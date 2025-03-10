---
class: heading_no_counter
---

# 语法描述

xmake 的工程描述文件 xmake.lua 虽然基于 lua 语法，但是为了使得更加方便简洁得编写项目构建逻辑，xmake 对其进行了一层封装，使得编写 xmake.lua 不会像写 makefile 那样繁琐

基本上写个简单的工程构建描述，只需四行就能搞定，例如：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
end)
```

## 域配置语法

我们默认约定的域配置语法，尽管非常简洁，但是对自动格式化缩进和 IDE 不是很友好。

```lua
target("foo")
    set_kind("binary")
    add_files("src/*.cpp")
target_end()
```

另外，它不能自动结束当前 target 作用域，用户需要显式调用 `target_end()`。

虽然，上面我们提到，可以使用 `do end` 模式来解决自动缩进问题，但是需要 `target_end()` 的问题还是存在。

```lua
target("bar") do
    set_kind("binary")
    add_files("src/*.cpp")
end
target_end()
```

我们提供了一种更好的可选域配置语法，来解决自动缩进，target 域隔离问题，例如：

```lua
add_defines("ROOT")

target("foo", function ()
    set_kind("binary")
    add_files("src/*.cpp")
    add_defines("FOO")
end)

target("bar", function ()
    set_kind("binary")
    add_files("src/*.cpp")
    add_defines("BAR")
end)
```

foo 和 bar 两个域是完全隔离的，我们即使在它们中间配置其他设置，也不会影响它们，另外，它还对 LSP 非常友好。

> 因此我们约定，xmake.lua 的域配置语法，默认采用可选的 `function () end` 模式，其他模式后续可能会被移除。

## 配置分离

xmake.lua 采用二八原则实现了描述域、脚本域两层分离式配置。

什么是二八原则呢，简单来说，大部分项目的配置，80% 的情况下，都是些基础的常规配置，比如：`add_cxflags`, `add_links`等，
只有剩下不到 20% 的地方才需要额外做些复杂来满足一些特殊的配置需求。

而这剩余的 20% 的配置通常比较复杂，如果直接充斥在整个 xmake.lua 里面，会把整个项目的配置整个很混乱，非常不可读。

因此，xmake 通过描述域、脚本域两种不同的配置方式，来隔离 80% 的简单配置以及 20% 的复杂配置，使得整个 xmake.lua 看起来非常的清晰直观，可读性和可维护性都达到最佳。

### 描述域

对于刚入门的新手用户，或者仅仅是维护一些简单的小项目，通过完全在描述配置就已经完全满足需求了，那什么是描述域呢？它长这样：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    add_defines("DEBUG")
    add_syslinks("pthread")
end)
```

一眼望去，其实就是个 `set_xxx`/`add_xxx` 的配置集，对于新手，完全可以不把它当做 lua 脚本，仅仅作为普通的，但有一些基础规则的配置文件就行了。

如果因为，看着有括号，还是像脚本语言的函数调用，那我们也可以这么写（是否带括号看个人喜好）：

```lua
target "test"
    set_kind "binary"
    add_files "src/*.c"
    add_defines "DEBUG"
    add_syslinks "pthread"
```

这是不是看着更像配置文件了？其实描述域就是配置文件，类似像 json 等 key/values 的配置而已，所以即使完全不会 lua 的新手，也是能很快上手的。

而且，对于通常的项目，仅通过 `set_xxx/add_xxx` 去配置各种项目设置，已经完全满足需求了。

这也就是开头说的：80% 的情况下，可以用最简单的配置规则去简化项目的配置，提高可读性和可维护性，这样对用户和开发者都会非常的友好，也更加直观。

如果我们要针对不同平台，架构做一些条件判断怎么办？没关系，描述域除了基础配置，也是支持条件判断，以及 for 循环的：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    add_defines("DEBUG")
    if is_plat("linux", "macosx") then
        add_links("pthread", "m", "dl")
    end
end)
```

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    add_defines("DEBUG")
    for _, name in ipairs({"pthread", "m", "dl"}) do
        add_links(name)
    end
end)
```

这是不是看着有点像 lua 了？虽说，平常可以把它当做普通配置问题，但是 xmake 毕竟基于 lua，所以描述域还是支持 lua 的基础语言特性的。

> 不过需要注意的是，描述域虽然支持 lua 的脚本语法，但在描述域尽量不要写太复杂的 lua 脚本，比如一些耗时的函数调用和 for 循环

并且在描述域，主要目的是为了设置配置项，因此 xmake 并没有完全开放所有的模块接口，很多接口在描述域是被禁止调用的，
即使开放出来的一些可调用接口，也是完全只读的，不耗时的安全接口，比如：`os.getenv()` 等读取一些常规的系统信息，用于配置逻辑的控制。

