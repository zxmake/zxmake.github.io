# 描述域

定义和设置子工程模块，每个 `target` 对应一个子工程，最后会生成一个目标程序，有可能是可执行程序，也有可能是库模块。

> target 的接口，都是可以放置在 target 外面的全局作用域中的，如果在全局中设置，那么会影响所有子工程 target。

例如：

```lua
-- 会同时影响 test 和 test2 目标
add_defines("DEBUG")

target("test", function()
    add_files("*.c")
end)

target("test2", function()
    add_files("*.c")
end)
```

> `target` 域是可以重复进入来实现分离设置的。

## 定义工程目标

定义一个新的控制台工程目标，工程名为 `test`，最后生成的目标名也是 `test`。

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
end)
```

可以重复调用这个 api，进入 target 域修改设置

```lua
-- 定义目标 demo，并进入 demo 设置模式
target("demo", function()
    set_kind("binary")
    add_files("src/demo.c")
end)

-- 定义和设置其他目标
target("other", function()
    ...
end)

-- 重新进入 demo 目标域，添加 test.c 文件
target("demo", function()
    add_files("src/test.c")
end)
```

> 所有根域的设置，会全局影响所有 target 目标，但是不会影响 option 的定义。

```lua
-- 在根域对所有 target 添加 - DDEBUG 的宏定义，影响所有 target（demo 和 test 都会加上此宏定义）
add_defines("DEBUG")

target("demo", function()
    set_kind("binary")
    add_files("src/demo.c")
end)

target("test", function()
    set_kind("binary")
    add_files("src/test.c")
end)
```

## target:set_kind

### 设置目标编译类型

设置目标类型，目前支持的类型有：

| 值         | 描述             |
| ---------- | ---------------- |
| phony      | 假的目标程序     |
| binary     | 二进制程序       |
| static     | 静态库程序       |
| shared     | 动态库程序       |
| object     | 仅仅编译对象集合 |
| headeronly | 仅仅头文件集合   |

#### binary

- 可执行文件类型

```lua
target("demo", function()
    set_kind("binary")
    add_files("src/*.c")
end)
```

> 如果没有设置 set_kind 接口，默认就是 binary 类型。

所以我们简化为：

```lua
target("demo", function()
    add_files("src/*.c")
end)
```

甚至:

```lua
target("demo", {files = "src/*.c"})
```

#### static

- 静态库目标类型

```lua
target("demo", function()
    set_kind("static")
    add_files("src/*.c")
end)
```

#### shared

- 动态库目标类型

```lua
target("demo", function()
    set_kind("shared")
    add_files("src/*.c")
end)
```

#### object

- 纯对象文件列表类型

通常用于两个目标程序间，部分对象文件共享，仅仅编译一次。也可以用于分离对象文件列表，配置不同的编译参数。

#### phony

- 空目标类型

它是一个特殊的目标程序类型，它不生成任何实际的程序文件，仅仅用于组合其他目标程序的依赖关系。

```lua
target("test1", function()
    set_kind("binary")
    add_files("src/*.c")
end)

target("test2", function()
    set_kind("binary")
    add_files("src/*.c")
end)

target("demo", function()
    set_kind("phony")
    add_deps("test1", "test2")
end)
```

比如上述配置，我们就可以在执行 `xmake build demo` 编译的时候，同时编译相关的两个依赖程序：test1 和 test2。

#### headeronly

- 纯头文件目标类型

xmake 新增了 `headeronly` 目标类型，这个类型的目标程序，我们不会实际编译它们，因为它没有源文件需要被编译。

但是它包含了头文件列表，这通常用于 headeronly 库项目的安装，IDE 工程的文件列表生成，以及安装阶段的 cmake/pkgconfig 导入文件的生成。

例如：

```lua
add_rules("mode.release", "mode.debug")

target("foo", function()
    set_kind("headeronly")
    add_headerfiles("src/foo.h")
    add_rules("utils.install.cmake_importfiles")
    add_rules("utils.install.pkgconfig_importfiles")
end)
```

更多详情见：[#1747](https://github.com/xmake-io/xmake/issues/1747)

## target:set_strip

### 设置是否 strip 信息

设置当前目标的 strip 模式，目前支持以下模式：

| 值    | 描述                                       |
| ----- | ------------------------------------------ |
| debug | 链接的时候，strip 掉调试符号               |
| all   | 链接的时候，strip 掉所有符号，包括调试符号 |

这个 api 一般在 release 模式下使用，可以生成更小的二进制程序：

```lua
target("xxxx", function()
    set_strip("all")
end)
```

> 这个 api 不一定非得在 target 之后使用，如果没有 target 指定，那么将会设置到全局模式。

## target:set_enabled

### 设置是否启用或禁用目标

如果设置 `set_enabled(false)`，则会直接禁用对应的 target，包括 target 的加载和信息获取，而 [set_default](#target%3Aset_default) 仅仅只是设置默认不去编译，但是 target 还是能获取到相关信息的，默认也会被加载。

## target:set_default

### 设置是否为默认构建安装目标

这个接口用于设置给定工程目标是否作为默认构建，如果没有调用此接口进行设置，那么这个目标就是默认被构建的，例如：

```lua
target("test1", function()
    set_default(false)
end)

target("test2", function()
    set_default(true)
end)

target("test3", function()
    ...
end)
```

上述代码的三个目标，在执行 `xmake`, `xmake install`, `xmake package`, `xmake run` 等命令的时候，如果不指定目标名，那么：

| 目标名 | 行为                             |
| ------ | -------------------------------- |
| test1  | 不会被默认构建、安装、打包和运行 |
| test2  | 默认构建、安装、打包和运行       |
| test3  | 默认构建、安装、打包和运行       |

通过上面的例子，可以看到默认目标可以设置多个，运行的时候也会依次运行。

> 需要注意的是，`xmake uninstall` 和 `xmake clean` 命令不受此接口设置影响，因为用户大部分情况下都是喜欢清除和卸载所有。

如果不想使用默认的目标，那么可以手动指定需要构建安装的目标：

```bash
$ xmake build targetname
$ xmake install targetname
```

如果要强制构建安装所有目标，可以传入 `[-a|--all]` 参数：

```bash
$ xmake build [-a|--all]
$ xmake install [-a|--all]
```

## target:set_options

### 设置关联选项

添加选项依赖，如果通过 [option](#option) 接口自定义了一些选项，那么只有在指定 `target` 目标域下，添加此选项，才能进行关联生效。

```lua
-- 定义一个 hello 选项
option("hello", function()
    set_default(false)
    set_showmenu(true)
    add_defines("HELLO_ENABLE")
end)

target("test", function()
    -- 如果 hello 选项被启用了，这个时候就会将 - DHELLO_ENABLE 宏应用到 test 目标上去
    set_options("hello")
end)
```

> 只有调用 `set_options` 进行关联生效后，[option](#option) 中定义的一些设置才会影响到此 `target` 目标，例如：宏定义、链接库、编译选项等等。

## target:set_symbols

### 设置符号信息

设置目标的符号模式，如果当前没有定义 target，那么将会设置到全局状态中，影响所有后续的目标。

目前主要支持以下几个级别：

| 值           | 描述                              | gcc/clang           | msvc           |
| ------------ | --------------------------------- | ------------------- | -------------- |
| debug        | 添加调试符号                      | -g                  | /Zi /Pdxxx.pdb |
| debug, edit  | 仅 msvc 生效，配合 debug 级别使用 | 忽略                | /ZI /Pdxxx.pdb |
| debug, embed | 仅 msvc 生效，配合 debug 级别使用 | 忽略                | /Z7            |
| hidden       | 设置符号不可见                    | -fvisibility=hidden | 忽略           |

这两个值也可以同时被设置，例如：

```lua
-- 添加调试符号, 设置符号不可见
set_symbols("debug", "hidden")
```

如果没有调用这个 api，默认是禁用调试符号的。

> 通过跟 `set_strip("all")` 配合同时设置，可以自动生成独立的调试符号，例如对于 ios 程序，就是 `.dSYM` 文件，对于 android 等其他程序，就是 `.sym` 符号文件。

如果 target 同时设置了下面两个设置，就会启用符号文件生成：

```lua
target("test", function()
    set_symbols("debug")
    set_strip("all")
end)
```

对于内置的 release 模式，默认不启用符号生成，仅仅只是 strip targetfile，如果要启用，只需要再额外开启 debug 符号就行，因为 mode.release 内部默认已经启用了 strip 了。

```lua
add_rules("mode.release")
target("test", function()
    set_symbols("debug")
end)
```

ios 程序会生成 `.dSYM` 文件，然后同时 Strip 自身符号：

```console
[62%]: linking.release libtest.dylib
[62%]: generating.release test.dSYM
```

android 程序会生成 `.sym` 文件（其实就是带符号的 so/binary 程序），然后同时 Strip 自身符号：

```console
[62%]: linking.release libtest.so
[62%]: generating.release test.sym
```

## target:set_basename

### 设置目标文件名

默认情况下，生成的目标文件名基于 `target("name")` 中配置的值，例如：

```lua
-- 目标文件名为：libxxx.a
target("xxx", function()
    set_kind("static")
end)

-- 目标文件名为：libxxx2.so
target("xxx2", function()
    set_kind("shared")
end)
```

默认的命名方式，基本上可以满足大部分情况下的需求，但是如果有时候想要更加定制化目标文件名。

例如，按编译模式和架构区分目标名，这个时候可以使用这个接口，来设置：

```lua
target("xxx", function()
    set_kind("static")
    set_basename("xxx_$(mode)_$(arch)")
end)
```

如果这个时候，编译配置为：`xmake f -m debug -a armv7`，那么生成的文件名为：`libxxx_debug_armv7.a`

如果还想进一步定制目标文件的目录名，可参考：[set_targetdir](#target%3Aset_targetdir)。

或者通过编写自定义脚本，实现更高级的逻辑，具体见：[after_build](#target%3Aafter_build) 和 [os.mv](/zh-cn/manual/builtin_modules?id=osmv)。

## target:set_filename

### 设置目标文件全名

它跟 [set_basename](#target%3Aset_basename) 的区别在于，[set_basename](#target%3Aset_basename)设置名字不带后缀跟前缀，例如：`libtest.a`，basename 如果改成 test2 后就变成了 `libtest2.a`。

而 filename 的修改，是修改整个目标文件名，包括前后缀，例如可以直接把 `libtest.a` 改成 `test.dll`，这个对于 [set_basename](#target%3Aset_basename) 是做不到的。

## target:set_prefixname

### 设置目标文件的前置名

修改设置目标文件的前置名，例如将默认的：`libtest.so` 改成 `test.so`

```lua
target("test", function()
    set_prefixname("")
end)
```

## target:set_suffixname

### 设置目标文件的后置名

修改设置目标文件的后置名，例如将默认的：`libtest.so` 改成 `libtest-d.so`

```lua
target("test", function()
    set_suffixname("-d")
end)
```

## target:set_extension

### 设置目标文件的扩展名

修改设置目标文件的扩展名，例如将默认的：`libtest.so` 改成 `test.dll`

```lua
target("test", function()
    set_prefixname("")
    set_extension(".dll")
end)
```

## target:set_warnings

### 设置警告级别

设置当前目标的编译的警告级别，一般支持一下几个级别：

| 值         | 描述                      | gcc/clang                             | msvc  |
| ---------- | ------------------------- | ------------------------------------- | ----- |
| none       | 禁用所有警告              | -w                                    | -W0   |
| less       | 启用较少的警告            | -W1                                   | -W1   |
| more       | 启用较多的警告            | -W3                                   | -W3   |
| extra      | 启用额外警告              | -Wextra                               |       |
| pedantic   | 启用非语言标准的使用警告  | -Wpedantic                            |       |
| all        | 启用所有警告              | -Wall                                 | -W3   |
| allextra   | 启用所有警告 + 额外的警告 | -Wall -Wextra                         | -W4   |
| everything | 启用全部支持的警告        | -Wall -Wextra -Weffc++ / -Weverything | -Wall |
| error      | 将所有警告作为编译错误    | -Werror                               | -WX   |

这个 api 的参数是可以混合添加的，例如：

```lua
-- 启用所有警告，并且作为编译错误处理
set_warnings("all", "error")
```

如果当前没有目标，调用这个 api 将会设置到全局模式。。

## target:set_optimize

### 设置优化级别

设置目标的编译优化等级，如果当前没有设置目标，那么将会设置到全局状态中，影响所有后续的目标。

目前主要支持一下几个级别：

| 值         | 描述               | gcc/clang | msvc         |
| ---------- | ------------------ | --------- | ------------ |
| none       | 禁用优化           | -O0       | -Od          |
| fast       | 快速优化           | -O1       | default      |
| faster     | 更快的优化         | -O2       | -O2          |
| fastest    | 最快运行速度的优化 | -O3       | -Ox -fp:fast |
| smallest   | 最小化代码优化     | -Os       | -O1 -GL      |
| aggressive | 过度优化           | -Ofast    | -Ox -fp:fast |

例如：

```lua
-- 最快运行速度的优化
set_optimize("fastest")
```

## target:set_languages

### 设置代码语言标准

设置目标代码编译的语言标准，如果当前没有目标存在，将会设置到全局模式中。

支持的语言标准目前主要有以下几个：

| 值      | 描述                |
| ------- | ------------------- |
| ansi    | c 语言标准: ansi    |
| c89     | c 语言标准: c89     |
| gnu89   | c 语言标准: gnu89   |
| c99     | c 语言标准: c99     |
| gnu99   | c 语言标准: gnu99   |
| c11     | c 语言标准: c11     |
| c17     | c 语言标准: c17     |
| clatest | c 语言标准: clatest |

| 值          | 描述                         |
| ----------- | ---------------------------- |
| cxx98       | c++ 语言标准:`c++98`       |
| gnuxx98     | c++ 语言标准:`gnu++98`     |
| cxx11       | c++ 语言标准:`c++11`       |
| gnuxx11     | c++ 语言标准:`gnu++11`     |
| cxx14       | c++ 语言标准:`c++14`       |
| gnuxx14     | c++ 语言标准:`gnu++14`     |
| cxx1z       | c++ 语言标准:`c++1z`       |
| gnuxx1z     | c++ 语言标准:`gnu++1z`     |
| cxx17       | c++ 语言标准:`c++17`       |
| gnuxx17     | c++ 语言标准:`gnu++17`     |
| cxx20       | c++ 语言标准:`c++20`       |
| gnuxx20     | c++ 语言标准:`gnu++20`     |
| cxxlatest   | c++ 语言标准:`c++latest`   |
| gnuxxlatest | c++ 语言标准:`gnu++latest` |

c 标准和 c++ 标准可同时进行设置，例如：

```lua
-- 设置 c 代码标准：c99， c++ 代码标准：c++11
set_languages("c99", "cxx11")
```

并不是设置了指定的标准，编译器就一定会按这个标准来编译，毕竟每个编译器支持的力度不一样，但是 xmake 会尽最大可能的去适配当前编译工具的支持标准。

## target:set_fpmodels

### 设置 float-point 编译模式

此接口用于设置浮点的编译模式，对数学计算相关优化的编译抽象设置，提供：fast, strict, except, precise 等几种常用的级别，有些可同时设置，有些是有冲突的，最后设置的生效。

关于这些级别的说明，可以参考下微软的文档：[Specify floating-point behavior](https://docs.microsoft.com/en-us/cpp/build/reference/fp-specify-floating-point-behavior?view=vs-2019)

当然，对应 gcc/icc 等其他编译器，xmake 会映射到不同的编译 flags。

```lua
set_fpmodels("fast")
set_fpmodels("strict")
set_fpmodels("fast", "except")
set_fpmodels("precise") -- default
```

关于这块详情见：[https://github.com/xmake-io/xmake/issues/981](https://github.com/xmake-io/xmake/issues/981)

## target:set_targetdir

### 设置生成目标文件目录

设置目标程序文件的输出目录，一般情况下，不需要设置，默认会输出在 build 目录下

而 build 的目录可以在工程配置的时候，手动修改：

```bash
xmake f -o /tmp/build
```

修改成 `/tmp/build` 后，目标文件默认输出到 `/tmp/build` 下面。

而如果用这个接口去设置，就不需要每次敲命令修改了，例如：

```lua
target("test", function()
    set_targetdir("/tmp/build")
end)
```

> 如果显示设置了 `set_targetdir`， 那么优先选择 `set_targetdir` 指定的目录为目标文件的输出目录。

## target:set_objectdir

### 设置对象文件生成目录

设置目标 target 的对象文件 (`*.o/obj`) 的输出目录，例如:

```lua
target("test", function()
    set_objectdir("$(buildir)/.objs")
end)
```

## target:set_dependir

### 设置依赖文件生成目录

设置目标 target 的编译依赖文件 (`.deps`) 的输出目录，例如:

```lua
target("test", function()
    set_dependir("$(buildir)/.deps")
end)
```

## target:add_imports

### 为自定义脚本预先导入扩展模块

通常，我们在 [on_build](#targeton_build) 等自定义脚本内部，可以通过 `import("core.base.task")` 的方式导入扩展模块，
但是对于自定义脚本比较多的情况下，每个自定义脚本都重复导入一遍，非常的繁琐，那么可以通过这个接口，实现预先导入，例如：

```lua
target("test", function()
    on_load(function (target)
        import("core.base.task")
        import("core.project.project")

        task.run("xxxx")
    end)
    on_build(function (target)
        import("core.base.task")
        import("core.project.project")

        task.run("xxxx")
    end)
    on_install(function (target)
        import("core.base.task")
        import("core.project.project")

        task.run("xxxx")
    end)
end)
```

通过此接口可以简化为：

```lua
target("test", function()
    add_imports("core.base.task", "core.project.project")
    on_load(function (target)
        task.run("xxxx")
    end)
    on_build(function (target)
        task.run("xxxx")
    end)
    on_install(function (target)
        task.run("xxxx")
    end)
end)
```

## target:add_rules

### 添加规则到目标

我们可以通过预先设置规则支持的文件后缀，来扩展其他文件的构建支持：

```lua
-- 定义一个 markdown 文件的构建规则
rule("markdown", function()
    set_extensions(".md", ".markdown")
    on_build(function (target, sourcefile)
        os.cp(sourcefile, path.join(target:targetdir(), path.basename(sourcefile) .. ".html"))
    end)
end)

