import { registerHandler } from '@/handler/factory'

registerHandler('accessPropertyRequest', (data, ctx) => {
  let current = ctx.getDelegateTarget()
  for (const visitStackTraceElement of data.path) {
    current = current[visitStackTraceElement]
  }
  ctx.getMessageBridge().getMessageSender().sendMessage('accessPropertyResponse', {
    id: data.id,
    data: current
  })
})

registerHandler('accessPropertyResponse', (data, ctx) => {
  ctx.getAndRemovePendingPromise(data.id)?.resolve(data.data)
})