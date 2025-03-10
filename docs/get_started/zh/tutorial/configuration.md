---
class: heading_no_counter
---

# 配置说明

通过 `xmake f|config` 配置命令，设置构建前的相关配置信息，详细参数选项，请运行: `xmake f --help`。

> **Tips**:
> 你可以使用命令行缩写来简化输入，也可以使用全名，例如:
>
> * `xmake f` 或者 `xmake config`
> * `xmake f -p linux` 或者 `xmake config --plat=linux`

## 目标平台

### 主机平台

```bash
$ xmake
```

> xmake将会自动探测当前主机平台，默认自动生成对应的目标程序。

### Linux

```bash
$ xmake f -p linux [-a i386|x86_64]
$ xmake
```

### Android

```bash
$ xmake f -p android --ndk=~/files/android-ndk-r10e/ [-a armeabi-v7a|arm64-v8a]
$ xmake
```

如果要手动指定 ndk 中具体某个工具链，而不是使用默认检测的配置，可以通过[--bin](#--bin)来设置，例如：

```bash
$ xmake f -p android --ndk=~/files/android-ndk-r10e/ -a arm64-v8a --bin=~/files/android-ndk-r10e/toolchains/aarch64-linux-android-4.9/prebuilt/darwin-x86_64/bin
```

[--bin](#--bin)主要用于设置选择编译工具的具体 bin 目录，这个的使用跟[交叉编译](#交叉编译配置)中的[--bin](#--bin)的行为是一致的。

> 如果手动设置了 bin 目录，没有通过检测，可以看下是否 `--arch=` 参数没有匹配对。

### iPhoneOS

```bash
$ xmake f -p iphoneos [-a armv7|armv7s|arm64|i386|x86_64]
$ xmake
```

由于 m1 设备上模拟器也支持 arm64 架构，因此之前单纯从 arch 去区分是否为模拟器，已无法满足需求。
因此我们新增了一个参数配置去区分是否为模拟器目标。

```bash
$ xmake f -p iphoneos --appledev=simulator
$ xmake f -p watchos --appledev=simulator
$ xmake f -p appletvos --appledev=simulator
```

### Mac Catalyst

我们也可以指定构建 Mac Catalyst 程序。

```bash
$ xmake f --appledev=catalyst
```

### Apple WatchOS

```bash
$ xmake f -p watchos [-a i386|armv7k]
$ xmake
```

### Wasm (WebAssembly)

此平台用于编译 WebAssembly 程序（内部会使用 emcc 工具链），在切换此平台之前，我们需要先进入 Emscripten 工具链环境，确保 emcc 等编译器可用。

```bash
$ xmake f -p wasm
$ xmake
```

xmake 也支持 Qt for wasm 编译，只需要：

```bash
$ xmake f -p wasm [--qt=~/Qt]
$ xmake
```

其中 `--qt` 参数设置是可选的，通常 xmake 都能检测到 qt 的 sdk 路径。

需要注意的一点是，Emscripten 和 Qt SDK 的版本是有对应关系的，不匹配的版本，可能会有 Qt/Wasm 之间的兼容问题。

关于版本对应关系，可以看下：[https://wiki.qt.io/Qt_for_WebAssembly](https://wiki.qt.io/Qt_for_WebAssembly)

更多详情见：[https://github.com/xmake-io/xmake/issues/956](https://github.com/xmake-io/xmake/issues/956)

除了 emscripten 以外，还有一个常用的 wasm 工具链 wasi-sdk，用于构建基于 wasi 的程序，我们仅仅只需要切换工具链即可。

```bash
$ xmake f -p wasm --toolchain=wasi
$ xmake
```

### HarmonyOS (鸿蒙)

xmake 也提供了鸿蒙 OS 平台的 native 工具链编译支持：

```bash
$ xmake f -p harmony
```

xmake 会自动探测默认的 SDK 路径，当然我们也可以指定 Harmony SDK 路径。

```bash
$ xmake f -p Harmony --sdk=/Users/ruki/Library/Huawei/Sdk/openharmony/10/native
```

## 交叉编译配置

通常，如果我们需要在当前 pc 环境编译生成其他设备上才能运行的目标文件时候，就需要通过对应的交叉编译工具链来编译生成它们，比如在 macos 上编译 linux 的程序，或者在 linux 上编译其他嵌入式设备的目标文件等。

通常的交叉编译工具链都是基于 gcc/clang 的，大都具有类似如下的结构：

```
/home/toolchains_sdkdir
   - bin
       - arm-linux-armeabi-gcc
       - arm-linux-armeabi-ld
       - ...
   - lib
       - libxxx.a
   - include
       - xxx.h
```

每个工具链都有对应的 include/lib 目录，用于放置一些系统库和头文件，例如 libc, stdc++ 等，而 bin 目录下放置的就是编译工具链一系列工具。例如：

```
arm-linux-armeabi-ar
arm-linux-armeabi-as
arm-linux-armeabi-c++
arm-linux-armeabi-cpp
arm-linux-armeabi-g++
arm-linux-armeabi-gcc
arm-linux-armeabi-ld
arm-linux-armeabi-nm
arm-linux-armeabi-strip
```

其中 `arm-linux-armeabi-` 前缀就是 cross，通过用来标示目标平台和架构，主要用于跟主机自身的 gcc/clang 进行区分。

里面的 gcc/g++ 就是 c/c++ 的编译器，通常也可以作为链接器使用，链接的时候内部会去调用 ld 来链接，并且自动追加一些 c++ 库。

cpp 是预处理器，as 是汇编器，ar 用于生成静态库，strip 用于裁剪掉一些符号信息，使得目标程序会更加的小。nm 用于查看导出符号列表。

### 自动探测和编译

如果我们的交叉编译工具链是上文的结构，xmake 会自动检测识别这个 sdk 的结构，提取里面的 cross，以及 include/lib 路径位置，用户通常不需要做额外的参数设置，只需要配置好 sdk 根目录就可以编译了，例如：

```bash
$ xmake f -p cross --sdk=/home/toolchains_sdkdir
$ xmake
```

其中，`-p cross` 用于指定当前的平台是交叉编译平台，`--sdk=` 用于指定交叉工具链的根目录。

> 注：我们也可以指定 `-p linux` 平台来配置交叉编译，效果是一样的，唯一的区别是额外标识了 linux 平台名，方便 xmake.lua 里面通过 `is_plat("linux")` 来判断平台。

这个时候，xmake 会去自动探测 gcc 等编译器的前缀名 cross：`arm-linux-armeabi-`，并且编译的时候，也会自动加上**链接库**和**头文件**的搜索选项，例如：

```
-I/home/toolchains_sdkdir/include
-L/home/toolchains_sdkdir/lib
```

这些都是 xmake 自动处理的，不需要手动配置他们。

### 手动配置编译

如果上面的自动检测对某些工具链，还无法完全通过编译，就需要用户自己手动设置一些交叉编译相关的配置参数，来调整适应这些特殊的工具链了，下面我会逐一讲解如何配置。

### 设置工具链 bin 目录

对于不规则工具链目录结构，靠单纯地[--sdk](#--sdk)选项设置，没法完全检测通过的情况下，可以通过这个选项继续附加设置工具链的 bin 目录位置。

例如：一些特殊的交叉工具链的，编译器bin目录，并不在  `/home/toolchains_sdkdir/bin`  这个位置，而是独立到了 `/usr/opt/bin`。

这个时候，我们可以在设置了 sdk 参数的基础上追加 bin 目录的参数设置，来调整工具链的 bin 目录。

```bash
$ xmake f -p cross --sdk=/home/toolchains_sdkdir --bin=/usr/opt/bin
$ xmake
```

### 设置交叉工具链工具前缀

像 `aarch64-linux-android-` 这种，通常如果你配置了`--sdk` 或者 `--bin` 的情况下，xmake 会去自动检测的，不需要自己手动设置。

但是对于一些极特殊的工具链，一个目录下同时有多个 cross 前缀的工具 bin 混在一起的情况，你需要手动设置这个配置，来区分到底需要选用哪个 bin。

例如，toolchains 的 bin 目录下同时存在两个不同的编译器：

```
/opt/bin
  - armv7-linux-gcc
  - aarch64-linux-gcc
```

我们现在想要选用 armv7 的版本，那么我们可以追加 `--cross=` 配置编译工具前缀名，例如：

```bash
$ xmake f -p cross --sdk=/usr/toolsdk --bin=/opt/bin --cross=armv7-linux-
```

### 设置 c/c++ 编译器

如果还要继续细分选择编译器，则继续追加相关编译器选项，例如：

```bash
$ xmake f -p cross --sdk=/user/toolsdk --cc=armv7-linux-clang --cxx=armv7-linux-clang++
```

当然，我们也可以指定编译器全路径。

`--cc` 用于指定 c 编译器名，`--cxx` 用于指定 c++ 编译器名。

> 注：如果存在 CC/CXX 环境变量的话，会优先使用当前环境变量中指定的值。

如果指定的编译器名不是那些 xmake 内置可识别的名字（带有 gcc, clang 等字样），那么编译器工具检测就会失败。

这个时候我们可以通过：

```bash
xmake f --cxx=clang++@/home/xxx/c++mips.exe
```

设置 c++mips.exe 编译器作为类 clang++ 的使用方式来编译。

也就是说，在指定编译器为 `c++mips.exe` 的同时，告诉 xmake，它跟 clang++ 用法和参数选项基本相同。

### 设置 c/c++ 链接器

如果还要继续细分选择链接器，则继续追加相关链接器选项，例如：

```bash
$ xmake f -p cross --sdk=/user/toolsdk --ld=armv7-linux-clang++ --sh=armv7-linux-clang++ --ar=armv7-linux-ar
```

ld 指定可执行程序链接器，sh 指定共享库程序链接器，ar 指定生成静态库的归档器。

注：如果存在 LD/SH/AR 环境变量的话，会优先使用当前环境变量中指定的值。

### 设置头文件和库搜索目录

如果 sdk 里面还有额外的其他 include/lib 目录不在标准的结构中，导致交叉编译找不到库和头文件，那么我们可以通过 `--includedirs` 和 `--linkdirs` 来追加搜索路径，然后通过 `--links` 添加额外的链接库。

```bash
$ xmake f -p cross --sdk=/usr/toolsdk --includedirs=/usr/toolsdk/xxx/include --linkdirs=/usr/toolsdk/xxx/lib --links=pthread
```

> 注：如果要指定多个搜索目录，可以通过 `:` 或者 `;` 来分割，也就是不同主机平台的路径分隔符，linux/macos下用`:`，win下用`;`。

### 设置编译和链接选项

我们也可以根据实际情况通过 `--cflags`, `--cxxflags`，`--ldflags`，`--shflags` 和 `--arflags` 额外配置一些编译和链接选项。

* cflags: 指定c编译参数
* cxxflags：指定c++编译参数
* cxflags: 指定c/c++编译参数
* asflags: 指定汇编器编译参数
* ldflags: 指定可执行程序链接参数
* shflags: 指定动态库程序链接参数
* arflags: 指定静态库的生成参数

例如：

```bash
$ xmake f -p cross --sdk=/usr/toolsdk --cflags="-DTEST -I/xxx/xxx" --ldflags="-lpthread"
```

### 项目描述设置

#### set_toolchains

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

#### set_toolset

如果觉得每次通过命令行配置比较繁琐，有些配置可以通过在 xmake.lua 预先配置好，来简化命令配置，比如编译器的指定，就可以通过 `set_toolset` 来对每个 target 单独设置。

```lua
target("test", function()
    set_kind("binary")
    set_toolset("cxx", "clang")
    set_toolset("ld", "clang++")
end)
```

强制 test 目标的编译器和链接器使用 clang 编译器，或者指定交叉编译工具链中的编译器名或者路径。

#### set_config

我们也可以通过 `set_config` 来设置在 `xmake f/config` 命令中的每个配置参数的默认值，这是个全局 api，对每个 target 都会生效。

```lua
set_config("cflags", "-DTEST")
set_config("sdk", "/home/xxx/tooksdk")
set_config("cc", "gcc")
set_config("ld", "g++")
```

不过，我们还是可以通过 `xmake f --name=value` 的方式，去修改 xmake.lua 中的默认配置。

### 自定义编译平台

如果某个交叉工具链编译后目标程序有对应的平台需要指定，并且需要在 xmake.lua 里面根据不同的交叉编译平台，还需要配置一些额外的编译参数，那么上文的 `-p cross` 设置就不能满足需求了。

其实，`-p/--plat=` 参数也可以设置为其他自定义的值，只需要跟 `is_plat` 保持对应关系就可以，所有非内置平台名，都会默认采用交叉编译模式，例如：

```bash
$ xmake f -p myplat --sdk=/usr/local/arm-xxx-gcc/
$ xmake
```

我们传入了 myplat 自定义平台名，作为当前交叉工具链的编译平台，然后 xmake.lua 里面我们对这个平台，配置下对应的设置：

```lua
if is_plat("myplat") then
    add_defines("TEST")
end
```

通过这种方式，xmake 就可以很方便的扩展处理各种编译平台，用户可以自己扩展支持 freebsd, netbsd, sunos 等其他各种平台的交叉编译。

我摘录一段之前移植 libuv 写的交叉编译的配置，直观感受下：

```lua
-- for dragonfly/freebsd/netbsd/openbsd platform
if is_plat("dragonfly", "freebsd", "netbsd", "openbsd") then
    add_files("src/unix/bsd-ifaddrs.c")
    add_files("src/unix/freebsd.c")
    add_files("src/unix/kqueue.c")
    add_files("src/unix/posix-hrtime.c")
    add_headerfiles("(include/uv-bsd.h)")
end

-- for sunos platform
if is_plat("sunos") then
    add_files("src/unix/no-proctitle.c")
    add_files("src/unix/sunos.c")
    add_defines("__EXTENSIONS_", "_XOPEN_SOURCE=600")
    add_headerfiles("(include/uv-sunos.h)")
end
```

然后，我们就可以切换这些平台来编译：

```bash
$ xmake f -p [dragonfly|freebsd|netbsd|openbsd|sunos] --sdk=/home/arm-xxx-gcc/
$ xmake
```

另外，内置的 linux 平台也是支持交叉编译的，如果不想配置其他平台名，统一作为 linux 平台来交叉编译，也是可以的。

```bash
$ xmake f -p linux --sdk=/usr/local/arm-xxx-gcc/
$ xmake
```

只要设置了 `--sdk=` 等参数，就会启用linux平台的交叉编译模式。

### 常用工具链配置

完整的工具链列表，请执行下面的命令查看：

```bash
$ xmake show -l toolchains
```

上文讲述的是通用的交叉编译工具链配置，如果一些特定的工具链需要额外传入 `--ldflags/--includedirs` 等场景就比较繁琐了,
因此 xmake 也内置了一些常用工具链，可以省去交叉编译工具链复杂的配置过程，只需要执行：

```bash
$ xmake f --toolchain=gnu-rm --sdk=/xxx/
$ xmake
```

就可以快速切换的指定的交叉编译工具链，如果这个工具链需要追加一些特定的 flags 设置，也会自动设置好，简化配置。

其中，gnu-rm 就是内置的 GNU Arm Embedded Toolchain。

比如，我们也可以快速从 gcc 工具链整体切换到 clang 或者 llvm 工具链，不再需要 `xmake f --cc=clang --cxx=clang --ld=clang++` 等挨个配置了。

```bash
$ xmake f --toolchain=clang
$ xmake
```

或者

```bash
$ xmake f --toolchain=llvm --sdk=/xxx/llvm
$ xmake
```

具体 xmake 持哪些工具链，可以通过下面的命令查看：

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

#### 自定义工具链

另外，我们也可以在 xmake.lua 中自定义 toolchain，然后通过 `xmake f --toolchain=myclang` 指定切换，例如：

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

关于这块的详情介绍，可以到[自定义工具链](/zh-cn/manual/custom_toolchain)章节查看

更多详情见：[#780](https://github.com/xmake-io/xmake/issues/780)

#### LLVM 工具链

llvm 工具链下载地址：<https://releases.llvm.org/>

```bash
$ xmake f -p cross --toolchain=llvm --sdk="C:\Program Files\LLVM"
$ xmake
```

#### GNU-RM 工具链

工具链地址：<https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm/downloads#>

```bash
$ xmake f -p cross --toolchain=gnu-rm --sdk=/xxx/cc-arm-none-eabi-9-2019-q4-major
$ xmake
```

#### TinyC 工具链

```bash
$ xmake f --toolchain=tinyc
$ xmake
```

> Releases 目录下，我们还提供了特殊的 xmake-tinyc-vX.X.X.win32.exe 安装包，内置 tinyc 工具链，无需依赖 msvc，也可以编译 c 代码，开箱即用无依赖。

#### Emcc 工具链

通常只需要切换到 Wasm 平台，里面内置了 emcc 工具链，还会额外调整目标程序的扩展名为 `*.html` 以及输出 `*.wasm`。

```bash
$ xmake f -p wasm
$ xmake
```

不过我们也能够直接切换到 emcc 工具链，但是后缀名不会被修改。

```bash
$ xmake f --toolchain=emcc
$ xmake
```

#### Intel C++ 编译工具链

```bash
$ xmake f --toolchain=icc
$ xmake
```

#### Intel Fortran 编译工具链

```bash
$ xmake f --toolchain=ifort
$ xmake
```

### 通用交叉编译配置

| 参数名                       | 描述                             |
| ---------------------------- | -------------------------------- |
| [--sdk](#--sdk)               | 设置交叉工具链的sdk根目录        |
| [--bin](#--bin)               | 设置工具链bin目录                |
| [--cross](#--cross)           | 设置交叉工具链工具前缀           |
| [--as](#--as)                 | 设置`asm`汇编器                  |
| [--cc](#--cc)                 | 设置`c`编译器                    |
| [--cxx](#--cxx)               | 设置`c++`编译器                  |
| [--mm](#--mm)                 | 设置`objc`编译器                 |
| [--mxx](#--mxx)               | 设置`objc++`编译器               |
| [--sc](#--sc)                 | 设置`swift`编译器                |
| [--gc](#--gc)                 | 设置`golang`编译器               |
| [--dc](#--dc)                 | 设置`dlang`编译器                |
| [--rc](#--rc)                 | 设置`rust`编译器                 |
| [--cu](#--cu)                 | 设置`cuda`编译器                 |
| [--ld](#--ld)                 | 设置`c/c++/objc/asm`链接器       |
| [--sh](#--sh)                 | 设置`c/c++/objc/asm`共享库链接器 |
| [--ar](#--ar)                 | 设置`c/c++/objc/asm`静态库归档器 |
| [--scld](#--scld)             | 设置`swift`链接器                |
| [--scsh](#--scsh)             | 设置`swift`共享库链接器          |
| [--gcld](#--gcld)             | 设置`golang`链接器               |
| [--gcar](#--gcar)             | 设置`golang`静态库归档器         |
| [--dcld](#--dcld)             | 设置`dlang`链接器                |
| [--dcsh](#--dcsh)             | 设置`dlang`共享库链接器          |
| [--dcar](#--dcar)             | 设置`dlang`静态库归档器          |
| [--rcld](#--rcld)             | 设置`rust`链接器                 |
| [--rcsh](#--rcsh)             | 设置`rust`共享库链接器           |
| [--rcar](#--rcar)             | 设置`rust`静态库归档器           |
| [--cu-ccbin](#--cu-ccbin)     | 设置`cuda` host编译器            |
| [--culd](#--culd)             | 设置`cuda`链接器                 |
| [--asflags](#--asflags)       | 设置`asm`汇编编译选项            |
| [--cflags](#--cflags)         | 设置`c`编译选项                  |
| [--cxflags](#--cxflags)       | 设置`c/c++`编译选项              |
| [--cxxflags](#--cxxflags)     | 设置`c++`编译选项                |
| [--mflags](#--mflags)         | 设置`objc`编译选项               |
| [--mxflags](#--mxflags)       | 设置`objc/c++`编译选项           |
| [--mxxflags](#--mxxflags)     | 设置`objc++`编译选项             |
| [--scflags](#--scflags)       | 设置`swift`编译选项              |
| [--gcflags](#--gcflags)       | 设置`golang`编译选项             |
| [--dcflags](#--dcflags)       | 设置`dlang`编译选项              |
| [--rcflags](#--rcflags)       | 设置`rust`编译选项               |
| [--cuflags](#--cuflags)       | 设置`cuda`编译选项               |
| [--ldflags](#--ldflags)       | 设置链接选项                     |
| [--shflags](#--shflags)       | 设置共享库链接选项               |
| [--arflags](#--arflags)       | 设置静态库归档选项               |

> 如果你想要了解更多参数选项，请运行: `xmake f --help`。

#### --sdk

* 设置交叉工具链的sdk根目录

大部分情况下，都不需要配置很复杂的 toolchains 前缀，例如：`arm-linux-` 什么的

只要这个工具链的 sdk 目录满足如下结构（大部分的交叉工具链都是这个结构）：

```
/home/toolchains_sdkdir
   - bin
       - arm-linux-gcc
       - arm-linux-ld
       - ...
   - lib
       - libxxx.a
   - include
       - xxx.h
```

那么，使用 xmake 进行交叉编译的时候，只需要进行如下配置和编译：

```bash
$ xmake f -p linux --sdk=/home/toolchains_sdkdir
$ xmake
```

这个时候，xmake 会去自动探测，gcc 等编译器的前缀名：`arm-linux-`，并且编译的时候，也会自动加上**链接库**和**头文件**的搜索选项，例如：

```
-I/home/toolchains_sdkdir/include -L/home/toolchains_sdkdir/lib
```

这些都是xmake自动处理的，不需要手动配置他们。。

#### --bin

* 设置工具链bin目录

对于不规则工具链目录结构，靠单纯地[--sdk](--sdk)选项设置，没法完全检测通过的情况下，可以通过这个选项继续附加设置工具链的 bin 目录位置。

例如：一些特殊的交叉工具链的，编译器 bin 目录，并不在 `/home/toolchains_sdkdir/bin` 这个位置，而是独立到了 `/usr/opt/bin`。

```bash
$ xmake f -p linux --sdk=/home/toolchains_sdkdir --bin=/usr/opt/bin
$ xmake
```

#### --cross

* 设置交叉工具链工具前缀

像 `aarch64-linux-android-` 这种，通常如果你配置了[--sdk](#--sdk)或者[--bin](#--bin)的情况下，xmake 会去自动检测的，不需要自己手动设置。

但是对于一些极特殊的工具链，一个目录下同时有多个 cross 前缀的工具 bin 混在一起的情况，你需要手动设置这个配置，来区分到底需要选用哪个 bin。

例如，toolchains 的 bin 目录下同时存在两个不同的编译器：

```
/opt/bin
 - armv7-linux-gcc
 - aarch64-linux-gcc
```

我们现在想要选用 armv7 的版本，则配置如下：

```bash
$ xmake f -p linux --sdk=/usr/toolsdk --bin=/opt/bin --cross=armv7-linux-
```

#### --as

* 设置 `asm` 汇编器

如果还要继续细分选择编译器，则继续追加相关编译器选项，例如：

```bash
$ xmake f -p linux --sdk=/user/toolsdk --as=armv7-linux-as
```

如果存在 `AS` 环境变量的话，会优先使用当前环境变量中指定的值。

> 如果指定的编译器名不是那些 xmake 内置可识别的名字（带有 gcc, clang 等字样），那么编译器工具检测就会失败。
> 这个时候我们可以通过：`xmake f --as=gcc@/home/xxx/asmips.exe` 设置ccmips.exe编译器作为类 gcc 的使用方式来编译。
> 也就是说，在指定编译器为 `asmips.exe` 的同时，告诉 xmake，它跟 gcc 用法和参数选项基本相同。

#### --cc

* 设置c编译器

如果还要继续细分选择编译器，则继续追加相关编译器选项，例如：

```bash
$ xmake f -p linux --sdk=/user/toolsdk --cc=armv7-linux-clang
```

如果存在 `CC` 环境变量的话，会优先使用当前环境变量中指定的值。

> 如果指定的编译器名不是那些 xmake 内置可识别的名字（带有 gcc, clang 等字样），那么编译器工具检测就会失败。
> 这个时候我们可以通过：`xmake f --cc=gcc@/home/xxx/ccmips.exe` 设置 ccmips.exe 编译器作为类 gcc 的使用方式来编译。
> 也就是说，在指定编译器为 `ccmips.exe` 的同时，告诉 xmake，它跟 gcc 用法和参数选项基本相同。

#### --cxx

* 设置 `c++` 编译器

如果还要继续细分选择编译器，则继续追加相关编译器选项，例如：

```bash
$ xmake f -p linux --sdk=/user/toolsdk --cxx=armv7-linux-clang++
```

如果存在 `CXX` 环境变量的话，会优先使用当前环境变量中指定的值。

> 如果指定的编译器名不是那些 xmake 内置可识别的名字（带有 gcc, clang 等字样），那么编译器工具检测就会失败。
> 这个时候我们可以通过：`xmake f --cxx=clang++@/home/xxx/c++mips.exe` 设置 c++mips.exe 编译器作为类 clang++ 的使用方式来编译。
> 也就是说，在指定编译器为 `c++mips.exe` 的同时，告诉 xmake，它跟 clang++ 用法和参数选项基本相同。

#### --ld

* 设置 `c/c++/objc/asm` 链接器

如果还要继续细分选择链接器，则继续追加相关编译器选项，例如：

```bash
$ xmake f -p linux --sdk=/user/toolsdk --ld=armv7-linux-clang++
```

如果存在 `LD` 环境变量的话，会优先使用当前环境变量中指定的值。

> 如果指定的编译器名不是那些 xmake 内置可识别的名字（带有 gcc, clang 等字样），那么链接器工具检测就会失败。
> 这个时候我们可以通过：`xmake f --ld=g++@/home/xxx/c++mips.exe` 设置 c++mips.exe 链接器作为类 g++ 的使用方式来编译。
> 也就是说，在指定链接器为 `c++mips.exe` 的同时，告诉 xmake，它跟 g++ 用法和参数选项基本相同。

#### --sh

* 设置 `c/c++/objc/asm` 共享库链接器

```bash
$ xmake f -p linux --sdk=/user/toolsdk --sh=armv7-linux-clang++
```

如果存在 `SH` 环境变量的话，会优先使用当前环境变量中指定的值。

#### --ar

* 设置 `c/c++/objc/asm` 静态库归档器

```bash
$ xmake f -p linux --sdk=/user/toolsdk --ar=armv7-linux-ar
```

如果存在`AR`环境变量的话，会优先使用当前环境变量中指定的值。

## 全局配置

我们也可以将一些常用配置保存到全局配置中，来简化频繁地输入：

例如:

```bash
$ xmake g --ndk=~/files/android-ndk-r10e/
```

现在，我们重新配置和编译 `android` 程序：

```bash
$ xmake f -p android
$ xmake
```

以后，就不需要每次重复配置 `--ndk=参数了。

> 每个命令都有其简写，例如: `xmake g` 或者 `xmake global`。

## 清除配置

有时候，配置出了问题编译不过，或者需要重新检测各种依赖库和接口，可以加上 `-c` 参数，清除缓存的配置，强制重新检测和配置：

```bash
$ xmake f -c
$ xmake
```

或者：

```bash
$ xmake f -p iphoneos -c
$ xmake
```

## 导入导出配置

我们还可以导入导出已经配置好的配置集，方便配置的快速迁移。

### 导出配置

```bash
$ xmake f --export=/tmp/config.txt
$ xmake f -m debug --xxx=y --export=/tmp/config.txt
```

### 导入配置

```bash
$ xmake f --import=/tmp/config.txt
$ xmake f -m debug --xxx=y --import=/tmp/config.txt
```

### 导出配置（带菜单）

```bash
$ xmake f --menu --export=/tmp/config.txt
$ xmake f --menu -m debug --xxx=y --export=/tmp/config.txt
```

### 导入配置（带菜单）

```bash
$ xmake f --menu --import=/tmp/config.txt
$ xmake f --menu -m debug --xxx=y --import=/tmp/config.txt
```
