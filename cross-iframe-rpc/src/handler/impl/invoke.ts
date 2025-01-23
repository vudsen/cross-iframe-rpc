import { registerHandler } from '@/handler/factory'
import { isPromise } from '@/util'

registerHandler('invokeRequest', (data, ctx) => {
  let current = ctx.getDelegateTarget()
  let last = null
  for (const p of data.path) {
    last = current
    current = current[p]
  }
  const val = current.apply(last, data.args)
  if (isPromise(val)) {
    val.then(r => {
      ctx.getMessageBridge().getMessageSender().sendMessage('invokeResponse', {
        id: data.id,
        data: r
      })
    }).catch(e => {
      ctx.getMessageBridge().getMessageSender().sendMessage('invokeResponse', {
        id: data.id,
        error: e
      })
    })
  }
})


registerHandler('invokeFunctionByIdRequest', (data, ctx) => {
  const func = ctx.getFunctionById(data.id)
  if (!func) {
    throw new Error('TODO')
  }
  func(...data.args)
})


registerHandler('invokeResponse', (data, ctx) => {
  const promise = ctx.getAndRemovePendingPromise(data.id)
  if (promise) {
    if (data.data) {
      promise.resolve(data.data)
    } else if (data.error) {
      promise.reject(data.data)
    } else {
      promise.resolve(data.data)
    }
  }
})