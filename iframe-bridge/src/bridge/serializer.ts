import type { Callable } from '@/bridge/type'
import { UNDEFINED } from '@/bridge/type'

type SerializerOptions = {
  /**
   * 注册一个函数
   * @param func
   * @return {string} 函数的id
   */
  registerFunction: (func: Callable) => string
}

export interface MessageSerializer {
  serialise(data: any): string
}

const createMessageSerializer = (options: SerializerOptions): MessageSerializer => {

  function serialise0(arg: any): any {
    if (arg === undefined || arg === null) {
      return UNDEFINED
    }
    if (typeof arg === 'object') {
      for (const key of Object.keys(arg)) {
        arg[key] = serialise0(arg[key])
      }
      return arg
    } else if (Array.isArray(arg)) {
      for (let i = 0; i < arg.length; i++) {
        arg[i] = serialise0(arg[i])
      }
    } else if (typeof arg === 'function') {
      return '$function$' + options.registerFunction(arg)
    } else {
      return `$${typeof arg}$${arg}`
    }
  }

  return {
    serialise(data: any): string {
      return JSON.stringify(serialise0(data))
    }
  }
}

export default createMessageSerializer