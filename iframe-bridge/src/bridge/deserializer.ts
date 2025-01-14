import type { Callable, TypeofEnum } from '@/bridge/type'
import { UNDEFINED } from '@/bridge/type'


type DeserializerOptions = {
  /**
   * 生成一个回调函数，该回调在调用后需要调用对端的函数。
   * @param peerId 对端的函数 id
   */
  generateCallback: (peerId: string) => Callable
}

const createMessageDeserializer = (options: DeserializerOptions) => {
  function resolveType(raw: string): TypeofEnum | undefined {
    if (raw[0] !== '$') {
      return
    }
    const p = raw.indexOf('$', 1)
    if (p == -1) {
      return undefined
    }
    // @ts-expect-error result is not in 'typeof'
    return raw.substring(1, p)
  }

  function deserializes0(arg: any): any {
    if (!arg || arg === UNDEFINED) {
      return undefined
    }
    if (typeof arg === 'object') {
      for (const key of Object.keys(arg)) {
        arg[key] = deserializes0(arg[key])
      }
      return arg
    } else if (Array.isArray(arg)) {
      for (let i = 0; i < arg.length; i++) {
        arg[i] = deserializes0(arg[i])
      }
      return arg
    }
    // expected string here
    if (typeof arg !== 'string') {
      throw new Error(`Unexpected type ${typeof arg}`)
    }
    const type = resolveType(arg)
    if (!type) {
      throw new Error('No type found: ' + arg)
    }
    if (type === 'function') {
      return options.generateCallback(arg.substring(type.length + 2))
    }
    const value = arg.substring(type.length + 2)
    switch (type) {
    case 'number':
      return Number.parseInt(value)
    case 'string':
      return value
    case 'boolean':
      return value === 'true'
    default:
      // TODO 有用到剩下的类型再加
      throw new Error(`Unexpected type ${typeof arg}`)
    }
  }

  return {
    deserialize(serialisedArgs: string): any {
      return deserializes0(JSON.parse(serialisedArgs))
    }
  }
}

export default createMessageDeserializer