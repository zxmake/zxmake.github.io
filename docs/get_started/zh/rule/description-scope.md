# 描述域

## rule

定义规则：

```lua
rule("markdown", function()
    set_extensions(".md", ".markdown")
    on_build_file(function (target, sourcefile, opt)
        os.cp(sourcefile, path.join(target:targetdir(), path.basename(sourcefile) .. ".html"))
    end)
end)
```

## rule:add_deps

关联依赖可以绑定一批规则，也就是不必对 target 挨个去使用 `add_rules()` 添加规则，只需要应用一个规则，就能生效它和它的所有依赖规则。

例如：

```lua
rule("foo", function()
    add_deps("bar")
end)

rule("bar", function()
   ...
end)
```

我们只需要 `add_rules("foo")`，就能同时应用 foo 和 bar 两个规则。

但是，默认情况下，依赖之间是不存在执行的先后顺序的，foo 和 bar 的 `on_build_file` 等脚本是并行执行的，顺序未定义。

如果要严格控制执行顺序，可以配置 `add_deps("bar", {order = true})`，告诉 xmake，我们需要根据依赖顺序来执行同级别的脚本。

例如：

```lua
rule("foo", function()
    add_deps("bar", {order = true})
    on_build_file(function (target, sourcefile)
    end)
end)

rule("bar", function()
    on_build_file(function (target, sourcefile)
    end)
end)
```

bar 的 `on_build_file` 将会被先执行。

不过，这种控制依赖的方式，只适合 foo 和 bar 两个规则都是自定义规则，如果想要将自己的规则插入到 xmake 的内置规则之前执行，这就不适用了。

这个时候，我们需要使用更加灵活的动态规则创建和注入的方式，去修改内置规则。

例如，我们想在内置的 `c++.build` 规则之前，执行自定义 cppfront 规则的 `on_build_file` 脚本，我们可以通过下面的方式来实现。

```lua
rule("cppfront", function()
    set_extensions(".cpp2")
    on_load(function (target)
        local rule = target:rule("c++.build"):clone()
        rule:add("deps", "cppfront", {order = true})
        target:rule_add(rule)
    end)
    on_build_file(function (target, sourcefile, opt)
        print("build cppfront file")
    end)
end)

target("test", function()
    set_kind("binary")
    add_rules("cppfront")
    add_files("src/*.cpp")
    add_files("src/*.cpp2")
end)
```

## rule:add_imports

为所有自定义脚本预先导入扩展模块。

