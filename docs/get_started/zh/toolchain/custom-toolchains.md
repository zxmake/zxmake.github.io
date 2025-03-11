---
class: heading_no_counter
---

# 自定义工具链

xmake 支持在用户的项目 xmake.lua 中自定义工具链，例如：

```lua
-- define toolchain
toolchain("myclang", function()

    -- mark as standalone toolchain
    set_kind("standalone")

    -- set toolset
    set_toolset("cc", "clang")
    set_toolset("cxx", "clang", "clang++")
    set_toolset("ld", "clang++", "clang")
    set_toolset("sh", "clang++", "clang")
    set_toolset("ar", "ar")
    set_toolset("ex", "ar")
    set_toolset("strip", "strip")
    set_toolset("mm", "clang")
    set_toolset("mxx", "clang", "clang++")
    set_toolset("as", "clang")

    add_defines("MYCLANG")

    -- check toolchain
    on_check(function (toolchain)
        return import("lib.detect.find_tool")("clang")
    end)

    -- on load
    on_load(function (toolchain)

        -- get march
        local march = is_arch("x86_64", "x64") and "-m64" or "-m32"

        -- init flags for c/c++
        toolchain:add("cxflags", march)
        toolchain:add("ldflags", march)
        toolchain:add("shflags", march)
        if not is_plat("windows") and os.isdir("/usr") then
            for _, includedir in ipairs({"/usr/local/include", "/usr/include"}) do
                if os.isdir(includedir) then
                    toolchain:add("includedirs", includedir)
                end
            end
            for _, linkdir in ipairs({"/usr/local/lib", "/usr/lib"}) do
                if os.isdir(linkdir) then
                    toolchain:add("linkdirs", linkdir)
                end
            end
        end

        -- init flags for objc/c++  (with ldflags and shflags)
        toolchain:add("mxflags", march)

        -- init flags for asm
        toolchain:add("asflags", march)
    end)
end)
```

然后通过下面的命令切到自己定义的工具链就行了：

```bash
$ xmake f --toolchain=myclang
```

当然，我们也可以通过 `set_toolchains` 接口直接对指定 target 切换设置到自定义工具链。

在自定义工具前，我们可以通过先运行以下命令，查看完整的内置工具链列表，确保 xmake 没有提供，如果有的话，直接使用就行了，没必要自己定义：

```bash
$ xmake show -l toolchains
```

下面是自定义 toolchain 目前支持的接口列表：

