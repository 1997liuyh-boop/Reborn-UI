import type { ClQrcodeMode } from '@/components/reborn-qrcode/draw'
import { eccLevel } from '@/components/reborn-qrcode/draw'

export interface QrGradient {
  type: 'linear' | 'radial'
  direction: 'horizontal' | 'vertical' | 'diagonal' | 'center'
  colorStops: { offset: number, color: string }[]
}

export interface QrConfig {
  text: string
  margin: number
  ecc: eccLevel
  dotsType: ClQrcodeMode
  dotsColor: string
  dotsImage: string | null
  dotsGradient: QrGradient | null
  backgroundColor: string
  backgroundTransparent: boolean
  backgroundGradient: QrGradient | null
  cornersSquareType: number
  cornersSquareGradient: QrGradient | null
  cornersDotType: number
  cornersDotGradient: QrGradient | null
  logoImage: string | null
  logoSize: 'small' | 'medium' | 'large'
  logoMargin: 'none' | 'small' | 'medium' | 'large'
  logoShape: 'rectangle'
  logoHideBackgroundDots: boolean
  logoShadow: boolean
}

export interface ValueOption<T> { value: T, name: string }
export interface ShapeOption<T> { type: T, name: string }
export type ColorTarget = 'foreground' | 'background'
export interface ForegroundImage { id: number, name: string, path: string }

/** 初始化与重置共用一份配置，避免控件选项与预览初值漂移。 */
export function createDefaultConfig(): QrConfig {
  return {
    text: 'https://www.leyifan.com/', margin: 1, ecc: eccLevel.H,
    dotsType: 'rect', dotsColor: '#000000', dotsImage: null, dotsGradient: null,
    backgroundColor: '#ffffff', backgroundTransparent: false, backgroundGradient: null,
    cornersSquareType: 0, cornersSquareGradient: null, cornersDotType: 0, cornersDotGradient: null,
    logoImage: null, logoSize: 'medium', logoMargin: 'small', logoShape: 'rectangle',
    logoHideBackgroundDots: true, logoShadow: false,
  }
}

