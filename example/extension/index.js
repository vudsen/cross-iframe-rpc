import {createBridgePeerClient} from './lib/index.js'

window.onload = () => {
  const iframe = document.getElementById('iframe')
  createBridgePeerClient(window.chrome, {
    postMessage(str) {
      iframe.contentWindow.postMessage(str, '*')
    },
    addEventListener(name, callback) {
      addEventListener(name, callback)
    },
    removeEventListener(name, callback) {
      removeEventListener(name, callback)
    }
  })
}