target("test", function()
    set_kind("binary")

    -- 使 test 目标支持 markdown 文件的构建规则
    add_rules("markdown")

    -- 添加 markdown 文件的构建
    add_files("src/*.md")
    add_files("src/*.markdown")
end)
```

我们可以在 add_rules 时传参：

```lua
rule("my_rule", function()
    on_load(function (target)
        local my_arg = target:extraconf("rules", "my_rule", "my_arg") -- "my arg"
    end)
end)

target("test", function()
    add_rules("my_rule", { my_arg = "my arg"})
end)
```

我们也可以指定应用局部文件到规则，具体使用见：[add_files](#targetadd_files)。

## target:on_load

### 自定义目标加载脚本

在 target 初始化加载的时候，将会执行此脚本，在里面可以做一些动态的目标配置，实现更灵活的目标描述定义，例如：

```lua
target("test", function()
    on_load(function (target)
        target:add("defines", "DEBUG", "TEST=\"hello\"")
        target:add("linkdirs", "/usr/lib", "/usr/local/lib")
        target:add({includedirs = "/usr/include", "links" = "pthread"})
    end)
end)
```

可以在 `on_load` 里面，通过 `target:set`, `target:add` 来动态添加各种 target 属性。

## target:on_config

### 自定义配置脚本

在 `xmake config` 执行完成后，Build 之前会执行此脚本，通常用于编译前的配置工作。它与 on_load 不同的是，on_load 只要 target 被加载就会执行，执行时机更早。

如果一些配置，无法在 on_load 中过早配置，那么都可以在 on_config 中去配置它。

另外，它的执行时机比 before_build 还要早，大概的执行流程如下：

```
on_load -> after_load -> on_config -> before_build -> on_build -> after_build
```

## target:on_link

### 自定义链接脚本

用于定制化处理 target 的链接过程。

```lua
target("test", function()
    on_link(function (target)
        print("link it")
    end)
end)
```

## target:on_build

### 自定义编译脚本

覆盖 target 目标默认的构建行为，实现自定义的编译过程，一般情况下，并不需要这么做，除非确实需要做一些 xmake 默认没有提供的编译操作。

你可以通过下面的方式覆盖它，来自定义编译操作：

```lua
target("test", function()

    -- 设置自定义编译脚本
    on_build(function (target)
        print("build it")
    end)
end)
```

所有 target 的自定义脚本都可以针对不同平台和架构，分别处理，例如：

```lua
target("test", function()
    on_build("iphoneos|arm*", function (target)
        print("build for iphoneos and arm")
    end)
end)
```

其中如果第一个参数为字符串，那么就是指定这个脚本需要在哪个 `平台 | 架构` 下，才会被执行，并且支持模式匹配，例如 `arm*` 匹配所有 arm 架构。

当然也可以只设置平台，不设置架构，这样就是匹配指定平台下，执行脚本：

```lua
target("test", function()
    on_build("windows", function (target)
        print("build for windows")
    end)
end)
```

> 一旦对这个 target 目标设置了自己的 build 过程，那么 xmake 默认的构建过程将不再被执行。

## target:on_build_file

### 自定义编译脚本, 实现单文件构建

通过此接口，可以用来 hook 指定 target 内置的构建过程，替换每个源文件编译过程：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    on_build_file(function (target, sourcefile, opt)
    end)
end)
```

如果不想重写内置的编译脚本，仅仅只是在编译前后添加一些自己的处理，其实用：[target.before_build_file](#targetbefore_build_file)和 [target.after_build_file](#targetafter_build_file) 会更加方便，不需要调用 `opt.origin`。

## target:on_build_files

### 自定义编译脚本, 实现多文件构建

通过此接口，可以用来 hook 指定 target 内置的构建过程，替换一批同类型源文件编译过程：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    on_build_files(function (target, sourcebatch, opt)
    end)
end)
```

设置此接口后，对应源文件列表中文件，就不会出现在自定义的 [target.on_build_file](#targeton_build_file) 了，因为这个是包含关系。

其中 sourcebatch 描述了这批同类型源文件：

- `sourcebatch.sourcekind`: 获取这批源文件的类型，比如：cc, as, ..
- `sourcebatch.sourcefiles()`: 获取源文件列表
- `sourcebatch.objectfiles()`: 获取对象文件列表
- `sourcebatch.dependfiles()`: 获取对应依赖文件列表，存有源文件中编译依赖信息，例如：xxx.d

## target:on_clean

### 自定义清理脚本

覆盖 target 目标的 `xmake [c|clean}` 的清理操作，实现自定义清理过程。

```lua
target("test", function()

    -- 设置自定义清理脚本
    on_clean(function (target)

        -- 仅删掉目标文件
        os.rm(target:targetfile())
    end)
end)
```

一些 target 接口描述如下：

| target 接口                         | 描述                                                                  |
| ----------------------------------- | --------------------------------------------------------------------- |
| target:name()                       | 获取目标名                                                            |
| target:targetfile()                 | 获取目标文件路径                                                      |
| target:get("kind")                  | 获取目标的构建类型                                                    |
| target:get("defines")               | 获取目标的宏定义                                                      |
| target:get("xxx")                   | 其他通过 `set_/add_` 接口设置的 target 信息，都可以通过此接口来获取 |
| target:add("links", "pthread")      | 添加目标设置                                                          |
| target:set("links", "pthread", "z") | 覆写目标设置                                                          |
| target:deps()                       | 获取目标的所有依赖目标                                                |
| target:dep("depname")               | 获取指定的依赖目标                                                    |
| target:sourcebatches()              | 获取目标的所有源文件列表                                              |

## target:on_package

### 自定义打包脚本

覆盖 target 目标的 `xmake [p|package}` 的打包操作，实现自定义打包过程，如果你想对指定 target 打包成自己想要的格式，可以通过这个接口自定义它。

这个接口还是挺实用的，例如，编译完 jni 后，将生成的 so，打包进 apk 包中。

```lua
-- 定义一个 android app 的测试 demo
target("demo", function()

    -- 生成动态库：libdemo.so
    set_kind("shared")

    -- 设置对象的输出目录，可选
    set_objectdir("$(buildir)/.objs")

    -- 每次编译完的 libdemo.so 的生成目录，设置为 app/libs/armeabi
    set_targetdir("libs/armeabi")

    -- 添加 jni 的代码文件
    add_files("jni/*.c")

    -- 设置自定义打包脚本，在使用 xmake 编译完 libdemo.so 后，执行 xmake p 进行打包
    -- 会自动使用 ant 将 app 编译成 apk 文件
    --
    on_package(function (target)

        -- 使用 ant 编译 app 成 apk 文件，输出信息重定向到日志文件
        os.run("ant debug")
    end)
end)
```

## target:on_install

### 自定义安装脚本

覆盖 target 目标的 `xmake [i|install}` 的安装操作，实现自定义安装过程。

例如，将生成的 apk 包，进行安装。

```lua
target("test", function()

    -- 设置自定义安装脚本，自动安装 apk 文件
    on_install(function (target)

        -- 使用 adb 安装打包生成的 apk 文件
        os.run("adb install -r ./bin/Demo-debug.apk")
    end)
end)
```

## target:on_uninstall

### 自定义卸载脚本

覆盖 target 目标的 `xmake [u|uninstall}` 的卸载操作，实现自定义卸载过程。

```lua
target("test", function()
    on_uninstall(function (target)
        ...
    end)
end)
```

## target:on_run

### 自定义运行脚本

覆盖 target 目标的 `xmake [r|run}` 的运行操作，实现自定义运行过程。

例如，运行安装好的 apk 程序：

```lua
target("test", function()

    -- 设置自定义运行脚本，自动运行安装好的 app 程序，并且自动获取设备输出信息
    on_run(function (target)

        os.run("adb shell am start -n com.demo/com.demo.DemoTest")
        os.run("adb logcat")
    end)
end)
```

## target:before_link

### 在链接之前执行一些自定义脚本

用于在链接之前增加一些自定义的操作。

```lua
target("test", function()
    before_link(function (target)
        print("")
    end)
end)
```

## target:before_build

### 在构建之前执行一些自定义脚本

并不会覆盖默认的构建操作，只是在构建之前增加一些自定义的操作。

```lua
target("test", function()
    before_build(function (target)
        print("")
    end)
end)
```

## target:before_build_file

### 自定义编译前的脚本, 实现单文件构建

通过此接口，可以用来 hook 指定 target 内置的构建过程，在每个源文件编译过程之前执行一些自定义脚本：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    before_build_file(function (target, sourcefile, opt)
    end)
end)
```

## target:before_build_files

### 自定义编译前的脚本, 实现多文件构建

通过此接口，可以用来 hook 指定 target 内置的构建过程，在一批同类型源文件编译过程之前执行一些自定义脚本：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    before_build_files(function (target, sourcebatch, opt)
    end)
end)
```

## target:before_clean

### 在清理之前执行一些自定义脚本

并不会覆盖默认的清理操作，只是在清理之前增加一些自定义的操作。

```lua
target("test", function()
    before_clean(function (target)
        print("")
    end)
end)
```

## target:before_package

#### 在打包之前执行一些自定义脚本

并不会覆盖默认的打包操作，只是在打包之前增加一些自定义的操作。

```lua
target("test", function()
    before_package(function (target)
        print("")
    end)
end)
```

## target:before_install

### 在安装之前执行一些自定义脚本

并不会覆盖默认的安装操作，只是在安装之前增加一些自定义的操作。

```lua
target("test", function()
    before_install(function (target)
        print("")
    end)
end)
```

## target:before_uninstall

### 在卸载之前执行一些自定义脚本

并不会覆盖默认的卸载操作，只是在卸载之前增加一些自定义的操作。

```lua
target("test", function()
    before_uninstall(function (target)
        print("")
    end)
end)
```

## target:before_run

### 在运行之前执行一些自定义脚本

并不会覆盖默认的运行操作，只是在运行之前增加一些自定义的操作。

```lua
target("test", function()
    before_run(function (target)
        print("")
    end)
end)
```

## target:after_link

### 在链接之后执行一些自定义脚本

用于在链接之后增加一些自定义的操作。

```lua
target("test", function()
    after_link(function (target)
        print("")
    end)
end)
```

## target:after_build

### 在构建之后执行一些自定义脚本

并不会覆盖默认的构建操作，只是在构建之后增加一些自定义的操作。

例如，对于 ios 的越狱开发，构建完程序后，需要用 `ldid` 进行签名操作

```lua
target("test", function()
    after_build(function (target)
        os.run("ldid -S %s", target:targetfile())
    end)
end)
```

## target:after_build_file

### 自定义编译前的脚本, 实现单文件构建

通过此接口，可以用来 hook 指定 target 内置的构建过程，在每个源文件编译过程之后执行一些自定义脚本：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    after_build_file(function (target, sourcefile, opt)
    end)
end)
```

