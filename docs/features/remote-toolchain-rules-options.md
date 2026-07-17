# 远程 Toolchain、Rule 和 Option

Xmake 支持通过 xmake-repo 发布和分发自定义的 `toolchain`、`rule` 和 `option` 脚本。项目每次构建时，都会从仓库拉取并加载最新脚本，因此可以集中维护公共构建逻辑，无需在每个代码库中重复复制。

在 xmake-repo 中更新脚本后，所有引用它的项目都会在下一次构建时自动使用最新版本。
