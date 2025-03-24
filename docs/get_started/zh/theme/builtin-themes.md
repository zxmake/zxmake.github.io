---
class: heading_no_counter
---

# 内置主题

## 默认主题

这个也就是咱们安装 xmake 后默认的显示主题，主题名：default，它默认会提供色彩输出，适合一些深色背景的终端。

<img src="/assets/img/theme/default.png" width="60%" />

我们也可以通过下面的命令切回默认主题：

```bash
$ xmake g --theme=default
```

## Ninja 主题

构建进度风格类似 ninja，采用单行进度条，不再回滚进度，用户可以根据自己的喜好设置。

除了进度展示不同外，其他都跟默认主题的配置相同。

```bash
$ xmake g --theme=ninja
```

<img src="/assets/img/theme/ninja.png" width="60%" />

## Emoji 主题

这个主题部分输出通过 emoji 字符代替之前的色彩输出。

```bash
$ xmake g --theme=emoji
```

<img src="/assets/img/theme/emoji.png" width="60%" />

## Dark 主题

这个主题主要是对一些终端背景是浅色系（比如淡黄色等），导致一些警告输出（默认也是黄色）重合不可见，所以把主题配色变成深色系，提高可见性。

```bash
$ xmake g --theme=dark
```

## Light 主题

这个主题主要是对一些终端背景是深色系，导致一些输出重合不可见，所以把主题配色变成浅色系，提高可见性。

```bash
$ xmake g --theme=light
```

## Plain 主题

这个主题，其实就是完全禁用色彩、emoji 输出，主要是应对一些不支持 colors code 的终端导致显示乱码的问题，也是最朴素的主题风格。

```bash
$ xmake g --theme=plain
```
