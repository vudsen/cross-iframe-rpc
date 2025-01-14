import createProxy from './proxy'
import DefaultBridgeContext from './context'
import type { MessagePoster } from '../bridge/type'


export const createBridgePeerClient = <T> (val: T, poster: MessagePoster) => {
  const ctx = new DefaultBridgeContext(val, poster)
  return createProxy(val, ctx)
}

export const createBridePeerClientWithTypeOnly = <T> (poster: MessagePoster): T => {
  const ctx = new DefaultBridgeContext({}, poster)
  return createProxy({}, ctx) as T
}

