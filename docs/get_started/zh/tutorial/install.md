# 安装

## 源码编译安装

### 安装

> 切记，xmake 不建议在 root 下安装和使用，所以尽量不要在 root 下拉取源码编译安装。

```bash
git clone https://github.com/TOMO-CAT/xmake.git
cd ./xmake
bash scripts/install.sh
```

如果没有外网环境，可以通过 gitee 镜像拉取（xmake repo 也会自动切到 gitee 源）：

```bash
git clone https://gitee.com/tomocat/xmake.git
```

安装完后检查是否安装完成：

```bash
xmake --version
```

### 启用 Luajit

对于一些大型项目（比如包含 300+ targets），我们可以启用 Luajit 加速构建，提升构建速度。

```bash
bash scripts/install.sh --runtime=luajit
```

### 仅更新 lua 脚本

这个开发者本地调试 xmake 源码才需要：

```bash
./scripts/get.sh __local__ __install_only__
```

### 编译 xmake bundle 包

默认编译方式会安装 xmake 二进制和 Lua 脚本，这样做的好处是方便源码调试 Lua 脚本，但是不方便发布和迁移，可以只编译 xmake 二进制：

```bash
# TODO:
```

### root 下安装

xmake 不推荐 root 下安装使用，因为这很不安全。因此以 root 用户运行 xmake 会打印一条 warning 日志，用户可以设置环境变量 `XMAKE_ROOT=y` 屏蔽相关的报警，用户需要随时注意root下误操作系统文件文件的风险。

### 启用 ccache

默认情况下 xmake 用的是内部的 xcache，但可能会出现一些非预期的 bug。如果需要启用 ccache，可以手动安装 ccache，xmake会自动检测并使用。

## 更新升级

我们可以通过 `xmake update` 命令来快速进行自我更新和升级，默认是升级到最新版本，当然也可以指定升级或者回退到某个版本：

```bash
xmake update 2.7.1
```

我们也可以指定更新到 master/dev 分支版本：

```bash
xmake update master
xmake update dev
```

从指定 git 源更新

```bash
# 指定 github 源
xmake update github:xmake-io/xmake#master

# 指定 gitee 源
xmake update gitee:tboox/xmake#dev
```

如果xmake/core没动过，仅仅更新xmake的lua脚本改动，可以加`-s/--scriptonly`快速更新lua脚本

```bash
xmake update -s dev
```

## 卸载

最后，我们如果要卸载 xmake，也是支持的：

```bash
xmake update --uninstall
```
