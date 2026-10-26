<script setup lang="ts">
import type { SearchBoxColor, SearchBoxSize } from './reborn-search-box.config'
import { computed, getCurrentInstance, onMounted, shallowRef, watch } from 'vue'
import { useRawProp } from '@/composables/useRawProp'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import RebornInput from '../reborn-input/RebornInput.vue'
import theme, { searchBoxInputUi } from './reborn-search-box.config'

export interface SearchBoxProps {
  /** 未绑定历史记录时使用的本地存储键。 */
  historyKey?: string
  placeholder?: string
  size?: SearchBoxSize
  color?: SearchBoxColor
  /** 追加到根节点的自定义类名 */
  customClass?: any
  /** 透传给内部输入框的占位符样式类 */
  placeholderClass?: string
  /** 是否禁用输入 */
  disabled?: boolean
  /** 是否使用圆角（药丸形）外观 */
  rounded?: boolean
  /** 是否显示一键清空按钮 */
  clearable?: boolean
  /** 是否显示输入框边框 */
  border?: boolean
}

const props = withDefaults(defineProps<SearchBoxProps>(), {
  historyKey: 'reborn-search-history',
  placeholder: '请输入搜索内容',
  size: 'sm',
  color: 'primary',
  placeholderClass: 'text-gray-5',
  disabled: false,
  rounded: true,
  clearable: true,
  border: false,
})

const emit = defineEmits<{
  search: [value: string]
  clickCamera: []
  focus: [event: any]
  blur: [event: any]
}>()
defineSlots<{
  prefix: () => any
  extra: () => any
  default: () => any
}>()
const model = defineModel<string>({ default: '' })
const historyModel = defineModel<string[]>('history', { default: () => [] })

const isTranslated = shallowRef(false)
const instance = getCurrentInstance()
// 是否绑定了 v-model:history：小程序端 vnode.props 不随父级更新，统一用 useRawProp 读取调用方原始属性
const { present: historyBound, refresh: refreshHistoryBound } = useRawProp('history')
const history = computed<string[]>(() => historyBound.value ? (instance?.props.history as string[] ?? []) : historyModel.value)

const b = tv(theme)
const ui = computed(() => {
  const styles = b({
    color: props.color,
  })

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn('relative', opts?.class, props.customClass) }),
    translateWrapper: (opts?: { class?: any }) => styles.translateWrapper({ class: cn(opts?.class) }),
    translateCardBase: (opts?: { class?: any }) => styles.translateCardBase({ class: cn(opts?.class) }),
    translateCardActive: (opts?: { class?: any }) => styles.translateCardActive({ class: cn(opts?.class) }),
    translateCardInactive: (opts?: { class?: any }) => styles.translateCardInactive({ class: cn(opts?.class) }),
    trailing: (opts?: { class?: any }) => styles.trailing({ class: cn(opts?.class) }),
    separator: (opts?: { class?: any }) => styles.separator({ class: cn(opts?.class) }),
    cameraIcon: (opts?: { class?: any }) => styles.cameraIcon({ class: cn(opts?.class) }),
    siteSelector: (opts?: { class?: any }) => styles.siteSelector({ class: cn(opts?.class) }),
  }
})

const inputUi = computed(() => {
  const base = searchBoxInputUi[props.size]

  return {
    ...base,
    wrapper: cn(base.wrapper, 'bg-gray-3/80 !rounded-ui-base'),
  }
})

function loadHistory() {
  refreshHistoryBound()
  if (historyBound.value) return
  try {
    const saved = uni.getStorageSync(props.historyKey)
    const parsed: unknown = typeof saved === 'string' ? JSON.parse(saved || '[]') : saved
    historyModel.value = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').slice(0, 10) : []
  } catch { historyModel.value = [] }
}
function addToHistory(keyword: string) {
  const next = [keyword, ...history.value.filter(item => item !== keyword)].slice(0, 10)
  historyModel.value = next
  refreshHistoryBound()
  if (!historyBound.value) {
    try { uni.setStorageSync(props.historyKey, JSON.stringify(next)) } catch { /* 存储失败时保留当前实例历史。 */ }
  }
}
watch(() => props.historyKey, loadHistory)

function onFocus(event: any) {
  emit('focus', event)
}

function onBlur(event: any) {
  emit('blur', event)
}

function handleSearch() {
  const keyword = `${model.value ?? ''}`.trim()

  if (keyword) {
    addToHistory(keyword)
  }

  emit('search', model.value)
  uni.hideKeyboard()
}

function handleCameraClick() {
  emit('clickCamera')
}

function toggleTranslate() {
  isTranslated.value = !isTranslated.value
}

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <view :class="ui.wrapper()">
    <!-- RebornInput 已改用 variant / shape 形态体系：SearchBox 自身的 rounded / border 旧属性在此做等价映射 -->
    <RebornInput v-model="model" :size="props.size" :color="props.color" :disabled="disabled"
      :shape="rounded ? 'circle' : 'square'" :clearable="clearable" :variant="border ? 'outlined' : 'filled'"
      :placeholder="placeholder" :placeholder-class="placeholderClass" :ui="inputUi" :separator="false"
      @focus="onFocus" @blur="onBlur" @confirm="handleSearch">
      <template #prefix>
        <slot name="prefix"><view class="i-lucide-search size-[38rpx]" /></slot>
      </template>

      <template #suffix>
        <view :class="ui.trailing()">
          <view :class="ui.translateWrapper()" @tap.stop="toggleTranslate">
            <view class="left-[4rpx] top-[12rpx]" :class="[
              ui.translateCardBase(),
              isTranslated
                ? ['translate-x-[28rpx] translate-y-[12rpx]', ui.translateCardActive()]
                : ui.translateCardInactive(),
            ]">
              <text>译</text>
            </view>
            <view class="left-[28rpx] top-[24rpx]" :class="[
              ui.translateCardBase(),
              isTranslated
                ? ['-translate-x-[20rpx] -translate-y-[12rpx]', ui.translateCardInactive()]
                : ui.translateCardActive(),
            ]">
              <text>原</text>
            </view>
          </view>

          <view :class="ui.separator()" />

          <view :class="ui.cameraIcon()" @tap="handleCameraClick">
            <slot>
              <view class="i-lucide-camera text-[48rpx] text-gray-4" />
            </slot>
          </view>
        </view>
      </template>
    </RebornInput>

    <view v-if="$slots.extra" :class="ui.siteSelector()"><slot name="extra" /></view>
  </view>
</template>
