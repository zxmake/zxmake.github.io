---
class: heading_no_counter
---

# 描述域

## 命名规范

接口的命名，是有按照预定义的一些规范来命名的，这样更加方便理解和易于使用，目前命名按照如下一些规则：

| 接口规则                | 描述                                                         |
| ----------------------- | ------------------------------------------------------------ |
| `is_`, `has_` 前缀的接口 | 表示为条件判断                                               |
| `set_` 前缀的接口        | 表示为覆盖设置                                               |
| `add_` 前缀的接口        | 表示为追加设置                                               |
| `s` 后缀的接口           | 表示支持多值传入，例如：`add_files("*.c", "test.cpp")`       |
| `on_` 前缀的接口         | 表示为覆盖内置脚本                                           |
| `before_` 前缀的接口     | 表示为在内置脚本运行前，执行此脚本                           |
| `after_` 前缀的接口      | 表示为在内置脚本运行后，执行此脚本                           |
| `scope("name")` 的接口   | 表示为定义一个描述域，例如：`target("xxx")`, `option("xxx")` |
| 描述域 / 描述设置         | 建议缩进表示                                                 |

## 条件判断

条件判断的 api，一般用于必须要处理特定平台的编译逻辑的场合。通常跟 lua 的 if 语句配合使用。

### is_os

#### 判断当前构建目标的操作系统

```lua
-- 如果当前操作系统是 ios
if is_os("ios") then
    add_files("src/xxx/*.m")
end
```

目前支持的操作系统有：

* linux
* android
* macosx
* ios

### is_arch

#### 判断当前编译架构

用于检测编译配置：`xmake f -a armv7`

```lua
-- 如果当前架构是 x86_64 或者 i386
if is_arch("x86_64", "i386") then
    add_files("src/xxx/*.c")
end

-- 如果当前平台是 armv7, arm64, armv7s, armv7-a
if is_arch("armv7", "arm64", "armv7s", "armv7-a") then
    -- ...
end
```

