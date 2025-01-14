import type {
  ListenerCallback,
  MessageBody,
  MessageBridge,
  MessageBridgeOptions,
  MessageDispatchFunctionArgs,
  MessageHandler,
  Messages
} from './type'
import DataSerializer from './serializer'
import { deepCopy } from '../util'

export default class MessageBridgeImpl implements MessageBridge {

  private handlerMap = new Map<keyof Messages, MessageHandler<any>>()
  private argSerializer

  constructor(private options: MessageBridgeOptions) {
    this.argSerializer = new DataSerializer({
      registerFunction: options.registerFunction,
      generateCallback: (peerId) => {
        return (...args: any[]) => {
          this.sendMessage('invokeById', {
            id: peerId,
            args
          })
        }
      }
    })
    this.listenerCallback = this.listenerCallback.bind(this)
    this.options.poster.addEventListener('message', this.listenerCallback)
  }

  listenerCallback: ListenerCallback = (evt) => {
    if (typeof evt.data !== 'string') {
      return
    }
    const data = this.argSerializer.deserialize(evt.data) as MessageBody<any>
    if (data.type) {
      this.handlerMap.get(data.type)?.handleMessage(data.data)
    }
  }

  addMessageHandler<K extends keyof Messages>(handler: MessageHandler<K>): void {
    this.handlerMap.set(handler.type, handler)
  }

  sendMessage<K extends keyof Messages> (...args: MessageDispatchFunctionArgs<K>) {
    const body: MessageBody<any> = {
      type: args[0],
      data: args[1]
    }
    this.options.poster.postMessage(this.argSerializer.serialise(deepCopy(body)))
  }

}
