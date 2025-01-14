import type {
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

const createMessageBridge = (options: MessageBridgeOptions): MessageBridge => {
  const serializer = createMessageSerializer(options)
  const sender = createMessageSender(options.poster, serializer)
  const deserializer = createMessageDeserializer({
    generateCallback: (peerId) => {
      return (...args: any[]) => {
        sender.sendMessage('invokeById', {
          id: peerId,
          args
        })
      }
    }
  })
  const handlerMap = new Map<keyof Messages, MessageHandler<any>>()
   
  const listenerCallback: ListenerCallback = (evt) => {
    if (typeof evt.data !== 'string') {
      return
    }
    const data = deserializer.deserialize(evt.data) as MessageBody<any>
    if (data.type) {
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