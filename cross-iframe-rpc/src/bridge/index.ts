import type {
  Callable,
  ListenerCallback,
  MessageBody,
  MessageBridge,
  MessageBridgeOptions,
  MessageHandler,
  Messages, MessageSender
} from './type'
import createMessageSerializer from './serializer'
import createMessageDeserializer from '@/bridge/deserializer'
import createMessageSender from '@/bridge/sender'

type MyWeakKey = {
  id: string
}

const createMessageBridge = (options: MessageBridgeOptions): MessageBridge => {
  const key = options.key ?? 'Default'
  const serializer = createMessageSerializer(options)
  const sender = createMessageSender({
    key,
    serializer: serializer,
    poster: options.poster
  })
  const peerCallbackCache = new WeakMap<MyWeakKey, Callable>()

  const deserializer = createMessageDeserializer({
    generateCallback: (peerId) => {
      const key = { id: peerId }
      const cached = peerCallbackCache.get(key)
      if (cached) {
        return cached
      }
      const func =  (...args: any[]) => {
        sender.sendMessage('invokeById', {
          id: peerId,
          args
        })
      }
      peerCallbackCache.set(key, func)
      return func
    }
  })
  const handlerMap = new Map<keyof Messages, MessageHandler<any>>()
   
  const listenerCallback: ListenerCallback = (evt) => {
    if (typeof evt.data !== 'string') {
      return
    }
    const data = deserializer.deserialize(evt.data) as MessageBody<any>
    if (data.type && data.key === options.key) {
      handlerMap.get(data.type)?.handleMessage(data.data)
    }
  }
  // TODO remove listener.
  options.poster.addEventListener('message', listenerCallback)
  
  return {
    addMessageHandler<K extends keyof Messages>(handler: MessageHandler<K>) {
      handlerMap.set(handler.type, handler)
    },
    getMessageSender(): MessageSender {
      return sender
    }
  }
}

export default createMessageBridge