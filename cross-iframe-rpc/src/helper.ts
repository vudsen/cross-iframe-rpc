import { createBridePeerClientWithTypeOnly, createBridgePeerClient } from '@/core'
import { setLoggerEnabled } from '@/logger'

export type SetupInMainWindowOptions<T> = {
  iframe: HTMLIFrameElement
  delegateTarget: T
}

export const setupInMainWindow = <T> (options: SetupInMainWindowOptions<T>): T => {
  // No need to log twice.
  setLoggerEnabled(false)
  return createBridgePeerClient({
    target: options.delegateTarget,
    poster: {
      postMessage(str) {
        options.iframe.contentWindow!.postMessage(str, '*')
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

export const setupInIframe = <T> (): T => {
  return createBridePeerClientWithTypeOnly<T>({
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