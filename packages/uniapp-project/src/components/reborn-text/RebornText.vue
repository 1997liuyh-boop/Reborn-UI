<script setup lang="ts">
import type { textColors } from './reborn-text.config'
import { computed } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-text.config'

defineOptions({
  name: 'RebornText',
})

const props = withDefaults(defineProps<RebornTextProps>(), {
  ui: () => ({
    base: '',
  }),
  customClass: '',
  value: null,
  type: 'default',
  mask: false,
  currency: '¥',
  precision: 2,
  maskStart: 3,
  maskEnd: 4,
  maskChar: '*',
  ellipsis: false,
  lines: 1,
  selectable: false,
  space: '',
  decode: false,
  preWrap: false,
})
export interface RebornTextProps {
  // 透传样式
  ui?: {
    base: string
  }
  customClass?: string
  // 文本颜色
  color?: typeof textColors[number]
  // 字体大小
  size?: number
  // 显示的值
  value?: string | number | null
  // 文本类型
  type?: string
  // 是否开启脱敏/加密
  mask?: boolean
  // 金额货币符号
  currency?: string
  // 金额小数位数
  precision?: number
  // 脱敏起始位置
  maskStart?: number
  // 脱敏结束位置
  maskEnd?: number
  // 脱敏替换字符
  maskChar?: string
  // 是否省略号
  ellipsis?: boolean
  // 最大行数，仅在ellipsis时生效
  lines?: number
  // 是否可选择
  selectable?: boolean
  // 显示连续空格
  space?: string
  // 是否解码 (app平台如需解析字符实体，需要配置为 true)
  decode?: boolean
  // 是否保留单词
  preWrap?: boolean
}
const cache = { key: 1 }

// 样式生成
const b = tv(theme)
const ui = computed(() => {
  const styles = b({
    color: props.color,
    preWrap: props.preWrap,
    ellipsis: props.ellipsis,
  })

  return {
    base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, props.ui?.base) }),
  }
})

// 文本样式
const textStyle = computed(() => {
  const style: Record<string, any> = {}

  // 省略号
  if (props.ellipsis) {
    style['-webkit-line-clamp'] = props.lines
    style['line-clamp'] = props.lines
  }

  // 字号
  if (props.size) {
    style.fontSize = `${props.size}rpx`
  }

  return style
})

/**
 * 手机号脱敏处理
 * 保留前3位和后4位，中间4位替换为掩码
 */
function formatPhone(phone: string): string {
  if (phone.length != 11 || !props.mask) { return phone }
  return phone.replace(/(\d{3})\d{4}(\d{4})/, `$1${props.maskChar.repeat(4)}$2`)
}

/**
 * 姓名脱敏处理
 * 2个字时保留第1个字
 * 大于2个字时保留首尾字
 */
function formatName(name: string): string {
  if (name.length <= 1 || !props.mask) { return name }
  if (name.length == 2) {
    return name[0] + props.maskChar
  }
  return name[0] + props.maskChar.repeat(name.length - 2) + name[name.length - 1]
}

/**
 * 金额格式化
 * 1. 处理小数位数
 * 2. 添加千分位分隔符
 * 3. 添加货币符号
 */
function formatAmount(amount: string | number): string {
  let num: number

  if (typeof amount == 'number') {
    num = amount
  }
  else {
    num = Number.parseFloat(amount)
  }

  const formatted = num.toFixed(props.precision)
  const parts = formatted.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return props.currency + parts.join('.')
}

/**
 * 银行卡号脱敏
 * 保留开头和结尾指定位数，中间用掩码替换
 */
function formatCard(card: string): string {
  if (card.length < 8 || !props.mask) { return card }

  const start = card.substring(0, props.maskStart)
  const end = card.substring(card.length - props.maskEnd)
  const middle = props.maskChar.repeat(card.length - props.maskStart - props.maskEnd)
  return start + middle + end
}

/**
 * 邮箱脱敏处理
 * 保留用户名首尾字符和完整域名
 */
function formatEmail(email: string): string {
  if (!props.mask) { return email }

  const atIndex = email.indexOf('@')
  if (atIndex == -1) { return email }

  const username = email.substring(0, atIndex)
  const domain = email.substring(atIndex)

  if (username.length <= 2) { return email }

  const maskedUsername
    = username[0] + props.maskChar.repeat(username.length - 2) + username[username.length - 1]
  return maskedUsername + domain
}

/**
 * 根据不同类型格式化显示
 */
const content = computed(() => {
  const val = props.value ?? ''

  switch (props.type) {
    case 'phone':
      return formatPhone(val as string)
    case 'name':
      return formatName(val as string)
    case 'amount':
      return formatAmount(val as number)
    case 'card':
      return formatCard(val as string)
    case 'email':
      return formatEmail(val as string)
    default:
      return val
  }
})
</script>

<template>
  <!-- #ifdef MP -->
  <view :key="cache.key" :class="ui.base({ class: customClass })" :style="textStyle" :selectable="selectable"
    :space="space" :decode="decode">
    <slot>{{ content }}</slot>
  </view>
  <!-- #endif -->

  <!-- #ifndef MP -->
  <text :key="cache.key" :class="ui.base({ class: customClass })" :style="textStyle" :selectable="selectable"
    :space="space" :decode="decode">
    <slot>{{ content }}</slot>
  </text>
  <!-- #endif -->
</template>

<style lang="scss" scoped></style>
