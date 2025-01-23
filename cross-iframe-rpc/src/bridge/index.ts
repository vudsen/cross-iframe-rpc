import type {
  Callable,
  ListenerCallback,
  MessageBody,
  MessageBridge,
  MessageBridgeOptions,
  MessageSender
} from './type'
import createMessageSerializer from './serializer'
import createMessageDeserializer from '@/bridge/deserializer'
import createMessageSender from '@/bridge/sender'
import { info } from '@/logger'
import QuickLRU from 'quick-lru'


const createMessageBridge = (options: MessageBridgeOptions): MessageBridge => {
  const key = options.key ?? 'Default'
  const serializer = createMessageSerializer(options)
  const sender = createMessageSender({
    key,
    serializer: serializer,
    poster: options.poster
  })
  const peerCallbackCache = new QuickLRU<string, Callable>({ maxSize: options.maxFunctionCacheSize })

  const deserializer = createMessageDeserializer({
    generateCallback: (peerId) => {
      const cached = peerCallbackCache.get(peerId)
      if (cached) {
        return cached
      }
      const func =  (...args: any[]) => {
        sender.sendMessage('invokeFunctionByIdRequest', {
          id: peerId,
          args
        })
      }
      peerCallbackCache.set(peerId, func)
      return func
    }
  })
   
  const listenerCallback: ListenerCallback = (evt) => {
    if (typeof evt.data !== 'string') {
      return
    }
    const data = deserializer.deserialize(evt.data) as MessageBody<any>
    info('RECEIVE', data)
    if (data.type && data.key === options.key) {
      options.onMessage(data)
    }
  }
  // TODO remove listener.
  options.poster.addEventListener('message', listenerCallback)

  return {
    getMessageSender(): MessageSender {
      return sender
    }
  }
}

export default createMessageBridge