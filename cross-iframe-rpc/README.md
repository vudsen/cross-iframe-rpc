# cross-iframe-rpc

- [中文文档](https://github.com/IceOfSummer/cross-iframe-rpc/blob/master/cross-iframe-rpc/README-zh.md)
- [Example] (https://github.com/vudsen/iframe-chrome-extension-template)


Build a bridge between the iframe and the main window; it allows the iframe to cross-origin invoke functions in the main window.
Similar to the RPC, but it added callback support. 

## What can it do?

The main purpose of this project is to develop a Chrome Extension. After everything setup, you can invoke chrome API in 
your iframe directly!

---

Generally, we have two ways to develop/organize our code in a Chrome Extension:

- Without any build tool, write everything yourself.
- Using `rollup`, `webpack`, etc., to build the code.

The first one is a good choice if your extension is light. But for some bigger extensions, it’s better to depend on build tools.

Because of the [strict CSP limitations](https://developer.chrome.google.cn/docs/extensions/reference/manifest/content-security-policy#extension_pages_policy),
We could only use `build` + `watch` to develop our extension. It is very slow and has bad performance.

**Why can't we start a web development server through Vite or other tools and let the extension page use our development server? **

After some research, I found that an iframe could do this. However,
we can't access the Chrome API in our iframe, **and that is what our library will do**.

### Theory

Listen for the `message` event in the main window and iframe, and use `postMessage` to invoke the API indirectly.

## Quick Start

[Demo Project](https://github.com/IceOfSummer/iframe-chrome-extension-template)

Install dependency:

```shell
npm install cross-iframe-rpc
```

### 1. Set The Dev Server Port Fixed.

You have to set your dev server port fixed. For example(Vite):

```ts
export default defineConfig({
  server: {
    port: 17000,
    strictPort: true
  },
})
```

### 2. Create Basic Template

Create a Html template, and import the page via an iframe([popup-dev.html](https://github.com/IceOfSummer/cross-iframe-rpc/blob/master/example/popup.html)):

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

[popup.ts](https://github.com/IceOfSummer/cross-iframe-rpc/blob/master/example/src/dev/popup.ts):

```ts
// popup.ts
import {setupInMainWindow} from "cross-iframe-rpc";

const iframe = document.getElementById('iframe') as HTMLIFrameElement
setupInMainWindow({
  iframe,
  delegateTarget: chrome,
})
```

### 3. Create Init Script In Dev Server

See [main.tsx](https://github.com/IceOfSummer/cross-iframe-rpc/blob/master/example/src/pages/popup/main.tsx):

```ts
import { setupInIframe } from 'cross-iframe-rpc'

if (process.env.NODE_ENV === 'development') {
  window.chrome = setupInIframe<typeof chrome>()
}
```

This file should be your page entrance. We created a 'client' here; it will communicate with the outer window.

### 4. Use Chrome Api In Your Dev Server Code

See [App.tsx](https://github.com/IceOfSummer/cross-iframe-rpc/blob/master/example/src/pages/popup/App.tsx)

```ts
// no additional steps, use chrome directly.
const tabs = await chrome.tabs.query({ currentWindow: true, active: true })
alert('Your current tab url is:\n' + tabs[0].url)
```

## Limitations

- Only allow function invoke.
- The type of return value always be `Promise`.

## API

### createBridgePeerClient

Create a peer client.

---

#### Parameters

**target** any

The object that you want to proxy. After you provide this, the corresponding client could invoke the API on this object.

---

**poster** MessagePoster

The events API.

---

**maxFunctionCacheSize** number *Optional*

Max function cache size, default is 50.

Because the lifecycle of the function is uncertain, we could only cache all the functions to avoid being recycled.
When it reaches this size, the least recently unused function will be removed.

### accessProperty

Access specific property.

---

#### Parameters

**target** object

Proxied target, see example below for more details.

#### Example

```typescript
import { createBridePeerClientWithTypeOnly, accessProperty } from 'cross-iframe-rpc'
// remote
const remoteObject = {
    round: {
      apple: 'yummy!'
    }
}

// client
const obj = createBridePeerClientWithTypeOnly<typeof remoteObject>({
  // ...
})

accessProperty(await accessProperty(obj.round.apple)).then(r => {
  // yummy!
  console.log(r)
})
```