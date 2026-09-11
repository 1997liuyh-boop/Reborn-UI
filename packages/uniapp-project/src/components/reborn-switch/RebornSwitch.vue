<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { switchColors, switchSizes, switchTypes } from './reborn-switch.config'
import { computed, ref, watch } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-switch.config'

defineOptions({
  name: 'RebornSwitch',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SwitchProps>(), {
  activeValue: true,
  inactiveValue: false,
  disabled: false,
  loading: false,
  inlinePrompt: false,
  autoWidth: false,
  wave: false,
  type: 'circle',
  size: 'md',
  color: 'primary',
})

const emit = defineEmits<{
  /** 切换完成后更新绑定值，参数为 activeValue 或 inactiveValue */
  (e: 'update:modelValue', value: any): void
  /** 状态切换后触发（beforeChange 拦截通过后才会触发），参数与 update:modelValue 相同 */
  (e: 'change', value: any): void
}>()

export interface SwitchProps {
  modelValue?: any
  defaultValue?: any
  activeValue?: any // 打开状态对应的绑定值，默认 true；配合 inactiveValue 可绑定字符串/数字等任意值
  inactiveValue?: any // 关闭状态对应的绑定值，默认 false
  activeLabel?: string
  inactiveLabel?: string
  disabled?: boolean
  loading?: boolean // 是否加载中：轨道内显示加载图标且开关不可点击（与 disabled 相互独立）
  inlinePrompt?: boolean // 文本显示在开关内：activeLabel / inactiveLabel 渲染进轨道内部而非两侧（line 型轨道过细，不生效）
  autoWidth?: boolean // 轨道宽度是否按两态点内文本的较长者撑开，切换时保持稳定；关闭（默认）时固定宽度、超出文本省略
  wave?: boolean // 切换波纹：每次切换成功后从轨道边缘向外扩散一圈开态色并淡出；默认关闭，开启后仅作视觉反馈，不影响取值与事件
  type?: typeof switchTypes[number] // 形态：circle 胶囊圆形（默认）/ round 圆角方形 / line 细线轨道 + 悬浮滑块
  borderColor?: string // 开关轨道的边框颜色（任意 CSS 色值），1px 实线；border-box 下不改变轨道外尺寸
  size?: typeof switchSizes[number]
  color?: typeof switchColors[number]
  beforeChange?: () => boolean | Promise<boolean> // 切换前拦截钩子：返回 false、Promise 解析为 false 或 Promise reject 时取消本次切换，常用于二次确认/异步校验
  customClass?: any // 追加到根节点（wrapper）的自定义类名
  /** 覆盖内部各区域样式类：wrapper 根容器、track 通用轨道、activeTrack/inactiveTrack 两态轨道、thumb 滑块、loading 加载图标、wave 切换波纹、activeLabel/inactiveLabel 两侧文案 */
  ui?: Partial<{
    wrapper: ClassValue
    input: ClassValue
    track: ClassValue
    activeTrack: ClassValue
    inactiveTrack: ClassValue
    thumb: ClassValue
    loading: ClassValue
    wave: ClassValue
    inlineActive: ClassValue
    inlineInactive: ClassValue
    activeLabel: ClassValue
    inactiveLabel: ClassValue
  }>
}

const b = tv(theme as any)

const { disabled: formDisabled, size: formSize, isError, validate } = useFormInject(props)

const isDisabled = computed(() => formDisabled.value || props.disabled || props.loading)

const localValue = ref(props.defaultValue ?? props.inactiveValue)
const isChecked = computed(() => {
  const val = props.modelValue !== undefined ? props.modelValue : localValue.value
  return val === props.activeValue
})

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = (b as any)({
    size: formSize.value || props.size,
    color: props.color,
    type: props.type,
    autoWidth: props.autoWidth,
    active: isChecked.value,
    error: isError.value,
    loading: props.loading,
  })

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    // 状态样式最后合并，背景与 ring 均可覆盖通用轨道样式。
    track: (opts?: { class?: any }) => styles.track({
      class: cn(
        isChecked.value ? styles.activeTrack() : styles.inactiveTrack(),
        opts?.class,
        uiOverrides.value.track,
        isChecked.value ? uiOverrides.value.activeTrack : uiOverrides.value.inactiveTrack,
      ),
    }),
    thumb: (opts?: { class?: any }) => styles.thumb({ class: cn(opts?.class, uiOverrides.value.thumb) }),
    loading: (opts?: { class?: any }) => styles.loading({ class: cn(opts?.class, uiOverrides.value.loading) }),
    wave: (opts?: { class?: any }) => styles.wave({ class: cn(opts?.class, uiOverrides.value.wave) }),
    inlineActive: (opts?: { class?: any }) => styles.inlineActive({ class: cn(opts?.class, uiOverrides.value.inlineActive) }),
    inlineInactive: (opts?: { class?: any }) => styles.inlineInactive({ class: cn(opts?.class, uiOverrides.value.inlineInactive) }),
    activeLabel: (opts?: { class?: any }) => styles.activeLabel({ class: cn(opts?.class, uiOverrides.value.activeLabel) }),
    inactiveLabel: (opts?: { class?: any }) => styles.inactiveLabel({ class: cn(opts?.class, uiOverrides.value.inactiveLabel) }),
  }
})

/** inline-prompt 是否生效：line 型轨道过细放不下文本，直接不渲染 */
const inlinePromptActive = computed(() => props.inlinePrompt && props.type !== 'line')

