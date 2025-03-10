---
class: heading_no_counter
---

# 内建规则

xmake 提供了一些内置规则去简化日常 xmake.lua 描述，以及一些常用构建环境的支持。

我们可以通过运行以下命令，查看完整的内置规则列表：

```bash
$ xmake show -l rules
```

## mode.debug

为当前工程 xmake.lua 添加 debug 编译模式的配置规则，例如：

```lua
add_rules("mode.debug")
```

相当于：

```lua
if is_mode("debug") then
    set_symbols("debug")
    set_optimize("none")
end
```

我们可以通过：`xmake f -m debug` 来切换到此编译模式。

## mode.release

为当前工程 xmake.lua 添加 release 编译模式的配置规则，例如：

```lua
add_rules("mode.release")
```

> 此模式默认不会带调试符号。

相当于：

```lua
if is_mode("release") then
    set_symbols("hidden")
    set_optimize("fastest")
    set_strip("all")
end
```

我们可以通过：`xmake f -m release` 来切换到此编译模式。

## mode.releasedbg

为当前工程 xmake.lua 添加 releasedbg 编译模式的配置规则，例如：

```lua
add_rules("mode.releasedbg")
```

> 与 release 模式相比，此模式还会额外开启调试符号，这通常是非常有用的。

相当于：

```lua
if is_mode("releasedbg") then
    set_symbols("debug")
    set_optimize("fastest")
    set_strip("all")
end
```

我们可以通过：`xmake f -m releasedbg` 来切换到此编译模式。

## mode.minsizerel

为当前工程 xmake.lua 添加 minsizerel 编译模式的配置规则，例如：

```lua
add_rules("mode.minsizerel")
```

> 与 release 模式相比，此模式更加倾向于最小代码编译优化，而不是速度优先。

相当于：

```lua
if is_mode("minsizerel") then
    set_symbols("hidden")
    set_optimize("smallest")
    set_strip("all")
end
```

我们可以通过：`xmake f -m minsizerel` 来切换到此编译模式。

## mode.check

为当前工程 xmake.lua 添加 check 编译模式的配置规则，一般用于内存检测，例如：

```lua
add_rules("mode.check")
```

相当于：

```lua
if is_mode("check") then
    set_symbols("debug")
    set_optimize("none")
    add_cxflags("-fsanitize=address", "-ftrapv")
    add_mxflags("-fsanitize=address", "-ftrapv")
    add_ldflags("-fsanitize=address")
end
```

我们可以通过：`xmake f -m check` 来切换到此编译模式。

## mode.profile

为当前工程 xmake.lua 添加 profile 编译模式的配置规则，一般用于性能分析，例如：

```lua
add_rules("mode.profile")
```

相当于：

```lua
if is_mode("profile") then
    set_symbols("debug")
    add_cxflags("-pg")
    add_ldflags("-pg")
end
```

我们可以通过：`xmake f -m profile` 来切换到此编译模式。

## mode.coverage

为当前工程 xmake.lua 添加 coverage 编译模式的配置规则，一般用于覆盖分析，例如：

```lua
add_rules("mode.coverage")
```

相当于：

```lua
if is_mode("coverage") then
    add_cxflags("--coverage")
    add_mxflags("--coverage")
    add_ldflags("--coverage")
end
```

我们可以通过：`xmake f -m coverage` 来切换到此编译模式。

## mode.valgrind

此模式提供 valgrind 内存分析检测支持。

```lua
add_rules("mode.valgrind")
```

我们可以通过：`xmake f -m valgrind` 来切换到此编译模式。

## mode.asan

此模式提供 AddressSanitizer 内存分析检测支持。

```lua
add_rules("mode.asan")
```

我们可以通过：`xmake f -m asan` 来切换到此编译模式。

## mode.tsan

此模式提供 ThreadSanitizer 内存分析检测支持。

```lua
add_rules("mode.tsan")
```

我们可以通过：`xmake f -m tsan` 来切换到此编译模式。

## mode.lsan

此模式提供 LeakSanitizer 内存分析检测支持。

```lua
add_rules("mode.lsan")
```

我们可以通过：`xmake f -m lsan` 来切换到此编译模式。

## mode.ubsan

此模式提供 UndefinedBehaviorSanitizer 内存分析检测支持。

```lua
add_rules("mode.ubsan")
```

我们可以通过：`xmake f -m ubsan` 来切换到此编译模式。

## qt.static

用于编译生成 Qt 环境的静态库程序：

```lua
target("test", function()
    add_rules("qt.static")
    add_files("src/*.cpp")
    add_frameworks("QtNetwork", "QtGui")
end)
```

