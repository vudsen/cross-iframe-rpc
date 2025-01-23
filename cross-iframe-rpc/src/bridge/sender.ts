import type { MessageBody, MessageDispatchFunctionArgs, MessagePoster, Messages, MessageSender } from '@/bridge/type'
import { deepCopy } from '@/util'
import type { MessageSerializer } from '@/bridge/serializer'
import { info } from '@/logger'



type SenderOptions = {
  poster: MessagePoster
  serializer: MessageSerializer
  key: string
}

const createMessageSender = (options: SenderOptions): MessageSender => {
  return {
    sendMessage<K extends keyof Messages> (...args: MessageDispatchFunctionArgs<K>) {
      const body: MessageBody<any> = {
        type: args[0],
        data: args[1],
        key: options.key
      }
      info('POST', body)
      options.poster.postMessage(options.serializer.serialise(deepCopy(body)))
    }
  }
}

export default createMessageSender