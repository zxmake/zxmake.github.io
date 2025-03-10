# rule

xmake 不仅原生支持多语言文件的构建，还允许用户通过自定义构建规则实现复杂的未知文件构建。

自定义构建规则可以使用 `set_extensions` 将一组文件扩展名关联到它们。

一旦这些扩展与规则相关联，稍后对 `add_files` 的调用将自动使用此自定义规则。

这是一个示例规则，它将使用 Pandoc 将添加到构建目标的 Markdown 文件转换为 HTML 文件：

```lua
-- define a build rule for a markdown file
rule("markdown", function()
    set_extensions(".md", ".markdown")
    on_build_file(function (target, sourcefile, opt)
        import("core.project.depend")
        import("utils.progress") -- it only for v2.5.9, we need use print to show progress below v2.5.8

        -- make sure build directory exists
        os.mkdir(target:targetdir())

        -- replace .md with .html
        local targetfile = path.join(target:targetdir(), path.basename(sourcefile) .. ".html")

        -- only rebuild the file if its changed since last run
        depend.on_changed(function ()
            -- call pandoc to make a standalone html file from a markdown file
            os.vrunv('pandoc', {"-s", "-f", "markdown", "-t", "html", "-o", targetfile, sourcefile})
            progress.show(opt.progress, "${color.build.object}markdown %s", sourcefile)
        end, {files = sourcefile})
    end)
end)

target("test", function()
    set_kind("object")

    -- make the test target support the construction rules of the markdown file
    add_rules("markdown")

    -- adding a markdown file to build
    add_files("src/*.md")
    add_files("src/*.markdown")
end)
```

还有一种以 `on_build_files` 形式代替 `on_build_file` 的方法，它允许您在一个函数调用中处理整个文件集。

第二种称为 `on_buildcmd_file` 和 `on_buildcmd_files` 的形式是声明性的；它不是运行任意 Lua 来构建目标，而是运行 Lua 来了解这些目标是如何构建的。

> `buildcmd` 的优点是可以将这些规则导出到根本不需要 xmake 即可运行的 makefile。

我们可以使用 buildcmd 进一步简化它，如下所示：

```lua
-- define a build rule for a markdown file
rule("markdown", function()
    set_extensions(".md", ".markdown")
    on_buildcmd_file(function (target, batchcmds, sourcefile, opt)

        -- make sure build directory exists
        batchcmds:mkdir(target:targetdir())

        -- replace .md with .html
        local targetfile = path.join(target:targetdir(), path.basename(sourcefile) .. ".html")

        -- call pandoc to make a standalone html file from a markdown file
        batchcmds:vrunv('pandoc', {"-s", "-f", "markdown", "-t", "html", "-o", targetfile, sourcefile})
        batchcmds:show_progress(opt.progress, "${color.build.object}markdown %s", sourcefile)

        -- only rebuild the file if its changed since last run
        batchcmds:add_depfiles(sourcefile)
    end)
end)

target("test", function()
    set_kind("object")

    -- make the test target support the construction rules of the markdown file
    add_rules("markdown")

    -- adding a markdown file to build
    add_files("src/*.md")
    add_files("src/*.markdown")
end)
```

无论文件扩展名如何，文件都可以分配给特定规则。您可以通过在添加文件时设置 `rule` 自定义属性来完成此操作，如下例所示：

```lua
target("test", function()
    -- ...
    add_files("src/test/*.md.in", {rule = "markdown"})
end)
```

一个 target 可以叠加应用多个 rules 去更加定制化实现自己的构建行为，甚至支持不同的构建环境。

> 通过 `add_files("*.md", {rule = "markdown"})` 方式指定的规则，优先级高于 `add_rules("markdown")` 设置的规则。
