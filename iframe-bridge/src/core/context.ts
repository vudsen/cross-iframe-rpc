import type { Callable, MessageBridge, MessagePoster, Messages } from '@/bridge/type'
import MessageBridgeImpl from '../bridge'
import type { BridgeContext } from './proxy'
import { isPromise } from '@/util'
import createMessageBridge from "../bridge";

type PromiseCallback = {
  resolve: (value: any) => void
  reject: (reason: any) => void
}



export default class DefaultBridgeContext implements BridgeContext {

  private delegateTarget: any
  private visitStackTrace: Array<string | symbol> = []
  private funcMapping = new Map<string, Callable>()
  private pendingPromise = new Map<number, PromiseCallback>()
  private lastId = 1
  private invokeId = 0
  private bridge: MessageBridge


  constructor(delegateTarget: any, poster: MessagePoster) {
    this.delegateTarget = delegateTarget
    this.bridge = createMessageBridge({
      poster,
      registerFunction: func => {
        const key = this.lastId.toString(10)
        this.lastId++
        this.funcMapping.set(key, func)

        return key
      }
    })
    this.bridge.addMessageHandler({
      type: 'invokeById',
      handleMessage: (data: Messages['invokeById']) =>{
        this.funcMapping.get(data.id)?.(...data.args)
      }
    })
    this.bridge.addMessageHandler({
      type: 'invoke',
      handleMessage: (data: Messages['invoke']) => {
        let current = this.delegateTarget
        for (const p of data.path) {
          current = current[p]
        }
        const val = current(...data.args)
        if (isPromise(val)) {
          val.then(r => {
            this.bridge.getMessageSender().sendMessage('invokeResponse', {
              id: data.id,
              data: r
            })
          }).catch(e => {
            this.bridge.getMessageSender().sendMessage('invokeResponse', {
              id: data.id,
              error: e
            })
          })
        }
      }
    })
    this.bridge.addMessageHandler({
      type: 'invokeResponse',
      handleMessage: (data: Messages['invokeResponse']) => {
        const promise = this.pendingPromise.get(data.id)
        if (promise) {
          if (data.data) {
            promise.resolve(data.data)
          } else if (data.error) {
            promise.reject(data.data)
          } else {
            promise.resolve(data.data)
          }
          this.pendingPromise.delete(data.id)
        }
      }
    })
  }

  addAccessTrace(pathName: string | symbol, level: number): void {
    while (this.visitStackTrace.length >= level) {
      this.visitStackTrace.pop()
    }
    this.visitStackTrace.push(pathName)
  }

  invoke(args: any[]): Promise<any> {
    const id = this.invokeId++
    this.bridge.getMessageSender().sendMessage('invoke', {
      id,
      path: this.visitStackTrace,
      args,
    })
    return new Promise((resolve, reject) => {
      this.pendingPromise.set(id, { resolve, reject })
    })
  }

}

