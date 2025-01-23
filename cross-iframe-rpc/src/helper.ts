import { createBridePeerClientWithTypeOnly, createBridgePeerClient } from '@/core'

export type SetupInMainWindowOptions<T> = {
  iframe: HTMLIFrameElement
  delegateTarget: T
}

export const setupInMainWindow = <T> (options: SetupInMainWindowOptions<T>): T => {
  return createBridgePeerClient({
    target: options.delegateTarget,
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