## qt.shared

用于编译生成 Qt 环境的动态库程序：

```lua
target("test", function()
    add_rules("qt.shared")
    add_files("src/*.cpp")
    add_frameworks("QtNetwork", "QtGui")
end)
```

## qt.console

用于编译生成 Qt 环境的控制台程序：

```lua
target("test", function()
    add_rules("qt.console")
    add_files("src/*.cpp")
end)
```

## qt.quickapp

用于编译生成 Qt 环境的 Quick(qml) ui 应用程序。

```lua
target("test", function()
    add_rules("qt.quickapp")
    add_files("src/*.cpp")
    add_files("src/qml.qrc")
end)
```

## qt.quickapp_static

用于编译生成 Qt 环境的 Quick(qml) ui 应用程序（静态链接版本）。

> 需要切换到静态库版本 Qt SDK

```lua
target("test", function()
    add_rules("qt.quickapp_static")
    add_files("src/*.cpp")
    add_files("src/qml.qrc")
end)
```

## qt.widgetapp

用于编译 Qt Widgets(ui/moc) 应用程序

```lua
target("test", function()
    add_rules("qt.widgetapp")
    add_files("src/*.cpp")
    add_files("src/mainwindow.ui")
    add_files("src/mainwindow.h")  -- 添加带有 Q_OBJECT 的 meta 头文件
end)
```

## qt.widgetapp_static

用于编译 Qt Widgets(ui/moc) 应用程序（静态库版本）

> 需要切换到静态库版本 Qt SDK

```lua
target("test", function()
    add_rules("qt.widgetapp_static")
    add_files("src/*.cpp")
    add_files("src/mainwindow.ui")
    add_files("src/mainwindow.h")  -- 添加带有 Q_OBJECT 的 meta 头文件
end)
```

