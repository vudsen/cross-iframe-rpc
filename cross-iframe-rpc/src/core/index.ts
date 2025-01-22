import type { BridgeContext } from './proxy'
import createProxy, { INTERNAL_RESOLVE_CTX_FUNC } from './proxy'
import DefaultBridgeContext from './context'
import type { MessagePoster } from '../bridge/type'


export type ClientOptions<T> = {
  target: T,
  poster: MessagePoster,
  maxFunctionCacheSize?: number,
  key?: string
}

export const createBridgePeerClient = <T> (options: ClientOptions<T>): T => {
  const ctx = new DefaultBridgeContext({
    delegateTarget: options.target,
    key: options.key ?? 'Default',
    ...options,
  })
  return createProxy({}, ctx) as T
}

/**
 * 仅提供类型进行创建
 * @param options
 */
export const createBridePeerClientWithTypeOnly = <T> (options: Omit<ClientOptions<T>, 'target'>): T => {
  const ctx = new DefaultBridgeContext({
    delegateTarget: {},
    key: options.key ?? 'Default',
    ...options,
  })
  return createProxy({}, ctx) as T
}

/**
 * 获取属性
 * @param target 被代理的对象
 */
export const accessProperty  = <T> (target: T): Promise<T> => {
  // @ts-expect-error target is undefined.
  const ctx = target[INTERNAL_RESOLVE_CTX_FUNC] as BridgeContext
  if (!ctx) {
    throw new Error('Not a proxied object!')
  }
  return ctx.accessProperty()
}