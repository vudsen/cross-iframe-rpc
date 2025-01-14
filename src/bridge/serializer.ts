import type { Callable } from '@/bridge/type'

const UNDEFINED = '$undefined$'

type TypeofEnum =
  | 'undefined'
  | 'object'
  | 'boolean'
  | 'number'
  | 'bigint'
  | 'string'
  | 'symbol'
  | 'function';


type DataSerializerOptions = {
  /**
   * 注册一个函数
   * @param func
   * @return {string} 函数的id
   */
  registerFunction: (func: Callable) => string
  /**
   * 生成一个回调函数，该回调在调用后需要调用对端的函数。
   * @param peerId 对端的函数 id
   */
  generateCallback: (peerId: string) => Callable
}

export default class DataSerializer {

  private options: DataSerializerOptions

  constructor(options: DataSerializerOptions) {
    this.options = options
  }

  /**
   * 序列化参数. 在每个参数转为字符串，并且在前面添加 $type$ 前缀.
   */
  public serialise(data: any): string {
    return JSON.stringify(this.serialise0(data))
  }

  private serialise0(arg: any): any {
    if (arg === undefined || arg === null) {
      return UNDEFINED
    }
    if (typeof arg === 'object') {
      for (const key of Object.keys(arg)) {
        arg[key] = this.serialise0(arg[key])
      }
      return arg
    } else if (Array.isArray(arg)) {
      for (let i = 0; i < arg.length; i++) {
        arg[i] = this.serialise0(arg[i])
      }
    } else if (typeof arg === 'function') {
      return '$function$' + this.options.registerFunction(arg)
    } else {
      return `$${typeof arg}$${arg}`
    }
  }

  private resolveType(raw: string): TypeofEnum | undefined {
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

  private deserializes0(arg: any): any {
    if (!arg || arg === UNDEFINED) {
      return undefined
    }
    if (typeof arg === 'object') {
      for (const key of Object.keys(arg)) {
        arg[key] = this.deserializes0(arg[key])
      }
      return arg
    } else if (Array.isArray(arg)) {
      for (let i = 0; i < arg.length; i++) {
        arg[i] = this.deserializes0(arg[i])
      }
      return arg
    }
    // expected string here
    if (typeof arg !== 'string') {
      throw new Error(`Unexpected type ${typeof arg}`)
    }
    const type = this.resolveType(arg)
    if (!type) {
      throw new Error('No type found: ' + arg)
    }
    if (type === 'function') {
      return this.options.generateCallback(arg.substring(type.length + 2))
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

  /**
   * 反序列化参数
   * @param serialisedArgs
   */
  public deserialize(serialisedArgs: string): any {
    return this.deserializes0(JSON.parse(serialisedArgs))
  }

}