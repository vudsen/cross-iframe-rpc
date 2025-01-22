import type { ListenerCallback, MessagePoster } from 'cross-iframe-rpc'
import { createBridePeerClientWithTypeOnly, createBridgePeerClient } from 'cross-iframe-rpc'

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

export const createClientAndServer = <T> (remoteObj: T) => {
  const { posterA, posterB } = createSimpleMessagePoster()
  const server = createBridgePeerClient({
    target: remoteObj,
    poster: posterA
  })
  const client = createBridePeerClientWithTypeOnly<T>({
    poster: posterB
  })
  return {
    client,
    server
  }
}