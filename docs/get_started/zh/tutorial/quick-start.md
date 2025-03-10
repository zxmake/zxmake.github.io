---
class: heading_no_counter
---

# 快速开始

## 创建工程

创建一个名叫 `hello` 的 `c` 控制台工程：

```bash
$ xmake create --language=c --project=./hello

# 或

$ xmake create -l c -P ./hello
```

执行完后，将会生成一个简单工程结构：

```
./hello/
├── src
│   └── main.c
└── xmake.lua
```

其中 `xmake.lua` 是工程描述文件，内容非常简单，告诉 xmake 添加 `src` 目录下的所有 `.c` 源文件：

```lua
add_rules("mode.debug", "mode.release")

target("hello", function()
    set_kind("binary")
    add_files("src/*.c")
end)
```

目前支持的语言如下：

* c/c++
* objc/c++
* cuda
* asm
* swift
* dlang
* golang
* rust

> 如果你想了解更多参数选项，请运行: `xmake create --help`。

## 构建工程

```bash
$ cd hello
$ xmake
```

## 运行程序

```bash
$ xmake run hello
```

## 调试程序

首先你需要切换到 debug 模式去重新编译程序。

```bash
$ xmake config -m debug 
$ xmake
```

然后执行下面的命令去开始调试：

```bash
$ xmake run -d hello 
```

xmake 将会使用调试器去加载程序运行，目前支持：lldb, gdb, windbg, vsjitdebugger, ollydbg 等各种调试器。

```bash
(gdb) b main
Breakpoint 1 at 0x115c: file src/main.c, line 4.
(gdb) r
Starting program: /tmp/test-xmake/hello/build/linux/x86_64/debug/hello 
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/x86_64-linux-gnu/libthread_db.so.1".

Breakpoint 1, main (argc=1, argv=0x7fffffffdac8) at src/main.c:4
4           printf("hello world!\n");
(gdb)
```

如果想要使用指定的调试器：

```bash
$ xmake f --debugger=gdb
$ xmake run -d hello
```

> 你也可以使用简写的命令行选项，例如: `xmake r` 或者 `xmake run`。