## target:after_build_files

### 自定义编译前的脚本, 实现多文件构建

通过此接口，可以用来 hook 指定 target 内置的构建过程，在一批同类型源文件编译过程之后执行一些自定义脚本：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    after_build_files(function (target, sourcebatch, opt)
    end)
end)
```

## target:after_clean

### 在清理之后执行一些自定义脚本

并不会覆盖默认的清理操作，只是在清理之后增加一些自定义的操作。

一般可用于清理编译某 target 自动生成的一些额外的临时文件，这些文件 xmake 默认的清理规则可能没有清理到，例如：

```lua
target("test", function()
    after_clean(function (target)
        os.rm("$(buildir)/otherfiles")
    end)
end)
```

## target:after_package

### 在打包之后执行一些自定义脚本

并不会覆盖默认的打包操作，只是在打包之后增加一些自定义的操作。

```lua
target("test", function()
    after_package(function (target)
        print("")
    end)
end)
```

## target:after_install

### 在安装之后执行一些自定义脚本

并不会覆盖默认的安装操作，只是在安装之后增加一些自定义的操作。

```lua
target("test", function()
    after_install(function (target)
        print("")
    end)
end)
```

## target:after_uninstall

### 在卸载之后执行一些自定义脚本

并不会覆盖默认的卸载操作，只是在卸载之后增加一些自定义的操作。

```lua
target("test", function()
    after_uninstall(function (target)
        print("")
    end)
end)
```

## target:after_run

### 在运行之后执行一些自定义脚本

并不会覆盖默认的运行操作，只是在运行之后增加一些自定义的操作。

```lua
target("test", function()
    after_run(function (target)
        print("")
    end)
end)
```

## target:set_pcheader

### 设置 C 预编译头文件

xmake 支持通过预编译头文件去加速 c 程序编译，目前支持的编译器有：gcc, clang 和 msvc。

使用方式如下：

```lua
target("test", function()
    set_pcheader("header.h")
end)
```

## target:set_pcxxheader

### 设置 C++ 预编译头文件

xmake 支持通过预编译头文件去加速 c++ 程序编译，目前支持的编译器有：gcc, clang 和 msvc。

使用方式如下：

```lua
target("test", function()
    set_pcxxheader("header.h")
end)
```

## target:set_pmheader

### 设置 ObjC 预编译头文件

xmake 支持通过预编译头文件去加速 ObjC 程序编译，目前支持的编译器有：gcc, clang 和 msvc。

使用方式如下：

```lua
target("test", function()
    set_pmheader("header.h")
end)
```

## target:set_pmxxheader

### 设置 ObjC++ 预编译头文件

xmake 支持通过预编译头文件去加速 ObjC++ 程序编译，目前支持的编译器有：gcc, clang 和 msvc。

使用方式如下：

```lua
target("test", function()
    set_pmxxheader("header.h")
end)
```

## target:add_deps

### 添加子工程目标依赖

添加当前目标的依赖目标，编译的时候，会去优先编译依赖的目标，然后再编译当前目标。。。

```lua
target("test1", function()
    set_kind("static")
    set_files("*.c")
end)

target("test2", function()
    set_kind("static")
    set_files("*.c")
end)

target("demo", function()
    add_deps("test1", "test2")
end)
```

上面的例子，在编译目标 demo 的时候，需要先编译 test1, test2 目标，因为 demo 会去用到他们

> target 会自动继承依赖目标中的配置和属性，不需要额外调用 `add_links`, `add_linkdirs` 和 `add_rpathdirs` 等接口去关联依赖目标了。

并且继承关系是支持级联的，例如：

```lua
target("library1", function()
    set_kind("static")
    add_files("*.c")
    add_includedirs("inc") -- 默认私有头文件目录不会被继承
    add_includedirs("inc1", {public = true}) -- 此处的头文件相关目录也会被继承
end)

target("library2", function()
    set_kind("static")
    add_deps("library1")
    add_files("*.c")
end)

target("test", function()
    set_kind("binary")
    add_deps("library2")
end)
```

如果我们不想继承依赖 target 的任何配置，如何操作呢？

```lua
add_deps("dep1", "dep2", {inherit = false})
```

通过显式设置 inherit 配置，来告诉 xmake，这两个依赖的配置是否需要被继承，如果不设置，默认就是启用继承的。

通过 `add_includedirs("inc1", {public = true})`, 设置 public 为 true, 将 includedirs 的设置公开给其他依赖的子 target 继承。

目前对于 target 的编译链接 flags 相关接口设置，都是支持继承属性的，可以人为控制是否需要导出给其他 target 来依赖继承，目前支持的属性有：

| 属性      | 描述                                                                 |
| --------- | -------------------------------------------------------------------- |
| private   | 默认设置，作为当前 target 的私有配置，不会被依赖的其他 target 所继承 |
| public    | 公有配置，当前 target，依赖的子 target 都会被设置                    |
| interface | 接口设置，仅被依赖的子 target 所继承设置，当前 target 不参与         |

对于这块的详细说明，可以看下：[https://github.com/xmake-io/xmake/issues/368](https://github.com/xmake-io/xmake/issues/368)

## target:add_links

### 添加链接库名

为当前目标添加链接库，一般这个要与 [add_linkdirs](#targetadd_linkdirs) 配对使用。

```lua
target("demo", function()

    -- 添加对 libtest.a 的链接，相当于 -ltest
    add_links("test")

    -- 添加链接搜索目录
    add_linkdirs("$(buildir)/lib")
end)
```

add_links 还支持添加库的完整路径，例如：`add_links("/tmp/libfoo.a")`，显式的指定库文件。

## target:add_syslinks

### 添加系统链接库名

这个接口使用上跟 [add_links](#targetadd_links) 类似，唯一的区别就是，通过这个接口添加的链接库顺序在所有 `add_links` 之后。

因此主要用于添加系统库依赖，因为系统库的链接顺序是非常靠后的，例如：

```lua
add_syslinks("pthread", "m", "dl")
target("demo", function()
    add_links("a", "b")
    add_linkdirs("$(buildir)/lib")
end)
```

上面的配置，即使 `add_syslinks` 被优先提前设置了，但最后的链接顺序依然是：`-la -lb -lpthread -lm -ldl`

## target:add_linkorders

### 调整链接顺序

用于调整 target 内部的链接顺序。

由于 xmake 提供了 `add_links`, `add_deps`, `add_packages`, `add_options` 接口，可以配置目标、依赖，包和选项中的链接。

但是它们之间的链接顺序，在之前可控性比较弱，只能按固定顺序生成，这对于一些复杂的项目，就有点显得力不从心了。

更多详情和背景见：[#1452](https://github.com/xmake-io/xmake/issues/1452)

#### 排序链接

为了更加灵活的调整 target 内部的各种链接顺序，我们新增了 `add_linkorders` 接口，用于配置目标、依赖、包、选项、链接组引入的各种链接顺序。

例如：

```lua
add_links("a", "b", "c", "d", "e")
-- e -> b -> a
add_linkorders("e", "b", "a")
-- e -> d
add_linkorders("e", "d")
```

add_links 是配置的初始链接顺序，然后我们通过 add_linkorders 配置了两个局部链接依赖 `e -> b -> a` 和 `e -> d` 后。

xmake 内部就会根据这些配置，生成 DAG 图，通过拓扑排序的方式，生成最终的链接顺序，提供给链接器。

当然，如果存在循环依赖，产生了环，它也会提供警告信息。

#### 排序链接和链接组

另外，对于循环依赖，我们也可以通过 `add_linkgroups` 配置链接组的方式也解决。

并且 `add_linkorders` 也能够对链接组进行排序。

```lua
add_links("a", "b", "c", "d", "e")
add_linkgroups("c", "d", {name = "foo", group = true})
add_linkorders("e", "linkgroup::foo")
```

如果要排序链接组，我们需要对每个链接组取个名，`{name = "foo"}` ，然后就能在 `add_linkorders` 里面通过 `linkgroup::foo` 去引用配置了。

2.9.6 版本新增 as_needed 配置项，可以用于禁用 as_needed。（默认不配置，就是开启状态。）

```lua
add_linkgroups("c", "d", {as_needed = false})
```

对应的 flags 如下。

```bash
-Wl,--no-as-needed c d -Wl,--as-needed
```

#### 排序链接和 frameworks

我们也可以排序链接和 macOS/iPhoneOS 的 frameworks。

```lua
add_links("a", "b", "c", "d", "e")
add_frameworks("Foundation", "CoreFoundation")
add_linkorders("e", "framework::CoreFoundation")
```

#### 完整例子

相关的完整例子，我们可以看下：

```lua
add_rules("mode.debug", "mode.release")

add_requires("libpng")

target("bar", function()
    set_kind("shared")
    add_files("src/foo.cpp")
    add_linkgroups("m", "pthread", {whole = true})
end)

target("foo", function()
    set_kind("static")
    add_files("src/foo.cpp")
    add_packages("libpng", {public = true})
end)

target("demo", function()
    set_kind("binary")
    add_deps("foo")
    add_files("src/main.cpp")
    if is_plat("linux", "macosx") then
        add_syslinks("pthread", "m", "dl")
    end
    if is_plat("macosx") then
        add_frameworks("Foundation", "CoreFoundation")
    end
    add_linkorders("framework::Foundation", "png16", "foo")
    add_linkorders("dl", "linkgroup::syslib")
    add_linkgroups("m", "pthread", {name = "syslib", group = true})
end)
```

完整工程在：[linkorders example](https://github.com/xmake-io/xmake/blob/master/tests/projects/c%2B%2B/linkorders/xmake.lua)

## target:add_linkgroups

### 添加链接组

这个链接组的特性，目前主要用于 linux 平台的编译，仅支持 gcc/clang 编译器。

需要注意的是 gcc/clang 里面的链接组概念主要特指：`-Wl,--start-group`

而 xmake 对齐进行了封装，做了进一步抽象，并且不仅仅用于处理 `-Wl,--start-group`，还可以处理 `-Wl,--whole-archive` 和 `-Wl,-Bstatic`。

下面我们会一一对其进行讲解。

更多详情见：[#1452](https://github.com/xmake-io/xmake/issues/1452)

#### --start-group 支持

`-Wl,--start-group` 和 `-Wl,--end-group` 是用于处理复杂库依赖关系的链接器选项，确保链接器可以解决符号依赖并成功连接多个库。

在 xmake 中，我们可以通过下面的方式实现：

```lua
add_linkgroups("a", "b", {group = true})
```

它会对应生成 `-Wl,--start-group -la -lb -Wl,--end-group` 链接选项。

如果 a 和 b 库之间有符号的循环依赖，也不会报链接错误，能够正常链接成功。

对于不支持的平台和编译，会退化成 `-la -lb`

#### --whole-archive 支持

`--whole-archive` 是一个链接器选项，通常用于处理静态库。
它的作用是告诉链接器将指定的静态库中的所有目标文件都包含到最终可执行文件中，而不仅仅是满足当前符号依赖的目标文件。
这可以用于确保某些库的所有代码都被链接，即使它们在当前的符号依赖关系中没有直接引用。

更多信息，可以参考 gcc/clang 的文档。

在 xmake 中，我们可以通过下面的方式实现：

```lua
add_linkgroups("a", "b", {whole = true})
```

它会对应生成 `-Wl,--whole-archive -la -lb -Wl,--no-whole-archive` 链接选项。

对于不支持的平台和编译，会退化成 `-la -lb`

另外，我们可以同时配置 group/whole：

```lua
add_linkgroups("a", "b", {whole = true, group = true})
```

#### -Bstatic 支持

`-Bstatic` 也是用于编译器（如 gcc）的选项，用于指示编译器在链接时只使用静态库而不使用共享库。

更多信息，可以参考 gcc/clang 的文档。

在 xmake 中，我们可以通过下面的方式实现：

```lua
add_linkgroups("a", "b", {static = true})
```

它会对应生成 `-Wl,-Bstatic -la -lb -Wl,-Bdynamic` 链接选项。

## target:add_files

### 添加源代码文件

用于添加目标工程的源文件，甚至库文件，目前支持的一些文件类型：

| 支持的源文件类型 | 描述                                    |
| ---------------- | --------------------------------------- |
| .c/.cpp/.cc/.cxx | c++ 文件                                |
| .s/.S/.asm       | 汇编文件                                |
| .m/.mm           | objc 文件                               |
| .swift           | swift 文件                              |
| .go              | golang 文件                             |
| .o/.obj          | 对象文件                                |
| .a/.lib          | 静态库文件，会自动合并库到目标程序      |
| .rc              | msvc 的资源文件                         |
| .manifest        | windows manifest 文件                   |
| .def             | windows dll 导出文件                    |
| .ld/.lds         | linker scripts 文件，通常用于 gcc/clang |
| .map/.ver        | version script 文件，通常用于 gcc/clang |

其中通配符 `*` 表示匹配当前目录下文件，而 `**` 则匹配多级目录下的文件。

例如：

```lua
add_files("src/test_*.c")
add_files("src/xxx/**.cpp")
add_files("src/asm/*.S", "src/objc/**/hello.m")
```

`add_files` 的使用其实是相当灵活方便的，其匹配模式借鉴了 premake 的风格，但是又对其进行了改善和增强。

使得不仅可以匹配文件，还有可以在添加文件同时，过滤排除指定模式的一批文件。

例如：

```lua
-- 递归添加 src 下的所有 c 文件，但是不包括 src/impl / 下的所有 c 文件
add_files("src/**.c|impl/*.c")

