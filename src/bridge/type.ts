export interface Messages {
  invoke: {
    id: number
    path: Array<string | symbol>
    args: any[]
  },
  invokeById: {
    id: string
    args: any[]
  },
  invokeResponse: {
    id: number
    data?: any
    error?: any
  }
}


export type MessageDispatchFunctionArgs<K extends keyof Messages> = Messages[K] extends null ?
  [K] :
  [K, Messages[K]]

type MessageDispatchFunction = <K extends keyof Messages> (...args: MessageDispatchFunctionArgs<K>) => void

export type MessageBody<K extends keyof Messages> = {
  type: K
  data: Messages[K]
}

type EvtData = {
  data: unknown
}

export type ListenerCallback = (evt: EvtData) => void

export interface MessagePoster {
  postMessage(string: string): void
  addEventListener(name: 'message', callback: ListenerCallback): void
  removeEventListener(name: 'message', callback: ListenerCallback): void
}

export interface MessageHandler<K extends keyof Messages> {
  type: K
  handleMessage(data: Messages[K]): void
}

export interface MessageBridge {
  /**
   * 添加一个拦截器.
   * TODO, 同一个消息支持多个handler
   * @param handler
   */
  addMessageHandler<K extends keyof Messages>(handler: MessageHandler<K>): void
  sendMessage: MessageDispatchFunction
}

export type Callable = (...args: any[]) => any
export interface MessageBridgeOptions {
  poster: MessagePoster
  /**
   * 注册一个函数
   * @param func
   * @return {string} 函数的id
   */
  registerFunction: (func: Callable) => string
}