更多 Qt 相关描述见：[#160](https://github.com/xmake-io/xmake/issues/160)

## xcode.bundle

用于编译生成 ios/macos bundle 程序

```lua
target("test", function()
    add_rules("xcode.bundle")
    add_files("src/*.m")
    add_files("src/Info.plist")
end)
```

## xcode.framework

用于编译生成 ios/macos framework 程序

```lua
target("test", function()
    add_rules("xcode.framework")
    add_files("src/*.m")
    add_files("src/Info.plist")
end)
```

## xcode.application

用于编译生成 ios/macos 应用程序

```lua
target("test", function()
    add_rules("xcode.application")
    add_files("src/*.m", "src/**.storyboard", "src/*.xcassets")
    add_files("src/Info.plist")
end)
```

## plugin.compile_commands.autoupdate

我们也可以使用这个规则来自动更新生成 compile_commandss.json

```lua
add_rules("plugin.compile_commands.autoupdate", {outputdir = ".vscode"})

target("test", function()
    set_kind("binary")
    add_files("src/*.c")
end)
```

## utils.symbols.export_list

我们可以在 xmake.lua 里面直接定义导出的符号列表，例如：

```lua
target("foo", function()
    set_kind("shared")
    add_files("src/foo.c")
    add_rules("utils.symbols.export_list", {symbols = {
        "add",
        "sub"}})
end)
```

或者，在 `*.export.txt` 文件中添加导出的符号列表。

```lua
target("foo2", function()
    set_kind("shared")
    add_files("src/foo.c")
    add_files("src/foo.export.txt")
    add_rules("utils.symbols.export_list")
end)
```

完整的工程例子见：[导出符号例子](https://github.com/xmake-io/xmake/tree/dev/tests/projects/c/shared_library_export_list)

## utils.install.cmake_importfiles

可以使用此规则在安装 target 目标库文件的时候，导出 .cmake 文件，用于其他 cmake 项目的库导入和查找。

## utils.install.pkgconfig_importfiles

可以使用此规则在安装 target 目标库文件的时候，导出 pkgconfig/.pc 文件，用于其他项目的库导入和查找。

## utils.bin2c

可以使用此规则，在项目中引入一些二进制文件，并见他们作为 c/c++ 头文件的方式提供开发者使用，获取这些文件的数据。

比如，我们可以在项目中，内嵌一些 png/jpg 资源文件到代码中。

```lua
target("console", function()
    set_kind("binary")
    add_rules("utils.bin2c", {extensions = {".png", ".jpg"}})
    add_files("src/*.c")
    add_files("res/*.png", "res/*.jpg")
end)
```

> extensions 的设置是可选的，默认后缀名是 .bin

然后，我们就可以通过 `#include "filename.png.h"` 的方式引入进来使用，xmake 会自动帮你生成对应的头文件，并且添加对应的搜索目录。

```c
static unsigned char g_png_data[] = {
    #include "image.png.h"
};

int main(int argc, char** argv)
{
    printf("image.png: %s, size: %d\n", g_png_data, sizeof(g_png_data));
    return 0;
}
```

生成头文件内容类似：

```console
cat build/.gens/test/macosx/x86_64/release/rules/c++/bin2c/image.png.h
  0x68, 0x65, 0x6C, 0x6C, 0x6F, 0x20, 0x78, 0x6D, 0x61, 0x6B, 0x65, 0x21, 0x0A, 0x00
```

## utils.glsl2spv

可以使用此规则，在项目中引入 `*.vert/*.frag` 等 glsl shader 文件，然后实现自动编译生成 `*.spv` 文件。

另外，我们还支持以 C/C++ 头文件的方式，二进制内嵌 spv 文件数据，方便程序使用。

### 编译生成 spv 文件

xmake 会自动调用 glslangValidator 或者 glslc 去编译 shaders 生成 .spv 文件，然后输出到指定的 `{outputdir = "build"}` 目录下。

```lua
add_rules("mode.debug", "mode.release")

add_requires("glslang", {configs = {binaryonly = true}})

target("test", function()
    set_kind("binary")
    add_rules("utils.glsl2spv", {outputdir = "build"})
    add_files("src/*.c")
    add_files("src/*.vert", "src/*.frag")
    add_packages("glslang")
end)
```

> 注，这里的 `add_packages("glslang")` 主要用于引入和绑定 glslang 包中的 glslangValidator，确保 xmake 总归能够使用它。

当然，如果用户自己系统上已经安装了它，也可以不用额外绑定这个包，不过我还是建议添加一下。

### 编译生成 c/c++ 头文件

我们也可以内部借助 bin2c 模块，将编译后的 spv 文件生成对应的二进制头文件，方便用户代码中直接引入，我们只需要启用 `{bin2c = true}`。:

```lua
add_rules("mode.debug", "mode.release")

add_requires("glslang", {configs = {binaryonly = true}})

target("test", function()
    set_kind("binary")
    add_rules("utils.glsl2spv", {bin2c = true})
    add_files("src/*.c")
    add_files("src/*.vert", "src/*.frag")
    add_packages("glslang")
end)
```

然后我们可以在代码这么引入：

```c
static unsigned char g_test_vert_spv_data[] = {
    #include "test.vert.spv.h"
};

static unsigned char g_test_frag_spv_data[] = {
    #include "test.frag.spv.h"
};
```

跟 bin2c 规则的使用方式类似，完整例子见：[glsl2spv example](https://github.com/xmake-io/xmake/tree/master/tests/projects/other/glsl2spv)

## utils.hlsl2spv

除了 `utils.glsl2spv` 规则，我们现在还支持 `utils.hlsl2spv` 规则。

```bash
add_rules("mode.debug", "mode.release")

add_requires("glslang", {configs = {binaryonly = true}})

target("test", function()
    set_kind("binary")
    add_rules("utils.hlsl2spv", {bin2c = true})
    add_files("src/*.c")
    add_files("src/*.hlsl", "src/*.hlsl")
    add_packages("directxshadercompiler")
end)
```

## python.library

我们可以用这个规则，配合 pybind11 生成 python 库模块，它会调整 python 库的模块名。

```lua
add_rules("mode.release", "mode.debug")
add_requires("pybind11")

target("example", function()
    add_rules("python.library")
    add_files("src/*.cpp")
    add_packages("pybind11")
    set_languages("c++11")
end)
```

带有 soabi：

```lua
add_rules("mode.release", "mode.debug")
add_requires("pybind11")

target("example", function()
    add_rules("python.library", {soabi = true})
    add_files("src/*.cpp")
    add_packages("pybind11")
    set_languages("c++11")
end)
```

## nodejs.module

构建 nodejs 模块。

```lua
add_requires("node-addon-api")

target("foo", function()
    set_languages("cxx17")
    add_rules("nodejs.module")
    add_packages("node-addon-api")
    add_files("*.cc")
end)
```

## utils.ipsc

ipsc 编译器规则支持，使用方式如下：

```lua
target("test", function()
    set_kind("binary")
    add_rules("utils.ispc", {header_extension = "_ispc.h"})
    set_values("ispc.flags", "--target=host")
    add_files("src/*.ispc")
    add_files("src/*.cpp")
end)
```