如果像上面那样一个个去判断所有 arm 架构，也许会很繁琐，毕竟每个平台的架构类型很多，xmake 提供了比 [add_files](#targetadd_files) 更强的 lua 正则表达式匹配模式，来更加简洁的进行判断：

```lua
-- 如果当前平台是 arm 平台
if is_arch("arm.*") then
    -- ...
end
```

用 `.*` 就可以匹配所有了。

### is_plat

#### 判断当前编译平台

用于检测编译配置：`xmake f -p iphoneos`

```lua
-- 如果当前平台是 android
if is_plat("android") then
    add_files("src/xxx/*.c")
end

-- 如果当前平台是 macosx 或者 iphoneos
if is_plat("macosx", "iphoneos") then
    add_frameworks("Foundation")
end
```

目前支持的平台有：

* cross
* linux
* macosx
* android
* iphoneos
* watchos

当然你也可以自己扩展添加自己的平台，甚至直接指定自己的平台名：

```bash
$ xmake f -p other --sdk=...
```

如果指定的平台名不存在，就会自动切到 `cross` 平台进行交叉编译，但是却可以通过 `is_plat("other")` 来判断自己的平台逻辑。

### is_host

#### 判断当前主机环境的操作系统

有些编译平台是可以在多个不同的操作系统进行构建的，例如：android 的 ndk 就支持 linux 和 macOS 环境。

这个时候就可以通过这个接口，区分当前是在哪个系统环境下进行的构建。

```lua
-- 如果当前主机环境是 linux
if is_host("linux") then
    add_includedirs("/usr/includess")
else
    add_includedirs(".")
end
```

目前支持的主机环境有：

* linux
* macosx

你也可以通过 [$(host)](/zh-cn/manual/builtin_variables?id=varhost) 内置变量或者 [os.host](/zh-cn/manual/builtin_modules?id=oshost) 接口，来进行获取

### is_cross

#### 判断当前平台是否为交叉编译

如果当前的目标架构和平台，不是当前的主机平台，属于交叉编译，这个接口就会返回 true。

### is_mode

#### 判断当前编译模式

用于检测编译配置：`xmake f -m debug`

编译模式的类型并不是内置的，可以自由指定，一般指定：`debug`, `release`, `profile` 这些就够用了，当然你也可以在 xmake.lua 使用其他模式名来判断。

```lua
-- 如果当前编译模式是 debug
if is_mode("debug") then

    -- 添加 DEBUG 编译宏
    add_defines("DEBUG")

    -- 启用调试符号
    set_symbols("debug")

    -- 禁用优化
    set_optimize("none")

end

-- 如果是 release 或者 profile 模式
if is_mode("release", "profile") then

    -- 如果是 release 模式
    if is_mode("release") then

        -- 隐藏符号
        set_symbols("hidden")

        -- strip 所有符号
        set_strip("all")

        -- 忽略帧指针
        add_cxflags("-fomit-frame-pointer")
        add_mxflags("-fomit-frame-pointer")

    -- 如果是 profile 模式
    else

        -- 启用调试符号
        set_symbols("debug")

    end

    -- 添加扩展指令集
    add_vectorexts("sse2", "sse3", "ssse3", "mmx")
end
```

### is_kind

#### 判断当前编译类型

判断当前是否编译的是动态库还是静态库，用于检测编译配置：`xmake f -k [static|shared]`

一般用于如下场景：

```lua
target("test")

    -- 通过配置设置目标的 kind
    set_kind("$(kind)")
    add_files("src/*c")

    -- 如果当前编译的是静态库，那么添加指定文件
    if is_kind("static") then
        add_files("src/xxx.c")
    end
```

编译配置的时候，可手动切换，编译类型：

```bash
# 编译静态库
$ xmake f -k static
$ xmake
```

```bash
# 编译动态库
$ xmake f -k shared
$ xmake
```

### is_config

#### 判断指定配置是否为给定的值

用于判断指定配置是否为给定的值，可用于描述域。

例如：

```console
$ xmake f --test=hello1
```

```lua
-- 自定义一个配置选项到命令行菜单
option("test", function()
    set_showmenu(true)
    set_description("The test config option")
end)

-- 如果自定义的 test 配置值是 hello1 或者 hello2
if is_config("test", "hello1", "hello2") then
    add_defines("HELLO")
end
```

可以用来根据配置值增加对应的依赖包，例如：

```lua
-- 根据 lua_flavor 的配置值，选择依赖 lua 还是 luajit
option("lua_flavor", function()
    set_showmenu(true)
    set_values("luajit", "lua")
end)
if is_config("lua_flavor", "luajit") then
    add_requires("luajit")
elseif is_config("lua_flavor", "lua") then
    add_requires("lua")
end
```

不仅如此，我们还可以设置模式匹配规则去判断值，例如：

```lua
-- 如果自定义的 test 配置值带有 hello 前缀
if is_config("test", "hello.*") then
    add_defines("HELLO")
end
```

> 此接口不仅能够判断通过 [option](#option) 定义的自定义配置选项，同时还能判断内置的全局配置、本地配置

### has_config

#### 判断配置是否启用或者存在

用于检测自定义或者内置的编译配置是否存在或启用，可用于描述域。

例如以下配置情况，都会返回 true:

```console
# 启用某个配置选项（如果是 boolean 类型配置）
$ xmake f --test1=y
$ xmake f --test1=yes
$ xmake f --test1=true

# 设置某个配置选项的值
$ xmake f --test2=value
```

```lua
-- 如果 test1 或者 test2 被设置或者启用
if has_config("test1", "test2") then
    add_defines("TEST")
end
```

而下面的情况则会禁用配置，返回 false：

```console
# 禁用配置（如果是 boolean 类型配置）
$ xmake f --test1=n
$ xmake f --test1=no
$ xmake f --test1=false
```

> 此接口不仅能够判断内置的全局配置、本地配置，同时还可以判断通过 [option](#option) 定义的自定义配置选项。

### has_package

#### 判断依赖包是否启用或者存在

此接口用于检测远程依赖包是否存在或启用，可用于描述域。

一般配合 [add_requires](/zh-cn/manual/global_interfaces?id=add_requires) 一起使用，例如：

```lua
add_requires("tbox", {optional = true})

target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    add_packages("tbox")

    if has_package("tbox") then
        add_defines("HAVE_TBOX")
    end
end)
```

如果通过 `add_requires` 添加的可选依赖包，远程下载安装失败，或者当前平台不支持导致实际上没有被正常安装上，那么 `has_package` 就会返回 false，表示不存在，然后对其他 flags 定义甚至源文件编译控制做一些特殊处理。

> 此接口跟 [has_config](#has_config) 的区别在于，[has_config](#has_config) 用于 [option](#option)，而它用于 [add_requires](#add_requires)。

## 全局接口

全局接口影响整个工程描述，被调用后，后面被包含进来的所有子 `xmake.lua` 都会受影响。

### includes

#### 添加子工程文件和目录

我们能够使用此接口添加工程子文件 (xmake.lua) 或者带有 xmake.lua 的工程子目录。

```
projectdir
  - subdirs
    - xmake.lua
  - src
```

添加子工程目录：

```lua
includes("subdirs")

target("test", function()
    set_kind("binary")
    add_files("src/*.c")
end)
```

或者添加子工程文件：

```lua
includes("subdirs/xmake.lua")

target("test", function()
    set_kind("binary")
    add_files("src/*.c")
end)
```

我们也可以通过模式匹配的方式，递归添加多个工程子目录文件：

```lua
includes("**/xmake.lua")

target("test", function()
    set_kind("binary")
    add_files("src/*.c")
end)
```

includes 包含内置的一些辅助配置脚本，例如：

```lua
includes("@builtin/check")
```

会引入内置提供的一些检测辅助接口。

还有

```lua
includes("@builtin/qt")
```

会引入一些内置的 Qt 相关辅助接口。

其中 `@builtin` 是告诉 xmake 从内置的 includes 目录中引入配置脚本。

也就是这个路径下的配置文件：[includes](https://github.com/xmake-io/xmake/tree/master/xmake/includes)

我们可以向上面那样，按目录整个引入，也可以引入单个配置文件，例如：

```lua
includes("@builtin/check/check_cfuncs.lua")
```

仅仅引入 check 目录下 check_cfuncs 相关的辅助脚本。

而通过 `@builtin` 我们就能很好的区分是引入当前用户工程目录下的文件，还是 xmake 安装目录下的内置文件。

### set_project

#### 设置工程名

设置工程名，在 doxygen 自动文档生成插件、工程文件生成插件中会用到，一般设置在 xmake.lua 的最开头，当然放在其他地方也是可以的

```lua
-- 设置工程名
set_project("xutil")

-- 设置工程版本
set_version("1.5.1")
```

### set_version

#### 设置工程版本

设置项目版本，可以放在 xmake.lua 任何地方，一般放在最开头，例如：

```lua
set_version("1.5.1")
```

支持 buildversion 的配置：

```lua
set_version("1.5.1", {build = "%Y%m%d%H%M"})
```

我们也能够添加版本宏定义到头文件，请参考：[add_configfiles](/manual/project_target?id=add-template-configuration-files)

> 我们可以全局设置版本，但现在我们也可以在 target 域去单独设置它。

同时支持配置 soname 版本，用于控制 so/dylib 动态库的版本兼容性控制。

我们可以配置 soname 的版本后缀名称，xmake 会在编译、安装动态库的时候，自动生成符号链接，执行指定版本的动态库。

例如，如果我们配置：

```lua
set_version("1.0.1", {soname = true})
```

xmake 会自动解析版本号的 major 版本作为 soname 版本，生成的结构如下：

```
└── lib
    ├── libfoo.1.0.1.dylib
    ├── libfoo.1.dylib -> libfoo.1.0.1.dylib
    └── libfoo.dylib -> libfoo.1.dylib
```

当然，我们也可以指定 soname 到特定的版本命名：

```lua
set_version("1.0.1", {soname = "1.0"}) -> libfoo.so.1.0, libfoo.1.0.dylib
set_version("1.0.1", {soname = "1"}) -> libfoo.so.1, libfoo.1.dylib
set_version("1.0.1", {soname = "A"}) -> libfoo.so.A, libfoo.A.dylib
set_version("1.0.1", {soname = ""}) -> libfoo.so, libfoo.dylib
```

而如果没设置 soname，那么默认不开启 soname 版本兼容控制：

```lua
set_version("1.0.1") -> libfoo.so, libfoo.dylib
```

### set_xmakever

#### 设置最小 xmake 版本

用于处理 xmake 版本兼容性问题，如果项目的 `xmake.lua`，通过这个接口设置了最小 xmake 版本支持，那么用户环境装的 xmake 低于要求的版本，就会提示错误。

一般情况下，建议默认对其进行设置，这样对用户比较友好，如果 `xmake.lua` 中用到了高版本的 api 接口，用户那边至少可以知道是否因为版本不对导致的构建失败。

设置如下：

```lua
-- 设置最小版本为：2.1.0，低于此版本的 xmake 编译此工程将会提示版本错误信息
set_xmakever("2.1.0")
```

### add_moduledirs

#### 添加模块目录

xmake 内置的扩展模块都在 `xmake/modules` 目录下，可通过 [import](#import) 来导入他们，如果自己在工程里面实现了一些扩展模块，
可以放置在这个接口指定的目录下，import 也就会能找到，并且优先进行导入。

### add_plugindirs

#### 添加插件目录

xmake 内置的插件都是放在 `xmake/plugins` 目录下，但是对于用户自定义的一些特定工程的插件，如果不想放置在 xmake 安装目录下，那么可以在 `xmake.lua` 中进行配置指定的其他插件路径。

```lua
-- 将当前工程下的 plugins 目录设置为自定义插件目录
add_plugindirs("$(projectdir)/plugins")
```

这样，xmake 在编译此工程的时候，也就加载这些插件。

### get_config

#### 获取给定的配置值

此接口用于快速获取给定的配置值，可用于描述域。

```lua
if get_config("myconfig") == "xxx" then
    add_defines("HELLO")
end
```

### set_config

#### 设置给定的默认配置值

此接口从 2.2.2 版本开始引入，用于快速在 xmake.lua 中设置一个默认配置值，仅用于描述域。

之前很多配置，包括编译工具链，构建目录等只能通过 `$ xmake f --name=value` 的方式来配置，如果我们想写死在 xmake.lua 提供一个默认值，就可以通过下面的方式来配置：

```lua
set_config("name", "value")
set_config("buildir", "other/buildir")
set_config("cc", "gcc")
set_config("ld", "g++")
```

不过，我们还是可以通过 `$ xmake f --name=value` 的方式，去修改 xmake.lua 中的默认配置。

### add_requires

#### 添加需要的依赖包

xmake 的依赖包管理是完全支持语义版本选择的，例如："~1.6.1"，对于语义版本的具体描述见：[https://semver.org/](https://semver.org/)

##### 语义版本

```lua
add_requires("tbox 1.6.*", "pcre 8.x", "libpng ^1.18")
add_requires("libpng ~1.16", "zlib 1.1.2 ||>=1.2.11 <1.3.0")
```

目前 xmake 使用的语义版本解析器是 [uael](https://github.com/uael) 贡献的 [sv](https://github.com/uael/sv) 库，里面也有对版本描述写法的详细说明，可以参考下：[版本描述说明](https://github.com/uael/sv#versions)

##### 最近版本

当然，如果我们对当前的依赖包的版本没有特殊要求，那么可以直接这么写：

```lua
add_requires("tbox", "libpng", "zlib")
```

默认，没设置版本号，xmake 会选取最近版本的包，等价于 `add_requires("zlib latest")`

##### 分支选择

这会使用已知的最新版本包，或者是 master 分支的源码编译的包，如果当前包有 git repo 地址，我们也能指定特定分支版本：

```lua
add_requires("tbox master")
add_requires("tbox dev")
```

如果指定的依赖包当前平台不支持，或者编译安装失败了，那么 xmake 会编译报错，这对于有些必须要依赖某些包才能工作的项目，这是合理的。
但是如果有些包是可选的依赖，即使没有也可以正常编译使用的话，可以设置为可选包：

##### Git commit 选择

我们可以对 git 维护的包直接指定 git commit 来选择版本。

```lua
add_requires("tbox e807230557aac69e4d583c75626e3a7ebdb922f8")
```

##### 可选包

```lua
add_requires("zlib", {optional = true})
```

##### 禁用系统包

默认的设置，xmake 会去优先检测系统库是否存在（如果没设置版本要求），如果用户完全不想使用系统库以及第三方包管理提供的库，那么可以设置：

```lua
add_requires("zlib", {system = false})
```

##### 禁用包校验

默认包安装，对于下载的包都是会去自动校验完整性，避免被篡改，但是如果安装一些未知新版本的包，就不行了。

用户可以通过 `{verify = false}` 强行禁用包完整性校验来临时安装他们（但通常不推荐这么做）。

```lua
add_requires("zlib", {verify = false})
```

##### 使用调试包

如果我们想同时源码调试依赖包，那么可以设置为使用 debug 版本的包（当然前提是这个包支持 debug 编译）：

```lua
add_requires("zlib", {debug = true})
```

如果当前包还不支持 debug 编译，可在仓库中提交修改编译规则，对 debug 进行支持，例如：

```lua
package("openssl", function()
    on_install("linux", "macosx", function (package)
        os.vrun("./config %s --prefix=\"%s\"", package:debug() and"--debug"or"", package:installdir())
        os.vrun("make -j4")
        os.vrun("make install")
    end)
end)
```

##### 作为私有包使用

如果这个包，我们仅仅用于包定义，不想对外默认导出 links/linkdirs 信息，可以作为私有包提供。

这通常对于做包时候，很有用。

```lua
package("test")
    add_deps("zlib", {private = true})
    on_install(function (package)
        local zlib = package:dep("zlib"):fetch()
        -- TODO
    end)
```

如果自己定义的一个 test 包，私有依赖一个 zlib 包，等待 zlib 安装完成后，获取里面的包文件信息做进一步处理安装，但是 zlib 包本身不会再对外导出 links/linkdirs。

尽管，`add_requires` 也支持这个选项，但是不对外导出 links/linkdirs，所以通常不会去这么用，仅仅对于做包很有帮助。

##### 使用动态库

默认的包安装的是静态库，如果要启用动态库，可以配置如下：

```lua
add_requires("zlib", {configs = {shared = true}})
```

> 当然，前提是这个包的定义里面，有对 `package:config("shared")` 判断处理，官方 xmake-repo 仓库里面，通常都是严格区分支持的。

##### 禁用 pic 支持

默认安装的 linux 包，都是开启 pic 编译的，这对于动态库中依赖静态库非常有用，但如果想禁用 pic，也是可以的。

```lua
add_requires("zlib", {configs = {pic = false}})
```

##### 特定配置包

某些包在编译时候有各种编译选项，我们也可以传递进来：

```lua
add_requires("boost", {configs = {context = true, coroutine = true}})
```

比如上面，安装的 boost 包，是启用了它内部的一些子模块特性（带有协程模块支持的包）。

当然，具体支持哪些配置，每个包都是不同的，可以通过 `xmake require --info boost` 命令查看里面的 configs 部分列表。

因为，每个包定义里面，都会有自己的配置选项，并且通过 `package:config("coroutine")` 在安装时候去判断启用它们。

##### 安装第三方管理器的包

目前支持安装下面这些第三方包管理器中包。

* Conan (conan::openssl/1.1.1g)
* Conda (conda::libpng 1.3.67)
* Vcpkg (vcpkg::ffmpeg)
* Homebrew/Linuxbrew (brew::pcre2/libpcre2-8)
* Pacman on archlinux/msys2 (pacman::libcurl)
* Apt on ubuntu/debian (apt::zlib1g-dev)
* Clib (clib::clibs/bytes@0.0.4)
* Dub (dub::log 0.4.3)
* Portage on Gentoo/Linux (portage::libhandy)

例如添加 conan 的依赖包：

```lua
add_requires("conan::zlib/1.2.11", {alias = "zlib", debug = true})
add_requires("conan::openssl/1.1.1g", {alias = "openssl",
    configs = {options = "OpenSSL:shared=True"}})

target("test")
    set_kind("binary")
    add_files("src/*.c")
    add_packages("openssl", "zlib")
```

执行 xmake 进行编译后：

```console
ruki:test_package ruki$ xmake
checking for the architecture ... x86_64
checking for the Xcode directory ... /Applications/Xcode.app
checking for the SDK version of Xcode ... 10.14
note: try installing these packages (pass -y to skip confirm)?
  -> conan::zlib/1.2.11  (debug)
  -> conan::openssl/1.1.1g
please input: y (y/n)

  => installing conan::zlib/1.2.11 .. ok
  => installing conan::openssl/1.1.1g .. ok

[0%]: cache compiling.release src/main.c
[100%]: linking.release test
```

关于这个的完整介绍和所有第三方包的安装使用，可以参考文档：[第三方依赖包安装](https://xmake.io/#/zh-cn/package/remote_package?id=%e7%ac%ac%e4%b8%89%e6%96%b9%e4%be%9d%e8%b5%96%e5%8c%85%e5%ae%89%e8%a3%85)

##### 另一种简化的配置语法

我们通常使用的常用配置语法：

```lua
add_requires("boost>=1.78.0", {configs = {iostreams = true, system = true, thread = true}})
```

对于大部分 boolean 配置，我们可以通过下面的写法，去简化配置。

```lua
add_requires("boost[iostreams,system,thread] >=1.78.0")
```

这对于 `xrepo install` 独立 cli 命令下带复杂配置的安装，会省事不少，用户可以根据自己的喜好需求，选择使用。

```console
xrepo install boost[iostreams,system,thread]
```

另外，除了 boolean 配置，还支持 string 和 array 配置值。boolean 值，也可以设置 `=n/y` 去禁用和启用。

```lua
add_requires("boost[iostreams,system,thread,key=value] >=1.78.0")
add_requires("boost[iostreams=y,thread=n] >=1.78.0")
add_requires("ffmpeg[shared,debug,codecs=[foo,bar,zoo]]")
```

### add_requireconfs

#### 设置指定依赖包的配置

我们可以用这个接口来对 `add_requires()` 定义的包和它的依赖包的配置进行扩充和改写，它有下面几种用法。

##### 扩充指定包的配置

这是基本用法，比如我们已经通过 `add_requires("zlib")` 声明了一个包，想要在后面对这个 zlib 的配置进行扩展，改成动态库编译，可以通过下面的方式配置。

```lua
add_requires("zlib")
add_requireconfs("zlib", {configs = {shared = true}})
```

它等价于

```lua
add_requires("zlib", {configs = {shared = true}})
```

##### 设置通用的默认配置

上面的用法，我们还看不出有什么实际用处，但如果依赖多了就能看出效果了，比如下面这样：

```lua
add_requires("zlib", {configs = {shared = true}})
add_requires("pcre", {configs = {shared = true}})
add_requires("libpng", {configs = {shared = true}})
add_requires("libwebp", {configs = {shared = true}})
add_requires("libcurl", {configs = {shared = false}})
```

是不是非常繁琐，如果我们用上 `add_requireconfs` 来设置默认配置，就可以极大的简化成下面的配置：

```lua
add_requireconfs("*", {configs = {shared = true}})
add_requires("zlib")
add_requires("pcre")
add_requires("libpng")
add_requires("libwebp")
add_requires("libcurl", {configs = {shared = false}})
```

上面的配置，我们通过 `add_requireconfs("*", {configs = {shared = true}})` 使用模式匹配的方式，设置所有的依赖包默认走动态库编译安装。

但是，我们又通过 `add_requires("libcurl", {configs = {shared = false}})` 将 libcurl 进行了特殊配置，强制走静态库编译安装。

最终的配置结果为：zlib/pcre/libpng/libwebp 是 shared 库，libcurl 是静态库。

我们通过模式匹配的方式，可以将一些每个包的常用配置都放置到统一的 `add_requireconfs` 中去预先配置好，极大简化每个 `add_requires` 的定义。

> 默认情况下，对于相同的配置，xmake 会优先使用 add_requires 中的配置，而不是 add_requireconfs。

如果 `add_requires("zlib 1.2.11")` 中设置了版本，就会优先使用 add_requires 的配置，完全忽略 add_requireconfs 里面的版本配置，当然我们也可以通过 override 来完全重写 `add_requires` 中指定的版本。

```lua
add_requires("zlib 1.2.11")
add_requireconfs("zlib", {override = true, version = "1.2.10"})
```

##### 改写包依赖配置

其实 `add_requireconfs` 最大的用处是可以让用户改写安装包的特定依赖包的配置。

什么意思呢，比如我们项目中集成使用 libpng 这个包，并且使用了动态库版本，但是 libpng 内部依赖的 zlib 库其实还是静态库版本。

```lua
add_requires("libpng", {configs = {shared = true}})
```

那如果我们想让 libpng 依赖的 zlib 包也改成动态库编译，应该怎么配置呢？这就需要 `add_requireconfs` 了。

```lua
add_requires("libpng", {configs = {shared = true}})
add_requireconfs("libpng.zlib", {configs = {shared = true}})
```

通过 `libpng.zlib` 依赖路径的写法，指定内部某个依赖，改写内部依赖配置。

如果依赖路径很深，比如 `foo -> bar -> xyz` 的依赖链，我们可以写成：`foo.bar.xyz`

我们也可以改写 libpng 依赖的内部 zlib 库版本：

```lua
add_requires("libpng")
add_requireconfs("libpng.zlib", {override = true, version = "1.2.10"})
```

##### 级联依赖的模式匹配

如果一个包的依赖非常多，且依赖层次也很深，怎么办呢，比如 libwebp 这个包，它的依赖有：

```
libwebp
  - libpng
    - zlib
    - cmake
  - libjpeg
  - libtiff
    - zlib
  - giflib
  - cmake
```

如果我想改写 libwebp 里面的所有的依赖库都加上特定配置，那么挨个配置，就会非常繁琐，这个时候就需要 `add_requireconfs()` 的递归依赖模式匹配来支持了。

```lua
add_requires("libwebp")
add_requireconfs("libwebp.**|cmake", {configs = {cxflags = "-DTEST"}})
```

上面的配置，我们将 libwebp 中所以的库依赖就额外加上了 `-DTEST` 来编译，但是 cmake 依赖属于构建工具依赖，我们可以通过 `|xxx` 的方式排除它。

这里的模式匹配写法，与 `add_files()` 非常类似。

我们在给几个例子，比如这回我们只改写 libwebp 下单级的依赖配置，启用调试库：

```lua
add_requires("libwebp")
add_requireconfs("libwebp.*|cmake", {debug = true})
```

### add_repositories

#### 添加依赖包仓库

如果需要的包不在官方仓库 [xmake-repo](https://github.com/xmake-io/xmake-repo) 中，我们可以提交贡献代码到仓库进行支持。
但如果有些包仅用于个人或者私有项目，我们可以建立一个私有仓库 repo，仓库组织结构可参考：[xmake-repo](https://github.com/xmake-io/xmake-repo)

比如，现在我们有一个一个私有仓库 repo：`git@github.com:myrepo/xmake-repo.git`

我们可以通过此接口来添加：

```lua
add_repositories("my-repo git@github.com:myrepo/xmake-repo.git")
```

如果我们只是想添加一两个私有包，这个时候特定去建立一个 git repo 太小题大做了，我们可以直接把包仓库放置项目里面，例如：

```
projectdir
  - myrepo
    - packages
      - t/tbox/xmake.lua
      - z/zlib/xmake.lua
  - src
    - main.c
  - xmake.lua
```

上面 myrepo 目录就是自己的私有包仓库，内置在自己的项目里面，然后在 xmake.lua 里面添加一下这个仓库位置：

```lua
add_repositories("my-repo myrepo")
```

这个可以参考 [benchbox](https://github.com/tboox/benchbox) 项目，里面就内置了一个私有仓库。

注：其中 myrepo 是 xmake 命令执行目录的相对路径，它不会自动根据配置文件所在目录自动转换，如果想要设置到相对于当前 xmake.lua 文件的路径，可以通过 rootdir 参数指定。

```lua
add_repositories("my-repo myrepo", {rootdir = os.scriptdir()})
```

不过这个参数设置只有 v2.5.7 以上版本才支持。

### set_defaultplat

#### 设置默认的编译平台

用于设置工程默认的编译平台，如果没有设置，默认平台跟随当前系统平台，也就是 os.host()。

比如，在 macOS 上默认编译平台是 macosx，如果当前项目是 ios 项目，那么可以设置默认编译平台为 iphoneos。

```lua
set_defaultplat("iphoneos")
```

它等价于，`xmake f -p iphoneos`。

### set_defaultarchs

#### 设置默认的编译架构

用于设置工程默认的编译架构，如果没有设置，默认平台跟随当前系统架构，也就是 os.arch()。

```lua
set_defaultplat("iphoneos")
set_defaultarchs("arm64")
```

它等价于，`xmake f -p iphoneos -a arm64`。

我们也可以设置多个平台下的默认架构。

```lua
set_defaultarchs("iphoneos|arm64", "windows|x64")
```

在 iphoneos 上默认编译 arm64 架构，在 windows 上默认编译 x64 架构。

### set_defaultmode

#### 设置默认的编译模式

用于设置工程默认的编译模式，如果没有设置，默认是 release 模式编译。

```lua
set_defaultmode("releasedbg")
```

它等价于，`xmake f -m releasedbg`。

### set_allowedplats

#### 设置允许编译的平台列表

用于设置工程支持的编译平台列表，如果用户指定了其他平台，会提示错误，这通常用于限制用户指定错误的无效平台。

如果没有设置，那么没有任何平台限制。

```lua
set_allowedplats("windows", "mingw")
```

设置当前项目仅仅支持 windows 和 mingw 平台。

### set_allowedarchs

#### 设置允许编译的平台架构

用于设置工程支持的编译架构列表，如果用户指定了其他架构，会提示错误，这通常用于限制用户指定错误的无效架构。

如果没有设置，那么没有任何架构限制。

```lua
set_allowedarchs("x64", "x86")
```

当前项目，仅仅支持 x64/x86 平台。

我们也可以同时指定多个平台下允许的架构列表。

```lua
set_allowedarchs("windows|x64", "iphoneos|arm64")
```

设置当前项目在 windows 上仅仅支持 x64 架构，并且在 iphoneos 上仅仅支持 arm64 架构。

### set_allowedmodes

#### 设置允许的编译模式列表

用于设置工程支持的编译模式列表，如果用户指定了其他模式，会提示错误，这通常用于限制用户指定错误的无效模式。

如果没有设置，那么没有任何模式限制。

```lua
set_allowedmodes("release", "releasedbg")
```

设置当前项目仅仅支持 release/releasedbg 两个编译模式。

## 辅助接口

### 自动检测辅助接口

xmake 提供了一些内置的辅助函数，可以直接使用 includes 导入，具体有哪些内置函数可以看下：[Helper functions](https://github.com/xmake-io/xmake/tree/master/xmake/includes)

我们可以使用这些接口，检测 links, c/c++ type, includes 和 编译器特性，并且写入宏定义到 config.h

其中，我们提供了两类接口，`check_xxx` 和 `configvar_check_xxx`，带有 `configvar_` 前缀的接口会在检测通过后，写入 `add_configfiles` 指定的 config.h.in 模板文件。

而 `check_xxx` 仅仅只是定义相关 macros 参与编译，但不会持久化到 `config.h.in` 中去。

相关 issues 见：

* [#342](https://github.com/xmake-io/xmake/issues/342)
* [#1715](https://github.com/xmake-io/xmake/issues/1715)

我们可以一次性引入所有检测接口：

```lua
includes("@builtin/check")
```

当然我们也可以按需引入单个脚本：

```lua
includes("@builtin/check/check_links.lua")
```

而原有的引入路径，没有区分是否为用户路径，不方便管理维护，且容易被用户配置干扰，后面会逐步废弃。

#### 检测 links

我们可以通过尝试链接来检测指定的 links 是否通过。

```lua
includes("check_links.lua")

target("test", function()
    set_kind("binary")
    add_files("*.c")
    add_configfiles("config.h.in")
    configvar_check_links("HAS_PTHREAD", {"pthread", "m", "dl"})
end)
```

config.h.in

```c
${define HAS_PTHREAD}
```

config.h

```c
#define HAS_PTHREAD 1
/* #undef HAS_PTHREAD */
```

#### 检测 c/c++ 类型

我们也能够检测 c/c++ 类型是否存在。

`configvar_check_ctypes` 用于检测 c 代码类型，`configvar_check_cxxtypes` 用于检测 c++ 代码类型。

```lua
includes("check_ctypes.lua")

target("test", function()
    set_kind("binary")
    add_files("*.c")
    add_configfiles("config.h.in")
    configvar_check_ctypes("HAS_WCHAR", "wchar_t")
    configvar_check_ctypes("HAS_WCHAR_AND_FLOAT", {"wchar_t", "float"})
end)
```

config.h.in

```c
${define HAS_WCHAR}
${define HAS_WCHAR_AND_FLOAT}
```

config.h

```c
/* #undef HAS_WCHAR */
/* #undef HAS_WCHAR_AND_FLOAT */
```

#### 检测 c/c++ 函数

`configvar_check_cfuncs` 用于检测 c 代码函数，`configvar_check_cxxfuncs` 用于检测 c++ 代码函数。

```lua
includes("check_cfuncs.lua")

target("test", function()
    set_kind("binary")
    add_files("*.c")
    add_configfiles("config.h.in")
    configvar_check_cfuncs("HAS_SETJMP", "setjmp", {includes = {"signal.h", "setjmp.h"}})
end)
```

config.h.in

```c
${define HAS_SETJMP}
```

config.h

```c
#define HAS_SETJMP 1
/* #undef HAS_SETJMP */
```

#### 检测 c/c++ 头文件

`configvar_check_cincludes` 用于检测 c 代码头文件，`configvar_check_cxxincludes` 用于检测 c++ 代码头文件。

```lua
includes("check_cincludes.lua")

target("test", function()
    set_kind("binary")
    add_files("*.c")
    add_configfiles("config.h.in")
    configvar_check_cincludes("HAS_STRING_H", "string.h")
    configvar_check_cincludes("HAS_STRING_AND_STDIO_H", {"string.h", "stdio.h"})
end)
```

config.h.in

```c
${define HAS_STRING_H}
${define HAS_STRING_AND_STDIO_H}
```

config.h

```c
/* #undef HAS_STRING_H */
#define HAS_STRING_AND_STDIO_H 1
```

#### 检测 c/c++ 代码片段

`configvar_check_csnippets` 用于检测 c 代码片段，`configvar_check_cxxsnippets` 用于检测 c++ 代码片段。

```lua
includes("check_csnippets.lua")

target("test", function()
    set_kind("binary")
    add_files("*.c")
    add_configfiles("config.h.in")
    configvar_check_csnippets("HAS_STATIC_ASSERT", "_Static_assert(1, \"\");")
end)
```

config.h.in

```c
${define HAS_STATIC_ASSERT}
```

config.h

```c
#define HAS_STATIC_ASSERT 1
```

xmake 对 check_csnippets 做了改进，新增 `tryrun` 和 `output` 参数去尝试运行和捕获输出。

```lua
includes("check_csnippets.lua")

target("test")
    set_kind("binary")
    add_files("*.c")
    add_configfiles("config.h.in")

    check_csnippets("HAS_INT_4", "return (sizeof(int) == 4)? 0 : -1;", {tryrun = true})
    check_csnippets("INT_SIZE", 'printf("%d", sizeof(int)); return 0;', {output = true, number = true})
    configvar_check_csnippets("HAS_LONG_8", "return (sizeof(long) == 8)? 0 : -1;", {tryrun = true})
    configvar_check_csnippets("PTR_SIZE", 'printf("%d", sizeof(void*)); return 0;', {output = true, number = true})
```

如果启用捕获输出，`config.h.in` 的 `${define PTR_SIZE}` 会自动生成 `#define PTR_SIZE 4`。

其中，`number = true` 设置，可以强制作为 number 而不是字符串值，否则默认会定义为 `#define PTR_SIZE "4"`

#### 检测编译器特性

```lua
includes("check_features.lua")

target("test", function()
    set_kind("binary")
    add_files("*.c")
    add_configfiles("config.h.in")
    configvar_check_features("HAS_CONSTEXPR", "cxx_constexpr")
    configvar_check_features("HAS_CONSEXPR_AND_STATIC_ASSERT", {"cxx_constexpr", "c_static_assert"}, {languages = "c++11"})
end)
```

config.h.in

```c
${define HAS_CONSTEXPR}
${define HAS_CONSEXPR_AND_STATIC_ASSERT}
```

config.h

```c
/* #undef HAS_CONSTEXPR */
#define HAS_CONSEXPR_AND_STATIC_ASSERT 1
```

所有 c 编译器特性列表：

| 特性名                |
| --------------------- |
| c_static_assert       |
| c_restrict            |
| c_variadic_macros     |
| c_function_prototypes |

所有 c++ 编译器特性列表：

| 特性名                               |
| ------------------------------------ |
| cxx_variable_templates               |
| cxx_relaxed_constexpr                |
| cxx_aggregate_default_initializers   |
| cxx_contextual_conversions           |
| cxx_attribute_deprecated             |
| cxx_decltype_auto                    |
| cxx_digit_separators                 |
| cxx_generic_lambdas                  |
| cxx_lambda_init_captures             |
| cxx_binary_literals                  |
| cxx_return_type_deduction            |
| cxx_decltype_incomplete_return_types |
| cxx_reference_qualified_functions    |
| cxx_alignof                          |
| cxx_attributes                       |
| cxx_inheriting_constructors          |
| cxx_thread_local                     |
| cxx_alias_templates                  |
| cxx_delegating_constructors          |
| cxx_extended_friend_declarations     |
| cxx_final                            |
| cxx_nonstatic_member_init            |
| cxx_override                         |
| cxx_user_literals                    |
| cxx_constexpr                        |
| cxx_defaulted_move_initializers      |
| cxx_enum_forward_declarations        |
| cxx_noexcept                         |
| cxx_nullptr                          |
| cxx_range_for                        |
| cxx_unrestricted_unions              |
| cxx_explicit_conversions             |
| cxx_lambdas                          |
| cxx_local_type_template_args         |
| cxx_raw_string_literals              |
| cxx_auto_type                        |
| cxx_defaulted_functions              |
| cxx_deleted_functions                |
| cxx_generalized_initializers         |
| cxx_inline_namespaces                |
| cxx_sizeof_member                    |
| cxx_strong_enums                     |
| cxx_trailing_return_types            |
| cxx_unicode_literals                 |
| cxx_uniform_initialization           |
| cxx_variadic_templates               |
| cxx_decltype                         |
| cxx_default_function_template_args   |
| cxx_long_long_type                   |
| cxx_right_angle_brackets             |
| cxx_rvalue_references                |
| cxx_static_assert                    |
| cxx_extern_templates                 |
| cxx_func_identifier                  |
| cxx_variadic_macros                  |
| cxx_template_template_parameters     |

c++17 特性检测：

| 特性名                               |
| ------------------------------------ |
| cxx_aggregate_bases                  |
| cxx_aligned_new                      |
| cxx_capture_star_this                |
| cxx_constexpr                        |
| cxx_deduction_guides                 |
| cxx_enumerator_attributes            |
| cxx_fold_expressions                 |
| cxx_guaranteed_copy_elision          |
| cxx_hex_float                        |
| cxx_if_constexpr                     |
| cxx_inheriting_constructors          |
| cxx_inline_variables                 |
| cxx_namespace_attributes             |
| cxx_noexcept_function_type           |
| cxx_nontype_template_args            |
| cxx_nontype_template_parameter_auto  |
| cxx_range_based_for                  |
| cxx_static_assert                    |
| cxx_structured_bindings              |
| cxx_template_template_args           |
| cxx_variadic_using                   |

c++20 特性检测：

| 特性名                               |
| ------------------------------------ |
| cxx_aggregate_paren_init             |
| cxx_char8_t                          |
| cxx_concepts                         |
| cxx_conditional_explicit             |
| cxx_consteval                        |
| cxx_constexpr                        |
| cxx_constexpr_dynamic_alloc          |
| cxx_constexpr_in_decltype            |
| cxx_constinit                        |
| cxx_deduction_guides                 |
| cxx_designated_initializers          |
| cxx_generic_lambdas                  |
| cxx_impl_coroutine                   |
| cxx_impl_destroying_delete           |
| cxx_impl_three_way_comparison        |
| cxx_init_captures                    |
| cxx_modules                          |
| cxx_nontype_template_args            |
| cxx_using_enum                       |

cstd 和 c++ std 版本支持，相关 issues: [#1715](https://github.com/xmake-io/xmake/issues/1715)

```lua
configvar_check_features("HAS_CXX_STD_98", "cxx_std_98")
configvar_check_features("HAS_CXX_STD_11", "cxx_std_11", {languages = "c++11"})
configvar_check_features("HAS_CXX_STD_14", "cxx_std_14", {languages = "c++14"})
configvar_check_features("HAS_CXX_STD_17", "cxx_std_17", {languages = "c++17"})
configvar_check_features("HAS_CXX_STD_20", "cxx_std_20", {languages = "c++20"})
configvar_check_features("HAS_C_STD_89", "c_std_89")
configvar_check_features("HAS_C_STD_99", "c_std_99")
configvar_check_features("HAS_C_STD_11", "c_std_11", {languages = "c11"})
configvar_check_features("HAS_C_STD_17", "c_std_17", {languages = "c17"})
```

#### 检测内置宏定义

编译器存在一些内置的宏定义，比如：`__GNUC__` 等，我们可以通过 `check_macros` 和 `configvar_check_macros` 辅助脚本来检测它们是否存在。

相关 issues: [#1715](https://github.com/xmake-io/xmake/issues/1715)

```lua
-- 检测宏是否定义
configvar_check_macros("HAS_GCC", "__GNUC__")
-- 检测宏没有被定义
configvar_check_macros("NO_GCC", "__GNUC__", {defined = false})
-- 检测宏条件
configvar_check_macros("HAS_CXX20", "__cplusplus>= 202002L", {languages = "c++20"})
```

#### 检测类型大小

在先前的版本中，我们可以通过 `check_csnippets` 和 `output = true` 的方式，来实现类型检测。

```lua
check_csnippets("INT_SIZE", 'printf("%d", sizeof(int)); return 0;', {output = true, number = true})
```

但是这种方式，是通过尝试运行测试代码，然后获取运行输出结果，提取类型大小信息。

这对于交叉编译，就不适用了。

xmake 新增了 `check_sizeof` 辅助接口，可以通过直接解析测试程序的二进制文件，提取类型大小信息。

由于不需要运行测试，这种方式不仅可以支持交叉编译，而且对检测效率也有极大的提升，使用也更加的简单。

```lua
includes("@builtin/check")

target("test", function()
    set_kind("static")
    add_files("*.cpp")
    check_sizeof("LONG_SIZE", "long")
    check_sizeof("STRING_SIZE", "std::string", {includes = "string"})
end)
```

```bash
$ xmake f -c
checking for LONG_SIZE ... 8
checking for STRING_SIZE ... 24
```

另外，我也可以通过 `target:check_sizeof` 在脚本域进行检测。

#### 检测大小端

xmake 新增了 `check_bigendian` 接口，来判断当前编译目标是否为大端模式。

```lua
includes("@builtin/check")

target("test", function()
    set_kind("static")
    add_files("*.cpp")
    check_bigendian("IS_BIG_ENDIAN")
end)
```

如果检测通过，当前是大端模式，那么会定义 `IS_BIG_ENDIAN=1`。