-- 添加 src 下的所有 cpp 文件，但是不包括 src/test.cpp、src/hello.cpp 以及 src 下所有带 xx_前缀的 cpp 文件
add_files("src/*.cpp|test.cpp|hello.cpp|xx_*.cpp")
```

其中分隔符 `|` 之后的都是需要排除的文件，这些文件也同样支持匹配模式，并且可以同时添加多个过滤模式，只要中间用 `|` 分割就行了。。

添加文件的时候支持过滤一些文件的一个好处就是，可以为后续根据不同开关逻辑添加文件提供基础。

<p class="tip">
为了使得描述上更加的精简，`|` 之后的过滤描述都是基于起一个模式：`src/*.cpp` 中 `*` 之前的目录为基础的。
所以上面的例子后面过滤的都是在 src 下的文件，这个是要注意的。
</p>

xmake 对 `add_files` 进行了改进，支持基于 files 更细粒度的编译选项控制，例如：

```lua
target("test", function()
    add_defines("TEST1")
    add_files("src/*.c")
    add_files("test/*.c", "test2/test2.c", {defines = "TEST2", languages = "c99", includedirs = ".", cflags = "-O0"})
end)
```

可以在 `add_files` 的最后一个参数，传入一个配置 table，去控制指定 files 的编译选项，里面的配置参数跟 target 的一致，并且这些文件还会继承 target 的通用配置 `-DTEST1`。

xmake 支持添加未知的代码文件，通过设置 rule 自定义规则，实现这些文件的自定义构建，例如：

```lua
target("test", function()
    -- ...
    add_files("src/test/*.md", {rule = "markdown"})
end)
```

关于自定义构建规则的使用说明，详细见：[构建规则](#构建规则)。

可以通过 force 参数来强制禁用 cxflags,cflags 等编译选项的自动检测，直接传入编译器，哪怕编译器有可能不支持，也会设置：

```lua
add_files("src/*.c", {force = {cxflags = "-DTEST", mflags = "-framework xxx"}})
```

## target:remove_files

### 从前面的源代码文件列表中删除指定文件

通过此接口，可以从前面 [add_files](targetadd_files) 接口添加的文件列表中，删除指定的文件，例如：

```lua
target("test", function()
    add_files("src/*.c")
    remove_files("src/test.c")
end)
```

上面的例子，可以从 `src` 目录下添加除 `test.c` 以外的所有文件，当然这个也可以通过 `add_files("src/*.c|test.c")` 来达到相同的目的，但是这种方式更加灵活。

例如，我们可以条件判断来控制删除哪些文件，并且此接口也支持 [add_files](targetadd_files) 的匹配模式，过滤模式，进行批量移除。

```lua
target("test", function()
    add_files("src/**.c")
    remove_files("src/test*.c")
    remove_files("src/subdir/*.c|xxx.c")
    if is_plat("iphoneos") then
        add_files("xxx.m")
    end
end)
```

通过上面的例子，我们可以看出 `add_files` 和 `remove_files` 是根据调用顺序，进行顺序添加和删除的，并且通过 `remove_files("src/subdir/*.c|xxx.c")` 删除一批文件，
并且排除 `src/subdir/xxx.c`（就是说，不删除这个文件）。

注： 这个接口 v2.6.3 版本才提供，之前的版本是 del_files，已经废弃。

如果向下要兼容以前的版本，可以通过下面的配置解决。

```lua
remove_files = remove_files or del_files
```

## target:remove_headerfiles

### 从前面的头文件列表中删除指定文件

主要用于从 `add_headerfiles` 设置的头文件列表中删除文件，用法与 `remove_files` 类似。

## target:add_linkdirs

### 添加链接库搜索目录

设置链接库的搜索目录，这个接口的使用方式如下：

```lua
target("test", function()
    add_linkdirs("$(buildir)/lib")
end)
```

此接口相当于 gcc 的 `-Lxxx` 链接选项。

一般他是与 [add_links](#targetadd_links) 配合使用的，当然也可以直接通过 [add_ldflags](#targetadd_ldflags) 或者 [add_shflags](#targetadd_shflags) 接口来添加，也是可以的。

<p class="tip">
如果不想在工程中写死，可以通过：`xmake f --linkdirs=xxx` 或者 `xmake f --ldflags="-L/xxx"` 的方式来设置，当然这种手动设置的目录搜索优先级更高。
</p>

## target:add_rpathdirs

### 添加程序运行时动态库的加载搜索目录

通过 [add_linkdirs](#targetadd_linkdirs) 设置动态库的链接搜索目录后，程序被正常链接，但是在 linux 平台想要正常运行编译后的程序，会报加载动态库失败。

因为没找到动态库的加载目录，想要正常运行依赖动态库的程序，需要设置 `LD_LIBRARY_PATH` 环境变量，指定需要加载的动态库目录。

但是这种方式是全局的，影响太广，更好的方式是通过 `-rpath=xxx` 的链接器选项，在链接程序的时候设置好需要加载的动态库搜索路径，而 xmake 对其进行了封装，通过 `add_rpathdirs` 更好的处理跨平台问题。

具体使用如下：

```lua
target("test", function()
    set_kind("binary")
    add_linkdirs("$(buildir)/lib")
    add_rpathdirs("$(buildir)/lib")
end)
```

只需要在链接的时候，在设置下 rpath 目录就好了，虽然也可以通过 `add_ldflags("-Wl,-rpath=xxx")` 达到相同的目的，但是这个接口更加通用。

内部会对不同平台进行处理，像在 macOS 下，是不需要 `-rpath` 设置的，也是可以正常加载运行程序，因此针对这个平台，xmake 内部会直接忽略器设置，避免链接报错。

而在为 dlang 程序进行动态库链接时，xmake 会自动处理成 `-L-rpath=xxx` 来传入 dlang 的链接器，这样就避免了直接使用 `add_ldflags` 需要自己判断和处理不同平台和编译器问题。

xmake 对这个接口进行了改进，支持：`@loader_path`, `@executable_path` 和 `$ORIGIN` 的内置变量，来指定程序的加载目录，它们的效果基本上是一样的，主要是为了同时兼容 macho, elf。

例如：

```lua
target("test", function()
    set_kind("binary")
    add_linkdirs("$(buildir)/lib")
    add_rpathdirs("@loader_path/lib")
end)
```

指定 test 程序加载当前执行目录下 `lib/*.[so|dylib]` 的动态库文件，这将有助于提升程序的可移植性，不用写死绝对路径和相对路径，导致程序和目录切换引起程序加载动态库失败。

> 需要注意的是，在 macos 下，要想 add_rpathdirs 设置生效，需要对 dylib 做一些预处理，添加 `@rpath/xxx` 路径设置：
> `$install_name_tool -add_rpath @rpath/libxxx.dylib xxx/libxxx.dylib`
> 我们也可以通过 `otool -L libxxx.dylib` 查看是否存在带 @rpath 的路径

另外，对于 gcc， `add_rpathdirs` 默认设置的是 runpath，如果想要显式的配置上 `-Wl,--enable-new-dtags`, `-Wl,--disable-new-dtags` 去配置 rpath 还是 runpath

我们可以通过额外的参数指定，`add_rpathdirs("xxx", {runpath = true})`

相关背景细节见：[#5109](https://github.com/xmake-io/xmake/issues/5109)

xmake 新增了 `add_rpathdirs("xxx", {install_only = true})` ，可以单独配置安装后的 rpath 路径。

## target:add_includedirs

### 添加头文件搜索目录

设置头文件的搜索目录，这个接口的使用方式如下：

```lua
target("test", function()
    add_includedirs("$(buildir)/include")
end)
```

当然也可以直接通过 [add_cxflags](#targetadd_cxflags) 或者 [add_mxflags](#targetadd_mxflags) 等接口来设置，也是可以的。

可通过额外的 `{public|interface = true}` 属性设置，将 includedirs 导出给依赖的子 target，例如：

```lua
target("test", function()
    set_kind("static")
    add_includedirs("src/include") -- 仅对当前 target 生效
    add_includedirs("$(buildir)/include", {public = true})，当前 target 和子 target 都会被设置
end)

target("demo", function()
    set_kind("binary")
    add_deps("test")
end)
```

更多关于这块的说明，见：[add_deps](#targetadd_deps)

> 如果不想在工程中写死，可以通过：`xmake f --includedirs=xxx` 或者 `xmake f --cxflags="-I/xxx"` 的方式来设置，当然这种手动设置的目录搜索优先级更高。

> 头文件默认不支持模式匹配，也不推荐这么做， 容易引入一些不需要的子目录，导致各种头文件引用冲突干扰，出了问题更难查。
> 如果用户非要这么做，可以通过 `add_includedirs(os.dirs(path.join(os.scriptdir(), "xxx/**")))` 来实现。

## target:add_sysincludedirs

### 添加系统头文件搜索目录

`add_includedirs` 通常用于添加工程头文件搜索目录，而一些系统库头文件的引入，有可能会触发一些内部的警告信息，但是这些警告对于用户来讲也许是无法避免，也修复不了的。

那么，每次显示这些警告反而会干扰用户，因此，gcc/clang 提供了 `-isystem` 专门用来设置系统头文件搜索路径，通过此接口设置的头文件，会压制一些警告信息来避免干扰用户。

msvc 也通提供了 `/external:I` 编译选项来设置它，但是需要高版本 msvc 才支持。

因此，xmake 提供了 `add_sysincludedirs` 来抽象适配设置系统库头文件搜索路径，如果当前编译器不支持，会自动切换回 `-I` 编译选项。

```lua
target("test", function()
    add_sysincludedirs("/usr/include")
end)
```

生成的编译选项如下：

```console
-isystem /usr/include
```

如果是 msvc 编译器，则会是：

```console
/experimental:external /external:W0 /external:I /usr/include
```

> 另外，使用 `add_requires()` 引入的依赖包，默认也会使用 `-isystem` 作为外部系统头文件。

## target:add_defines

### 添加宏定义

```lua
add_defines("DEBUG", "TEST=0", "TEST2=\"hello\"")
```

相当于设置了编译选项：

```
-DDEBUG -DTEST=0 -DTEST2=\"hello\"
```

## target:add_undefines

### 取消宏定义

```lua
add_undefines("DEBUG")
```

相当于设置了编译选项：`-UDEBUG`

在代码中相当于：`#undef DEBUG`

## target:add_cflags

### 添加 c 编译选项

仅对 c 代码添加编译选项

```lua
add_cflags("-g", "-O2", "-DDEBUG")
```

> 所有选项值都基于 gcc 的定义为标准，如果其他编译器不兼容（例如：vc），xmake 会自动内部将其转换成对应编译器支持的选项值。
> 用户无需操心其兼容性，如果其他编译器没有对应的匹配值，那么 xmake 会自动忽略器设置。

可以通过 force 参数来强制禁用 flags 的自动检测，直接传入编译器，哪怕编译器有可能不支持，也会设置：

```lua
add_cflags("-g", "-O2", {force = true})
```

## target:add_cxflags

### 添加 c/c++ 编译选项

同时对 c/c++ 代码添加编译选项，用法跟 add_cflags 一致。

## target:add_cxxflags

### 添加 c++ 编译选项

仅对 c++ 代码添加编译选项，用法跟 add_cflags 一致。

#### 添加特定编译器 flags

我们改进了所有 flags 添加接口，可以仅仅对特定编译器指定 flags，例如：

```lua
add_cxxflags("clang::-stdlib=libc++")
add_cxxflags("gcc::-stdlib=libc++")
add_cxxflags("cl::/GR-")
add_cxxflags("clang_cl::/GR-")
```

或者：

```lua
add_cxxflags("-stdlib=libc++", {tools = "clang"})
add_cxxflags("-stdlib=libc++", {tools = "gcc"})
add_cxxflags("/GR-", {tools = {"clang_cl", "cl"}})
```

> 不仅仅是编译 flags，对 add_ldflags 等链接 flags，也是同样生效的。

## target:add_mflags

### 添加 objc 编译选项

仅对 objc 代码添加编译选项

```lua
add_mflags("-g", "-O2", "-DDEBUG")
```

可以通过 force 参数来强制禁用 flags 的自动检测，直接传入编译器，哪怕编译器有可能不支持，也会设置：

```lua
add_mflags("-g", "-O2", {force = true})
```

## target:add_mxflags

### 添加 objc/objc++ 编译选项

同时对 objc/objc++ 代码添加编译选项

```lua
add_mxflags("-framework CoreFoundation")
```

## target:add_mxxflags

### 添加 objc++ 编译选项

仅对 objc++ 代码添加编译选项

```lua
add_mxxflags("-framework CoreFoundation")
```

## target:add_scflags

### 添加 swift 编译选项

对 swift 代码添加编译选项

```lua
add_scflags("xxx")
```

## target:add_asflags

### 添加汇编编译选项

对汇编代码添加编译选项

```lua
add_asflags("xxx")
```

## target:add_gcflags

### 添加 go 编译选项

对 golang 代码添加编译选项

```lua
add_gcflags("xxx")
```

## target:add_dcflags

### 添加 dlang 编译选项

对 dlang 代码添加编译选项

```lua
add_dcflags("xxx")
```

## target:add_rcflags

### 添加 rust 编译选项

对 rust 代码添加编译选项

```lua
add_rcflags("xxx")
```

## target:add_fcflags

### 添加 fortran 编译选项

对 fortran 代码添加编译选项

```lua
add_fcflags("xxx")
```

## target:add_zcflags

### 添加 zig 编译选项

对 zig 代码添加编译选项

```lua
add_zcflags("xxx")
```

## target:add_cuflags

### 添加 cuda 编译选项

对 cuda 代码添加编译选项

```lua
add_cuflags("-gencode arch=compute_30,code=sm_30")
```

## target:add_culdflags

### 添加 cuda 设备链接选项

cuda 默认构建会使用 device-link，这个阶段如果要设置一些链接 flags，则可以通过这个接口来设置。
而最终的程序链接，会使用 ldflags，不会调用 nvcc，直接通过 gcc/clang 等 c/c++ 链接器来链接。

关于 device-link 的说明，可以参考：[https://devblogs.nvidia.com/separate-compilation-linking-cuda-device-code/](https://devblogs.nvidia.com/separate-compilation-linking-cuda-device-code/)

```lua
add_culdflags("-gencode arch=compute_30,code=sm_30")
```

## target:add_cugencodes

### 添加 cuda 设备的 gencode 设置

`add_cugencodes()` 接口其实就是对 `add_cuflags("-gencode arch=compute_xx,code=compute_xx")` 编译 flags 设置的简化封装，其内部参数值对应的实际 flags 映射关系如下：

```lua
- compute_xx                   --> `-gencode arch=compute_xx,code=compute_xx`
- sm_xx                        --> `-gencode arch=compute_xx,code=sm_xx`
- sm_xx,sm_yy                  --> `-gencode arch=compute_xx,code=[sm_xx,sm_yy]`
- compute_xx,sm_yy             --> `-gencode arch=compute_xx,code=sm_yy`
- compute_xx,sm_yy,sm_zz       --> `-gencode arch=compute_xx,code=[sm_yy,sm_zz]`
- native                       --> match the fastest cuda device on current host,
                                   eg. for a Tesla P100, `-gencode arch=compute_60,code=sm_60` will be added,
                                   if no available device is found, no `-gencode` flags will be added
```

例如：

```lua
add_cugencodes("sm_30")
```

就等价为

```lua
add_cuflags("-gencode arch=compute_30,code=sm_30")
add_culdflags("-gencode arch=compute_30,code=sm_30")
```

是不是上面的更加精简些，这其实就是个用于简化设置的辅助接口。

而如果我们设置了 native 值，那么 xmake 会自动探测当前主机的 cuda 设备，然后快速匹配到它对应的 gencode 设置，自动追加到整个构建过程中。

例如，如果我们主机目前的 GPU 是 Tesla P100，并且能够被 xmake 自动检测到，那么下面的设置：

```lua
add_cugencodes("native")
```

等价于：

```lua
add_cugencodes("sm_60")
```

## target:add_ldflags

### 添加链接选项

添加静态链接选项

```lua
add_ldflags("-L/xxx", "-lxxx")
```

在添加链接选项时，默认无法支持参数内有空格，使用 expand = false：

```lua
-- add_ldflags("-L/my lib") ERROR: Invalid arguments
add_ldflags({"-L/my lib"}, {expand = false}) -- OK
```

## target:add_arflags

### 添加静态库归档选项

影响对静态库的生成

```lua
add_arflags("xxx")
```

## target:add_shflags

### 添加动态库链接选项

影响对动态库的生成

```lua
add_shflags("xxx")
```

## target:add_options

### 添加关联选项

这个接口跟 [set_options](#targetset_options) 类似，唯一的区别就是，此处是追加选项，而 [set_options](#targetset_options) 每次设置会覆盖先前的设置。

## target:add_packages

### 添加包依赖

在 target 作用域中，添加集成包依赖，例如：

```lua
target("test", function()
    add_packages("zlib", "polarssl", "pcre", "mysql")
end)
```

这样，在编译 test 目标时，如果这个包存在的，将会自动追加包里面的宏定义、头文件搜索路径、链接库目录，也会自动链接包中所有库。

用户不再需要自己单独调用 [add_links](#targetadd_links)，[add_includedirs](#targetadd_includedirs), [add_ldflags](#targetadd_ldflags) 等接口，来配置依赖库链接了。

对于如何设置包搜索目录，可参考：[add_packagedirs](/zh-cn/manual/global_interfaces?id=add_packagedirs) 接口

此接口也同时支持远程依赖包管理中 [add_requires](/zh-cn/manual/global_interfaces?id=add_requires) 定义的包。

```lua
add_requires("zlib", "polarssl")
target("test", function()
    add_packages("zlib", "polarssl")
end)
```

还支持覆写内置的 links，控制实际链接的库：

```lua
-- 默认会有 ncurses, panel, form 等 links
add_requires("ncurses")

target("test", function()

    -- 显示指定，只使用 ncurses 一个链接库
    add_packages("ncurses", {links = "ncurses"})
end)
```

或者干脆禁用 links，只使用头文件：

```lua
add_requires("lua")
target("test", function()
    add_packages("lua", {links = {}})
end)
```

## target:add_languages

### 添加语言标准

与 [set_languages](#targetset_languages) 类似，唯一区别是这个接口不会覆盖掉之前的设置，而是追加设置。

## target:add_vectorexts

### 添加向量扩展指令

添加扩展指令优化选项，目前支持以下几种扩展指令集：

```lua
add_vectorexts("mmx")
add_vectorexts("neon")
add_vectorexts("avx", "avx2", "avx512")
add_vectorexts("sse", "sse2", "sse3", "ssse3", "sse4.2")
```

> 如果当前设置的指令集编译器不支持，xmake 会自动忽略掉，所以不需要用户手动去判断维护，只需要将你需要的指令集全部设置上就行了。

xmake 新增了一个 `all` 配置项，可以用于尽可能的开启所有扩展指令优化。

```lua
add_vectorexts("all")
```

## target:add_frameworks

### 添加链接框架

目前主要用于 `ios` 和 `macosx` 平台的 `objc` 和 `swift` 程序，例如：

```lua
target("test", function()
    add_frameworks("Foundation", "CoreFoundation")
end)
```

当然也可以使用 [add_mxflags](#targetadd_mxflags) 和[add_ldflags](#targetadd_ldflags)来设置，不过比较繁琐，不建议这样设置。

```lua
target("test", function()
    add_mxflags("-framework Foundation", "-framework CoreFoundation")
    add_ldflags("-framework Foundation", "-framework CoreFoundation")
end)
```

如果不是这两个平台，这些设置将会被忽略。

## target:add_frameworkdirs

### 添加链接框架搜索目录

对于一些第三方 framework，那么仅仅通过 [add_frameworks](#targetadd_frameworks) 是没法找到的，还需要通过这个接口来添加搜索目录。

```lua
target("test", function()
    add_frameworks("MyFramework")
    add_frameworkdirs("/tmp/frameworkdir", "/tmp/frameworkdir2")
end)
```

## target:set_toolset

### 设置工具集

针对特定 target 单独设置切换某个编译器，链接器，不过我们更推荐使用 [set_toolchains](#targetset_toolchains) 对某个 target 进行整体工具链的切换。

与 set_toolchains 相比，此接口只切换工具链某个特定的编译器或者链接器。

对于 `add_files("*.c")` 添加的源码文件，默认都是会调用系统最匹配的编译工具去编译，或者通过 `xmake f --cc=clang` 命令手动去修改，不过这些都是全局影响所有 target 目标的。

如果有些特殊需求，需要对当前工程下某个特定的 target 目标单独指定不同的编译器、链接器或者特定版本的编译器，这个时候此接口就可以排上用途了，例如：

```lua
target("test1", function()
    add_files("*.c")
end)

target("test2", function()
    add_files("*.c")
    set_toolset("cc", "$(projectdir)/tools/bin/clang-5.0")
end)
```

上述描述仅对 test2 目标的编译器进行特殊设置，使用特定的 clang-5.0 编译器来编译 test2，而 test1 还是使用默认设置。

<p class="tip">
每次设置都会覆盖当前 target 目标下之前的那次设置，不同 target 之间不会被覆盖，互相独立，如果在根域设置，会影响所有子 target。
</p>

前一个参数是 key，用于指定工具类型，目前支持的有（编译器、链接器、归档器）：

| 工具类型 | 描述                                  |
| -------- | ------------------------------------- |
| cc       | c 编译器                              |
| cxx      | c++ 编译器                            |
| mm       | objc 编译器                           |
| mxx      | objc++ 编译器                         |
| gc       | go 编译器                             |
| as       | 汇编器                                |
| sc       | swift 编译器                          |
| rc       | rust 编译器                           |
| dc       | dlang 编译器                          |
| fc       | fortran 编译器                        |
| sc       | swift 编译器                          |
| rust     | rust 编译器                           |
| strip    | strip 程序                            |
| ld       | c/c++/asm/objc 等通用可执行程序链接器 |
| sh       | c/c++/asm/objc 等通用动态库链接器     |
| ar       | c/c++/asm/objc 等通用静态库归档器     |
| dcld     | dlang 可执行链接器, rcld/gcld 等类似  |
| dcsh     | dlang 动态库链接器, rcsh/gcsh 等类似  |

对于一些编译器文件名不规则，导致 xmake 无法正常识别处理为已知的编译器名的情况下，我们也可以加一个工具名提示，例如：

```lua
set_toolset("cc", "gcc@$(projectdir)/tools/bin/mipscc.exe")
```

上述描述设置 mipscc.exe 作为 c 编译器，并且提示 xmake 作为 gcc 的传参处理方式进行编译。

## target:set_toolchains

### 设置工具链

这对某个特定的 target 单独切换设置不同的工具链，和 set_toolset 不同的是，此接口是对完整工具链的整体切换，比如 cc/ld/sh 等一系列工具集。

这也是推荐做法，因为像 gcc/clang 等大部分编译工具链，编译器和链接器都是配套使用的，要切就得整体切，单独零散的切换设置会很繁琐。

比如我们切换 test 目标到 clang+yasm 两个工具链：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    set_toolchains("clang", "yasm")
end)
```

只需要指定工具链名字即可，具体 xmake 支持哪些工具链，可以通过下面的命令查看：

```bash
$ xmake show -l toolchains
xcode         Xcode IDE
vs            VisualStudio IDE
yasm          The Yasm Modular Assembler
clang         A C language family frontend for LLVM
go            Go Programming Language Compiler
dlang         D Programming Language Compiler
sdcc          Small Device C Compiler
cuda          CUDA Toolkit
ndk           Android NDK
rust          Rust Programming Language Compiler
llvm          A collection of modular and reusable compiler and toolchain technologies
cross         Common cross compilation toolchain
nasm          NASM Assembler
gcc           GNU Compiler Collection
mingw         Minimalist GNU for Windows
gnu-rm        GNU Arm Embedded Toolchain
envs          Environment variables toolchain
fasm          Flat Assembler
```

当然，我们也可以通过命令行全局切换到其他工具链：

```bash
$ xmake f --toolchain=clang
$ xmake
```

另外，我们也可以在 xmake.lua 中自定义 toolchain，然后通过 `set_toolchains` 指定进去，例如：

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

    -- ...
end)
```

关于这块的详情介绍，可以到 [自定义工具链](/zh-cn/manual/custom_toolchain) 章节查看

更多详情见：[#780](https://github.com/xmake-io/xmake/issues/780)

支持对 toolchains 平台和架构的单独设置和切换，比如：

```lua
target("test", function()
    set_toolchains("xcode", {plat = os.host(), arch = os.arch()})
end)
```

如果当前是在交叉编译模式，那么这个 test 还是会强制切到 xcode 的本地编译工具链和对应的 pc 平台上去，这对于想要同时支持部分 target 使用主机工具链，部分 target 使用交叉编译工具链时候，非常有用。

但是，这还不是特别方便，尤其是跨平台编译时候，不同平台的 pc 工具链都是不同的，有 msvc, xcode, clang 等，还需要判断平台来指定。

因此，我们可以直接使用 [set_plat](#targetset_plat) 和[set_arch](#targetset_arch)接口，直接设置特定 target 到主机平台，就可以内部自动选择 host 工具链了，例如：

```lua
target("test", function()
    set_plat(os.host())
    set_arch(os.arch())
end)
```

这块的应用场景和 example 可以看下：[https://github.com/xmake-io/xmake-repo/blob/dev/packages/l/luajit/port/xmake.lua](https://github.com/xmake-io/xmake-repo/blob/dev/packages/l/luajit/port/xmake.lua)

luajit 里面就需要同时编译 host 平台的 minilua/buildvm 来生成 jit 相关代码，然后开始针对性编译 luajit 自身到不同的交叉工具链。

关于这块详情，可以参考：[https://github.com/xmake-io/xmake/pull/857](https://github.com/xmake-io/xmake/pull/857)

xmake 对 set_toolchains 做了进一步的改进，更好地对特定 target 支持独立工具链切换，比如不同 target 支持切换到不同的 vs 版本，例如：

```lua
target("test", function()
    set_toolchains("msvc", {vs = "2015"})
end)
```

默认 xmake 会使用全局 vs 工具链，比如当前检测到 vs2019，但是用户同时还安装了 vs2015，那么可以通过上面的配置将 test 目标切换到 vs2015 来编译。

甚至还可以配合 `set_arch` 来指定特定的架构到 x86，而不是默认的 x64。

```lua
target("test", function()
    set_arch("x86")
    set_toolchains("msvc", {vs = "2015"})
end)
```

上面的效果跟 `set_toolchains("msvc", {vs = "2015", arch = "x86"})` 类似，不过 `set_arch` 是针对 target 粒度的，而 `set_toolchains` 里面的 arch 设置仅仅针对特定工具链粒度。

通常，我们更推荐使用 `set_arch` 来对整个 target 实现架构切换。

## target:set_plat

### 设置指定目标的编译平台

通常配合 [set_arch](#targetset_arch) 使用，将指定 target 的编译平台切换到指定平台，xmake 会自动根据切换的平台，选择合适的工具链。

一般用于需要同时编译 host 平台目标、交叉编译目标的场景，更多详情见：[set_toolchains](#targetset_toolchains)

例如：

```console
$ xmake f -p android --ndk=/xxx
```

即使正在使用 android ndk 编译 android 平台目标，但是其依赖的 host 目标，还是会切换到主机平台，使用 xcode, msvc 等 host 工具链来编译。

```lua
target("host", function()
    set_kind("binary")
    set_plat(os.host())
    set_arch(os.arch())
    add_files("src/host/*.c")
end)

target("test", function()
    set_kind("binary")
    add_deps("host")
    add_files("src/test/*.c")
end)
```

## target:set_arch

### 设置指定目标的编译架构

详情见：[set_plat](#targetset_plat)

## target:set_values

### 设置一些扩展配置值

给 target 设置一些扩展的配置值，这些配置没有像 `set_ldflags` 这种内置的 api 可用，通过第一个参数传入一个配置名，来扩展配置。
一般用于传入配置参数给自定义 rule 中的脚本使用，例如：

```lua
rule("markdown", function()
    on_build_file(function (target, sourcefile, opt)
        -- compile .markdown with flags
        local flags = target:values("markdown.flags")
        if flags then
            -- ..
        end
    end)
end)

target("test", function()
    add_files("src/*.md", {rule = "markdown"})
    set_values("markdown.flags", "xxx", "xxx")
end)
```

上述代码例子中，可以看出，在 target 应用 markdown 规则的时候，通过 set_values 去设置一些 flags 值，提供给 markdown 规则去处理。
在规则脚本中可以通过 `target:values("markdown.flags")` 获取到 target 中设置的扩展 flags 值。

> 具体扩展配置名，根据不同的 rule，会有所不同，目前有哪些，可以参考相关规则的描述：[内建规则](/zh-cn/manual/custom_rule?id = 内建规则)

下面是一些 xmake 目前支持的一些内置的扩展配置项列表。

| 扩展配置名              | 配置描述                                   |
| ----------------------- | ------------------------------------------ |
| fortran.moduledir       | 设置 fortran 模块的输出目录                |
| ndk.arm_mode            | 设置 ndk 的 arm 编译模式（arm/thumb）      |
| objc.build.arc          | 设置启用或禁用 objc 的 arc                 |
| objc++.build.arc        | 设置启用或禁用 objc++ 的 arc               |
| xcode.bundle_identifier | 设置 xcode 工具链的 Bundle Identifier      |
| xcode.mobile_provision  | 设置 xcode 工具链的证书信息                |
| xcode.codesign_identity | 设置 xcode 工具链的代码签名标识            |
| wasm.preloadfiles       | 设置 wasm 打包的预加载文件（preload file） |
| wdk.env.winver          | 设置 wdk 的 win 支持版本                   |
| wdk.umdf.sdkver         | 设置 wdk 的 umdf sdk 版本                  |
| wdk.kmdf.sdkver         | 设置 wdk 的 kmdf sdk 版本                  |
| wdk.sign.mode           | 设置 wdk 的代码签名模式                    |
| wdk.sign.store          | 设置 wdk 的代码签名 store                  |
| wdk.sign.certfile       | 设置 wdk 的代码签名证书文件                |
| wdk.sign.thumbprint     | 设置 wdk 的代码签名指纹                    |

## target:add_values

### 添加一些扩展配置值

用法跟 [target:set_values](#targetset_values) 类似，区别就是这个接口是追加设置，而不会每次覆盖设置。

## target:set_rundir

### 设置运行目录

此接口用于设置默认运行 target 程序的当前运行目录，如果不设置，默认情况下，target 是在可执行文件所在目录加载运行。

如果用户想要修改加载目录，一种是通过 `on_run()` 的方式自定义运行逻辑，里面去做切换，但仅仅为了切个目录就这么做，太过繁琐。

因此可以通过这个接口快速的对默认执行的目录环境做设置切换。

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    set_rundir("$(projectdir)/xxx")
end)
```

## target:set_runargs

### 设置运行参数列表

2.6.9 新增接口，可用于设置 `xmake run` 的默认运行参数，通过它，我们可以避免每次命令行输入运行参数，`xmake run -x --arg1=val`

```lua
set_runargs("-x", "--arg1=val")
```

## target:add_runenvs

### 添加运行环境变量

此接口用于添加设置默认运行 target 程序的环境变量，跟 [set_runenv](#targetset_runenv) 不同的是，此接口是对已有系统 env 中的值进行追加，并不会覆盖。

所以，对于 PATH 这种，通过此接口追加值是非常方便的，而且此接口支持多值设置，所以通常就是用来设置带有 path sep 的多值 env。。

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    add_runenvs("PATH", "/tmp/bin", "xxx/bin")
    add_runenvs("LD_LIBRARY_PATH", "/tmp/lib", "xxx/lib")
end)
```

## target:set_runenv

### 设置运行环境变量

此接口跟 [add_runenvs](#targetadd_runenvs) 不同的是，`set_runenv` 是对某个环境变量的覆盖设置，会覆盖原有系统环境的 env 值，并且此接口是单数设置，不能传递多参。

所以，如果要覆盖设置 PATH 这中多路径的 env，需要自己去拼接：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    set_runenv("PATH", path.joinenv("/tmp/bin", "xxx/bin"))
    set_runenv("NAME", "value")
end)
```

## target:set_installdir

### 设置安装目录

2.2.5 版本新增接口，用于针对每个 target 设置不同的默认安装目录，一般用于 `xmake install/uninstall` 命令。

默认情况下执行 `xmake install` 会安装到系统 `/usr/local` 目录，我们除了可以通过 `xmake install -o /usr/local` 指定其他安装目录外，
还可以在 xmake.lua 中针对 target 设置不同的安装目录来替代默认目录。

除了上述两种方式，我们也可以通过 `INSTALLDIR` 和 `DESTDIR` 环境变量设置默认的安装目录。

## target:set_prefixdir

### 设置安装前置子目录

尽管通过 `set_installdir` 和 `xmake install -o [installdir]` 设置了安装根目录，但是如果我们还想进一步调整 bin, lib 和 include 的子路径。

那么，我们可以使用这个接口，默认情况下，安装目录会按照这个结构：

```bash
installdir
  - bin
  - lib
  - include
```

如果我们配置：

```lua
set_prefix("prefixdir")
```

就是增加一个总的子目录：

```bash
installdir
  - prefixdir
    - bin
    - lib
    - include
```

我们还可以单独配置 bin, lib 和 include 子目录，例如：

```lua
set_prefix("prefixdir", {bindir = "mybin", libdir = "mylib", includedir = "myinc"})
```

```bash
installdir
  - prefixdir
    - mybin
    - mylib
    - myinc
```

如果，我们不配置 prefixdir，仅仅修改 bin 子目录，可以将 prefixdir 配置成 `/`。

```lua
set_prefix("/", {bindir = "mybin", libdir = "mylib", includedir = "myinc"})
```

```bash
installdir
  - mybin
  - mylib
  - myinc
```

## target:add_installfiles

### 添加安装文件

2.2.5 版本新增接口，用于针对每个 target 设置对应需要安装的文件，一般用于 `xmake install/uninstall` 命令。

比如我们可以指定安装各种类型的文件到安装目录：

```lua
target("test", function()
    add_installfiles("src/*.h")
    add_installfiles("doc/*.md")
end)
```

默认在 linux 等系统上，我们会安装到 `/usr/local/*.h, /usr/local/*.md`，不过我们也可以指定安装到特定子目录：

```lua
target("test", function()
    add_installfiles("src/*.h", {prefixdir = "include"})
    add_installfiles("doc/*.md", {prefixdir = "share/doc"})
end)
```

上面的设置，我们会安装到 `/usr/local/include/*.h, /usr/local/share/doc/*.md`

注：默认安装不会保留目录结构，会完全展开，当然我们也可以通过 `()` 去提取源文件中的子目录结构来安装，例如：

```lua
target("test", function()
    add_installfiles("src/(tbox/*.h)", {prefixdir = "include"})
    add_installfiles("doc/(tbox/*.md)", {prefixdir = "share/doc"})
end)
```

我们把 `src/tbox/*.h` 中的文件，提取 `tbox/*.h` 子目录结构后，在进行安装：`/usr/local/include/tbox/*.h, /usr/local/share/doc/tbox/*.md`

当然，用户也可以通过 [set_installdir](#targetset_installdir) 接口，来配合使用。

关于此接口的详细说明，见：[https://github.com/xmake-io/xmake/issues/318](https://github.com/xmake-io/xmake/issues/318)

## target:add_headerfiles

### 添加安装头文件

2.2.5 版本新增接口，用于针对每个 target 设置对应需要安装的头文件，一般用于 `xmake install/uninstall` 命令。

此接口使用方式跟 [add_installfiles](#targetadd_installfiles) 接口几乎完全一样，都可以用来添加安装文件，不过此接口仅用于安装头文件。
因此，使用上比 `add_installfiles` 简化了不少，默认不设置 prefixdir，也会自动将头文件安装到对应的 `include` 子目录中。

并且此接口对于 `xmake project -k vs201x` 等插件生成的 IDE 文件，也会添加对应的头文件进去。

我注：默认安装不会保留目录结构，会完全展开，当然们也可以通过 `()` 去提取源文件中的子目录结构来安装，例如：

```lua
target("test", function()
    add_headerfiles("src/(tbox/*.h)", {prefixdir = "include"})
end)
```

v2.7.1 之后，我们可以通过 `{install = false}` 参数，禁用默认的头文件安装行为，仅仅对设置的头文件用于 project generator 的文件列表展示和编辑，例如 vs project。

```lua
add_headerfiles("src/foo.h")
add_headerfiles("src/test.h", {install = false})
```

上面两个头文件，在 vs 工程中都会展示出来，但是仅仅 foo.h 会被发布安装到系统。

## target:set_configdir

### 设置模板配置文件的输出目录

2.2.5 版本新增接口，主要用于 [add_configfiles](#targetadd_configfiles) 接口设置的模板配置文件的输出目录。

## target:set_configvar

### 设置模板配置变量

2.2.5 版本新增接口，用于在编译前，添加一些需要预处理的模板配置变量，一般用于 [add_configfiles](#targetadd_configfiles) 接口。

```lua
target("test", function()
    set_kind("binary")
    add_files("main.c")
    set_configvar("HAS_FOO", 1)
    set_configvar("HAS_BAR", "bar")
    set_configvar("HAS_ZOO", "zoo", {quote = false})
    add_configfiles("config.h.in")
end)
```

config.h.in

```c
${define HAS_FOO}
${define HAS_BAR}
${define HAS_ZOO}
```

生成的 config.h 内容如下：

```c
#define HAS_FOO 1
#define HAS_BAR "bar"
#define HAS_ZOO zoo
```

set_configvar 可以设置 number，string 和 boolean 类型值，如果是 string 值，默认生成的宏定义带有引号，如果要去掉引号，可以设置 `{quote = false}`。

相关 issues 见：[#1694](https://github.com/xmake-io/xmake/issues/1694)

对于，宏定义里面有路径，需要转义处理路径分隔符的，我们也可以配置开启路径字符转义。

```lua
set_configvar("TEST", "C:\\hello", {escape = true})
```

它会自动转义成 `#define TEST "C:\\hello"` ，如果没开启转义，则会变成：`#define TEST "C:\hello"`

相关 issues 见：[#1872](https://github.com/xmake-io/xmake/issues/1872)

## target:add_configfiles

### 添加模板配置文件

用于在编译前，添加一些需要预处理的配置文件。

先来一个简单的例子：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    set_configdir("$(buildir)/config")
    add_configfiles("src/config.h.in")
end)
```

上面的设置，会在编译前，自动的将 `config.h.in` 这个头文件配置模板，经过预处理后，生成输出到指定的 `build/config/config.h`。

如果 `set_configdir` 不设置，那么默认输出到 `build` 目录下。

其中 `.in` 后缀会被自动识别处理掉，如果想要输出存储为其他文件名，可以通过：

```lua
add_configfiles("src/config.h", {filename = "myconfig.h"})
```

的方式，来重命名输出，同样，这个接口跟 [add_installfiles](#targetadd_configfiles) 类似，也是支持 prefixdir 和子目录提取设置：

```lua
add_configfiles("src/*.h.in", {prefixdir = "subdir"})
add_configfiles("src/(tbox/config.h)")
```

#### 变量替换

这个接口的一个最重要的特性就是，可以在预处理的时候，对里面的一些模板变量进行预处理替换，例如：

config.h.in

```
#define VAR1 "${VAR1}"
#define VAR2 "${VAR2}"
#define HELLO "${HELLO}"
```

```lua
set_configvar("VAR1", "1")

target("test", function()
    set_kind("binary")
    add_files("main.c")

    set_configvar("VAR2", 2)
    add_configfiles("config.h.in", {variables = {hello = "xmake"}})
    add_configfiles("*.man", {onlycopy = true})
end)
```

通过 [set_configvar](#targetset_configvar) 接口设置模板变量，裹着通过 `{variables = {xxx = ""}}` 中设置的变量进行替换处理。

预处理后的文件 `config.h` 内容为：

```
#define VAR1 "1"
#define VAR2 "2"
#define HELLO "xmake"
```

而 `{onlycopy = true}` 设置，会强制将 `*.man` 作为普通文件处理，仅在预处理阶段 copy 文件，不进行变量替换。

默认的模板变量匹配模式为 `${var}`，当然我们也可以设置其他的匹配模式，例如，改为 `@var@` 匹配规则：

```lua
target("test", function()
    add_configfiles("config.h.in", {pattern = "@(.-)@"})
end)
```

#### 内置变量

我们也有提供了一些内置的变量，即使不通过此接口设置，也是可以进行默认变量替换的：

```
${VERSION} -> 1.6.3
${VERSION_MAJOR} -> 1
${VERSION_MINOR} -> 6
${VERSION_ALTER} -> 3
${VERSION_BUILD} -> set_version("1.6.3", {build = "%Y%m%d%H%M"}) -> 201902031421
${PLAT} and ${plat} -> MACOS and macosx
${ARCH} and ${arch} -> ARM and arm
${MODE} and ${mode} -> DEBUG/RELEASE and debug/release
${DEBUG} and ${debug} -> 1 or 0
${OS} and ${os} -> IOS or ios
```

例如：

config.h.in

```c
#define CONFIG_VERSION "${VERSION}"
#define CONFIG_VERSION_MAJOR ${VERSION_MAJOR}
#define CONFIG_VERSION_MINOR ${VERSION_MINOR}
#define CONFIG_VERSION_ALTER ${VERSION_ALTER}
#define CONFIG_VERSION_BUILD ${VERSION_BUILD}
```

config.h

```c
#define CONFIG_VERSION "1.6.3"
#define CONFIG_VERSION_MAJOR 1
#define CONFIG_VERSION_MINOR 6
#define CONFIG_VERSION_ALTER 3
#define CONFIG_VERSION_BUILD 201902031401
```

v2.5.3 后新增 git 相关内置变量：

```c
#define GIT_COMMIT      "${GIT_COMMIT}"
#define GIT_COMMIT_LONG "${GIT_COMMIT_LONG}"
#define GIT_COMMIT_DATE "${GIT_COMMIT_DATE}"
#define GIT_BRANCH      "${GIT_BRANCH}"
#define GIT_TAG         "${GIT_TAG}"
#define GIT_TAG_LONG    "${GIT_TAG_LONG}"
#define GIT_CUSTOM      "${GIT_TAG}-${GIT_COMMIT}"
```

```c
#define GIT_COMMIT      "8c42b2c2"
#define GIT_COMMIT_LONG "8c42b2c251793861eb85ffdf7e7c2307b129c7ae"
#define GIT_COMMIT_DATE "20210121225744"
#define GIT_BRANCH      "dev"
#define GIT_TAG         "v1.6.6"
#define GIT_TAG_LONG    "v1.6.6-0-g8c42b2c2"
#define GIT_CUSTOM      "v1.6.6-8c42b2c2"
```

#### 宏定义

我们还可以对 `#define` 定义进行一些变量状态控制处理：

config.h.in

```c
${define FOO_ENABLE}
```

```lua
set_configvar("FOO_ENABLE", 1) -- or pass true
set_configvar("FOO_STRING", "foo")
```

通过上面的变量设置后，`${define xxx}` 就会替换成：

```c
#define FOO_ENABLE 1
#define FOO_STRING "foo"
```

或者（设置为 0 禁用的时候）

```c
/* #undef FOO_ENABLE */
/* #undef FOO_STRING */
```

这种方式，对于一些自动检测生成 config.h 非常有用，比如配合 option 来做自动检测：

```lua
option("foo")
    set_default(true)
    set_description("Enable Foo")
    set_configvar("FOO_ENABLE", 1) -- 或者传递 true，启用 FOO_ENABLE 变量
    set_configvar("FOO_STRING", "foo")

