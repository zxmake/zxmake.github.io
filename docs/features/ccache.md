
# 编译缓存

## xcache 与 ccache

默认情况下，如果你本机安装了 ccache，xmake 就会使用外置的 ccache。如果本机没有安装 ccache，就会降级到 xmake 内置的 xcache 跨平台本地缓存方案。

相比 ccache 等第三方独立进程，xmake 内部状态维护，更加便于优化，也避免了频繁的独立进程加载耗时，也避免了与守护进程额外的通信。

当然，我们也可以通过下面的命令禁用缓存。

```bash
# 禁用 xcache
$ xmake f -xxcache=n

# 禁用 ccache
$ xmake f --ccache=n
```

## nvcc 支持 ccache
