import type { Callable, MessageBridge } from '@/bridge/type'

export type PromiseCallback = {
  resolve: (value: any) => void
  reject: (reason: any) => void
}

export interface BridgeContext {
  addAccessTrace(pathName: string | symbol, level: number): void
  invoke(args: any[]): Promise<any>
  accessProperty(): Promise<any>
  getMessageBridge(): MessageBridge
  getDelegateTarget(): any
  getFunctionById(id: string): Callable | undefined
  getAndRemovePendingPromise(id: number): PromiseCallback | undefined
}


export const INTERNAL_RESOLVE_CTX_FUNC = '$cross-iframe-rpc$internalResolveCtx'

function createHandler(o: any, context: BridgeContext, level: number): ProxyHandler<any> {
  return {
    get(_, path): any {
      if (path === INTERNAL_RESOLVE_CTX_FUNC) {
        return context
      }
      context.addAccessTrace(path, level)
      return new Proxy(function fake(){}, createHandler(o, context, level + 1))
    },
    apply(_: any, __: any, argArray: any[]): any {
      return context.invoke(argArray)
    }
  }
}

const createProxy = <T> (val: T, ctx: BridgeContext): T => {
  return new Proxy(val, createHandler(val, ctx, 1))
}

export default createProxy
