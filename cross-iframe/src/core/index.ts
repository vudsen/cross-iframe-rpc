import createProxy from './proxy'
import DefaultBridgeContext from './context'
import type { MessagePoster } from '../bridge/type'


export type ClientOptions<T> = {
  target: T,
  poster: MessagePoster,
  maxFunctionCacheSize?: number,
}

export const createBridgePeerClient = <T> (options: ClientOptions<T>): T => {
  const ctx = new DefaultBridgeContext({
    delegateTarget: options.target,
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
    ...options,
  })
  return createProxy({}, ctx) as T
}
