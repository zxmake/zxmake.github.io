---
class: heading_no_counter
---

# 扩展模块

所有扩展模块的使用，都需要通过 [import](/zh-cn/manual/builtin_modules?id=import) 接口，进行导入后才能使用。

## core.base.option

一般用于获取 xmake 命令参数选项的值，常用于插件开发。

### option.get

- 获取参数选项值

在插件开发中用于获取参数选项值，例如：

```lua
-- 导入选项模块
import("core.base.option")

-- 插件入口函数
function main(...)
    print(option.get("info"))
end
```

上面的代码获取 hello 插件，执行：`xmake hello --info=xxxx` 命令时候传入的 `--info=` 选项的值，并显示：`xxxx`

对于非 main 入口的 task 任务或插件，可以这么使用：

```lua
task("hello", function()
    on_run(function ()
        import("core.base.option")
        print(option.get("info"))
    end)
end)
```

## core.base.global

用于获取 xmake 全局的配置信息，也就是 `xmake g|global --xxx=val` 传入的参数选项值。

### global.get

获取指定配置值。

类似 [config.get](#configget)，唯一的区别就是这个是从全局配置中获取。

### global.load

加载配置。

类似 [global.get](#globalget)，唯一的区别就是这个是从全局配置中加载。

### global.directory

获取全局配置信息目录。

默认为 `~/.config` 目录。

### global.dump

打印输出所有全局配置信息。

输出结果如下：

```lua
{
    clean = true
,   ccache = "ccache"
,   xcode_dir = "/Applications/Xcode.app"
}
```

## core.base.task

用于任务操作，一般用于在自定义脚本中、插件任务中，调用运行其他 task 任务。

### task.run

运行指定任务。

用于在自定义脚本、插件任务中运行 [task](#task) 定义的任务或插件，例如：

```lua
task("hello", function()
    on_run(function ()
        print("hello xmake!")
    end)
end)

target("demo", function()
    on_clean(function(target)

        -- 导入 task 模块
        import("core.base.task")

        -- 运行这个 hello task
        task.run("hello")
    end)
end)
```

我们还可以在运行任务时，增加参数传递，例如：

```lua
task("hello", function()
    on_run(function (arg1, arg2)
        print("hello xmake: %s %s!", arg1, arg2)
    end)
end)

target("demo", function()
    on_clean(function(target)

        -- 导入 task
        import("core.base.task")

        -- {} 这个是给第一种选项传参使用，这里置空，这里在最后面传入了两个参数：arg1, arg2
        task.run("hello", {}, "arg1", "arg2")
    end)
end)
```

对于 `task.run` 的第二个参数，用于传递命令行菜单中的选项，而不是直接传入 `function (arg, ...)` 函数入口中，例如：

```lua
-- 导入 task
import("core.base.task")

-- 插件入口
function main(...)

    -- 运行内置的 xmake 配置任务，相当于：xmake f|config --plat=iphoneos --arch=armv7
    task.run("config", {plat="iphoneos", arch="armv7"})
end
```

## core.base.json

xmake 提供了内置的 json 模块，基于 lua_cjson 实现，我们可以用它实现快速的在 json 和 lua table 直接相互操作。

我们可以通过 `import("core.base.json")` 直接导入使用。

这里也有一些例子：[Jsom Examples](https://github.com/xmake-io/xmake/blob/master/tests/modules/json/test.lua)

### json.decode

直接从字符串解码 json 获取 lua table.

```lua
import("core.base.json")
local luatable = json.decode('[1,"2", {"a":1,"b":true}]')
print(luatable)
```

```
{
    1.0,
    "2",
    {
      b = true,
      a = 1.0
    }
  }
```

> 如果里面有 null，可以用 `json.null` 来判断

### json.encode

我们也可以直接对一个 lua table 进行编码。

```lua
local jsonstr = json.encode({1, "2", {a = 1}})
```

需要注意的是，如果需要编码 null，需要使用 `json.null`，例如

```lua
local jsonstr = json.encode({json.null, 1, "2", false, true})
```

### json.loadfile

直接加载 json 文件，并解析成 lua table。

```lua
local luatable = json.loadfile("/tmp/xxx.json")
```

### json.savefile

保存 lua table 到指定 json 文件。

```lua
json.savefile("/tmp/xxx.json", {1, {a = 1}})
```

## core.tool.linker

链接器相关操作，常用于插件开发。

### linker.link

执行链接。

针对 target，链接指定对象文件列表，生成对应的目标文件，例如：

```lua
linker.link("binary", "cc", {"a.o", "b.o", "c.o"}, target:targetfile(), {target = target})
```

其中 [target](#target)，为工程目标，这里传入，主要用于获取 target 特定的链接选项，具体如果获取工程目标对象，见：[core.project.project](#core-project-project)

当然也可以不指定 target，例如：

```lua
linker.link("binary", "cc", {"a.o", "b.o", "c.o"}, "/tmp/targetfile")
```

第一个参数指定链接类型，目前支持：binary, static, shared
第二个参数告诉链接器，应该作为那种源文件对象进行链接，这些对象源文件使用什么编译器编译的，例如：

| 第二个参数值 | 描述         |
| ------------ | ------------ |
| cc           | c 编译器      |
| cxx          | c++ 编译器    |
| mm           | objc 编译器   |
| mxx          | objc++ 编译器 |
| gc           | go 编译器     |
| as           | 汇编器       |
| sc           | swift 编译器  |
| rc           | rust 编译器   |
| dc           | dlang 编译器  |

指定不同的编译器类型，链接器会适配最合适的链接器来处理链接，并且如果几种支持混合编译的语言，那么可以同时传入多个编译器类型，指定链接器选择支持这些混合编译语言的链接器进行链接处理：

```lua
linker.link("binary", {"cc", "mxx", "sc"}, {"a.o", "b.o", "c.o"}, "/tmp/targetfile")
```

上述代码告诉链接器，a, b, c 三个对象文件有可能分别是 c, objc++, swift 代码编译出来的，链接器会从当前系统和工具链中选择最合适的链接器去处理这个链接过程。

### linker.linkcmd

获取链接命令行字符串。

直接获取 [linker.link](#linkerlink) 中执行的命令行字符串，相当于：

```lua
local cmdstr = linker.linkcmd("static", "cxx", {"a.o", "b.o", "c.o"}, target:targetfile(), {target = target})
```

注：后面 `{target = target}` 扩展参数部分是可选的，如果传递了 target 对象，那么生成的链接命令，会加上这个 target 配置对应的链接选项。

并且还可以自己传递各种配置，例如：

```lua
local cmdstr = linker.linkcmd("static", "cxx", {"a.o", "b.o", "c.o"}, target:targetfile(), {configs = {linkdirs = "/usr/lib"}})
```

### linker.linkargv

获取链接命令行参数列表。

跟 [linker.linkcmd](#linkerlinkcmd) 稍微有点区别的是，此接口返回的是参数列表，table 表示，更加方便操作：

```lua
local program, argv = linker.linkargv("static", "cxx", {"a.o", "b.o", "c.o"}, target:targetfile(), {target = target})
```

其中返回的第一个值是主程序名，后面是参数列表，而 `os.args(table.join(program, argv))` 等价于 `linker.linkcmd`。

我们也可以通过传入返回值给 [os.runv](#os-runv) 来直接运行它：`os.runv(linker.linkargv(..))`

### linker.linkflags

获取链接选项。

获取 [linker.linkcmd](#linkerlinkcmd) 中的链接选项字符串部分，不带 shellname 和对象文件列表，并且是按数组返回，例如：

```lua
local flags = linker.linkflags("shared", "cc", {target = target})
for _, flag in ipairs(flags) do
    print(flag)
end
```

返回的是 flags 的列表数组。

### linker.has_flags

判断指定链接选项是否支持。

虽然通过 [lib.detect.has_flags](detect-has_flags) 也能判断，但是那个接口更加底层，需要指定链接器名称
而此接口只需要指定 target 的目标类型，源文件类型，它会自动切换选择当前支持的链接器。

```lua
if linker.has_flags(target:targetkind(), target:sourcekinds(), "-L/usr/lib -lpthread") then
    -- ok
end
```

## core.tool.compiler

编译器相关操作，常用于插件开发。

### compiler.compile

执行编译。

针对 target，链接指定对象文件列表，生成对应的目标文件，例如：

```lua
compiler.compile("xxx.c", "xxx.o", "xxx.h.d", {target = target})
```

其中 [target](#target)，为工程目标，这里传入主要用于获取 taeget 的特定编译选项，具体如果获取工程目标对象，见：[core.project.project](#core-project-project)

而 `xxx.h.d` 文件用于存储为此源文件的头文件依赖文件列表，最后这两个参数都是可选的，编译的时候可以不传他们：

```lua
compiler.compile("xxx.c", "xxx.o")
```

来单纯编译一个源文件。

### compiler.compcmd

获取编译命令行。

直接获取 [compiler.compile](#compilercompile) 中执行的命令行字符串，相当于：

```lua
local cmdstr = compiler.compcmd("xxx.c", "xxx.o", {target = target})
```

注：后面 `{target = target}` 扩展参数部分是可选的，如果传递了 target 对象，那么生成的编译命令，会加上这个 target 配置对应的链接选项。

并且还可以自己传递各种配置，例如：

```lua
local cmdstr = compiler.compcmd("xxx.c", "xxx.o", {configs = {includedirs = "/usr/include", defines = "DEBUG"}})
```

通过 target，我们可以导出指定目标的所有源文件编译命令：

```lua
import("core.project.project")

for _, target in pairs(project.targets()) do
    for sourcekind, sourcebatch in pairs(target:sourcebatches()) do
        for index, objectfile in ipairs(sourcebatch.objectfiles) do
            local cmdstr = compiler.compcmd(sourcebatch.sourcefiles[index], objectfile, {target = target})
        end
    end
end
```

### compiler.compargv

获取编译命令行列表。

跟 [compiler.compcmd](#compilercompcmd) 稍微有点区别的是，此接口返回的是参数列表，table 表示，更加方便操作：

```lua
local program, argv = compiler.compargv("xxx.c", "xxx.o")
```

### compiler.compflags

获取编译选项。

获取 [compiler.compcmd](#compilercompcmd) 中的编译选项字符串部分，不带 shellname 和文件列表，例如：

```lua
local flags = compiler.compflags(sourcefile, {target = target})
for _, flag in ipairs(flags) do
    print(flag)
end
```

返回的是 flags 的列表数组。

### compiler.has_flags

- 判断指定编译选项是否支持

虽然通过 [lib.detect.has_flags](detect-has_flags) 也能判断，但是那个接口更加底层，需要指定编译器名称。
而此接口只需要指定语言类型，它会自动切换选择当前支持的编译器。

```lua
-- 判断 c 语言编译器是否支持选项: -g
if compiler.has_flags("c", "-g") then
    -- ok
end

-- 判断 c++ 语言编译器是否支持选项: -g
if compiler.has_flags("cxx", "-g") then
    -- ok
end
```

### compiler.features

- 获取所有编译器特性

虽然通过 [lib.detect.features](detect-features) 也能获取，但是那个接口更加底层，需要指定编译器名称。
而此接口只需要指定语言类型，它会自动切换选择当前支持的编译器，然后获取当前的编译器特性列表。

```lua
-- 获取当前 c 语言编译器的所有特性
local features = compiler.features("c")

-- 获取当前 c++ 语言编译器的所有特性，启用 c++11 标准，否则获取不到新标准的特性
local features = compiler.features("cxx", {configs = {cxxflags = "-std=c++11"}})

-- 获取当前 c++ 语言编译器的所有特性，传递工程 target 的所有配置信息
local features = compiler.features("cxx", {target = target, configs = {defines = "..", includedirs = ".."}})
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

### compiler.has_features

判断指定的编译器特性是否支持。

虽然通过 [lib.detect.has_features](detect-has-features) 也能获取，但是那个接口更加底层，需要指定编译器名称。
而此接口只需要指定需要检测的特姓名称列表，就能自动切换选择当前支持的编译器，然后判断指定特性在当前的编译器中是否支持。

```lua
if compiler.has_features("c_static_assert") then
    -- ok
end

if compiler.has_features({"c_static_assert", "cxx_constexpr"}, {languages = "cxx11"}) then
    -- ok
end

if compiler.has_features("cxx_constexpr", {target = target, defines = "..", includedirs = ".."}) then
    -- ok
end
```

具体特性名有哪些，可以参考：[compiler.features](#compilerfeatures)。

## core.project.config

用于获取工程编译时候的配置信息，也就是 `xmake f|config --xxx=val` 传入的参数选项值。

### config.get

获取指定配置值。

用于获取 `xmake f|config --xxx=val` 的配置值，例如：

```lua
target("test")
    on_run(function (target)

        -- 导入配置模块
        import("core.project.config")

        -- 获取配置值
        print(config.get("xxx"))
    end)
```

### config.load

加载配置。

一般用于插件开发中，插件任务中不像工程的自定义脚本，环境需要自己初始化加载，默认工程配置是没有被加载的，如果要用 [config.get](#configget) 接口获取工程配置，那么需要先：

```lua

-- 导入配置模块
import("core.project.config")

function main(...)

    -- 先加载工程配置
    config.load()

    -- 获取配置值
    print(config.get("xxx"))
end
```

### config.arch

获取当前工程的架构配置。

也就是获取 `xmake f|config --arch=armv7` 的平台配置，相当于 `config.get("arch")`。

### config.plat

获取当前工程的平台配置。

也就是获取 `xmake f|config --plat=iphoneos` 的平台配置，相当于 `config.get("plat")`。

### config.mode

获取当前工程的编译模式配置。

也就是获取 `xmake f|config --mode=debug` 的平台配置，相当于 `config.get("mode")`。

### config.buildir

获取当前工程的输出目录配置。

也就是获取 `xmake f|config -o /tmp/output` 的平台配置，相当于 `config.get("buildir")`。

### config.directory

获取当前工程的配置信息目录。

获取工程配置的存储目录，默认为：`projectdir/.config`

### config.dump

打印输出当前工程的所有配置信息。

输出结果例如：

```lua
{
    sh = "xcrun -sdk macosx clang++"
,   xcode_dir = "/Applications/Xcode.app"
,   ar = "xcrun -sdk macosx ar"
,   small = true
,   object = false
,   arch = "x86_64"
,   xcode_sdkver = "10.12"
,   ex = "xcrun -sdk macosx ar"
,   cc = "xcrun -sdk macosx clang"
,   rc = "rustc"
,   plat = "macosx"
,   micro = false
,   host = "macosx"
,   as = "xcrun -sdk macosx clang"
,   dc = "dmd"
,   gc = "go"
,   openssl = false
,   ccache = "ccache"
,   cxx = "xcrun -sdk macosx clang"
,   sc = "xcrun -sdk macosx swiftc"
,   mm = "xcrun -sdk macosx clang"
,   buildir = "build"
,   mxx = "xcrun -sdk macosx clang++"
,   ld = "xcrun -sdk macosx clang++"
,   mode = "release"
,   kind = "static"
}
```

## core.project.project

用于获取当前工程的一些描述信息，也就是在 `xmake.lua` 工程描述文件中定义的配置信息，例如：[target](#target)、[option](#option) 等。

### project.load

加载工程描述配置。

仅在插件中使用，因为这个时候还没有加载工程配置信息，在工程目标的自定义脚本中，不需要执行此操作，就可以直接访问工程配置。

```lua
-- 导入工程模块
import("core.project.project")

-- 插件入口
function main(...)

    -- 加载工程描述配置
    project.load()

    -- 访问工程描述，例如获取指定工程目标
    local target = project.target("test")
end
```

### project.directory

获取工程目录

获取当前工程目录，也就是 `xmake -P xxx` 中指定的目录，否则为默认当前 `xmake` 命令执行目录。

> 建议使用 [os.projectdir](#os-projectdir) 来获取。

### project.target

获取指定工程目标对象。

获取和访问指定工程目标配置，例如：

```lua
local target = project.target("test")
if target then

    -- 获取目标名
    print(target:name())

    -- 获取目标目录, 2.1.9 版本之后才有
    print(target:targetdir())

    -- 获取目标文件名
    print(target:targetfile())

    -- 获取目标类型，也就是：binary, static, shared
    print(target:targetkind())

    -- 获取目标名
    print(target:name())

    -- 获取目标源文件
    local sourcefiles = target:sourcefiles()

    -- 获取目标安装头文件列表
    local srcheaders, dstheaders = target:headerfiles()

    -- 获取目标依赖
    print(target:get("deps"))
end
```

### project.targets

获取工程目标对象列表。

返回当前工程的所有编译目标，例如：

```lua
for targetname, target in pairs(project.targets())
    print(target:targetfile())
end
```

### project.option

获取指定选项对象。

获取和访问工程中指定的选项对象，例如：

```lua
local option = project.option("test")
if option:enabled() then
    option:enable(false)
end
```

### project.options

获取工程所有选项对象。

返回当前工程的所有编译目标，例如：

```lua
for optionname, option in pairs(project.options())
    print(option:enabled())
end
```

### project.name

获取当前工程名。

也就是获取 [set_project](#set_project) 的工程名配置。

```lua
print(project.name())
```

### project.version

获取当前工程版本号。

也就是获取 [set_version](#set_version) 的工程版本配置。

```lua
print(project.version())
```

## core.language.language

用于获取编译语言相关信息，一般用于代码文件的操作。

### language.extensions

获取所有语言的代码后缀名列表。

获取结果如下：

```lua
{
     [".c"]      = cc
,    [".cc"]     = cxx
,    [".cpp"]    = cxx
,    [".m"]      = mm
,    [".mm"]     = mxx
,    [".swift"]  = sc
,    [".go"]     = gc
}
```

### language.targetkinds

获取所有语言的目标类型列表。

获取结果如下：

```lua
{
     binary = {"ld", "gcld", "dcld"}
,    static = {"ar", "gcar", "dcar"}
,    shared = {"sh", "dcsh"}
}
```

### language.sourcekinds

获取所有语言的源文件类型列表。

获取结果如下：

```lua
{
     cc  = ".c"
,    cxx = {".cc", ".cpp", ".cxx"}
,    mm  = ".m"
,    mxx = ".mm"
,    sc  = ".swift"
,    gc  = ".go"
,    rc  = ".rs"
,    dc  = ".d"
,    as  = {".s", ".S", ".asm"}
}
```

### language.sourceflags

加载所有语言的源文件编译选项名列表。

获取结果如下：

```lua
{
     cc  = {"cflags", "cxflags"}
,    cxx = {"cxxflags", "cxflags"}
,    ...
}
```

### language.load

加载指定语言。

从语言名称加载具体语言对象，例如：

```lua
local lang = language.load("c++")
if lang then
    print(lang:name())
end
```

### language.load_sk

从源文件类型加载指定语言。

从源文件类型：`cc, cxx, mm, mxx, sc, gc, as ..` 加载具体语言对象，例如：

```lua
local lang = language.load_sk("cxx")
if lang then
    print(lang:name())
end
```

### language.load_ex

从源文件后缀名加载指定语言。

从源文件后缀名：`.cc, .c, .cpp, .mm, .swift, .go  ..` 加载具体语言对象，例如：

```lua
local lang = language.load_sk(".cpp")
if lang then
    print(lang:name())
end
```

### language.sourcekind_of

获取指定源文件的源文件类型。

也就是从给定的一个源文件路径，获取它是属于那种源文件类型，例如：

```lua
print(language.sourcekind_of("/xxxx/test.cpp"))
```

显示结果为：`cxx`，也就是 `c++` 类型，具体对应列表见：[language.sourcekinds](#languagesourcekinds)

## lib.detect

此模块提供了非常强大的探测功能，用于探测程序、编译器、语言特性、依赖包等。

> 此模块的接口分散在多个模块目录中，尽量通过导入单个接口来使用，这样效率更高。

### detect.find_file

查找文件。

这个接口提供了比 [os.files](#os-files) 更加强大的工程， 可以同时指定多个搜索目录，并且还能对每个目录指定附加的子目录，来模式匹配查找，相当于是 [os.files](#os-files) 的增强版。

例如：

```lua
import("lib.detect.find_file")

local file = find_file("ccache", { "/usr/bin", "/usr/local/bin"})
```

如果找到，返回的结果是：`/usr/bin/ccache`

它同时也支持模式匹配路径，进行递归查找，类似 `os.files`：

```lua
local file = find_file("test.h", { "/usr/include", "/usr/local/include/**"})
```

不仅如此，里面的路径也支持内建变量，来从环境变量和注册表中获取路径进行查找：

```lua
local file = find_file("xxx.h", { "$(env PATH)", "$(reg HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\XXXX;Name)"})
```

如果路径规则比较复杂多变，还可以通过自定义脚本来动态生成路径传入：

```lua
local file = find_file("xxx.h", { "$(env PATH)", function () return val("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\XXXX;Name"):match("\"(.-)\"") end})
```

大部分场合下，上面的使用已经满足各种需求了，如果还需要一些扩展功能，可以通过传入第三个参数，自定义一些可选配置，例如：

```lua
local file = find_file("test.h", { "/usr", "/usr/local"}, {suffixes = {"/include", "/lib"}})
```

通过指定 suffixes 子目录列表，可以扩展路径列表（第二个参数），使得实际的搜索目录扩展为：

```
/usr/include
/usr/lib
/usr/local/include
/usr/local/lib
```

并且不用改变路径列表，就能动态切换子目录来搜索文件。

> 我们也可以通过 `xmake lua` 插件来快速调用和测试此接口：`xmake lua lib.detect.find_file test.h /usr/local`

### detect.find_path

查找路径。

这个接口的用法跟 [lib.detect.find_file](#detectfind_file) 类似，唯一的区别是返回的结果不同。
此接口查找到传入的文件路径后，返回的是对应的搜索路径，而不是文件路径本身，一般用于查找文件对应的父目录位置。

```lua
import("lib.detect.find_path")

local p = find_path("include/test.h", { "/usr", "/usr/local"})
```

上述代码如果查找成功，则返回：`/usr/local`，如果 `test.h` 在 `/usr/local/include/test.h` 的话。

还有一个区别就是，这个接口传入不只是文件路径，还可以传入目录路径来查找：

```lua
local p = find_path("lib/xxx", { "$(env PATH)", "$(reg HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\XXXX;Name)"})
```

同样，此接口也支持模式匹配和后缀子目录：

```lua
local p = find_path("include/*.h", { "/usr", "/usr/local/**"}, {suffixes = "/subdir"})
```

### detect.find_library

查找库文件。

此接口用于指定的搜索目录中查找库文件（静态库，动态库），例如：

```lua
import("lib.detect.find_library")

local library = find_library("crypto", {"/usr/lib", "/usr/local/lib"})
```

在 macosx 上运行，返回的结果如下：

```lua
{
    filename = libcrypto.dylib
,   linkdir = /usr/lib
,   link = crypto
,   kind = shared
}
```

如果不指定是否需要静态库还是动态库，那么此接口会自动选择一个存在的库（有可能是静态库、也有可能是动态库）进行返回。

如果需要强制指定需要查找的库类型，可以指定 kind 参数为（`static/shared`）：

```lua
local library = find_library("crypto", {"/usr/lib", "/usr/local/lib"}, {kind = "static"})
```

此接口也支持 suffixes 后缀子目录搜索和模式匹配操作：

```lua
local library = find_library("cryp*", {"/usr", "/usr/local"}, {suffixes = "/lib"})
```

### detect.find_program

查找可执行程序。

这个接口比 [lib.detect.find_tool](#detectfind_tool) 较为原始底层，通过指定的参数目录来查找可执行程序。

```lua
import("lib.detect.find_program")

local program = find_program("ccache")
```

上述代码犹如没有传递搜索目录，所以它会尝试直接执行指定程序，如果运行 ok，那么直接返回：`ccache`，表示查找成功。

指定搜索目录，修改尝试运行的检测命令参数（默认是：`ccache --version`）：

```lua
local program = find_program("ccache", {paths = {"/usr/bin", "/usr/local/bin"}, check = "--help"})
```

上述代码会尝试运行：`/usr/bin/ccache --help`，如果运行成功，则返回：`/usr/bin/ccache`。

如果 `--help` 也没法满足需求，有些程序没有 `--version/--help` 参数，那么可以自定义运行脚本，来运行检测：

```lua
local program = find_program("ccache", {paths = {"/usr/bin", "/usr/local/bin"}, check = function (program) os.run("%s -h", program) end})
```

同样，搜索路径列表支持内建变量和自定义脚本：

```lua
local program = find_program("ccache", {paths = {"$(env PATH)", "$(reg HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\AeDebug;Debugger)"}})
local program = find_program("ccache", {paths = {"$(env PATH)", function () return "/usr/local/bin" end}})
```

<p class="tip">
为了加速频发查找的效率，此接口是默认自带 cache 的，所以就算频繁查找相同的程序，也不会花太多时间。
如果要禁用 cache，可以在工程目录执行 `xmake f -c` 清除本地 cache。
</p>

我们也可以通过 `xmake lua lib.detect.find_program ccache` 来快速测试。

### detect.find_programver

查找可执行程序版本号。

```lua
import("lib.detect.find_programver")

local programver = find_programver("ccache")
```

返回结果为：3.2.2

默认它会通过 `ccache --version` 尝试获取版本，如果不存在此参数，可以自己指定其他参数：

```lua
local version = find_programver("ccache", {command = "-v"})
```

甚至自定义版本获取脚本：

```lua
local version = find_programver("ccache", {command = function () return os.iorun("ccache --version") end})
```

对于版本号的提取规则，如果内置的匹配模式不满足要求，也可以自定义：

```lua
local version = find_programver("ccache", {command = "--version", parse = "(%d+%.?%d*%.?%d*.-)%s"})
local version = find_programver("ccache", {command = "--version", parse = function (output) return output:match("(%d+%.?%d*%.?%d*.-)%s") end})
```

> 为了加速频发查找的效率，此接口是默认自带 cache 的，如果要禁用 cache，可以在工程目录执行 `xmake f -c` 清除本地 cache。

我们也可以通过 `xmake lua lib.detect.find_programver ccache` 来快速测试。

### detect.find_package

查找包文件。

这个接口不推荐直接使用（仅供内部使用），库集成，请尽量使用 `add_requires()` 和 `add_packages()`。

### detect.find_tool

查找工具。

此接口也是用于查找可执行程序，不过比 [lib.detect.find_program](#detectfind_program) 更加的高级，功能也更加强大，它对可执行程序进行了封装，提供了工具这个概念：

- toolname: 工具名，可执行程序的简称，用于标示某个工具，例如：`gcc`, `clang` 等
- program: 可执行程序命令，例如：`xcrun -sdk macosx clang`

其对应关系如下：

| toolname  | program                             |
| --------- | ----------------------------------- |
| clang     | `xcrun -sdk macosx clang`           |
| gcc       | `/usr/toolchains/bin/arm-linux-gcc` |
| link      | `link.exe -lib`                     |

[lib.detect.find_program](#detectfind_program) 只能通过传入的原始 program 命令或路径，去判断该程序是否存在。
而 `find_tool` 则可以通过更加一致的 toolname 去查找工具，并且返回对应的 program 完整命令路径，例如：

```lua
import("lib.detect.find_tool")

local tool = find_tool("clang")
```

返回的结果为：`{name = "clang", program = "clang"}`，这个时候还看不出区别，我们可以手动指定可执行的命令：

```lua
local tool = find_tool("clang", {program = "xcrun -sdk macosx clang"})
```

返回的结果为：`{name = "clang", program = "xcrun -sdk macosx clang"}`

而在 macosx 下，gcc 就是 clang，如果我们执行 `gcc --version` 可以看到就是 clang 的一个马甲，我们可以通过 `find_tool` 接口进行智能识别：

```lua
local tool = find_tool("gcc")
```

返回的结果为：`{name = "clang", program = "gcc"}`

通过这个结果就可以看的区别来了，工具名实际会被标示为 clang，但是可执行的命令用的是 gcc。

我们也可以指定 `{version = true}` 参数去获取工具的版本，并且指定一个自定义的搜索路径，也支持内建变量和自定义脚本哦：

```lua
local tool = find_tool("clang", {version = true, paths = {"/usr/bin", "/usr/local/bin", "$(env PATH)", function () return "/usr/xxx/bin" end}})
```

返回的结果为：`{name = "clang", program = "/usr/bin/clang", version = "4.0"}`

这个接口是对 `find_program` 的上层封装，因此也支持自定义脚本检测：

```lua
local tool = find_tool("clang", {check = "--help"})
local tool = find_tool("clang", {check = function (tool) os.run("%s -h", tool) end})
```

最后总结下，`find_tool` 的查找流程：

1. 优先通过 `{program = "xxx"}` 的参数来尝试运行和检测。
2. 如果在 `xmake/modules/detect/tools` 下存在 `detect.tools.find_xxx` 脚本，则调用此脚本进行更加精准的检测。
3. 尝试从 `/usr/bin`，`/usr/local/bin` 等系统目录进行检测。

我们也可以在工程 `xmake.lua` 中 `add_moduledirs` 指定的模块目录中，添加自定义查找脚本，来改进检测机制：

```
projectdir
  - xmake/modules
    - detect/tools/find_xxx.lua
```

例如我们自定义一个 `find_7z.lua` 的查找脚本：

```lua
import("lib.detect.find_program")
import("lib.detect.find_programver")

function main(opt)

    -- init options
    opt = opt or {}

    -- find program
    local program = find_program(opt.program or "7z", opt.pathes, opt.check or "--help")

    -- find program version
    local version = nil
    if program and opt and opt.version then
        version = find_programver(program, "--help", "(%d+%.?%d*)%s")
    end

    -- ok?
    return program, version
end
```

将它放置到工程的模块目录下后，执行：`xmake l lib.detect.find_tool 7z` 就可以查找到了。

> 为了加速频发查找的效率，此接口是默认自带 cache 的，如果要禁用 cache，可以在工程目录执行 `xmake f -c` 清除本地 cache。

我们也可以通过 `xmake lua lib.detect.find_tool clang` 来快速测试。

### detect.find_toolname

查找工具名。

通过 program 命令匹配对应的工具名，例如：

| program                   | toolname   |
| ------------------------- | ---------- |
| `xcrun -sdk macosx clang` | clang      |
| `/usr/bin/arm-linux-gcc`  | gcc        |
| `link.exe -lib`           | link       |
| `gcc-5`                   | gcc        |
| `arm-android-clang++`     | clangxx    |
| `pkg-config`              | pkg_config |

toolname 相比 program，更能唯一标示某个工具，也方便查找和加载对应的脚本 `find_xxx.lua`。

### detect.find_cudadevices

查找本机的 CUDA 设备。

通过 CUDA Runtime API 枚举本机的 CUDA 设备，并查询其属性。

```lua
import("lib.detect.find_cudadevices")

local devices = find_cudadevices({skip_compute_mode_prohibited = true})
local devices = find_cudadevices({min_sm_arch = 35, order_by_flops = true})
```

返回的结果为：`{{ ['$id'] = 0, name = "GeForce GTX 960M", major = 5, minor = 0, ... }, ... }`

包含的属性依据当前 CUDA 版本会有所不同，可以参考 [CUDA 官方文档](https://docs.nvidia.com/cuda/cuda-runtime-api/structcudaDeviceProp.html#structcudaDeviceProp) 及其历史版本。

### detect.features

获取指定工具的所有特性。

此接口跟 [compiler.features](#compilerfeatures) 类似，区别就是此接口更加的原始，传入的参数是实际的工具名 toolname。

并且此接口不仅能够获取编译器的特性，任何工具的特性都可以获取，因此更加通用。

```lua
import("lib.detect.features")

local features = features("clang")
local features = features("clang", {flags = "-O0", program = "xcrun -sdk macosx clang"})
local features = features("clang", {flags = {"-g", "-O0", "-std=c++11"}})
```

通过传入 flags，可以改变特性的获取结果，例如一些 c++11 的特性，默认情况下获取不到，通过启用 `-std=c++11` 后，就可以获取到了。

所有编译器的特性列表，可以见：[compiler.features](#compilerfeatures)。

### detect.has_features

判断指定特性是否支持。

此接口跟 [compiler.has_features](#compilerhas_features) 类似，但是更加原始，传入的参数是实际的工具名 toolname。

并且此接口不仅能够判断编译器的特性，任何工具的特性都可以判断，因此更加通用。

```lua
import("lib.detect.has_features")

local features = has_features("clang", "cxx_constexpr")
local features = has_features("clang", {"cxx_constexpr", "c_static_assert"}, {flags = {"-g", "-O0"}, program = "xcrun -sdk macosx clang"})
local features = has_features("clang", {"cxx_constexpr", "c_static_assert"}, {flags = "-g"})
```

如果指定的特性列表存在，则返回实际支持的特性子列表，如果都不支持，则返回 nil，我们也可以通过指定 flags 去改变特性的获取规则。

所有编译器的特性列表，可以见：[compiler.features](#compilerfeatures)。

### detect.has_flags

判断指定参数选项是否支持。

此接口跟 [compiler.has_flags](#compilerhas_flags) 类似，但是更加原始，传入的参数是实际的工具名 toolname。

```lua
import("lib.detect.has_flags")

local ok = has_flags("clang", "-g")
local ok = has_flags("clang", {"-g", "-O0"}, {program = "xcrun -sdk macosx clang"})
local ok = has_flags("clang", "-g -O0", {toolkind = "cxx"})
```

如果检测通过，则返回 true。

此接口的检测做了一些优化，除了 cache 机制外，大部分场合下，会去拉取工具的选项列表（`--help`）直接判断，如果选项列表里获取不到的话，才会通过尝试运行的方式来检测。

### detect.has_cfuncs

判断指定 c 函数是否存在。

此接口是 [lib.detect.check_cxsnippets](#detectcheck_cxsnippets) 的简化版本，仅用于检测函数。

```lua
import("lib.detect.has_cfuncs")

local ok = has_cfuncs("setjmp")
local ok = has_cfuncs({"sigsetjmp((void*)0, 0)", "setjmp"}, {includes = "setjmp.h"})
```

对于函数的描述规则如下：

| 函数描述                                        | 说明          |
| ----------------------------------------------- | ------------- |
| `sigsetjmp`                                     | 纯函数名      |
| `sigsetjmp((void*)0, 0)`                        | 函数调用      |
| `sigsetjmp{int a = 0; sigsetjmp((void*)a, a);}` | 函数名 + {} 块 |

在最后的可选参数中，除了可以指定 `includes` 外，还可以指定其他的一些参数用于控制编译检测的选项条件：

```lua
{verbose = false, target = [target|option], includes = .., configs = {linkdirs = .., links = .., defines = ..}}
```

其中 verbose 用于回显检测信息，target 用于在检测前追加 target 中的配置信息, 而 config 用于自定义配置跟 target 相关的编译选项。

### detect.has_cxxfuncs

判断指定 c++ 函数是否存在。

此接口跟 [lib.detect.has_cfuncs](#detecthas_cfuncs) 类似，请直接参考它的使用说明，唯一区别是这个接口用于检测 c++ 函数。

### detect.has_cincludes

判断指定 c 头文件是否存在。

此接口是 [lib.detect.check_cxsnippets](#detectcheck_cxsnippets) 的简化版本，仅用于检测头文件。

```lua
import("lib.detect.has_cincludes")

local ok = has_cincludes("stdio.h")
local ok = has_cincludes({"stdio.h", "stdlib.h"}, {target = target})
local ok = has_cincludes({"stdio.h", "stdlib.h"}, {configs = {defines = "_GNU_SOURCE=1", languages = "cxx11"}})
```

### detect.has_cxxincludes

判断指定 c++ 头文件是否存在。

此接口跟 [lib.detect.has_cincludess](#detecthas_cincludes) 类似，请直接参考它的使用说明，唯一区别是这个接口用于检测 c++ 头文件。

### detect.has_ctypes

判断指定 c 类型是否存在。

此接口是 [lib.detect.check_cxsnippets](#detectcheck_cxsnippets) 的简化版本，仅用于检测函数。

```lua
import("lib.detect.has_ctypes")

local ok = has_ctypes("wchar_t")
local ok = has_ctypes({"char", "wchar_t"}, {includes = "stdio.h"})
local ok = has_ctypes("wchar_t", {includes = {"stdio.h", "stdlib.h"}, configs = {"defines ="_GNU_SOURCE=1", languages ="cxx11"}})
```

### detect.has_cxxtypes

判断指定 c++ 类型是否存在。

此接口跟 [lib.detect.has_ctypess](#detecthas_ctypes) 类似，请直接参考它的使用说明，唯一区别是这个接口用于检测 c++ 类型。

### detect.check_cxsnippets

检测 c/c++ 代码片段是否能够编译通过。

通用的 c/c++ 代码片段检测接口，通过传入多个代码片段列表，它会自动生成一个编译文件，然后常识对它进行编译，如果编译通过返回 true。

对于一些复杂的编译器特性，连 [compiler.has_features](#compilerhas_features) 都无法检测到的时候，可以通过此接口通过尝试编译来检测它。

```lua
import("lib.detect.check_cxsnippets")

local ok = check_cxsnippets("void test() {}")
local ok = check_cxsnippets({"void test(){}", "#define TEST 1"}, {types = "wchar_t", includes = "stdio.h"})
```

此接口是 [detect.has_cfuncs](#detecthas_cfuncs), [detect.has_cincludes](#detecthas_cincludes) 和[detect.has_ctypes](detect-has_ctypes)等接口的通用版本，也更加底层。

因此我们可以用它来检测：types, functions, includes 还有 links，或者是组合起来一起检测。

第一个参数为代码片段列表，一般用于一些自定义特性的检测，如果为空，则可以仅仅检测可选参数中条件，例如：

```lua
local ok = check_cxsnippets({}, {types = {"wchar_t", "char*"}, includes = "stdio.h", funcs = {"sigsetjmp", "sigsetjmp((void*)0, 0)"}})
```

上面那个调用，会去同时检测 types, includes 和 funcs 是否都满足，如果通过返回 true。

还有其他一些可选参数：

```lua
{verbose = false, target = [target|option], sourcekind = "[cc|cxx]"}
```

其中 verbose 用于回显检测信息，target 用于在检测前追加 target 中的配置信息, sourcekind 用于指定编译器等工具类型，例如传入 `cxx` 强制作为 c++ 代码来检测。

## net.http

此模块提供 http 的各种操作支持，目前提供的接口如下：

### http.download

下载 http 文件。

这个接口比较简单，就是单纯的下载文件。

```lua
import("net.http")

http.download("https://xmake.io", "/tmp/index.html")
```

## privilege.sudo

此接口用于通过 `sudo` 来运行命令，并且提供了平台一致性处理，对于一些需要 root 权限运行的脚本，可以使用此接口。

> 为了保证安全性，除非必须使用的场合，其他情况下尽量不要使用此接口。

### sudo.has

判断 sudo 是否支持。

目前仅在 `macosx/linux` 下支持 sudo，windows 上的管理员权限运行暂时还不支持，因此建议使用前可以通过此接口判断支持情况后，针对性处理。

```lua
import("privilege.sudo")

if sudo.has() then
    sudo.run("rm /system/file")
end
```

### sudo.run

安静运行原生 shell 命令。

具体用法可参考：[os.run](#os-run)。

```lua
import("privilege.sudo")

sudo.run("rm /system/file")
```

### sudo.runv

安静运行原生 shell 命令，带参数列表。

具体用法可参考：[os.runv](#os-runv)。

### sudo.exec

回显运行原生 shell 命令。

具体用法可参考：[os.exec](#os-exec)。

### sudo.execv

回显运行原生 shell 命令，带参数列表。

具体用法可参考：[os.execv](#os-execv)。

### sudo.iorun

安静运行原生 shell 命令并获取输出内容。

具体用法可参考：[os.iorun](#os-iorun)。

### sudo.iorunv

安静运行原生 shell 命令并获取输出内容，带参数列表。

具体用法可参考：[os.iorunv](#os-iorunv)。

## devel.git

此接口提供了 git 各种命令的访问接口，相对于直接调用 git 命令，此模块提供了更加上层易用的封装接口，并且提供对 git 的自动检测和跨平台处理。

### git.clone

clone 代码库。

此接口对应 `git clone` 命令

```lua
import("devel.git")

git.clone("git@github.com:tboox/xmake.git")
git.clone("git@github.com:tboox/xmake.git", {depth = 1, branch = "master", outputdir = "/tmp/xmake"})
```

### git.pull

拉取代码库最新提交。

此接口对应 `git pull` 命令

```lua
import("devel.git")

git.pull()
git.pull({remote = "origin", tags = true, branch = "master", repodir = "/tmp/xmake"})
```

### git.clean

清理代码库文件。

此接口对应 `git clean` 命令

```lua
import("devel.git")

git.clean()
git.clean({repodir = "/tmp/xmake", force = true})
```

### git.checkout

签出指定分支版本。

此接口对应 `git checkout` 命令

```lua
import("devel.git")

git.checkout("master", {repodir = "/tmp/xmake"})
git.checkout("v1.0.1", {repodir = "/tmp/xmake"})
```

### git.refs

获取所有引用列表。

此接口对应 `git ls-remote --refs` 命令

```lua
import("devel.git")

local refs = git.refs(url)
```

### git.tags

获取所有标记列表。

此接口对应 `git ls-remote --tags` 命令

```lua
import("devel.git")

local tags = git.tags(url)
```

### git.branches

获取所有分支列表。

此接口对应 `git ls-remote --heads` 命令

```lua
import("devel.git")

local branches = git.branches(url)
```

## utils.archive

此模块用于压缩和解压文件。支持大部分常用压缩格式的解压缩，它会自动检测系统提供了哪些压缩工具，然后会使用最合适的压缩工具进行操作。

### archive.archive

- 压缩文件

```lua
import("utils.archive")

archive.archive("/tmp/a.zip", "/tmp/outputdir")
archive.archive("/tmp/a.7z", "/tmp/outputdir")
archive.archive("/tmp/a.gzip", "/tmp/outputdir")
archive.archive("/tmp/a.tar.bz2", "/tmp/outputdir")
```

还可以添加一些配置选项，如递归目录，压缩质量，排除文件等。

```lua
import("utils.archive")

local options = {}
options.curdir = "/tmp"
options.recurse = true
options.compress = "fastest|faster|default|better|best"
options.excludes = {"*/dir/*", "dir/*"}
archive.archive("/tmp/a.zip", "/tmp/outputdir", options)
```

### archive.extract

解压文件。

```lua
import("utils.archive")

archive.extract("/tmp/a.zip", "/tmp/outputdir")
archive.extract("/tmp/a.7z", "/tmp/outputdir")
archive.extract("/tmp/a.gzip", "/tmp/outputdir")
archive.extract("/tmp/a.tar.bz2", "/tmp/outputdir")
```

## utils.platform

此模块用于一些平台相关的辅助操作接口

## cli

### cli.amalgamate

合并成单源码文件。

这是一个小工具模块，主要用于快速合并指定 target 里面的所有 c/c++ 和 头文件源码到单个源文件。

合并会将内部 includes 头文件全部展开，并生成 DAG，通过拓扑排序引入。

默认它会处理所有 target 的合并，例如：

```bash
$ xmake l cli.amalgamate
build/tbox.c generated!
build/tbox.h generated!
```

我们也可以指定合并需要的目标：

```bash
$ xmake l cli.amalgamate tbox
build/tbox.c generated!
build/tbox.h generated!
```

也可以在合并每个源文件时候，指定一个自定义的 unique ID 的宏定义，来处理符号冲突问题。

```bash
$ xmake l cli.amalgamate -u MY_UNIQUEU_ID
build/tbox.c generated!
build/tbox.h generated!
```

如果多个源文件内部有重名符号，就可以判断这个 `MY_UNIQUEU_ID` 宏是否被定义，如果定义了，说明是在单文件中，就自己在源码中处理下重名符号。

```c
#ifdef MY_UNIQUEU_ID
    // do some thing
#endif
```

我们也可以指定输出位置：

```bash
$ xmake l cli.amalgamate -o /xxx
/xxx/tbox.c generated!
/xxx/tbox.h generated!
```
