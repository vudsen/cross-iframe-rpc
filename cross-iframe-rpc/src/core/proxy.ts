import type { Callable, MessageBridge } from '@/bridge/type'

export type PromiseCallback = {
  resolve: (value: any) => void
  reject: (reason: any) => void
}

export interface BridgeContext {
  invoke(path: Array<string | symbol>, args: any[]): Promise<any>
  accessProperty(path: Array<string | symbol>): Promise<any>
  getMessageBridge(): MessageBridge
  getDelegateTarget(): any
  getFunctionById(id: string): Callable | undefined
  getAndRemovePendingPromise(id: number): PromiseCallback | undefined
}

interface ProxyObj {
  parent?: ProxyObj
  path: string | symbol
}

export const INTERNAL_RESOLVE_CTX_FUNC = '$cross-iframe-rpc$internalResolveCtx'
export const INTERNAL_RESOLVE_CURRENT_PATH = '$cross-iframe-rpc$internalResolveCurrentPath'

function resolvePath(obj: ProxyObj): Array<string | symbol> {
  const path: Array<string | symbol> = []
  let current: ProxyObj | undefined = obj
  while (current && current.parent) {
    path.push(current.path)
    current = current.parent
  }
  path.reverse()
  return path
}

const fakeFunction = () => {}

function createHandler(
  o: any,
  context: BridgeContext,
  obj: ProxyObj
): ProxyHandler<any> {
  return {
    get(_, path): any {
      if (path === INTERNAL_RESOLVE_CTX_FUNC) {
        return context
      } else if (path === INTERNAL_RESOLVE_CURRENT_PATH) {
        return resolvePath(obj)
      }
      return new Proxy(fakeFunction, createHandler(o, context, {
        parent: obj,
        path: path
      }))
    },
    apply(_: any, __: any, argArray: any[]): any {
      return context.invoke(resolvePath(obj), argArray)
    }
  }
}

const createProxy = <T> (val: T, ctx: BridgeContext): T => {
  return new Proxy(val, createHandler(val, ctx, {
    path: '',
  }))
}

export default createProxy
