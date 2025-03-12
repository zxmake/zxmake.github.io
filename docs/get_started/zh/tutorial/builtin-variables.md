---
class: heading_no_counter
---

# 内置变量

xmake 提供了 `$(varname)` 的语法，来支持内置变量的获取，例如：

```lua
add_cxflags("-I$(buildir)")
```

它将会在在实际编译的时候，将内置的 `buildir` 变量转换为实际的构建输出目录：`-I./build`

一般内置变量可用于在传参时快速获取和拼接变量字符串，例如：

```lua
target("test", function()
    -- 添加工程源码目录下的源文件
    add_files("$(projectdir)/src/*.c")

    -- 添加构建目录下的头文件搜索路径
    add_includedirs("$(buildir)/inc")
end)
```

也可以在自定义脚本的模块接口中使用，例如：

```lua
target("test", function()
    on_run(function (target)
        -- 复制当前脚本目录下的头文件到输出目录
        os.cp("$(scriptdir)/xxx.h", "$(buildir)/inc")
    end)
end)
```

所有的内置变量，也可以通过 [val](#val) 接口，来获取他们的值。

这种使用内置变量的方式，使得描述编写更加的简洁易读，下面是一些 xmake 内置的变量，可以直接获取：

| 接口                         | 描述                          |
| ---------------------------- | ----------------------------- |
| [$(os)](#varos)                 | 获取当前编译平台的操作系统    |
| [$(host)](#varhost)             | 获取本机操作系统              |
| [$(tmpdir)](#vartmpdir)         | 获取临时目录                  |
| [$(curdir)](#varcurdir)         | 获取当前目录                  |
| [$(buildir)](#varbuildir)       | 获取构建输出目录              |
| [$(scriptdir)](#varscriptdir)   | 获取工程描述脚本目录          |
| [$(globaldir)](#varglobaldir)   | 获取全局配置目录              |
| [$(configdir)](#varconfigdir)   | 获取本地工程配置目录          |
| [$(programdir)](#varprogramdir) | xmake 安装脚本目录            |
| [$(projectdir)](#varprojectdir) | 获取工程根目录                |
| [$(shell)](#varshell)           | 执行外部 shell 命令           |
| [$(env)](#varenv)               | 获取外部环境变量              |
| [$(reg)](#varreg)               | 获取 windows 注册表配置项的值 |

当然这种变量模式，也是可以扩展的，默认通过 `xmake f --var=val` 命令，配置的参数都是可以直接获取，例如：

```lua
target("test", function()
    add_defines("-DTEST=$(var)")
end)
```

> 所有 `xmake f --xxx=...` 配置的参数值，都是可以通过内置变量获取到，例如：`xmake f --arch=x86` 对应 `$(arch)`，其他的还有 `$(plat)`, `$(mode)` 等等。
> 具体有哪些参数，可以通过：`xmake f -h` 查看。

既然支持直接从配置选项中获取，那么当然也就能很方便的扩展自定义的选项，来获取自定义的变量了，具体如何自定义选项见：[option](#option)

## var.$(os)

获取当前编译平台的操作系统。

如果当前编译的是 iphoneos，那么这个值就是：`ios`，以此类推。

## var.$(host)

获取本机操作系统。

指的是当前本机环境的主机系统，如果你是在 macOS 上编译，那么系统就是：`macosx`

## var.$(tmpdir)

获取临时目录。

一般用于临时存放一些非永久性文件。

## var.$(curdir)

获取当前目录。

一般默认是执行 `xmake` 命令时的工程根目录，当然如果通过 [os.cd](#os-cd) 改变了目录的话，这个值也会一起改变。

## var.$(buildir)

获取当前的构建输出目录。

默认一般为当前工程根目录下的：`./build` 目录，也可以通过执行：`xmake f -o /tmp/build` 命令来修改默认的输出目录。

## var.$(scriptdir)

获取当前工程描述脚本的目录。

也就是对应 `xmake.lua` 所在的目录路径。

## var.$(globaldir)

全局配置目录。

xmake 的 `xmake g|global` 全局配置命令，数据存储的目录路径，在里面可以放置一些自己的插件、平台脚本。

默认为：`~/.config`

## var.$(configdir)

当前工程配置目录。

当前工程的配置存储目录，也就是 `xmake f|config` 配置命令的存储目录，默认为：`projectdir/.config`

## var.$(programdir)

xmake 安装脚本目录。

也就是 `XMAKE_PROGRAM_DIR` 环境变量所在目录，我们也可以通过设置这个环境量，来修改 xmake 的加载脚本，实现版本切换。

### var.$(projectdir)

工程根目录。

也就是 `xmake -P xxx` 命令中指定的目录路径，默认不指定就是 `xmake` 命令执行时的当前目录，一般用于定位工程文件。

## var.$(shell)

执行外部 shell 命令。

除了内置的变量处理，xmake 还支持原生 shell 的运行，来处理一些 xmake 内置不支持的功能

例如，现在有个需求，我想用在编译 linux 程序时，调用 `pkg-config` 获取到实际的第三方链接库名，可以这么做：

```lua
target("test", function()
    set_kind("binary")
    if is_plat("linux") then
        add_ldflags("$(shell pkg-config --libs sqlite3)")
    end
end)
```

当然，xmake 有自己的自动化第三库检测机制，一般情况下不需要这么麻烦，而且 lua 自身的脚本化已经很不错了。

但是这个例子可以说明，xmake 是完全可以通过原生 shell，来与一些第三方的工具进行配合使用。

## var.$(env)

获取外部环境变量。

例如，可以通过获取环境变量中的路径：

```lua
target("test", function()
    add_includedirs("$(env PROGRAMFILES)/OpenSSL/inc")
end)
```
