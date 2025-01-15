/**
 * 判断是否为 promise
 */
export const isPromise = (val: unknown): val is Promise<unknown> => {
  return (
    val !== null &&
    typeof val === 'object' &&
    typeof (val as Promise<unknown>).then === 'function' &&
    typeof (val as Promise<unknown>).catch === 'function'
  )
}


/**
 * 深拷贝
 */
export const deepCopy = <T> (target: T): T => {
  if (!target) {
    return target
  }
  if (Array.isArray(target)) {
    const result = []
    for (const objElement of target) {
      result.push(deepCopy(objElement))
    }
    // @ts-expect-error value has copied
    return result
  } else if (typeof target === 'object') {
    const result = {}
    Object.entries(target).forEach(([k, v]) => {
      // @ts-expect-error value has copied
      result[k] = deepCopy(v)
    })
    // @ts-expect-error value has copied
    return result
  } else {
    return target
  }
}