/** 保留 UniApp 的边框兼容参数；背景和 ring 统一通过 ui 类名设置。 */
const trackStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.borderColor) {
    style.borderColor = props.borderColor
    style.borderWidth = '1px'
    style.borderStyle = 'solid'
  }
  return style
})

/**
 * 切换波纹（wave 开启才生效）：小程序端靠 key 重建节点无法稳定重播动画，
 * 改成两组同构关键帧交替挂类——animation-name 变化即从头播放，效果与 web 端的 :key 重建一致。
 * 颜色取 color 语义色变量，不受轨道 ui 背景覆盖影响，扩散与淡出见 scoped 样式。
 */
const waveTick = ref(0)
const waveStyle = computed(() => ({
  '--re-switch-wave-color': `var(--color-${props.color})`,
}))
/** 奇数次挂 a、偶数次挂 b；waveTick 为 0 表示尚未切换过，此时波纹节点不渲染 */
const waveClass = computed(() => (waveTick.value % 2 === 1 ? 're-switch-wave-a' : 're-switch-wave-b'))

function updateValue(checked: boolean) {
  const nextValue = checked ? props.activeValue : props.inactiveValue
  if (!props.disabled && !props.loading) {
    if (props.modelValue === undefined) {
      localValue.value = nextValue
    }
    // 关闭波纹时不自增，波纹节点始终不渲染，避免为纯装饰动画多挂一个节点
    if (props.wave) { waveTick.value++ }
    emit('update:modelValue', nextValue)
    emit('change', nextValue)
    if (validate) { validate('change') }
  }
}

async function onTap() {
  if (props.disabled || props.loading) return

  const originalChecked = isChecked.value
  const newChecked = !originalChecked

  if (props.beforeChange) {
    try {
      const result = await props.beforeChange()
      if (result === false) return
    } catch {
      return
    }
  }

  updateValue(newChecked)
}

watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined) {
      localValue.value = value
    }
  },
)

const isFocused = ref(false)
defineExpose({
  /** `() => void` 标记聚焦态（为根节点追加 is-focused 类名）；uniapp 端无原生焦点行为 */
  focus: () => {
    isFocused.value = true
  },
})
</script>

<template>
  <view>
    <view
      :hover-class="isDisabled ? 'none' : 're-switch-pressed'"
      :hover-start-time="0" :hover-stay-time="0"
      class="group" :class="[
        ui.wrapper({ class: props.customClass }),
        isChecked && 'is-checked',
        isFocused && 'is-focused',
      ]" :data-disabled="isDisabled" style="-webkit-tap-highlight-color: transparent;" @tap="onTap"
    >
      <!-- inline-prompt 开启后两侧文案让位给轨道内文本 -->
      <view v-if="!inlinePromptActive && (props.inactiveLabel || $slots.inactiveLabel)" :class="ui.inactiveLabel()">
        <slot name="inactiveLabel">
          {{ props.inactiveLabel }}
        </slot>
      </view>

      <view :class="ui.track()" :style="trackStyle" :data-loading="props.loading">
        <!-- 切换波纹：交替挂 a / b 类以重新触发动画；wave 关闭或尚未切换过时不渲染 -->
        <view v-if="props.wave && waveTick" :class="[ui.wave(), waveClass]" :style="waveStyle" />

        <!-- 两态文本持续挂载并水平滑动；网格稳定宽度，独立裁剪不影响滑块和波纹。 -->
        <view v-if="inlinePromptActive" class="grid min-w-0 flex-1 grid-cols-1 self-stretch overflow-hidden rounded-[inherit]">
          <view v-if="props.activeLabel" :aria-hidden="!isChecked" :class="ui.inlineActive()">
            {{ props.activeLabel }}
          </view>
          <view v-if="props.inactiveLabel" :aria-hidden="isChecked" :class="ui.inlineInactive()">
            {{ props.inactiveLabel }}
          </view>
        </view>

        <view :class="ui.thumb()">
          <slot name="thumb" :checked="isChecked" :loading="props.loading">
            <view v-if="props.loading" :class="ui.loading()" />
            <!-- 滑块内按状态显示的内容：开态渲染 #active、关态渲染 #inactive -->
            <slot v-else-if="isChecked" name="active" :checked="isChecked" />
            <slot v-else name="inactive" :checked="isChecked" />
          </slot>
        </view>
      </view>

      <view v-if="!inlinePromptActive && (props.activeLabel || $slots.activeLabel)" :class="ui.activeLabel()">
        <slot name="activeLabel">
          {{ props.activeLabel }}
        </slot>
      </view>
    </view>
  </view>
</template>

<style scoped>
/*
 * 切换波纹：从轨道边缘向外扩散一圈开态色并淡出（参考 antd wave）。
 * a / b 两组关键帧内容完全相同，只为交替切换 animation-name 触发重播——
 * 小程序端复用同一个节点改 key 不会重新起播，这是唯一可靠的重播手段。
 */
.re-switch-wave-a {
  animation: re-switch-wave-a 0.5s ease-out both;
}

.re-switch-wave-b {
  animation: re-switch-wave-b 0.5s ease-out both;
}

@keyframes re-switch-wave-a {
  0% {
    box-shadow: 0 0 0 0 var(--re-switch-wave-color);
    opacity: 0.4;
  }

  100% {
    box-shadow: 0 0 0 16rpx var(--re-switch-wave-color);
    opacity: 0;
  }
}

@keyframes re-switch-wave-b {
  0% {
    box-shadow: 0 0 0 0 var(--re-switch-wave-color);
    opacity: 0.4;
  }

  100% {
    box-shadow: 0 0 0 16rpx var(--re-switch-wave-color);
    opacity: 0;
  }
}
</style>
