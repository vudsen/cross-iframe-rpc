import type { MessageBody, MessageDispatchFunctionArgs, MessagePoster, Messages, MessageSender } from '@/bridge/type'
import { deepCopy } from '@/util'
import type { MessageSerializer } from '@/bridge/serializer'



const createMessageSender = (poster: MessagePoster, serializer: MessageSerializer): MessageSender => {
  return {
    sendMessage<K extends keyof Messages> (...args: MessageDispatchFunctionArgs<K>) {
      const body: MessageBody<any> = {
        type: args[0],
        data: args[1]
      }
      poster.postMessage(serializer.serialise(deepCopy(body)))
    }
  }
}

export default createMessageSender