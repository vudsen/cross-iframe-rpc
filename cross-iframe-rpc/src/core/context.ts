import type { Callable, MessageBridge, MessagePoster } from '@/bridge/type'
import type { BridgeContext, PromiseCallback } from './proxy'
import createMessageBridge from '../bridge'
import QuickLRU from 'quick-lru'
import '@/handler/init'
import { getHandler } from '@/handler/factory'

type DefaultBridgeContextOptions = {
  delegateTarget: any,
  poster: MessagePoster
  maxFunctionCacheSize?: number
  key: string
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
    const maxFunctionCacheSize = options.maxFunctionCacheSize ?? 50
    this.funcMapping = new QuickLRU<string, Callable>({ maxSize: maxFunctionCacheSize })
    this.bridge = createMessageBridge({
      key: options.key,
      maxFunctionCacheSize: maxFunctionCacheSize,
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
      },
      onMessage: (msg) => {
        getHandler(msg.type)(msg.data, this)
      }
    })
  }

  getAndRemovePendingPromise(id: number): PromiseCallback | undefined {
    const promise = this.pendingPromise.get(id)
    if (!promise) {
      return
    }
    this.pendingPromise.delete(id)
    return promise
  }

  getFunctionById(id: string): Callable | undefined {
    return this.funcMapping.get(id)
  }

  getDelegateTarget() {
    return this.delegateTarget
  }

  getMessageBridge(): MessageBridge {
    return this.bridge
  }

  accessProperty() {
    const id = this.invokeId++
    return new Promise((resolve, reject) => {
      this.pendingPromise.set(id, { resolve, reject })
      this.bridge.getMessageSender().sendMessage('accessPropertyRequest', {
        id,
        path: this.visitStackTrace,
      })
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
    return new Promise((resolve, reject) => {
      this.pendingPromise.set(id, { resolve, reject })
      this.bridge.getMessageSender().sendMessage('invokeRequest', {
        id,
        path: this.visitStackTrace,
        args,
      })
    })
  }

}

