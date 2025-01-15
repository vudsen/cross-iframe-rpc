# cross-iframe-rpc

为 iframe 和主窗口建立"桥梁"，让 iframe 可以跨域调用主窗口的代码，类似于 RPC 调用, 但添加了回调支持.

## 它可以干什么?

该项主要目意图是用于 chrome 拓展开发。在设置完成后，您可以在 iframe 内部直接调用 chrome API!

---

正常情况下，chrome 拓展的代码有两种 组织/编写 方法:

- 不借助任何工具，直接编写
- 借助 rollup、webpack 等工具打包后编写

对于前者，只适合轻量的拓展，对于一些较大的拓展，我们必须的借助打包工具。

而对于后者，由于 chrome [严格的 CSP 限制](https://developer.chrome.google.cn/docs/extensions/reference/manifest/content-security-policy#extension_pages_policy)，
导致几乎只能使用 `build` + `watch` 的方式进行开发，这种方式打包非常慢，而且非常占用性能。

**那么能不能借助 vite 等工具启动一个 Web 服务器，然后让拓展页面访问我们的开发服务器呢?**

在一番研究后，发现可以使用 iframe 来完成这个需求。但是在 iframe 中无法使用 Chrome Api, **而这个问题，就是这个库要解决的问题**。

### 原理

在主窗口和 iframe 中监听 `message` 事件，并使用 `postMessage` 来间接调取 API。

## 快速开始

[演示项目](/example)

安装依赖:

```shell
npm install cross-iframe-rpc
```

### 1. 固定开发服务器端口

首先你需要固定开发服务器的端口，例如 Vite:

```ts
export default defineConfig({
  server: {
    port: 17000,
    strictPort: true
  },
})
```

### 2. 创建初始化脚本

创建一个 Html 模板，然后通过 iframe 导入页面([popup-dev.html](/example/popup-dev.html)):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
</head>
<body style="margin: 0">
<!-- src is your dev server's page -->
<iframe style="width: 500px;height: 500px;border:none;" id="iframe" src="http://localhost:17000/popup/popup.html"></iframe>
<!-- Additional script, check step 3  -->
<script type="module" src="popup.ts"></script>
</body>
</html>
```

[popup.ts](/example/src/dev/popup.ts):

```ts
// popup.ts
import {createBridgePeerClient} from "cross-iframe-rpc";

const iframe = document.getElementById('iframe') as HTMLIFrameElement
createBridgePeerClient({
  target: chrome,
  poster: {
    postMessage(str) {
      iframe.contentWindow!.postMessage(str, '*')
    },
    addEventListener(name, callback) {
      addEventListener(name, callback)
    },
    removeEventListener(name, callback) {
      removeEventListener(name, callback)
    }
  }
})
```


### 3. 配置开发服务器页面代码

参考 [main.tsx](/example/src/pages/popup/main.tsx):

```ts
if (process.env.NODE_ENV === 'development') {
  window.chrome = createBridgePeerClient({
    target: chrome,
    poster: {
      postMessage(str) {
        window.parent.window.postMessage(str, '*')
      },
      addEventListener(name, callback) {
        window.addEventListener(name, (evt) => {
          callback(evt)
        })
      },
      removeEventListener(name, callback) {
        window.removeEventListener(name, callback)
      }
    }
  })
}
```

这个文件应该是你开发服务器的入口文件，在这里我们将会创建一个 "客户端", 用于和外层的窗口通信。

### 4. 在开发服务器代码中使用 Chrome API

详见 [App.tsx](/example/src/pages/popup/App.tsx)

```ts
// 没有任何额外步骤，直接使用 API 即可
const tabs = await chrome.tabs.query({ currentWindow: true, active: true })
alert('Your current tab url is:\n' + tabs[0].url)
```

## 限制

- 只允许函数调用
- 调用的返回值总是 `Promise`

## API

### createBridgePeerClient

创建一个对等的客户端。

---

#### 参数

**target** any 

要代理的对象，当提供该值后，对端的客户端可以调用该对象的相关 API。

---

**poster** MessagePoster

事件相关的 API。

---

**maxFunctionCacheSize** number *Optional*

最大函数缓存数量，默认为 50。

由于回调函数的生命周期并不确定，所以只能全部缓存下来以防被回收。所以这里存在一个最大缓存数量，当超过最大数量时将会清除最久未使用的函数。
