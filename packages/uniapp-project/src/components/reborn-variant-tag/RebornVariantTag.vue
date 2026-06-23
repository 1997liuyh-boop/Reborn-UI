<script setup lang="ts">
import type {
  VariantTagColor,
  VariantTagPosition,
  VariantTagSize,
  VariantTagUI,
  VariantTagVariant,
} from './reborn-variant-tag.config'
import { computed, useSlots } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { variantTagColors } from './reborn-variant-tag.config'

defineOptions({
  name: 'RebornVariantTag',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<VariantTagProps>(), {
  variant: 'corner-ribbon',
  color: 'primary',
  label: '首发',
  subLabel: '',
  reverse: false,
  position: 'top-left',
  size: 'md',
  width: undefined,
  height: undefined,
  radius: undefined,
  fontSize: undefined,
  offsetX: 0,
  offsetY: 0,
  foldSize: undefined,
  customClass: undefined,
  contentClass: undefined,
  ui: () => ({}),
})

const emit = defineEmits(['click'])

interface PaletteToken {
  base: string
  accent: string
  text: string
  soft: string
  border: string
  contrast: string
}

export interface VariantTagProps {
  variant?: VariantTagVariant
  color?: VariantTagColor | (string & {})
  customColor?: string
  accentColor?: string
  textColor?: string
  label?: string
  subLabel?: string
  reverse?: boolean
  position?: VariantTagPosition
  size?: VariantTagSize
  width?: string | number
  height?: string | number
  radius?: string | number
  fontSize?: string | number
  offsetX?: string | number
  offsetY?: string | number
  foldSize?: string | number
  customClass?: any
  contentClass?: any
  ui?: VariantTagUI
}

const slots = useSlots()
const b = tv(theme)

const builtinPalette: Record<VariantTagColor, PaletteToken> = {
  primary: {
    base: '#ff4263',
    accent: '#ff6f86',
    text: '#ffffff',
    soft: 'rgba(255, 66, 99, 0.14)',
    border: 'rgba(255, 66, 99, 0.34)',
    contrast: '#1485e0',
  },
  secondary: {
    base: '#7b7f8d',
    accent: '#a0a5b5',
    text: '#ffffff',
    soft: 'rgba(123, 127, 141, 0.16)',
    border: 'rgba(123, 127, 141, 0.34)',
    contrast: '#60656f',
  },
  success: {
    base: '#15a86a',
    accent: '#2ac789',
    text: '#ffffff',
    soft: 'rgba(21, 168, 106, 0.16)',
    border: 'rgba(21, 168, 106, 0.32)',
    contrast: '#0d8f5b',
  },
  info: {
    base: '#1693f6',
    accent: '#5bb8ff',
    text: '#ffffff',
    soft: 'rgba(22, 147, 246, 0.16)',
    border: 'rgba(22, 147, 246, 0.32)',
    contrast: '#0e7fda',
  },
  warning: {
    base: '#ff8a00',
    accent: '#ffbe3d',
    text: '#ffffff',
    soft: 'rgba(255, 138, 0, 0.16)',
    border: 'rgba(255, 138, 0, 0.32)',
    contrast: '#ffb300',
  },
  error: {
    base: '#f04452',
    accent: '#ff7b86',
    text: '#ffffff',
    soft: 'rgba(240, 68, 82, 0.16)',
    border: 'rgba(240, 68, 82, 0.34)',
    contrast: '#df3041',
  },
  neutral: {
    base: '#6b7280',
    accent: '#9ca3af',
    text: '#ffffff',
    soft: 'rgba(107, 114, 128, 0.14)',
    border: 'rgba(107, 114, 128, 0.34)',
    contrast: '#4b5563',
  },
}

function toUnit(value: string | number | undefined, fallback?: string) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  return typeof value === 'number' ? `${value}rpx` : value
}

const ui = computed(() => {
  const styles = b({
    variant: props.variant,
    size: props.size,
  })

  return {
    root: (options?: { class?: any }) =>
      styles.root({ class: cn(options?.class, props.customClass, props.ui.root) }),
    container: (options?: { class?: any }) =>
      styles.container({ class: cn(options?.class, props.ui.container) }),
    overlay: (options?: { class?: any }) =>
      styles.overlay({ class: cn(options?.class, props.ui.overlay) }),
    ribbon: (options?: { class?: any }) =>
      styles.ribbon({ class: cn(options?.class, props.ui.ribbon) }),
    inline: (options?: { class?: any }) =>
      styles.inline({ class: cn(options?.class, props.ui.inline) }),
    label: (options?: { class?: any }) => styles.label({ class: cn(options?.class, props.ui.label) }),
    subLabel: (options?: { class?: any }) =>
      styles.subLabel({ class: cn(options?.class, props.ui.subLabel) }),
  }
})

