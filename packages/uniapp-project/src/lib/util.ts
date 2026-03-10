import { AbortablePromise } from './AbortablePromise'

type NotUndefined<T> = T extends undefined ? never : T

export function isObj(value: any): value is object {
    return Object.prototype.toString.call(value) === '[object Object]' || typeof value === 'object'
}

export function getType(target: unknown): string {
    const typeStr = Object.prototype.toString.call(target)
    const match = typeStr.match(/\[object (\w+)\]/)
    return match && match.length ? match[1].toLowerCase() : ''
}

export const isDef = <T>(value: T): value is NonNullable<T> => value !== undefined && value !== null

export function addUnit(num: number | string) {
    return Number.isNaN(Number(num)) ? `${num}` : `${num}rpx`
}

export function rgbToHex(r: number, g: number, b: number): string {
    const hex = ((r << 16) | (g << 8) | b).toString(16)
    return '#' + '0'.repeat(Math.max(0, 6 - hex.length)) + hex
}

export function hexToRgb(hex: string): number[] {
    const rgb: number[] = []
    for (let i = 1; i < 7; i += 2) {
        rgb.push(parseInt('0x' + hex.slice(i, i + 2), 16))
    }
    return rgb
}

export const gradient = (startColor: string, endColor: string, step: number = 2): string[] => {
    const sColor: number[] = hexToRgb(startColor)
    const eColor: number[] = hexToRgb(endColor)
    const rStep: number = (eColor[0] - sColor[0]) / step
    const gStep: number = (eColor[1] - sColor[1]) / step
    const bStep: number = (eColor[2] - sColor[2]) / step
    const gradientColorArr: string[] = []
    for (let i = 0; i < step; i++) {
        gradientColorArr.push(
            rgbToHex(parseInt(String(rStep * i + sColor[0])), parseInt(String(gStep * i + sColor[1])), parseInt(String(bStep * i + sColor[2])))
        )
    }
    return gradientColorArr
}

export const context = {
    id: 1000
}

export function kebabCase(word: string): string {
    return word.replace(/[A-Z]/g, function (match) {
        return '-' + match
    }).toLowerCase()
}

export function camelCase(word: string): string {
    return word.replace(/-(\w)/g, (_, c) => c.toUpperCase())
}

export function isArray(value: any): value is Array<any> {
    if (typeof Array.isArray === 'function') {
        return Array.isArray(value)
    }
    return Object.prototype.toString.call(value) === '[object Array]'
}

export function isFunction<T extends Function>(value: any): value is T {
    return getType(value) === 'function' || getType(value) === 'asyncfunction'
}

export function isString(value: unknown): value is string {
    return getType(value) === 'string'
}

export function isNumber(value: any): value is number {
    return getType(value) === 'number'
}

export function isPromise(value: unknown): value is Promise<any> {
    if (isObj(value) && isDef(value)) {
        return isFunction((value as Promise<any>).then) && isFunction((value as Promise<any>).catch)
    }
    return false
}

export function isBoolean(value: any): value is boolean {
    return typeof value === 'boolean'
}

export function isUndefined(value: any): value is undefined {
    return typeof value === 'undefined'
}

export function isNotUndefined<T>(value: T): value is NotUndefined<T> {
    return !isUndefined(value)
}

export function objToStyle(styles: Record<string, any> | Record<string, any>[]): string {
    if (isArray(styles)) {
        const result = styles
            .filter((item) => item != null && item !== '')
            .map((item) => objToStyle(item))
            .join(';')
        return result ? (result.endsWith(';') ? result : result + ';') : ''
    }
    if (isString(styles)) {
        return styles ? (styles.endsWith(';') ? styles : styles + ';') : ''
    }
    if (isObj(styles)) {
        const result = Object.keys(styles)
            .filter((key) => styles[key] != null && styles[key] !== '')
            .map((key) => [kebabCase(key), styles[key]].join(':'))
            .join(';')
        return result ? (result.endsWith(';') ? result : result + ';') : ''
    }
    return ''
}

export const pause = (ms: number = 1000 / 30) => {
    return new AbortablePromise((resolve) => {
        const timer = setTimeout(() => {
            clearTimeout(timer)
            resolve(true)
        }, ms)
    })
}

export const isDate = (val: unknown): val is Date => Object.prototype.toString.call(val) === '[object Date]' && !Number.isNaN((val as Date).getTime())

export function deepClone<T>(obj: T, cache: Map<any, any> = new Map()): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (isDate(obj)) return new Date((obj as any).getTime()) as any
    if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags) as any
    if (obj instanceof Error) {
        const errorCopy = new Error(obj.message) as any
        errorCopy.stack = obj.stack
        return errorCopy
    }
    if (cache.has(obj)) return cache.get(obj)
    const copy: any = Array.isArray(obj) ? [] : {}
    cache.set(obj, copy)
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            copy[key] = deepClone((obj as any)[key], cache)
        }
    }
    return copy as T
}

export function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
    target = deepClone(target)
    if (typeof target !== 'object' || typeof source !== 'object') {
        throw new Error('Both target and source must be objects.')
    }
    for (const prop in source) {
        if (!Object.prototype.hasOwnProperty.call(source, prop)) continue
        (target as Record<string, any>)[prop] = source[prop]
    }
    return target
}

export function deepAssign(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    Object.keys(source).forEach((key) => {
        const targetValue = target[key]
        const newObjValue = source[key]
        if (isObj(targetValue) && isObj(newObjValue)) {
            deepAssign(targetValue, newObjValue)
        } else {
            target[key] = newObjValue
        }
    })
    return target
}

export const getPropByPath = (obj: any, path: string): any => {
    const keys: string[] = path.split('.')
    try {
        return keys.reduce((acc: any, key: string) => (acc !== undefined && acc !== null ? acc[key] : undefined), obj)
    } catch (error) {
        return undefined
    }
}

export function omitBy<O extends Record<string, any>>(obj: O, predicate: (value: any, key: keyof O) => boolean): Partial<O> {
    const newObj = deepClone(obj)
    Object.keys(newObj).forEach((key) => predicate(newObj[key], key) && delete newObj[key])
    return newObj
}

export const isH5 = (() => {
    let isH5 = false
    // #ifdef H5
    isH5 = true
    // #endif
    return isH5
})()