> 另外需要注意一点，xmake.lua 是会被多次解析的，用于在不同阶段解析不同的配置域：比如：`option()`, `target()` 等域。

因此，不要想着在 xmake.lua 的描述域，写复杂的 lua 脚本，也**不要在描述域调用 print 去显示信息，因为会被执行多遍**。

### 脚本域

限制描述域写复杂的 lua，各种 lua 模块和接口都用不了？怎么办？这个时候就是脚本域出场的时候了。

如果用户已经完全熟悉了 xmake 的描述域配置，并且感觉有些满足不了项目上的一些特殊配置维护了，那么我们可以在脚本域做更加复杂的配置逻辑：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    on_load(function (target)
        if is_plat("linux", "macosx") then
            target:add("links", "pthread", "m", "dl")
        end
    end)
    after_build(function (target)
        import("core.project.config")
        local targetfile = target:targetfile()
        os.cp(targetfile, path.join(config.buildir(), path.filename(targetfile)))
        print("build %s", targetfile)
    end)
end)
```

只要是类似：`on_xxx`, `after_xxx`, `before_xxx` 等字样的 function body 内部的脚本，都属于脚本域。

在脚本域中，用户可以干任何事，xmake 提供了 import 接口可以导入 xmake 内置的各种 lua 模块，也可以导入用户提供的 lua 脚本。

我们可以在脚本域实现你想实现的任意功能，甚至写个独立项目出来都是可以的。

对于一些脚本片段，不是很臃肿的话，像上面这么内置写写就足够了，如果需要实现更加复杂的脚本，不想充斥在一个 xmake.lua 里面，可以把脚本分离到独立的 lua 文件中去维护。

例如：

```lua
target("test", function()
    set_kind("binary")
    add_files("src/*.c")
    on_load("modules.test.load")
    on_install("modules.test.install")
end)
```

我们可以把自定义的脚本放置到 xmake.lua 对应目录下，`modules/test/load.lua` 和 `modules/test/install.lua` 中独立维护。

这些独立的 lua 脚本里面，我们还可以通过[import](/zh-cn/manual/builtin_modules?id=import)导入各种内置模块和自定义模块进来使用，就跟平常写lua, java 没啥区别。

而对于脚本的域的不同阶段，`on_load` 主要用于 target 加载时候，做一些动态化的配置（注意这里不像描述域，只会执行一遍）。

其他阶段，还有很多，比如：`on/after/before`_`build/install/package/run` 等，具体看下后面的 target api 手册部分吧，这里就不细说了。

## 配置类型

在描述域配置中，分配置域和配置项，配置域里面可以通过 `set_xxx`/`add_xxx` 的接口，配置各种配置项。

```lua
target("test1", function()
    set_kind("binary")
    add_files("src/*.c")
end)

target("test2", function()
    set_kind("binary")
    add_files("src/*.c")
end)
```

像上述配置中，target 就属于配置域，它下面的所有 `set_xx`/`add_xxx` 接口配置都属于配置项，对这个 target 局部生效。

我们可以把它理解成局部作用域，类似 c 里面的 block 块：

```
target("test1")
{
    set_kind("binary")
    add_files("src/*.c")
}
target("test2")
{
    set_kind("binary")
    add_files("src/*.c")
}
```

不过，为了简化写法，xmake 约定每个新定义的 target 域开始，上一个配置域就自动结束了，当然，如果这样用户觉得有困扰，也可以手动配置离开域：

```lua
target("test1")
    set_kind("binary")
    add_files("src/*.c")
target_end()

target("test2")
    set_kind("binary")
    add_files("src/*.c")
target_end()
```

### 配置域

目前提供的配置域有：`target()`, `option()`, `task()`, `package()`

每个域的详细说明，见：[API手册](/zh-cn/manual/project_target)

### 配置项

只要是带有 `set_xxx` 和 `add_xxx` 字样的配置，都属于配置项，一个配置域里面可以设置多个配置项。

关于配置项的规范说明，见：[接口规范](/zh-cn/manual/specification)

## 作用域

xmake 的描述语法是按作用域划分的，主要分为：

- 外部作用域
- 内部作用域
- 接口作用域

那哪些属于外部，哪些又属于内部呢，看看下面的注释，就知道个大概了：

```lua
-- 外部作用域
target("test", function()

    -- 外部作用域
    set_kind("binary")
    add_files("src/*.c")

    on_run(function ()
        -- 内部作用域
        end)

    after_package(function ()
        -- 内部作用域
        end)
end)