const palette = computed<PaletteToken>(() => {
  const named = variantTagColors.includes(props.color as VariantTagColor)
    ? builtinPalette[props.color as VariantTagColor]
    : undefined

  const base = props.customColor || named?.base || props.color
  const accent = props.accentColor || named?.accent || base
  const text = props.textColor || named?.text || '#ffffff'
  const soft = named?.soft || `${base}22`
  const border = named?.border || `${base}55`
  const contrast = named?.contrast || accent || base

  return { base, accent, text, soft, border, contrast }
})

const hasContent = computed(() => !!slots.default)

const overlayPositionStyle = computed<Record<string, string>>(() => {
  const x = toUnit(props.offsetX, '0rpx')!
  const y = toUnit(props.offsetY, '0rpx')!

  switch (props.position) {
    case 'top-right':
      return { top: y, right: x }
    case 'bottom-left':
      return { bottom: y, left: x }
    case 'bottom-right':
      return { bottom: y, right: x }
    default:
      return { top: y, left: x }
  }
})

const cornerRibbonStyle = computed<Record<string, string>>(() => {
  const map = {
    sm: { box: '152rpx', width: '220rpx', height: '56rpx', fontSize: '24rpx' },
    md: { box: '184rpx', width: '268rpx', height: '68rpx', fontSize: '28rpx' },
    lg: { box: '216rpx', width: '312rpx', height: '80rpx', fontSize: '32rpx' },
  } as const

  const current = map[props.size]
  const rotationMap: Record<VariantTagPosition, string> = {
    'top-left': '-45deg',
    'top-right': '45deg',
    'bottom-left': '45deg',
    'bottom-right': '-45deg',
  }
  const anchorMap: Record<VariantTagPosition, Record<string, string>> = {
    'top-left': { top: '28rpx', left: '-56rpx' },
    'top-right': { top: '28rpx', right: '-56rpx' },
    'bottom-left': { bottom: '28rpx', left: '-56rpx' },
    'bottom-right': { bottom: '28rpx', right: '-56rpx' },
  }

  return {
    width: toUnit(props.width, current.box)!,
    height: toUnit(props.height, current.box)!,
    '--tag-ribbon-width': toUnit(props.width, current.width)!,
    '--tag-ribbon-height': toUnit(props.height, current.height)!,
    '--tag-ribbon-rotate': rotationMap[props.position],
    '--tag-ribbon-font-size': toUnit(props.fontSize, current.fontSize)!,
    '--tag-ribbon-bg': `linear-gradient(135deg, ${palette.value.accent} 0%, ${palette.value.base} 60%, ${palette.value.base} 100%)`,
    '--tag-ribbon-text': palette.value.text,
    ...anchorMap[props.position],
  } as Record<string, string>
})

const promoStyle = computed<Record<string, string>>(() => {
  const sizeMap = {
    sm: { minWidth: '148rpx', height: '144rpx', radius: '32rpx', fontSize: '28rpx', subFontSize: '36rpx' },
    md: { minWidth: '184rpx', height: '176rpx', radius: '40rpx', fontSize: '36rpx', subFontSize: '56rpx' },
    lg: { minWidth: '216rpx', height: '204rpx', radius: '48rpx', fontSize: '40rpx', subFontSize: '64rpx' },
  } as const
  const current = sizeMap[props.size]

  return {
    minWidth: toUnit(props.width, current.minWidth)!,
    height: toUnit(props.height, current.height)!,
    borderRadius: toUnit(props.radius, current.radius)!,
    color: palette.value.text,
    background: `linear-gradient(180deg, ${palette.value.accent} 0%, ${palette.value.base} 72%)`,
    boxShadow: `0 20rpx 48rpx ${palette.value.soft}`,
    '--tag-promo-font-size': toUnit(props.fontSize, current.fontSize)!,
    '--tag-promo-sub-font-size': current.subFontSize,
  }
})

