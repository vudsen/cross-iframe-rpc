import type { Callable, MessageBridge, MessagePoster, Messages } from '@/bridge/type'
import type { BridgeContext } from './proxy'
import { isPromise } from '@/util'
import createMessageBridge from '../bridge'
import QuickLRU from 'quick-lru'

type PromiseCallback = {
  resolve: (value: any) => void
  reject: (reason: any) => void
}


type DefaultBridgeContextOptions = {
  delegateTarget: any,
  poster: MessagePoster
  maxFunctionCacheSize?: number
}

export default class DefaultBridgeContext implements BridgeContext {

  private delegateTarget: Record<string | symbol, any>
  private visitStackTrace: Array<string | symbol> = []
  // 不能直接使用 WeakMap，回调一般由远程的窗口保持强引用，自己本地是没有强引用的，所以可能导致本地的回调被回收
  private funcMapping
  private funcMappingToId = new WeakMap<Callable, string>()
  private pendingPromise = new Map<number, PromiseCallback>()
  private lastId = 1
  private invokeId = 0
  private bridge: MessageBridge


  constructor(options: DefaultBridgeContextOptions) {
    this.delegateTarget = options.delegateTarget
    this.funcMapping = new QuickLRU<string, Callable>({ maxSize: options.maxFunctionCacheSize ?? 50 })
    this.bridge = createMessageBridge({
      poster: options.poster,
      registerFunction: func => {
        const cached = this.funcMappingToId.get(func)
        if (cached) {
          return cached
        }
        const key = this.lastId.toString(10)
        this.lastId++
        this.funcMapping.set(key, func)
        this.funcMappingToId.set(func, key)

        return key
      }
    })
    this.bridge.addMessageHandler({
      type: 'invokeById',
      handleMessage: (data: Messages['invokeById']) =>{
        const func = this.funcMapping.get(data.id)
        if (!func) {
          throw new Error('TODO')
        }
        func(...data.args)
      }
    })
    this.bridge.addMessageHandler({
      type: 'invoke',
      handleMessage: (data: Messages['invoke']) => {
        let current = this.delegateTarget
        let last = null
        for (const p of data.path) {
          last = current
          current = current[p]
        }
        const val = current.apply(last, data.args)
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

