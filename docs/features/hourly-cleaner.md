# xmake Hourly Cleaner：Package 和 Cache 轮转清理

`hourly-cleaner` 是 xmake 在构建过程中自动触发的后台清理任务，用于回收长期没有使用的远程 package，以及清理过期的全局 repository filelock。它不是常驻 daemon，也不会因为机器开机就每小时运行一次。

## 清理范围

这里的 package 是通过 `add_requires` 使用的远程包。它和 `xmake f --ccache` 使用的 C/C++ 编译缓存不是同一套缓存，后者请参考[编译缓存](ccache.md)。

默认目录如下，实际路径可能被环境变量或全局配置覆盖：

| 内容 | 默认路径 | 说明 |
| --- | --- | --- |
| package 安装目录 | `~/.xmake/packages` | 已安装、可直接被工程使用的 package |
| package 下载/构建缓存根目录 | `~/.xmake/cache/packages` | 下载源码、构建中间文件等；下面按 `YYMM` 月份分目录 |
| package filelock | `~/.xmake/filelock/packages` | 一项 package 一个 `.lock` 文件，用来保护并记录最近访问时间 |
| 全局 repository filelock | `~/.xmake/filelock/repositories` | 更新全局 repository 时使用的锁 |

## 什么时候触发

构建入口会尝试启动 hourly cleaner：

```text
xmake build -> 创建本小时 mark -> 后台启动 hourly_cleaner.lua
```

它有以下行为：

1. 触发点是 `actions/build/main.lua` 的 build action，通常是 `xmake b`，以及通过 task 调用该 build action 的命令。只执行 `xmake show`、`xmake lua` 或机器没有构建活动时，不会自动清理；某些直接调用 `build_targets` 的 test/pack 流程也不能仅凭“发生了编译”判断会触发 cleaner。
2. 同一个用户、同一个 `os.tmpdir()`、同一个小时通常只启动一次。并发构建可能在检查和写入 mark 之间发生竞态，偶尔启动多个 cleaner；后续的 filelock 仍会保护清理过程。mark 文件类似：
   `$(os.tmpdir())/cleanup/YYMMDDHH.mark`。
3. 清理进程是 detached 的后台进程，主构建不会等待它完成。构建结束后清理可能仍在运行。
4. 后台任务的输出写到：
   `$(os.tmpdir())/YYMMDDHH-hourly-cleaner.log`。

> 注意：mark 文件会在尝试启动后台进程前写入。如果本次后台进程启动失败，本小时内不会自动重试；下一个小时再次构建时才会重新尝试。

## Package 的保留策略

hourly cleaner 遍历 `~/.xmake/filelock/packages/*.lock`（路径以实际配置为准），从对应的旁路文件 `<name>.lock.info` 中读取 `time` 字段。这个时间是 xmake 最近一次成功获取 package 锁的时间，不是 cache 目录的 mtime。

默认保留时间是 30 天，也就是 720 小时。可以通过环境变量调整：

```bash
# 例如: 只保留最近 14 天没有使用的 package
$ export XMAKE_PKG_RETAIN_HOURS=336
$ xmake
```

当某个 package 超过保留时间时，xmake 会删除对应的 package 安装目录、当前月份的 package cache 目录，以及 `.lock.info` 和 `.lock`。

### `lock.info` 时间不等于“真正使用过库文件”

当前实现把“成功获取 package filelock”视为一次使用。package 描述被加载时，xmake 会主动执行一次 `package:lock()` 来刷新时间；因此下面这些场景都可能刷新 `.lock.info`，即使最终没有编译、链接或运行该 package：

- 每次构建前的 config 阶段会解析项目中的全部 `add_requires`，不要求这些 package 都被 target 的 `add_packages` 使用；
- `xmake require --info/list/check/fetch/download` 等解析、检查或查询命令；
- 解析依赖树时加载的间接依赖，以及条件分支或可选依赖的 package 描述；
- 多个项目、用户或 CI 任务共用同一个 `XMAKE_GLOBALDIR` 时，任意一方对相同 package lock 的访问。

所以，`time` 更准确的含义是“最近一次 xmake package 元数据/锁访问时间”，不是“最近一次实际消费安装产物的时间”。如果目标是只保留真正被 target 使用的 package，需要在 xmake 中把“加载描述”和“实际使用”拆成不同的标记；仅调整保留小时数无法消除这种情况。

## 确认是否生效

建议在疑似有问题的那台机器上按下面顺序检查。

### 查看磁盘占用

```bash
$ du -sh ~/.xmake/*
```

### 查看 hourly-cleaner 日志

日志格式：

```bash
# eg. /tmp/.xmake0/260827/26082719-hourly-cleaner.log
/tmp/.xmake0/YYMMDD/YYMMDDHH-hourly-cleaner.log
```

检查日志是否正常。

### 查看轮转逻辑是否正常

查询最长时间未使用的 package 和 cache：