-- 外部作用域
task("hello", function()

    -- 外部作用域
    on_run(function ()
        -- 内部作用域
        end)
end)
```

简单的说，就是在自定义脚本 `function () end` 之内的都属于内部作用域，也就是脚本作用域，其他地方都是都属于于外部作用域。。

### 外部作用域

对于大部分工程来说，并不需要很复杂的工程描述，也不需要自定义脚本支持，只需要简单的 `set_xxx` 或者 `add_xxx` 就能满足需求了

那么根据二八定律，80% 的情况下，我们只需要这么写：

```lua
target("test", function()
    set_kind("static")
    add_files("src/test/*.c")
end)

target("demo", function()
    add_deps("test")
    set_kind("binary")
    add_links("test")
    add_files("src/demo/*.c")
end)
```

不需要复杂的 api 调用，也不需要各种繁琐的变量定义，以及 if 判断 和 for 循环，要的就是简洁可读，一眼看过去，就算不懂 lua 语法也没关系

就当做简单的描述语法，看上去有点像函数调用而已，会点编程的基本一看就知道怎么配置。

为了做到简洁、安全，在这个作用域内，很多 lua 内置 api 是不开放出来的，尤其是跟写文件、修改操作环境相关的，仅仅提供一些基本的只读接口，和逻辑操作

目前外部作用域开放的 lua 内置 api 有：

- table
- string
- pairs
- ipairs
- print
- os

当然虽然内置 lua api 提供不多，但 xmake 还提供了很多扩展 api，像描述 api 就不多说，详细可参考：[API手册](/zh-cn/manual/builtin_modules)

还有些辅助 api，例如：

- dirs：扫描获取当前指定路径中的所有目录
- files：扫描获取当前指定路径中的所有文件
- format: 格式化字符串，string.format 的简写版本

还有变量定义、逻辑操作也是可以使用的，毕竟是基于 lua 的，该有的基础语法，还是要有的，我们可以通过 if 来切换编译文件：

```lua
target("test", function()
    set_kind("static")
    if is_plat("iphoneos") then
        add_files("src/test/ios/*.c")
    else
        add_files("src/test/*.c")
    end
end)
```

需要注意的是，变量定义分全局变量和局部变量，局部变量只对当前 xmake.lua 有效，不影响子 xmake.lua

```lua
-- 局部变量，只对当前xmake.lua有效
local var1 = 0

-- 全局变量，影响所有之后 includes() 包含的子 xmake.lua 
var2 = 1

includes("src")
```

### 内部作用域

也称插件、脚本作用域，提供更加复杂、灵活的脚本支持，一般用于编写一些自定义脚本、插件开发、自定义 task 任务、自定义模块等等

一般通过 `function () end` 包含，并且被传入到 `on_xxx`, `before_xxx` 和 `after_xxx` 接口内的，都属于自作用域。

例如：

```lua
-- 自定义脚本
target("hello", function()
    after_build(function ()
        -- 内部作用域
        end)
end)

-- 自定义任务、插件
task("hello", function()
    on_run(function ()
        -- 内部作用域
        end)
end)
```

在此作用域中，不仅可以使用大部分 lua 的 api，还可以使用很多 xmake 提供的扩展模块，所有扩展模块，通过 import 来导入

具体可参考：[import模块导入文档](/zh-cn/manual/builtin_modules?id=import)

这里我们给个简单的例子，在编译完成后，对 ios 目标程序进行 ldid 签名：

```lua
target("iosdemo", function()
    set_kind("binary")
    add_files("*.m")
    after_build(function (target)
        -- 执行签名，如果失败，自动中断，给出高亮错误信息
        os.run("ldid -S$(projectdir)/entitlements.plist %s", target:targetfile())
    end)
end)
```

需要注意的是，在内部作用域中，所有的调用都是启用异常捕获机制的，如果运行出错，会自动中断 xmake，并给出错误提示信息

因此，脚本写起来，不需要繁琐的 `if retval then` 判断，脚本逻辑更加一目了然

### 接口作用域

在外部作用域中的所有描述api设置，本身也是有作用域之分的，在不同地方调用，影响范围也不相同，例如：

```lua
-- 全局根作用域，影响所有 target，包括 includes() 中的子工程 target 设置
add_defines("DEBUG")

-- 定义或者进入 demo 目标作用域（支持多次进入来追加设置）
target("demo", function()
    set_kind("shared")
    add_files("src/*.c")
    -- 当前 target 作用域，仅仅影响当前 target
    add_defines("DEBUG2")
end)

-- 选项设置，仅支持局部设置，不受全局 api 设置所影响
option("test", function()
    -- 当前选项的局部作用域
    set_default(false)
end)