target("test")
    add_configfiles("config.h.in")

    -- 如果启用 foo 选项 -> 添加 FOO_ENABLE 和 FOO_STRING 定义
    add_options("foo")
```

config.h.in

```c
${define FOO_ENABLE}
${define FOO_STRING}
```

config.h

```c
#define FOO_ENABLE 1
#define FOO_STRING "foo"
```

关于 option 选项检测，以及 config.h 的自动生成，有一些辅助函数，可以看下：[https://github.com/xmake-io/xmake/issues/342](https://github.com/xmake-io/xmake/issues/342)

除了 `#define`，如果想要对其他非 `#define xxx` 也做状态切换处理，可以使用 `${default xxx 0}` 模式，设置默认值，例如：

```
HAVE_SSE2 equ ${default VAR_HAVE_SSE2 0}
```

通过 `set_configvar("HAVE_SSE2", 1)` 启用变量后，变为 `HAVE_SSE2 equ 1`，如果没有设置变量，则使用默认值：`HAVE_SSE2 equ 0`

关于这个的详细说明，见：[https://github.com/xmake-io/xmake/issues/320](https://github.com/xmake-io/xmake/issues/320)

#### 定义导出宏

v2.9.8 新增的特性，可以生成动态库的导出宏定义，通常用于 windows 下 dll 库的符号导出和导入。

在 config.h.in 中定义：

```c
${define_export MYLIB}
```

就会生成

```c
#ifdef MYLIB_STATIC
#  define MYLIB_EXPORT
#else
#  if defined(_WIN32)
#    define MYLIB_EXPORT __declspec(dllexport)
#  elif defined(__GNUC__) && ((__GNUC__ >= 4) || (__GNUC__ == 3 && __GNUC_MINOR__ >= 3))
#    define MYLIB_EXPORT __attribute__((visibility("default")))
#  else
#    define MYLIB_EXPORT
#  endif
#endif
```

我们在定义动态库导出符号时，可以通过这个宏来控制导入导出。

```c
MYLIB_EXPORT void foo();
```

它跟 CMake 的 [GenerateExportHeader](https://cmake.org/cmake/help/latest/module/GenerateExportHeader.html) 的功能类似。

不过，它不会额外生成一个独立的导出头文件，而是直接在 config.h 中去生成它。

更多详情见：[#6088](https://github.com/xmake-io/xmake/issues/6088)

#### 自定义预处理器

如果 xmake 内置的生成规则不满足需求，也可以自定义处理器去重写生成规则，例如重写 `${define_export XXX}`：

```lua
target("test", function()
    set_kind("binary")
    add_files("main.c")
    add_configfiles("config.h.in", {
        preprocessor = function (preprocessor_name, name, value, opt)
            if preprocessor_name == "define_export" then
                    value = ([[#ifdef %s_STATIC
#  define %s_EXPORT
#else
#  if defined(_WIN32)
#    define %s_EXPORT __declspec(dllexport)
#  elif defined(__GNUC__) && ((__GNUC__ >= 4) || (__GNUC__ == 3 && __GNUC_MINOR__ >= 3))
#    define %s_EXPORT __attribute__((visibility("default")))
#  else
#    define %s_EXPORT
#  endif
#endif
]]):format(name, name, name, name, name)
                return value
            end
        end})
end)
```

我们也可以重写对 `${define XXX}` 和 `${default XXX}` 的生成，甚至自定义扩展其他预处理配置。

例如：

```lua
target("test", function()
    set_kind("binary")
    add_files("main.c")
    set_configvar("FOO", "foo")
    add_configfiles("config.h.in", {
        preprocessor = function (preprocessor_name, name, value, opt)
            local argv = opt.argv
            if preprocessor_name == "define_custom" then
                return string.format("#define CUSTOM_%s %s", name, value)
            end
        end})
end)
```

然后我们在 config.h.in 中配置：

```c
${define_custom FOO arg1 arg2}
```

其中，`define_custom` 是自定义的预处理器名，FOO 是变量名，可以从 `set_configvar` 中获取变量值。

而 arg1, arg2 是可选的预处理参数列表，根据实际的需求来判断是否需要使用，如果想要使用参数，可以通过 `opt.argv` 来获取，它是一个参数列表 table。

在运行 `xmake config` 后，就会在 config.h 中自动生成如下配置：

```c
#define CUSTOM_FOO foo
```

## target:set_policy

### 设置构建行为策略

xmake 有很多的默认行为，比如：自动检测和映射 flags、跨 target 并行构建等，虽然提供了一定的智能化处理，但重口难调，不一定满足所有的用户的使用习惯和需求。

因此，从 v2.3.4 开始，xmake 提供默认构建策略的修改设置，开放给用户一定程度上的可配置性。

使用方式如下：

```lua
set_policy("check.auto_ignore_flags", false)
```

只需要在项目根域设置这个配置，就可以禁用 flags 的自动检测和忽略机制，另外 `set_policy` 也可以针对某个特定的 target 局部生效。

```lua
target("test", function()
    set_policy("check.auto_ignore_flags", false)
end)
```

完整的 policies 支持列表和使用说明，见：[构建策略](/zh-cn/guide/build_policies)

### target:set_runtimes

### 设置编译目标依赖的运行时库

用于抽象化设置编译目标依赖的运行时库，目前仅仅支持对 msvc 运行时库的抽象，但后续也许会扩展对其他编译器运行时库的映射。

目前支持的一些配置值说明如下：

| 值             | 描述                                               |
| -------------- | -------------------------------------------------- |
| MT             | msvc 运行时库：多线程静态库                        |
| MTd            | msvc 运行时库：多线程静态库（调试）                |
| MD             | msvc 运行时库：多线程动态库                        |
| MDd            | msvc 运行时库：多线程动态库（调试）                |
| c++_static     | clang 的 c++ 运行时库，静态库                      |
| c++_shared     | clang 的 c++ 运行时库，动态库                      |
| stdc++_static  | gcc 的 c++ 运行时库，静态库                        |
| stdc++_shared  | gcc 的 c++ 运行时库，动态库                        |
| gnustl_static  | android 的 c++ 运行时库，静态库，高版本 NDK 已废弃 |
| gnustl_shared  | android 的 c++ 运行时库，静态库，高版本 NDK 已废弃 |
| stlport_static | android 的 c++ 运行时库，静态库，高版本 NDK 已废弃 |
| stlport_static | android 的 c++ 运行时库，静态库，高版本 NDK 已废弃 |

关于 vs 运行时，可以参考：[msvc 运行时说明](https://docs.microsoft.com/en-us/cpp/build/reference/md-mt-ld-use-run-time-library?view=msvc-160)

而这个接口传入 MT/MTd 参数配置，xmake 会自动配置上 `/MT /nodefaultlib:msvcrt.lib` 参数。

我们可以针对不同的 target 设置不同的运行时。

另外，如果我们将 `set_runtimes` 设置在全局根域，那么所有的 `add_requires("xx")` 包定义也会全局同步切换到对应的 vs runtime 配置

```lua
set_runtimes("MD")
add_requires("libcurl", "fmt")
target("test")
   set_kind("binary")
   add_files("src/*.c")
```

当然，我们也可以通过 `add_requires("xx", {configs = {vs_runtime = "MD"}})` 对特定包修改 vs 运行时库。

我们也可以通过 `xmake f --vs_runtime='MD'` 通过参数配置来全局切换它。

与此 api 相关的 issue：[#1071](https://github.com/xmake-io/xmake/issues/1071#issuecomment-750817681)

## target:set_group

### 设置目标分组

#### 编译指定一批目标程序

我们可以使用 `set_group()` 将给定的目标标记为 `test/benchmark/...` 并使用 `set_default(false)` 禁用来默认构建它。

然后，通过 `xmake -g xxx` 命令就能指定构建一批目标程序了。

比如，我们可以使用此功能来构建所有测试。

```lua
target("test1", function()
    set_kind("binary")
    set_default(false)
    set_group("test")
    add_files("src/*.cpp")
end)

target("test2", function()
    set_kind("binary")
    set_default(false)
    set_group("test")
    add_files("src/*.cpp")
end)
```

编译指定的 group：

```console
$ xmake -g test
$ xmake --group=test
```

#### 运行指定一批目标程序

我们也可以通过设置分组，来指定运行所有带有 `test` 分组的测试程序。

```console
$ xmake run -g test
$ xmake run --group=test
```

另外，我们还可以支持分组的模式匹配：

```
$ xmake build -g test_*
$ xmake run -g test/foo_*
$ xmake build -g bench*
$ xmake run -g bench*
```

更多信息见：[#1913](https://github.com/xmake-io/xmake/issues/1913)

## target:set_exceptions

### 启用或者禁用异常

我们可以通过这个配置，配置启用和禁用 C++/Objc 的异常。

通常，如果我们通过 `add_cxxflags` 接口去配置它们，需要根据不同的平台，编译器分别处理它们，非常繁琐。

例如：

```lua
    on_config(function (target)
        if (target:has_tool("cxx", "cl")) then
            target:add("cxflags", "/EHsc", {force = true})
            target:add("defines", "_HAS_EXCEPTIONS=1", {force = true})
        elseif(target:has_tool("cxx", "clang") or target:has_tool("cxx", "clang-cl")) then
            target:add("cxflags", "-fexceptions", {force = true})
            target:add("cxflags", "-fcxx-exceptions", {force = true})
        end
    end)
```

而通过这个接口，我们就可以抽象化成编译器无关的方式去配置它们。

开启 C++ 异常:

```lua
set_exceptions("cxx")
```

禁用 C++ 异常:

```lua
set_exceptions("no-cxx")
```

我们也可以同时配置开启 objc 异常。

```lua
set_exceptions("cxx", "objc")
```

或者禁用它们。

```lua
set_exceptions("no-cxx", "no-objc")
```

xmake 会在内部自动根据不同的编译器，去适配对应的 flags。

## target:set_encodings

### 设置编码

我们可以用这个接口设置源文件、目标执行文件的编码。

目前支持的编码：utf-8, gb2312 (msvc)

默认情况下，我们仅仅指定编码，是会同时对源文件，目标文件生效。

```lua
-- for all source/target encodings
set_encodings("utf-8") -- msvc: /utf-8
```

它等价于：

```lua
set_encodings("source:utf-8", "target:utf-8")
```

并且，目前仅仅支持设置成 utf-8 编码，将来会不断扩展。

如果，我们仅仅想单独设置源文件编码，或者目标文件编码，也是可以的。

#### 设置源文件编码

通常指的是编译的代码源文件的编码，我们可以这么设置。

```lua
-- gcc/clang: -finput-charset=UTF-8, msvc: -source-charset=utf-8
set_encodings("source:utf-8")
```

#### 设置目标文件编码

它通常指的是目标可执行文件的运行输出编码。

```lua
-- gcc/clang: -fexec-charset=UTF-8, msvc: -target-charset=utf-8
set_encodings("target:utf-8")
```

## target:add_forceincludes

### 强制添加 includes

用于在配置文件中直接强制添加 `includes` 头文件。

```lua
add_forceincludes("config.h")
```

它的效果类似于 `#include <config.h>`，但是不需要在源码中显式添加它了。

另外，它的搜索路径也是需要通过 `add_includedirs` 来控制，而不是直接配置文件路径。

```lua
add_forceincludes("config.h")
add_includedirs("src")
```

默认 add_forceincludes 匹配 c/c++/objc。如果仅仅只想匹配 c++ 可以这么配置：

```lua
add_forceincludes("config.h", {sourcekinds = "cxx"})
```

如果想同时匹配多个源文件类型，也是可以的：

```lua
add_forceincludes("config.h", {sourcekinds = {"cxx", "mxx"}})
```

## target:add_tests

### 添加测试用例

我们只需要在需要测试的 target 上通过 add_tests 配置一些测试用例，就可以自动执行测试。

即使当前 target 被设置成了 `set_default(false)`，在执行测试的时候，xmake 也还是会先自动编译它们，然后自动运行所有的测试。

我们可以先看个整体的例子，大概知道下它是怎么样子的。

```lua
add_rules("mode.debug", "mode.release")

for _, file in ipairs(os.files("src/test_*.cpp")) do
    local name = path.basename(file)
    target(name, function()
        set_kind("binary")
        set_default(false)
        add_files("src/" .. name .. ".cpp")
        add_tests("default")
        add_tests("args", {runargs = {"foo", "bar"}})
        add_tests("pass_output", {trim_output = true, runargs = "foo", pass_outputs = "hello foo"})
        add_tests("fail_output", {fail_outputs = {"hello2 .*", "hello xmake"}})
    end)
end
```

这个例子，自动扫描源码目录下的 `test_*.cpp` 源文件，然后每个文件自动创建一个测试目标，它被设置成了 `set_default(false)`，也就是正常情况下，默认不会编译它们。

但是，如果执行 `xmake test` 进行测试，它们就会被自动编译，然后测试运行，运行效果如下：

```bash
$ xmake test
running tests ...
[2%]: test_1/args        .................................... passed 7.000s
[5%]: test_1/default     .................................... passed 5.000s
[8%]: test_1/fail_output .................................... passed 5.000s
[11%]: test_1/pass_output .................................... passed 6.000s
[13%]: test_2/args        .................................... passed 7.000s
[16%]: test_2/default     .................................... passed 6.000s
[19%]: test_2/fail_output .................................... passed 6.000s
[22%]: test_2/pass_output .................................... passed 6.000s
[25%]: test_3/args        .................................... passed 7.000s
[27%]: test_3/default     .................................... passed 7.000s
[30%]: test_3/fail_output .................................... passed 6.000s
[33%]: test_3/pass_output .................................... passed 6.000s
[36%]: test_4/args        .................................... passed 6.000s
[38%]: test_4/default     .................................... passed 6.000s
[41%]: test_4/fail_output .................................... passed 5.000s
[44%]: test_4/pass_output .................................... passed 6.000s
[47%]: test_5/args        .................................... passed 5.000s
[50%]: test_5/default     .................................... passed 6.000s
[52%]: test_5/fail_output .................................... failed 6.000s
[55%]: test_5/pass_output .................................... failed 5.000s
[58%]: test_6/args        .................................... passed 7.000s
[61%]: test_6/default     .................................... passed 6.000s
[63%]: test_6/fail_output .................................... passed 6.000s
[66%]: test_6/pass_output .................................... passed 6.000s
[69%]: test_7/args        .................................... failed 6.000s
[72%]: test_7/default     .................................... failed 7.000s
[75%]: test_7/fail_output .................................... failed 6.000s
[77%]: test_7/pass_output .................................... failed 5.000s
[80%]: test_8/args        .................................... passed 7.000s
[83%]: test_8/default     .................................... passed 6.000s
[86%]: test_8/fail_output .................................... passed 6.000s
[88%]: test_8/pass_output .................................... failed 5.000s
[91%]: test_9/args        .................................... passed 6.000s
[94%]: test_9/default     .................................... passed 6.000s
[97%]: test_9/fail_output .................................... passed 6.000s
[100%]: test_9/pass_output .................................... passed 6.000s

80% tests passed, 7 tests failed out of 36, spent 0.242s
```

#### 运行指定测试目标

我们也可以指定运行指定 target 的某个测试：

```bash
$ xmake test targetname/testname
```

或者按模式匹配的方式，运行一个 target 的所有测试，或者一批测试：

```bash
$ xmake test targetname/*
$ xmake test targetname/foo*
```

也可以运行所有 target 的同名测试：

```bash
$ xmake test */testname
```

#### 并行化运行测试

其实，默认就是并行化运行的，但是我们可以通过 `-jN` 调整运行的并行度。

```bash
$ xmake test -jN
```

#### 分组运行测试

```bash
$ xmake test -g "foo"
$ xmake test -g "foo*"
```

#### 添加测试到目标（无参数）

如果没有配置任何参数，仅仅配置了测试名到 `add_tests`，那么仅仅测试这个目标程序的是否会运行失败，根据退出代码来判断是否通过测试。

```
target("test", function()
    add_tests("testname")
end)
```

#### 配置运行参数

我们也可以通过 `{runargs = {"arg1", "arg2"}}` 的方式，给 `add_tests` 配置指定测试需要运行的参数。

另外，一个 target 可以同时配置多个测试用例，每个测试用例可独立运行，互不冲突。

```lua
target("test", function()
    add_tests("testname", {runargs = "arg1"})
    add_tests("testname", {runargs = {"arg1", "arg2"}})
end)
```

如果我们没有配置 runargs 到 `add_tests`，那么我们也会尝试从被绑定的 target 中，获取 `set_runargs` 设置的运行参数。

```lua
target("test", function()
    add_tests("testname")
    set_runargs("arg1", "arg2")
end)
```

#### 配置运行目录

我们也可以通过 rundir 设置测试运行的当前工作目录，例如：

```lua
target("test", function()
    add_tests("testname", {rundir = os.projectdir()})
end)
```

如果我们没有配置 rundir 到 `add_tests`，那么我们也会尝试从被绑定的 target 中，获取 `set_rundir` 设置的运行目录。

```lua
target("test", function()
    add_tests("testname")
    set_rundir("$(projectdir)")
end)
```

#### 配置运行环境

我们也可以通过 runenvs 设置一些运行时候的环境变量，例如：

```lua
target("test", function()
    add_tests("testname", {runenvs = {LD_LIBRARY_PATH = "/lib"}})
end)
```

如果我们没有配置 runenvs 到 `add_tests`，那么我们也会尝试从被绑定的 target 中，获取 `add_runenvs` 设置的运行环境。

```lua
target("test", function()
    add_tests("testname")
    add_runenvs("LD_LIBRARY_PATH", "/lib")
end)
```

#### 匹配输出结果

默认情况下，`xmake test` 会根据测试运行的退出代码是否为 0，来判断是否测试通过。

当然，我们也可以通过配置测试运行的输出结果是否满足我们的指定的匹配模式，来判断是否测试通过。

主要通过这两个参数控制：

| 参数         | 说明                     |
| ------------ | ------------------------ |
| pass_outputs | 如果输出匹配，则测试通过 |
| fail_outputs | 如果输出匹配，则测试失败 |

传入 `pass_outputs` 和 `fail_outputs` 的是一个 lua 匹配模式的列表，但模式稍微做了一些简化，比如对 `*` 的处理。

如果要匹配成功，则测试通过，可以这么配置：

```lua
target("test", function()
    add_tests("testname1", {pass_outputs = "hello"})
    add_tests("testname2", {pass_outputs = "hello *"})
    add_tests("testname3", {pass_outputs = {"hello", "hello *"}})
end)
```

如果要匹配成功，则测试失败，可以这么配置：

```lua
target("test", function()
    add_tests("testname1", {fail_outputs = "hello"})
    add_tests("testname2", {fail_outputs = "hello *"})
    add_tests("testname3", {fail_outputs = {"hello", "hello *"}})
end)
```

我们也可以同时配置它们：

```lua
target("test", function()
    add_tests("testname", {pass_outputs = "foo", fail_outputs = "hello"})
end)
```

由于一些测试输出的结果，尾部会有一些换行什么的空白字符，干扰匹配模式，我们可以再配置 `trim_output = true`，先截断空白字符后，再做匹配。

```lua
target("test", function()
    add_tests("testname", {trim_output = true, pass_outputs = "foo", fail_outputs = "hello"})
end)
```

我们还可以配置 `{plain = true}` 是禁用 lua 模式匹配，仅仅做最基础的平坦文本匹配。

```lua
target("test", function()
    add_tests("testname", {plain = true, pass_outputs = "foo", fail_outputs = "hello"})
end)
```

#### 配置测试组

我们也可以通过 `group = "foo"` 来配置一个测试组，进行分组测试：

```lua
target("test", function()
    add_tests("testname1", {group = "foo"})
    add_tests("testname2", {group = "foo"})
    add_tests("testname3", {group = "bar"})
    add_tests("testname4", {group = "bae"})
end)
```

其中 testname1/testname2 是一个组 foo，另外两个是在另外一个组。

然后，我们就可以使用 `xmake test -g groupname` 来进行分组测试了。

```bash
$ xmake test -g "foo"
$ xmake test -g "foo*"
```

> 运行分组，也是支持模式匹配的。

另外，如果没有设置 `group` 参数给 `add_tests`，我们也可以默认获取绑定到 target 的组名。

```lua
target("test", function()
    add_tests("testname")
    set_group("foo")
end)
```

#### 自定义测试脚本

我们还新增了 `before_test`, `on_test` 和 `after_test` 配置脚本，用户可以在 rule 和 target 域，自定义配置它们实现定制化的测试执行。

```lua
target("test", function())
     on_test(function (target, opt)
        print(opt.name, opt.runenvs, opt.runargs, opt.pass_outputs)

        -- do test
        -- ...

        -- passed
        return true

        -- failied
        return false, errors
     end)
end)
```

其中，opt 里面可以获取到所有传入 `add_tests` 的参数，我们在 on_test 里面自定义测试逻辑，然后返回 true 就是测试通过，返回 false 就是测试失败，然后继续返回测试失败的错误信息。

#### 自动化构建

由于测试目标在正常开发构建阶段，通常是不需要被构建的，因此我们会设置 `set_default(false)`。

```lua
target("test", function()
    add_tests("testname")
    set_default(false)
end)
```

但是运行 `xmake test` 进行测试时候，这些测试对应的 target 还是会被自动构建，确保能够被运行。

```bash
$ xmake test
[25%]: cache compiling.release src/main.cpp
[50%]: linking.release test
running tests ...
[100%]: test/testname .................................... passed 6.000s

100% tests passed, 0 tests failed out of 1, spent 0.006s
```

#### 首次测试失败就终止

默认情况下，`xmake test` 会等到所有测试都运行完，不管里面有多少是没通过的。

而有时候，我们想在第一个测试没通过，就直接中断测试，那么我们可以通过下面的配置启用：

```lua
set_policy("test.stop_on_first_failure", true)
```

#### 测试失败返回 0

默认情况下，只要有一个测试没通过，等到 `xmake test` 运行完成，它都会返回非 0 退出代码，这对于一些 CI 环境非常有用，可以中断 CI 的其他脚本继续运行。

然后触发信号告诉 CI，我们需要生成测试报告和告警了。

然后，如果我们想要压制这种行为，可以强制将 `xmake test` 的退出代码总是设置成 0。

```lua
set_policy("test.return_zero_on_failure", true)
```

#### 仅仅测试编译

有时候，我们仅仅想要测试代码是否通过编译，或者没有通过编译，不需要运行它们，那么可以通过配置 `build_should_pass` 和 `build_should_fail` 来实现。

```lua
target("test_10", function()
    set_kind("binary")
    set_default(false)
    add_files("src/compile.cpp")
    add_tests("compile_fail", {build_should_fail = true})
end)

target("test_11", function()
    set_kind("binary")
    set_default(false)
    add_files("src/compile.cpp")
    add_tests("compile_pass", {build_should_pass = true})
end)
```

这通常用于一些测试代码中带有 `static_assert` 的场景，例如：

```c++
template <typename T>
bool foo(T val) {
  if constexpr (std::is_same_v<T, int>) {
    printf("int!\n");
  } else if constexpr (std::is_same_v<T, float>) {
    printf("float!\n");
  } else {
    static_assert(false, "unsupported type");
  }
}

int main(int, char**) {
  foo("BAD");
  return 0;
}
```

#### 配置额外的代码编译

我们还可以在配置测试用例的时候，对每个测试配置额外需要编译的代码，以及一些宏定义，实现内联测试。

xmake 会为每个测试单独编译一个独立的可执行程序去运行它，但这并不会影响到 target 在生产环境的编译结果。

```lua
target("test_13", function()
    set_kind("binary")
    set_default(false)
    add_files("src/test_1.cpp")
    add_tests("stub_1", {files = "tests/stub_1.cpp", defines = "STUB_1"})
end)

target("test_14", function()
    set_kind("binary")
    set_default(false)
    add_files("src/test_2.cpp")
    add_tests("stub_2", {files = "tests/stub_2.cpp", defines = "STUB_2"})
end)

target("test_15", function()
    set_kind("binary")
    set_default(false)
    add_files("src/test_1.cpp")
    add_tests("stub_n", {files = "tests/stub_n*.cpp", defines = "STUB_N"})
end)
```

以 doctest 为例，我们可以在不修改任何 main.cpp 的情况下，外置单元测试：

```lua
add_rules("mode.debug", "mode.release")

add_requires("doctest")

target("doctest")
    set_kind("binary")
    add_files("src/*.cpp")
    for _, testfile in ipairs(os.files("tests/*.cpp")) do
        add_tests(path.basename(testfile), {
            files = testfile,
            remove_files = "src/main.cpp",
            languages = "c++11",
            packages = "doctest",
            defines = "DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN"})
    end
```

定义 DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN 会引入额外的 main 入口函数，因此我们需要配置 remove_files 去移除已有的 main.cpp 文件。

运行效果如下：

```bash
ruki-2:doctest ruki$ xmake test
running tests ...
[50%]: doctest/test_1 .................................... failed 0.009s
[100%]: doctest/test_2 .................................... passed 0.009s

50% tests passed, 1 tests failed out of 2, spent 0.019s
ruki-2:doctest ruki$ xmake test -v
running tests ...
[50%]: doctest/test_1 .................................... failed 0.026s
[doctest] doctest version is "2.4.11"
[doctest] run with "--help" for options
===============================================================================
tests/test_1.cpp:7:
TEST CASE:  testing the factorial function

tests/test_1.cpp:8: ERROR: CHECK(factorial(1) == 10 ) is NOT correct!
  values: CHECK(1 == 10)

===============================================================================
[doctest] test cases: 1 | 0 passed | 1 failed | 0 skipped
[doctest] assertions: 4 | 3 passed | 1 failed |
[doctest] Status: FAILURE!

run failed, exit code: 1
[100%]: doctest/test_2 .................................... passed 0.010s

50% tests passed, 1 tests failed out of 2, spent 0.038s
```

#### 测试动态库

通常，`add_tests` 仅用于对可执行程序进行运行测试，运行动态库需要有一个额外的 main 主入口，因此我们需要额外配置一个可执行程序去加载它，例如：

```lua

target("doctest_shared")
    set_kind("shared")
    add_files("src/foo.cpp")
    for _, testfile in ipairs(os.files("tests/*.cpp")) do
        add_tests(path.basename(testfile), {
            kind = "binary",
            files = testfile,
            languages = "c++11",
            packages = "doctest",
            defines = "DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN"})
    end
```

通过 `kind = "binary"` 可以将每个单元测试改为 binary 可执行程序，并通过 DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN 引入 main 入口函数。

这样就能实现动态库目标中外置可运行的单元测试。

#### 配置运行超时

如果一些测试程序长时间运行不退出，就会卡住，我们可以通过配置超时时间，强制退出，并返回失败。

```lua
target("test_timeout")
    set_kind("binary")
    set_default(false)
    add_files("src/run_timeout.cpp")
    add_tests("run_timeout", {run_timeout = 1000})
```

```bash
$ xmake test
[100%]: test_timeout/run_timeout .................................... failed 1.006s
run failed, exit code: -1, exit error: wait process timeout
```
