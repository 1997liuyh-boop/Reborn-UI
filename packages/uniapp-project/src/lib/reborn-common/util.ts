export const context = {
  id: 0,
}

export const isDef = <T>(value: T): value is NonNullable<T> => value !== undefined && value !== null
export const isObj = (value: unknown): value is Record<string, any> => value !== null && typeof value === 'object'
export const isFunction = (value: unknown): value is (...args: any[]) => any => typeof value === 'function'
export const isPromise = <T>(value: unknown): value is Promise<T> => !!value && isFunction((value as any).then)
export const isUndefined = (value: unknown): value is undefined => typeof value === 'undefined'

export function addUnit(value: string | number | undefined) {
  if (!isDef(value) || value === '') return undefined
  return typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value)) ? `${value}px` : String(value)
}

export function objToStyle(styles: Record<string, any> | Record<string, any>[]) {
  if (Array.isArray(styles)) {
    return styles.map(item => objToStyle(item)).filter(Boolean).join(';')
  }
  return Object.entries(styles)
    .filter(([, value]) => isDef(value) && value !== '')
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}

export const pause = () => new Promise<void>(resolve => setTimeout(resolve, 30))
export const setPromise = (duration: number) => new Promise<void>(resolve => setTimeout(resolve, duration))

export function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(target: T, source: U): T & U {
  const result: Record<string, any> = { ...target }
  Object.entries(source).forEach(([key, value]) => {
    if (isObj(value) && isObj(result[key])) result[key] = deepMerge(result[key], value)
    else result[key] = value
  })
  return result as T & U
}

export function omitBy<O extends Record<string, any>>(obj: O, predicate: (value: any, key: keyof O) => boolean): Partial<O> {
  return Object.keys(obj).reduce((acc, key) => {
    const typedKey = key as keyof O
    if (!predicate(obj[typedKey], typedKey)) acc[typedKey] = obj[typedKey]
    return acc
  }, {} as Partial<O>)
}
