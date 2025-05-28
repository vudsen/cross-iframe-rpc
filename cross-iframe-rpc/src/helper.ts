import { createBridePeerClientWithTypeOnly, createBridgePeerClient } from '@/core'
import { setLoggerEnabled } from '@/logger'
import { isPromise } from '@/util'

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

/**
 * Try cast the result to a Promise.
 * It's used for the non-async chrome api. Because of the bridge, the non-async turned into async. This makes us hard to code.
 *
 * So wrap the sync api with this function, to make it same in both production and development.
 *
 * Such as: `tryPromisify(chrome.i18n.getMessage('xxx')).then(translation => console.log(translation))`
 * @param result
 */
export const tryPromisify = <T> (result: T): Promise<T> => {
  if (isPromise(result)) {
    return result as Promise<T>
  }
  return Promise.resolve(result)
}