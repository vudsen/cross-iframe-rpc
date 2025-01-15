import createProxy from './proxy'
import type { ValueGetter } from './context'
import DefaultBridgeContext from './context'
import type { MessagePoster } from '../bridge/type'



export const createBridgePeerClient = <T> (val: ValueGetter<T>, poster: MessagePoster) => {
  const ctx = new DefaultBridgeContext(val, poster)
  return createProxy(val, ctx)
}

export const createBridePeerClientWithTypeOnly = <T> (poster: MessagePoster): T => {
  const ctx = new DefaultBridgeContext(() => {}, poster)
  return createProxy({}, ctx) as T
}

