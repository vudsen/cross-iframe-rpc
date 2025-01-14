export interface BridgeContext {
  addAccessTrace(pathName: string | symbol, level: number): void
  invoke(args: any[]): Promise<any>
}

function createHandler(o: any, context: BridgeContext, level: number): ProxyHandler<any> {
  return {
    get(_, path): any {
      context.addAccessTrace(path, level)

      return new Proxy(o[path] ?? function fake() {}, createHandler(o, context, level + 1))
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
