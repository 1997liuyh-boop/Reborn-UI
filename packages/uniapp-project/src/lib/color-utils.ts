export interface HsvaColor {
    h: number
    s: number
    v: number
    a: number
}

export interface RgbaColor {
    r: number
    g: number
    b: number
    a: number
}

export type ColorFormat = 'hex' | 'rgb' | 'rgba'

export function hexToHsva(hex: string): HsvaColor {
    const rgba = hexToRgba(hex)
    return rgbaToHsva(rgba)
}

export function hsvaToHex(hsva: HsvaColor): string {
    const rgba = hsvaToRgba(hsva)
    return rgbaToHex(rgba)
}

export function hexToRgba(hex: string): RgbaColor {
    hex = hex.replace(/^#/, '')
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('')
    }

    if (hex.length !== 6 && hex.length !== 8) {
        return { r: 0, g: 0, b: 0, a: 1 }
    }

    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1

    return { r, g, b, a }
}

export function rgbaToHex(rgba: RgbaColor): string {
    const r = Math.round(rgba.r).toString(16).padStart(2, '0')
    const g = Math.round(rgba.g).toString(16).padStart(2, '0')
    const b = Math.round(rgba.b).toString(16).padStart(2, '0')
    const a = rgba.a < 1 ? Math.round(rgba.a * 255).toString(16).padStart(2, '0') : ''
    return `#${r}${g}${b}${a}`.toLowerCase()
}

export function rgbaToHsva(rgba: RgbaColor): HsvaColor {
    const r = rgba.r / 255
    const g = rgba.g / 255
    const b = rgba.b / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    let h = 0
    if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6
        else if (max === g) h = (b - r) / delta + 2
        else h = (r - g) / delta + 4
        h = Math.round(h * 60)
        if (h < 0) h += 360
    }
    const s = max === 0 ? 0 : delta / max
    const v = max
    return { h, s: s * 100, v: v * 100, a: rgba.a }
}

export function hsvaToRgba(hsva: HsvaColor): RgbaColor {
    const h = hsva.h / 60
    const s = hsva.s / 100
    const v = hsva.v / 100
    const i = Math.floor(h)
    const f = h - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)
    const mod = i % 6
    let r = 0, g = 0, b = 0
    if (mod === 0) { r = v; g = t; b = p }
    else if (mod === 1) { r = q; g = v; b = p }
    else if (mod === 2) { r = p; g = v; b = t }
    else if (mod === 3) { r = p; g = q; b = v }
    else if (mod === 4) { r = t; g = p; b = v }
    else if (mod === 5) { r = v; g = p; b = q }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
        a: hsva.a
    }
}

export function detectColorFormat(value: string | undefined | null): ColorFormat {
    if (!value) return 'hex'

    const normalized = value.trim().toLowerCase()
    if (normalized.startsWith('rgba(')) return 'rgba'
    if (normalized.startsWith('rgb(')) return 'rgb'
    return 'hex'
}

export function parseColorString(value: string | undefined | null): RgbaColor | null {
    if (!value) return null

    const normalized = value.trim()

    if (normalized.startsWith('#')) {
        return hexToRgba(normalized)
    }

    const match = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i)
    if (!match) return null

    return {
        r: Number.parseInt(match[1] || '0'),
        g: Number.parseInt(match[2] || '0'),
        b: Number.parseInt(match[3] || '0'),
        a: match[4] ? Number.parseFloat(match[4]) : 1,
    }
}

export function colorStringToHsva(value: string | undefined | null): HsvaColor {
    const rgba = parseColorString(value)
    if (!rgba) {
        return hexToHsva('#000000')
    }

    return rgbaToHsva(rgba)
}

export function hsvaToColorString(hsva: HsvaColor, format: ColorFormat): string {
    if (format === 'hex') {
        return hsvaToHex(hsva)
    }

    const rgba = hsvaToRgba(hsva)
    if (format === 'rgb') {
        return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`
    }

    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a.toFixed(2)})`
}
