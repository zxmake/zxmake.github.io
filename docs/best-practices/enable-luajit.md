# 启用 LuaJIT 优化 xmake 构建

对于包含大量 target、依赖和自定义 Lua 脚本的工程，xmake 需要执行很多 Lua 层的解析、配置和调度工作。将 xmake 编译为使用 LuaJIT 的版本，可以降低这部分脚本执行开销。

## 问题与使用场景

LuaJIT 更适合以下场景：

- 工程包含数百个 target，配置和依赖解析耗时明显
- 使用了较多自定义 rule、task 或 Lua 模块
- 构建过程中的 CPU 时间大量消耗在 xmake 脚本调度

一般场景下对于大型项目（包含数百个 target）启用 luajit 收益较为明显，具体收益应该以实际测试为准，可以通过 `dry-run` 测试 lua 脚本调度实际耗时：

```bash
$ time xmake build --dry-run
```

## 启用方式

### 从源码安装

在 xmake 源码根目录执行安装脚本，并显式指定运行时：

```bash
git clone https://github.com/TOMO-CAT/xmake.git
cd xmake
bash scripts/install.sh --runtime=luajit
```

### 通过 update 切换已有安装

如果当前 xmake 已经支持 `update`，可以在更新时选择运行时：

```bash
# 切换到指定版本/分支，并使用 LuaJIT
xmake update --force --runtime=luajit master
```

`--force` 用于当前版本与目标版本相同时仍然强制重新安装。`--scriptonly`（或 `-s`）仅更新 Lua 脚本，不能把已经编译好的 Lua VM 从 Lua 切换成 LuaJIT。

## 验证是否生效

安装后建议从多个层次检查，确保调用到的是刚安装的 xmake：

```bash
# 确认 PATH 中的可执行文件
command -v xmake

# 版本标题应包含 “based on LuaJIT”
xmake --version

# 查看运行时状态，预期输出 true
xmake lua -c 'print(xmake.luajit())'

# 也可以查看完整的 xmake 信息，输出中应包含 luajit: yes
xmake show
```