```bash
XMAKE_USAGE_LIMIT=50 xmake lua -c '
local g, now, rows = import("core.base.global"), os.time(), {}
local limit = tonumber(os.getenv("XMAKE_USAGE_LIMIT")) or 20

for _, f in ipairs(os.files(path.join(g.directory(), "filelock/packages/*.lock.info"))) do
    local info = io.load(f)
    local t = info and tonumber(info.time)

    if t then
        local id = path.filename(f):gsub("%.lock%.info$", "")
        id = id:gsub("^[^_]+__", ""):gsub("__", "@", 1)

        rows[#rows + 1] = {
            age = math.max(0, now - t),
            time = t,
            id = id
        }
    end
end

table.sort(rows, function(a, b)
    return a.age > b.age
end)

print(string.format("%-4s  %-9s  %-19s  %s",
    "#", "UNUSED", "LAST USED", "PACKAGE@VERSION"))
print(string.rep("-", 80))

for n = 1, math.min(limit, #rows) do
    local r = rows[n]
    print(string.format("%-4d  %8.1fh  %-19s  %s",
        n,
        r.age / 3600,
        os.date("%Y-%m-%d %H:%M:%S", r.time),
        r.id))
end

print("")
print(string.format("shown=%d, total=%d",
    math.min(limit, #rows), #rows))
'
```

查看是否有删除 package / cache 的日志：

```bash
grep -RIn --include='*-hourly-cleaner.log' 'cleanup' /tmp/.xmake0 | tail -50
```

获取 package / cache 未使用时长分布（通过 `xmake lua` 运行）：

```bash
xmake lua -c '
local pkg = import("core.package.package")

local lock_root = pkg.filelockdir()
local package_root = pkg.installdir()

-- 默认只检查当前月份；XMAKE_CACHE_ALL=1 时检查所有月份
local all_cache = os.getenv("XMAKE_CACHE_ALL") == "1"
local cache_root = all_cache
    and pkg.cachedir({rootonly = true})
    or pkg.cachedir()

local now = os.time()
local installed, cached = {}, {}

-- package: /first/name/version
for _, dir in ipairs(os.dirs(path.join(
    package_root, "*", "*", "*"
)) or {}) do
    installed[path.relative(dir, package_root)] = true
end

-- cache:
-- 当前月份: /first/name/version
-- 所有月份: /month/first/name/version
if all_cache then
    for _, dir in ipairs(os.dirs(path.join(
        cache_root, "*", "*", "*", "*"
    )) or {}) do
        local p = path.split(path.relative(dir, cache_root))
        if #p == 4 then
            cached[path.join(p[2], p[3], p[4])] = true
        end
    end
else
    for _, dir in ipairs(os.dirs(path.join(
        cache_root, "*", "*", "*"
    )) or {}) do
        cached[path.relative(dir, cache_root)] = true
    end
end

local bins = {}
local valid, missing, invalid = 0, 0, 0

local function bucket(timestamp)
    local hours = math.max(
        1,
        math.ceil(math.max(0, now - timestamp) / 3600)
    )

    local key
    if hours <= 5 then
        key = hours
    else
        key = 6 + math.floor((hours - 6) / 5) * 5
    end

    local label
    if hours <= 5 then
        label = "<=" .. hours .. "h"
    else
        label = string.format("%d-%dh", key, key + 4)
    end

    return key, label
end

for _, lock in ipairs(os.files(path.join(
    lock_root, "*.lock"
)) or {}) do
    local infofile = lock .. ".info"

    if not os.isfile(infofile) then
        missing = missing + 1
    else
        local info = try {
            function()
                return io.load(infofile)
            end
        }

        local timestamp =
            type(info) == "table" and tonumber(info.time)

        local parts = path.filename(lock)
            :gsub("%.lock$", "")
            :split("__", {plain = true, strict = true})

        if not timestamp or #parts ~= 3 then
            invalid = invalid + 1
        else
            valid = valid + 1

            local key, label = bucket(timestamp)
            local row = bins[key] or {
                label = label,
                package = 0,
                cache = 0,
                locks = 0
            }

            local id = path.join(
                parts[1], parts[2], parts[3]
            )

            row.locks = row.locks + 1
            row.package = row.package + (installed[id] and 1 or 0)
            row.cache = row.cache + (cached[id] and 1 or 0)

            bins[key] = row
        end
    end
end

local keys = {}
for key in pairs(bins) do
    keys[#keys + 1] = key
end
table.sort(keys)

print("cache scope: " ..
    (all_cache and "all months" or cache_root))

print(string.format(
    "%-10s %10s %10s %10s",
    "AGE", "PACKAGE", "CACHE", "LOCKS"
))
print(string.rep("-", 46))

for _, key in ipairs(keys) do
    local row = bins[key]

    print(string.format(
        "%-10s %10d %10d %10d",
        row.label,
        row.package,
        row.cache,
        row.locks
    ))
end

print("")
print(string.format(
    "valid locks=%d, missing lock.info=%d, invalid=%d",
    valid, missing, invalid
))
'
```

### 手动触发一次 hourly-cleaner

```bash
# 后续可以考虑增加 --dry-run 模式
XMAKE_PKG_RETAIN_HOURS=60 xmake lua -D /usr/local/share/xmake/actions/build/hourly_cleaner.lua 2>&1 | tee hourly_cleaner.log
```
