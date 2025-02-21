# Start

## 安装

> <https://teedoc.github.io/get_started/zh/usage/quick_start.html>

```bash
# 安装软件
sudo apt install python3 python3-pip git
pip3 install teedoc -i https://pypi.tuna.tsinghua.edu.cn/simple

# 更新软件
pip3 install -U teedoc

# 新建工程
mkdir xmake-teedoc
cd xmake-teedoc
teedoc init

# (可选) 基于官网文档源码修改
git clone https://github.com/teedoc/teedoc.github.io my_site

# 安装插件
cd xmake-teedoc
teedoc -i https://pypi.tuna.tsinghua.edu.cn/simple install
```

## 运行

```bash
# 构建所有的 html 页面以及拷贝资源文件
teedoc build

# 启动一个 HTTP 服务
teedoc serve
```