| 接口                                                                      | 描述                      |
| ------------------------------------------------------------------------- | ------------------------- |
| [toolchain](#toolchain)                                                      | 定义工具链                |
| [set_kind](#toolchainset_kind)                                               | 设置工具链类型            |
| [set_toolset](#toolchainset_toolset)                                         | 设置工具集                |
| [set_sdkdir](#toolchainset_sdkdir)                                           | 设置工具链 sdk 目录路径   |
| [set_bindir](#toolchainset_bindir)                                           | 设置工具链 bin 目录路径   |
| [on_check](#toolchainon_check)                                               | 检测工具链                |
| [on_load](#toolchainonon_load)                                               | 加载工具链                |
| [toolchain_end](#toolchain_end)                                              | 结束定义工具链            |
| [add_includedirs](/zh-cn/manual/project_target?id=targetadd_includedirs)     | 添加头文件搜索目录        |
| [add_defines](/zh-cn/manual/project_target?id=targetadd_defines)             | 添加宏定义                |
| [add_undefines](/zh-cn/manual/project_target?id=targetadd_undefines)         | 取消宏定义                |
| [add_cflags](/zh-cn/manual/project_target?id=targetadd_cflags)               | 添加 c 编译选项           |
| [add_cxflags](/zh-cn/manual/project_target?id=targetadd_cxflags)             | 添加 c/c++ 编译选项       |
| [add_cxxflags](/zh-cn/manual/project_target?id=targetadd_cxxflags)           | 添加 c++ 编译选项         |
| [add_mflags](/zh-cn/manual/project_target?id=targetadd_mflags)               | 添加 objc 编译选项        |
| [add_mxflags](/zh-cn/manual/project_target?id=targetadd_mxflags)             | 添加 objc/objc++ 编译选项 |
| [add_mxxflags](/zh-cn/manual/project_target?id=targetadd_mxxflags)           | 添加 objc++ 编译选项      |
| [add_scflags](/zh-cn/manual/project_target?id=targetadd_scflags)             | 添加 swift 编译选项       |
| [add_asflags](/zh-cn/manual/project_target?id=targetadd_asflags)             | 添加汇编编译选项          |
| [add_gcflags](/zh-cn/manual/project_target?id=targetadd_gcflags)             | 添加 go 编译选项          |
| [add_dcflags](/zh-cn/manual/project_target?id=targetadd_dcflags)             | 添加 dlang 编译选项       |
| [add_rcflags](/zh-cn/manual/project_target?id=targetadd_rcflags)             | 添加 rust 编译选项        |
| [add_cuflags](/zh-cn/manual/project_target?id=targetadd_cuflags)             | 添加 cuda 编译选项        |
| [add_culdflags](/zh-cn/manual/project_target?id=targetadd_culdflags)         | 添加 cuda 设备链接选项    |
| [add_ldflags](/zh-cn/manual/project_target?id=targetadd_ldflags)             | 添加链接选项              |
| [add_arflags](/zh-cn/manual/project_target?id=targetadd_arflags)             | 添加静态库归档选项        |
| [add_shflags](/zh-cn/manual/project_target?id=targetadd_shflags)             | 添加动态库链接选项        |
| [add_languages](/zh-cn/manual/project_target?id=targetadd_languages)         | 添加语言标准              |
| [add_frameworks](/zh-cn/manual/project_target?id=targetadd_frameworks)       | 添加链接框架              |
| [add_frameworkdirs](/zh-cn/manual/project_target?id=targetadd_frameworkdirs) | 添加链接框架              |

## toolchain

### 定义工具链

可以在用户项目 xmake.lua 中定义，也可以通过 includes 独立到单独的 xmake.lua 去专门定义各种工具链

```lua
toolchain("myclang", function()
    set_toolset("cc", "clang")
    set_toolset("cxx", "clang", "clang++")
end)
```

### 定义交叉工具链

我们也可以在 xmake.lua 中针对不同的交叉工具链 sdk 进行自定义配置，通常只需要指定 sdkdir，xmake 就可以自动检测其他的配置，比如 cross 等信息，例如:

```lua
toolchain("my_toolchain", function()
    set_kind("standalone")
    set_sdkdir("/tmp/arm-linux-musleabi-cross")
end)

target("hello", function()
    set_kind("binary")
    add_files("apps/hello/*.c")
end)
```

这是一个最精简的交叉工具链配置，仅仅设置了对应的 sdk 路径，然后通过 `set_kind("standalone")` 将其标记为完整独立的工具链。

这个时候，我们就可以通过命令行 `--toolchain=my_toolchain` 去手动切换到此工具链来使用。

```console
xmake f --toolchain=my_toolchain
xmake
```

另外，我们还可以直接在 xmake.lua 中通过 `set_toolchains` 将其绑定到对应的 target 上去，那么仅仅只在编译此 target 时候，才会切换到我们自定义的工具链。

```lua
toolchain("my_toolchain", function()
    set_kind("standalone")
    set_sdkdir("/tmp/arm-linux-musleabi-cross")
end)

target("hello", function()
    set_kind("binary")
    add_files("apps/hello/*.c")
    set_toolchains("my_toolchain")
end)
```

这样，我们不再需要手动切换工具链了，只需要执行 xmake，就会默认自动切换到 my_toolchain 工具链。

这对于嵌入式开发来讲尤其有用，因为嵌入式平台的交叉编译工具链非常多，我们经常需要各种切换来完成不同平台的编译。

因此，我们可以将所有的工具链定义放置到独立的 lua 文件中去定义，例如：

```
projectdir
    - xmake.lua
    - toolchains
      - my_toolchain1.lua
      - my_toolchain2.lua
      - ...
```

然后，我们只需要再 xmake.lua 中通过 includes 去引入它们，并根据不同的自定义平台，绑定不同的工具链：

```lua
includes("toolchains/*.lua")
target("hello", function()
    set_kind("binary")
    add_files("apps/hello/*.c")
    if is_plat("myplat1") then
        set_toolchains("my_toolchain1")
    elseif is_plat("myplat2") then
        set_toolchains("my_toolchain2")
    end
end)
```

这样，我们就可以编译的时候，直接快速切换指定平台，来自动切换对应的工具链了。

```console
xmake f -p myplat1
xmake
```

如果，有些交叉编译工具链结构复杂，自动检测还不足够，那么可以根据实际情况，使用 `set_toolset`, `set_cross` 和 `set_bindir` 等接口，针对性的配置上其他的设置。

例如下面的例子，我们还额外添加了一些 cxflags/ldflags 以及内置的系统库 links。

```lua
toolchain("my_toolchain", function()
    set_kind("standalone")
    set_sdkdir("/tmp/arm-linux-musleabi-cross")
    on_load(function (toolchain)
        -- add flags for arch
        if toolchain:is_arch("arm") then
            toolchain:add("cxflags", "-march=armv7-a", "-msoft-float", {force = true})
            toolchain:add("ldflags", "-march=armv7-a", "-msoft-float", {force = true})
        end
        toolchain:add("ldflags", "--static", {force = true})
        toolchain:add("syslinks", "gcc", "c")
    end)
end)
```

更多自定义工具链的例子，我们可以看下面的接口文档，也可以到 xmake 的源码的目录参考内置的工具链定义：[内部工具链列表](https://github.com/xmake-io/xmake/blob/master/xmake/toolchains/)

## toolchain:set_kind

### 设置工具链类型

目前仅支持设置为 `standalone` 类型，表示当前工具链是独立完整的工具链，包括 cc/cxx/ld/sh/ar 等编译器、归档器、链接器等一整套工具集的配置。

通常用于某个 target 被同时设置了多个工具链的情况，但同时只能生效一个独立工具链，通过此配置可以保证生效的工具链存在互斥关系，比如 gcc/clang 工具链不会同时生效。

而像 yasm/nasm 这种局部工具链，属于附加的局部工具链扩展，不用设置 standalone，因为 clang/yasm 两个工具链有可能同时存在。

> 只要记住，存在完整编译环境的工具链，都设置为 standalone 就行。

## toolchain:set_toolset

设置工具集。

用于设置每个单独工具名和路径，例如：

```lua
toolchain("myclang", function()
    set_kind("standalone")
    set_toolset("cc", "clang")
    set_toolset("cxx", "clang", "clang++")
    set_toolset("ld", "clang++", "clang")
    set_toolset("sh", "clang++", "clang")
    set_toolset("ar", "ar")
    set_toolset("ex", "ar")
    set_toolset("strip", "strip")
    set_toolset("mm", "clang")
    set_toolset("mxx", "clang", "clang++")
    set_toolset("as", "clang")
end)
```

关于这个接口的详情，可以看下：[target.set_toolset](/zh-cn/manual/project_target?id=targetset_toolset)

## toolchain:set_sdkdir

设置工具链 sdk 目录路径。

通常我们可以通过 `xmake f --toolchain=myclang --sdk=xxx` 来配置 sdk 目录，但是每次配置比较繁琐，我们也可以通过此接口预先配置到 xmake.lua 中去，方便快速切换使用。

```lua
toolchain("myclang", function()
    set_kind("standalone")
    set_sdkdir("/tmp/sdkdir")
    set_toolset("cc", "clang")
end)
```

## toolchain:set_bindir

设置工具链 bin 目录路径。

通常我们可以通过 `xmake f --toolchain=myclang --bin=xxx` 来配置 sdk 目录，但是每次配置比较繁琐，我们也可以通过此接口预先配置到 xmake.lua 中去，方便快速切换使用。

```lua
toolchain("myclang", function()
    set_kind("standalone")
    set_bindir("/tmp/sdkdir/bin")
    set_toolset("cc", "clang")
end)
```

## toolchain:on_check

检测工具链。

用于检测指定工具链所在 sdk 或者程序在当前系统上是否存在，通常用于多个 standalone 工具链的情况，进行自动探测和选择有效工具链。

而对于 `xmake f --toolchain=myclang` 手动指定的场景，此检测配置不是必须的，可以省略。

```lua
toolchain("myclang", function()
    on_check(function (toolchain)
        return import("lib.detect.find_tool")("clang")
    end)
end)
```

## toolchain:on_load

加载工具链。

对于一些复杂的场景，我们可以在 on_load 中动态灵活的设置各种工具链配置，比在描述域设置更加灵活，更加强大：

```lua
toolchain("myclang", function()
    set_kind("standalone")
    on_load(function (toolchain)

        -- set toolset
        toolchain:set("toolset", "cc", "clang")
        toolchain:set("toolset", "ld", "clang++")

        -- init flags
        local march = toolchain:is_arch("x86_64", "x64") and "-m64" or "-m32"
        toolchain:add("cxflags", march)
        toolchain:add("ldflags", march)
        toolchain:add("shflags", march)
    end)
end)
```