使用方式和说明请见：[target:add_imports](#targetadd_imports)，用法相同。

## rule:set_extensions

设置规则支持的文件扩展类型。

通过设置支持的扩展文件类型，将规则应用于带这些后缀的文件上，例如：

```lua
-- 定义一个 markdown 文件的构建规则
rule("markdown", function()
    set_extensions(".md", ".markdown")
    on_build_file(function (target, sourcefile, opt)
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

## rule:on_load

自定义加载脚本。

用于实现自定规则的加载脚本，当加载 target 的时候，会被执行，可在里面自定义设置一些 target 配置，例如：

```lua
rule("test", function()
    on_load(function (target)
        target:add("defines", "TEST")
    end)
end)
```

## rule:on_link

自定义链接脚本。

用于实现自定规则的链接脚本，会覆盖被应用的 target 的默认链接行为，例如：

```lua
rule("test", function()
    on_link(function (target)
    end)
end)
```

## rule:on_config

自定义配置脚本。

在 `xmake config` 执行完成后，Build 之前会执行此脚本，通常用于编译前的配置工作。它与 on_load 不同的是，on_load 只要 target 被加载就会执行，执行时机更早。

如果一些配置，无法在 on_load 中过早配置，那么都可以在 on_config 中去配置它。

另外，它的执行时机比 before_build 还要早，大概的执行流程如下：

```
on_load -> after_load -> on_config -> before_build -> on_build -> after_build
```

## rule:on_build

自定义编译脚本。

用于实现自定规则的构建脚本，会覆盖被应用的 target 的默认构建行为，例如：

```lua
rule("markdown", function()
    on_build(function (target)
    end)
end)
```

## rule:on_clean

自定义清理脚本。

用于实现自定规则的清理脚本会，覆盖被应用的 target 的默认清理行为，例如：

```lua
rule("markdown", function()
    on_clean(function (target)
        -- remove sourcefile.html
    end)
end)
```

## rule:on_package

自定义打包脚本。

用于实现自定规则的打包脚本，覆盖被应用的 target 的默认打包行为, 例如：

```lua
rule("markdown", function()
    on_package(function (target)
        -- package sourcefile.html
    end)
end)
```

## rule:on_install

自定义安装脚本。

用于实现自定规则的安装脚本，覆盖被应用的 target 的默认安装行为, 例如：

```lua
rule("markdown", function()
    on_install(function (target)
    end)
end)
```

## rule:on_uninstall

自定义卸载脚本。

用于实现自定规则的卸载脚本，覆盖被应用的 target 的默认卸载行为, 例如：

```lua
rule("markdown", function()
    on_uninstall(function (target)
    end)
end)
```

## rule:on_build_file

自定义编译脚本，一次处理一个源文件。

```lua
rule("markdown", function()
    on_build_file(function (target, sourcefile, opt)
        print("%%%d: %s", opt.progress, sourcefile)
    end)
end)
```

其中第三个参数 opt 是可选参数，用于获取一些编译过程中的信息状态，例如：opt.progress 为当期的编译进度。

## rule:on_buildcmd_file

自定义批处理编译脚本，一次处理一个源文件。

这个接口里面的脚本不会直接构建源文件，但是会通过 batchcmds 对象，构造一个批处理命令行任务，

xmake 在实际执行构建的时候，一次性执行这些命令。

这对于 `xmake project` 此类工程生成器插件非常有用，因为生成器生成的第三方工程文件并不支持 `on_build_files` 此类内置脚本的执行支持。

但是 `on_buildcmd_files` 构造的最终结果，就是一批原始的 cmd 命令行，可以直接给其他工程文件作为 custom commands 来执行。

另外，相比 `on_build_files`，它也简化对扩展文件的编译实现，更加的可读易配置，对用户也更加友好。

```lua
rule("foo", function()
    set_extensions(".xxx")
    on_buildcmd_file(function (target, batchcmds, sourcefile, opt)
        batchcmds:vrunv("gcc", {"-o", objectfile, "-c", sourcefile})
        batchcmds:add_depfiles("/xxxxx/dependfile.h",  ...)
        -- batchcmds:add_depvalues(...)
        -- batchcmds:set_depmtime(os.mtime(...))
        -- batchcmds:set_depcache("xxxx.d")
    end)
end)
```

除了 `batchcmds:vrunv`，我们还支持一些其他的批处理命令，例如：

```lua
batchcmds:show("hello %s", "xmake")
batchcmds:vrunv("gcc", {"-o", objectfile, "-c", sourcefile}, {envs = {LD_LIBRARY_PATH="/xxx"}})
batchcmds:mkdir("/xxx") -- and cp, mv, rm, ln ..
batchcmds:compile(sourcefile_cx, objectfile, {configs = {includedirs = sourcefile_dir, languages = (sourcekind == "cxx" and "c++11")}})
batchcmds:link(objectfiles, targetfile, {configs = {linkdirs = ""}})
```

同时，我们在里面也简化对依赖执行的配置，下面是一个完整例子：

```lua
rule("lex", function()
    set_extensions(".l", ".ll")
    on_buildcmd_file(function (target, batchcmds, sourcefile_lex, opt)

        -- imports
        import("lib.detect.find_tool")

        -- get lex
        local lex = assert(find_tool("flex") or find_tool("lex"), "lex not found!")

        -- get c/c++ source file for lex
        local extension = path.extension(sourcefile_lex)
        local sourcefile_cx = path.join(target:autogendir(), "rules", "lex_yacc", path.basename(sourcefile_lex) .. (extension == ".ll" and ".cpp" or ".c"))

        -- add objectfile
        local objectfile = target:objectfile(sourcefile_cx)
        table.insert(target:objectfiles(), objectfile)

        -- add commands
        batchcmds:show_progress(opt.progress, "${color.build.object}compiling.lex %s", sourcefile_lex)
        batchcmds:mkdir(path.directory(sourcefile_cx))
        batchcmds:vrunv(lex.program, {"-o", sourcefile_cx, sourcefile_lex})
        batchcmds:compile(sourcefile_cx, objectfile)

        -- add deps
        batchcmds:add_depfiles(sourcefile_lex)
        local dependfile = target:dependfile(objectfile)
        batchcmds:set_depmtime(os.mtime(dependfile))
        batchcmds:set_depcache(dependfile)
    end)
end)
```

`add_depfiles` 设置这个目标文件依赖的源文件。`set_depmtime` 设置目标文件的修改时间，如果有任意源文件的修改时间大于它，则认为需要重新生成这个目标文件。这里使用 dependfile 而不是 objectfile 的原因见 [issues 748](https://github.com/xmake-io/xmake/issues/748)。`set_depcache` 设置存储依赖信息的文件。

关于这个的详细说明和背景，见：[issue 1246](https://github.com/xmake-io/xmake/issues/1246)

## rule:on_build_files

自定义编译脚本，一次处理多个源文件。

大部分的自定义构建规则，每次都是处理单独一个文件，输出一个目标文件，例如：a.c => a.o

但是，有些情况下，我们需要同时输入多个源文件一起构建生成一个目标文件，例如：a.c b.c d.c => x.o

对于这种情况，我们可以通过自定义这个脚本来实现：

```lua
rule("markdown", function()
    on_build_files(function (target, sourcebatch, opt)
        -- build some source files
        for _, sourcefile in ipairs(sourcebatch.sourcefiles) do
            -- ...
        end
    end)
end)
```

## rule:on_buildcmd_files

自定义批处理编译脚本，一次处理多个源文件。

关于这个的详细说明，见：[rule:on_buildcmd_file](#ruleon_buildcmd_file)

```lua
rule("foo", function()
    set_extensions(".xxx")
    on_buildcmd_files(function (target, batchcmds, sourcebatch, opt)
        for _, sourcefile in ipairs(sourcebatch.sourcefiles) do
            batchcmds:vrunv("gcc", {"-o", objectfile, "-c", sourcefile})
        end
    end)
end)
```

## rule:before_config

自定义配置前脚本。

用于实现自定义 target 配置前的执行脚本，例如：

```lua
rule("test", function()
    before_config(function (target)
    end)
end)
```

它会在 on_config 之前被执行。

## rule:before_link

自定义链接前脚本。

用于实现自定义 target 链接前的执行脚本，例如：

```lua
rule("test", function()
    before_link(function (target)
    end)
end)
```

## rule:before_build

自定义编译前脚本。

用于实现自定义 target 构建前的执行脚本，例如：

```lua
rule("markdown", function()
    before_build(function (target)
    end)
end)
```

## rule:before_clean

自定义清理前脚本。

用于实现自定义 target 清理前的执行脚本，例如：

```lua
rule("markdown", function()
    before_clean(function (target)
    end)
end)
```

## rule:before_package

自定义打包前脚本。

用于实现自定义 target 打包前的执行脚本, 例如：

```lua
rule("markdown", function()
    before_package(function (target)
    end)
end)
```

## rule:before_install

自定义安装前脚本。

用于实现自定义 target 安装前的执行脚本，例如：

```lua
rule("markdown", function()
    before_install(function (target)
    end)
end)
```

## rule:before_uninstall

自定义卸载前脚本。

用于实现自定义 target 卸载前的执行脚本，例如：

```lua
rule("markdown", function()
    before_uninstall(function (target)
    end)
end)
```

## rule:before_build_file

自定义编译前脚本，一次处理一个源文件。

跟 [rule:on_build_file](#ruleon_build_file) 用法类似，不过这个接口被调用的时机是在编译某个源文件之前，
一般用于对某些源文件进行编译前的预处理。

## rule:before_buildcmd_file

自定义编译前批处理脚本，一次处理一个源文件。

跟 [rule:on_buildcmd_file](#ruleon_buildcmd_file) 用法类似，不过这个接口被调用的时机是在编译某个源文件之前，
一般用于对某些源文件进行编译前的预处理。

## rule:before_build_files

自定义编译前脚本，一次处理多个源文件。

跟 [rule:on_build_files](#ruleon_build_files) 用法类似，不过这个接口被调用的时机是在编译某些源文件之前，
一般用于对某些源文件进行编译前的预处理。

## rule:before_buildcmd_files

自定义编译前批处理脚本，一次处理多个源文件。

跟 [rule:on_buildcmd_files](#ruleon_buildcmd_files) 用法类似，不过这个接口被调用的时机是在编译某些源文件之前，
一般用于对某些源文件进行编译前的预处理。

## rule:after_config

自定义配置后脚本。

用于实现自定义 target 配置后的执行脚本，例如：

```lua
rule("test", function()
    after_config(function (target)
    end)
end)
```

它会在 on_config 之后被执行。

## rule:after_link

自定义链接后脚本。

用于实现自定义 target 链接后的执行脚本，用法跟 [rule:before_link](#rulebefore_link) 类似。

## rule:after_build

自定义编译后脚本。

用于实现自定义 target 构建后的执行脚本，用法跟 [rule:before_build](#rulebefore_build) 类似。

## rule:after_clean

自定义清理后脚本。

用于实现自定义 target 清理后的执行脚本，用法跟 [rule:before_clean](#rulebefore_clean) 类似。

## rule:after_package

自定义打包后脚本。

用于实现自定义 target 打包后的执行脚本, 用法跟 [rule:before_package](#rulebefore_package) 类似。

## rule:after_install

自定义安装后脚本。

用于实现自定义 target 安装后的执行脚本，用法跟 [rule:before_install](#rulebefore_install) 类似。

## rule:after_uninstall

自定义卸载后脚本。

用于实现自定义 target 卸载后的执行脚本，用法跟 [rule:before_uninstall](#rulebefore_uninstall) 类似。

## rule:after_build_file

自定义编译后脚本，一次处理一个源文件。

跟 [rule:on_build_file](#ruleon_build_file) 用法类似，不过这个接口被调用的时机是在编译某个源文件之后，
一般用于对某些编译后对象文件进行后期处理。

## rule:after_buildcmd_file

自定义编译后批处理脚本，一次处理一个源文件。

跟 [rule:on_buildcmd_file](#ruleon_buildcmd_file) 用法类似，不过这个接口被调用的时机是在编译某个源文件之后，
一般用于对某些编译后对象文件进行后期处理。

## rule:after_build_files

自定义编译后脚本，一次处理多个源文件。

跟 [rule:on_build_files](#ruleon_build_files) 用法类似，不过这个接口被调用的时机是在编译某些源文件之后，
一般用于对某些编译后对象文件进行后期处理。

## rule:after_buildcmd_files

自定义编译后批处理脚本，一次处理多个源文件。

跟 [rule:on_buildcmd_files](#ruleon_buildcmd_files) 用法类似，不过这个接口被调用的时机是在编译某些源文件之后，
一般用于对某些编译后对象文件进行后期处理。
