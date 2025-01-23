import type { Messages } from '@/bridge/type'
import type { BridgeContext } from '@/core/proxy'

export interface MessageHandler<K extends keyof Messages> {
  (data: Messages[K], ctx: BridgeContext): void
}

const handlerMapping = new Map<keyof Messages, MessageHandler<any>>()


export function registerHandler<T extends keyof Messages>(evt: T, handler: MessageHandler<T>): void {
  handlerMapping.set(evt, handler)
}

export function getHandler<T extends keyof Messages>(evt: T): MessageHandler<T> {
  const handler = handlerMapping.get(evt)
  if (handler) {
    return handler
  }
  throw new Error(`Unsupported message type: ${evt}`)
}