const activityStyle = computed<Record<string, string>>(() => {
  const sizeMap = {
    sm: { height: '68rpx', radius: '24rpx', font: '28rpx', padding: '6rpx', gap: '8rpx' },
    md: { height: '84rpx', radius: '28rpx', font: '32rpx', padding: '8rpx', gap: '12rpx' },
    lg: { height: '100rpx', radius: '32rpx', font: '36rpx', padding: '10rpx', gap: '16rpx' },
  } as const
  const current = sizeMap[props.size]

  return {
    height: toUnit(props.height, current.height)!,
    borderRadius: toUnit(props.radius, current.radius)!,
    border: `2rpx solid ${palette.value.border}`,
    backgroundColor: '#ffffff',
    color: palette.value.base,
    padding: current.padding,
    gap: current.gap,
    '--tag-activity-font-size': toUnit(props.fontSize, current.font)!,
    '--tag-activity-fill': palette.value.base,
  }
})

const statusStyle = computed<Record<string, string>>(() => {
  const sizeMap = {
    sm: { height: '68rpx', radius: '24rpx', font: '28rpx', tagWidth: '44rpx' },
    md: { height: '84rpx', radius: '28rpx', font: '32rpx', tagWidth: '56rpx' },
    lg: { height: '100rpx', radius: '32rpx', font: '36rpx', tagWidth: '68rpx' },
  } as const
  const current = sizeMap[props.size]

  return {
    height: toUnit(props.height, current.height)!,
    borderRadius: toUnit(props.radius, current.radius)!,
    border: `2rpx solid ${palette.value.border}`,
    background: '#ffffff',
    color: '#6b6b6b',
    '--tag-status-font-size': toUnit(props.fontSize, current.font)!,
    '--tag-status-tag-width': current.tagWidth,
    '--tag-status-fill': palette.value.base,
  }
})

const foldStyle = computed<Record<string, string>>(() => {
  const sizeMap = {
    sm: { width: '124rpx', height: '48rpx', font: '24rpx', fold: '20rpx', radius: '8rpx' },
    md: { width: '156rpx', height: '60rpx', font: '28rpx', fold: '24rpx', radius: '12rpx' },
    lg: { width: '184rpx', height: '72rpx', font: '32rpx', fold: '28rpx', radius: '16rpx' },
  } as const
  const current = sizeMap[props.size]

  return {
    width: toUnit(props.width, current.width)!,
    height: toUnit(props.height, current.height)!,
    borderRadius: toUnit(props.radius, current.radius)!,
    '--tag-fold-font-size': toUnit(props.fontSize, current.font)!,
    '--tag-fold-size': toUnit(props.foldSize, current.fold)!,
    '--tag-fold-bg': `linear-gradient(180deg, ${palette.value.accent} 0%, ${palette.value.base} 100%)`,
    '--tag-fold-text': palette.value.text,
  }
})

const inlineTexts = computed(() => {
  if (props.variant !== 'activity-badge') {
    return [props.label, props.subLabel]
  }

  return props.reverse ? [props.subLabel, props.label] : [props.label, props.subLabel]
})

function handleClick(event: any) {
  emit('click', event)
}
</script>

<template>
  <view :class="ui.root()" @tap="handleClick">
    <template v-if="props.variant === 'corner-ribbon'">
      <view :class="ui.container({ class: props.contentClass })">
        <slot />
        <view :class="ui.overlay()" :style="overlayPositionStyle">
          <view class="reborn-variant-tag__corner" :style="cornerRibbonStyle">
            <view :class="ui.ribbon()" class="reborn-variant-tag__corner-ribbon">
              <text>{{ props.label }}</text>
            </view>
          </view>
        </view>
      </view>
    </template>

    <template v-else-if="props.variant === 'promo-badge'">
      <view :class="ui.inline()" class="reborn-variant-tag__promo" :style="promoStyle">
        <view class="reborn-variant-tag__promo-glow reborn-variant-tag__promo-glow--left" />
        <view class="reborn-variant-tag__promo-glow reborn-variant-tag__promo-glow--right" />
        <text :class="ui.label()" class="reborn-variant-tag__promo-label">{{ props.label }}</text>
        <text v-if="props.subLabel" :class="ui.subLabel()" class="reborn-variant-tag__promo-sub">
          {{ props.subLabel }}
        </text>
      </view>
    </template>

    <template v-else-if="props.variant === 'activity-badge'">
      <view :class="ui.inline()" class="reborn-variant-tag__activity" :style="activityStyle">
        <text v-if="inlineTexts[0]" :class="ui.label()" class="reborn-variant-tag__activity-main">
          {{ inlineTexts[0] }}
        </text>
        <text v-if="inlineTexts[1]" :class="ui.subLabel()" class="reborn-variant-tag__activity-side">
          {{ inlineTexts[1] }}
        </text>
      </view>
    </template>

    <template v-else-if="props.variant === 'status-tag'">
      <view :class="ui.inline()" class="reborn-variant-tag__status" :style="statusStyle">
        <text class="reborn-variant-tag__status-prefix">{{ props.subLabel || 'N\nRANK' }}</text>
        <text :class="ui.label()" class="reborn-variant-tag__status-label">{{ props.label }}</text>
      </view>
    </template>

    <template v-else>
      <view :class="hasContent ? ui.container({ class: props.contentClass }) : ui.root({ class: props.customClass })">
        <slot />
        <view :class="ui.overlay()" :style="overlayPositionStyle">
          <view class="reborn-variant-tag__fold" :style="foldStyle">
            <text :class="ui.label()" class="reborn-variant-tag__fold-label">{{ props.label }}</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped>