-- 其他target设置，-DDEBUG 也会被设置上
target("demo2", function()
    set_kind("binary")
    add_files("src/*.c")
end)

-- 重新进入demo目标作用域
target("demo", function()
    -- 追加宏定义，只对当前demo目标有效
    add_defines("DEBUG3")
end)
```

通常情况下，进入另一个 target/option 域设置，会自动离开上个 target/option 域，但是有时候为了比较一些作用域污染情况，我们可以显示离开某个域，例如：

```lua
option("test")
    set_default(false)
option_end()

target("demo")
    set_kind("binary")
    add_files("src/*.c")
target_end()
```

调用 `option_end()`, `target_end()` 即可显式的离开当前 target/option 域设置。

### 代码格式化

由于默认的描述域配置语法的缩进并不符合 lua 格式规范，因此 lua language server 是不支持对它进行格式化处理的。

如果想要让 IDE，编辑器更好的对配置进行格式化缩进支持，我么可以通过 `do end` 的写法来处理：

```lua
target("bar") do
    set_kind("binary")
    add_files("src/*.cpp")
end

target("foo") do
    set_kind("binary")
    add_files("src/*.cpp")
end
```

这样，Lua LSP 就能把它作为标准的 lua 代码进行正确的格式化，是否需要这么做，看用户自己的需求。

如果没有代码自动格式化的使用习惯，那就不需要这么做。

## 多级配置

在脚本域我们可以通过 import 导入各种丰富的扩展模块来使用，而在描述域我们可以通过[includes](/#/zh-cn/manual/global_interfaces?id=includes)接口，来引入项目子目录下的 xmake.lua 配置。

记住：xmake 的 includes 是按照 tree 结构来处理配置关系的，子目录下的 xmake.lua 里面的 target 配置会继承父 xmake.lua 中的根域配置，例如：

目前有如下项目结构：

```
projectdir
    - xmake.lua
    - src
      - xmake.lua
```

`projectdir/xmake.lua` 是项目的根 xmake.lua 配置，而 `src/xmake.lua` 是项目的子配置。

`projectdir/xmake.lua` 内容：

```lua
add_defines("ROOT")

target("test1", function()
    set_kind("binary")
    add_files("src/*.c")
    add_defines("TEST1")
end)

target("test2", function()
    set_kind("binary")
    add_files("src/*.c")
    add_defines("TEST2")
end)

includes("src")
```

里面全局根域配置了 `add_defines("ROOT")`，会影响下面的所有 target 配置，包括 includes 里面子 xmake.lua 中的所有 target 配置，所以这个是全局总配置。

而在 test1/test2 里面的 `add_defines("TEST1")` 和 `add_defines("TEST2")` 属于局部配置，只对当前 target 生效。

`src/xmake.lua` 内容：

```lua
add_defines("ROOT2")

target("test3", function()
    set_kind("binary")
    add_files("src/*.c")
    add_defines("TEST3")
end)
```

在 `src/xmake.lua` 子配置中，也有个全局根域，配置了 `add_defines("ROOT2")`，这个属于子配置根域，只对当前子 xmake.lua 里面所有 target 生效，也会对下级 includes 里面的子 xmake.lua 中 target 生效，因为之前说了，xmake 是 tree 状结构的配置继承关系。

所以，这几个 target 的最终配置结果依次是：

```
target("test1"): -DROOT -DTEST1
target("test2"): -DROOT -DTEST2
target("test3"): -DROOT -DROOT2 -DTEST3
```

## 语法简化

xmake.lua 的配置域语法，非常灵活，可以在相关域做各种复杂灵活的配置，但是对于许多精简的小块配置，这个时候就稍显冗余了：

```lua
option("test1", function()
    set_default(true)
    set_showmenu(true)
    set_description("test1 option")
end)

option("test2", function()
    set_default(true)
    set_showmeu(true)
end)

option("test3", function()
    set_default("hello")
end)
```

对于上面的这些小块 option 域设置，我们可以简化下成单行描述：

```lua
option("test1", {default = true, showmenu = true, description = "test1 option"})
option("test2", {default = true, showmenu = true})
option("test3", {default = "hello"})
```

除了 option 域，对于其他域也是支持这种简化写法的，例如：

```lua
target("demo", function()
    set_kind("binary")
    add_files("src/*.c")
end)
```

简化为：

```lua
target("demo", {kind = "binary", files = "src/*.c"})
```

或者

```lua
target("demo", {
    kind = "binary",
    files = "src/*.c"
})
```

当然，如果配置需求比较复杂的，还是原有的多行设置方式更加方便，这个就看自己的需求来评估到底使用哪种方式了。
