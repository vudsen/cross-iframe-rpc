// TODO support symbol.
export interface Messages {
  invokeRequest: {
    id: number
    path: Array<string | symbol>
    args: any[]
  },
  invokeFunctionByIdRequest: {
    id: string
    args: any[]
  },
  invokeResponse: {
    id: number
    data?: any
    error?: any
  }
  accessPropertyRequest: {
    id: number
    path: Array<string | symbol>
  }
  accessPropertyResponse: {
    id: number
    data: any
  }
}



export type MessageBody<K extends keyof Messages> = {
  type: K
  key: string
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


export type MessageDispatchFunctionArgs<K extends keyof Messages> = Messages[K] extends null ?
  [K] :
  [K, Messages[K]]

type MessageDispatchFunction = <K extends keyof Messages> (...args: MessageDispatchFunctionArgs<K>) => void

export interface MessageSender {
  sendMessage: MessageDispatchFunction
}

export interface MessageBridge {
  /**
   * 添加一个拦截器.
   * TODO, 同一个消息支持多个handler
   * @param handler
   */
  getMessageSender(): MessageSender
}
export const UNDEFINED = '$undefined$'

export type TypeofEnum =
  | 'undefined'
  | 'object'
  | 'boolean'
  | 'number'
  | 'bigint'
  | 'string'
  | 'symbol'
  | 'function';

export type Callable = (...args: any[]) => any
export type RegisterFunction = (func: Callable) => string

export interface MessageBridgeOptions {
  poster: MessagePoster
  /**
   * 注册一个函数
   * @param func
   * @return {string} 函数的id
   */
  registerFunction: (func: Callable) => string
  /**
   * 唯一的 key。当需要为多个对象创建桥梁时，需要指定不同的 Key
   */
  key: string
  /**
   * 最大函数缓存数量
   */
  maxFunctionCacheSize: number
  onMessage: <T extends keyof Messages>(callback: MessageBody<T>) => void
}