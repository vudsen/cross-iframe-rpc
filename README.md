# iframe-bridge

为 iframe 和主窗口建立"桥梁"，使得 iframe 可以跨域调用主窗口的代码。

## 它可以干什么

该项主要目意图是用于 chrome 拓展开发。

---

正常情况下，chrome 拓展的代码有两种 组织/编写 方法:

- 不借助任何工具，直接编写 
- 借助 rollup、webpack 等工具打包后编写

对于前者，只适合轻量的拓展。而对于后者，由于 chrome [严格的 CSP 限制](https://developer.chrome.google.cn/docs/extensions/reference/manifest/content-security-policy#extension_pages_policy)，
导致几乎只能使用 `build` + `watch` 的方式进行开发，这种方式冷启动速度非常慢，而且非常占用性能。

那么能不能借助 vite 等工具启动一个 Web 服务器，然后让拓展页面访问我们的开发服务器呢?

这个想法很不错，但是现实很残酷，google 几乎禁止了这种方式来直接访问外部页面。

在一番研究后，发现可以使用 iframe 来加载外部资源，并且可以完美和 vite 等工具结合。
不过在 iframe 中无法使用 chrome api, **而这个问题，就是这个库要解决的问题**。

### 原理

在主窗口和 iframe 中监听 `message` 事件，并使用 `postMessage` 来间接调取 API。

## 快速开始

> [!CAUTION]
> 目前无法保证所有 API 都可以通过该方式间接调用，请尽量只在开发环境中使用。
> 
> 在打包时，将 `process.env.NODE_ENV` 设置为 `production`，该库将会直接调用 chrome API，而不是间接调用。

🚧🚧 项目仍在开发中 🚧🚧


