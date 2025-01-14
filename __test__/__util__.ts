import type { ListenerCallback, MessagePoster } from '../src/bridge/type'

export const createSimpleMessagePoster = () => {
  const msgBoxACallbacks: ListenerCallback[] = []
  const msgBoxBCallbacks: ListenerCallback[] = []


  const posterA: MessagePoster = {
    postMessage(string: string) {
      for (const msgBoxBCallback of msgBoxBCallbacks) {
        msgBoxBCallback({
          data: string
        })
      }
    },
    addEventListener(_, callback) {
      msgBoxACallbacks.push(callback)
    },
    removeEventListener(_, callback: ListenerCallback) {
      msgBoxACallbacks.splice(msgBoxACallbacks.indexOf(callback), 1)
    }
  }

  const posterB: MessagePoster = {
    postMessage(string: string) {
      for (const msgBoxBCallback of msgBoxACallbacks) {
        msgBoxBCallback({
          data: string
        })
      }
    },
    addEventListener(_, callback) {
      msgBoxBCallbacks.push(callback)
    },
    removeEventListener(_, callback: ListenerCallback) {
      msgBoxBCallbacks.splice(msgBoxBCallbacks.indexOf(callback), 1)
    }
  }

  return {
    posterA,
    posterB
  }
}