.reborn-variant-tag__corner {
  position: relative;
  display: block;
  overflow: hidden;
}

.reborn-variant-tag__corner-ribbon {
  position: absolute;
  display: flex;
  width: var(--tag-ribbon-width);
  height: var(--tag-ribbon-height);
  align-items: center;
  justify-content: center;
  background: var(--tag-ribbon-bg);
  color: var(--tag-ribbon-text);
  font-size: var(--tag-ribbon-font-size);
  box-shadow: 0 20rpx 36rpx rgba(0, 0, 0, 0.15);
  transform: rotate(var(--tag-ribbon-rotate));
}

.reborn-variant-tag__promo {
  position: relative;
  flex-direction: column;
  gap: 8rpx;
  font-weight: 900;
  text-align: center;
}

.reborn-variant-tag__promo::after {
  position: absolute;
  top: 20rpx;
  right: 24rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.28);
  content: '';
}

.reborn-variant-tag__promo-glow {
  position: absolute;
  width: 56rpx;
  height: 56rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.18);
}

.reborn-variant-tag__promo-glow--left {
  bottom: 28rpx;
  left: 20rpx;
}

.reborn-variant-tag__promo-glow--right {
  top: 28rpx;
  right: 16rpx;
}

.reborn-variant-tag__promo-label {
  position: relative;
  z-index: 1;
  font-size: var(--tag-promo-font-size);
}

.reborn-variant-tag__promo-sub {
  position: relative;
  z-index: 1;
  font-size: var(--tag-promo-sub-font-size);
  line-height: 1;
  color: #ffe45b;
  text-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.14);
}

.reborn-variant-tag__activity {
  align-items: center;
  box-shadow: 0 16rpx 36rpx rgba(20, 133, 224, 0.08);
}

.reborn-variant-tag__activity-main {
  padding-left: 20rpx;
  padding-right: 20rpx;
  font-size: var(--tag-activity-font-size);
  line-height: 1;
}

.reborn-variant-tag__activity-side {
  display: inline-flex;
  height: calc(100% - 4rpx);
  align-items: center;
  border-radius: inherit;
  padding-left: 24rpx;
  padding-right: 24rpx;
  background: var(--tag-activity-fill);
  color: #ffffff;
  font-size: var(--tag-activity-font-size);
  line-height: 1;
}

.reborn-variant-tag__status {
  align-items: center;
  gap: 16rpx;
  padding-left: 16rpx;
  padding-right: 28rpx;
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.06);
}

.reborn-variant-tag__status-prefix {
  display: inline-flex;
  width: var(--tag-status-tag-width);
  min-width: var(--tag-status-tag-width);
  height: calc(100% - 20rpx);
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  background: linear-gradient(180deg, rgba(119, 119, 119, 0.88) 0%, var(--tag-status-fill) 100%);
  color: #ffffff;
  font-size: calc(var(--tag-status-font-size) * 0.52);
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
  white-space: pre-line;
}

.reborn-variant-tag__status-label {
  font-size: var(--tag-status-font-size);
  font-weight: 700;
}

.reborn-variant-tag__fold {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--tag-fold-bg);
  color: var(--tag-fold-text);
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.12);
}

.reborn-variant-tag__fold::after {
  position: absolute;
  right: 0;
  bottom: calc(-1 * var(--tag-fold-size));
  width: 0;
  height: 0;
  border-top: var(--tag-fold-size) solid rgba(0, 0, 0, 0.18);
  border-left: var(--tag-fold-size) solid transparent;
  content: '';
}

.reborn-variant-tag__fold::before {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 0;
  height: 0;
  border-bottom: var(--tag-fold-size) solid #ffffff;
  border-left: var(--tag-fold-size) solid transparent;
  content: '';
}

.reborn-variant-tag__fold-label {
  position: relative;
  z-index: 1;
  padding-right: 4rpx;
  font-size: var(--tag-fold-font-size);
  font-weight: 700;
}
</style>
