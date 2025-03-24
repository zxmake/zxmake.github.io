---
class: heading_no_counter
---

# 切换主题

如果用户不喜欢 xmake 默认的显示配色和风格，我们可以通过下面的全局配置命令，来切换到 xmake 提供的其他一些配置主题上去，例如：

```bash
$ xmake g --theme=dark
```

默认的主题名为 default，这里我们通过切换到 dark 风格主题，来适配一些终端背景很浅的场景，提供更加深色的色彩输出，避免看不清。

如果我们要切回默认主题，可以直接敲：

```bash
$ xmake g -c
```

或者

```bash
$ xmake g --theme=default
```
