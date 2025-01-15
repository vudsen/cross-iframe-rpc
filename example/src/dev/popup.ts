import {createBridgePeerClient} from "cross-iframe";

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
