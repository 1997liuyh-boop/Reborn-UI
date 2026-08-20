<script setup lang="ts">
import type { SearchBoxColor, SearchBoxSize } from './reborn-search-box.config'
import { computed, onMounted, ref } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import RebornImage from '../reborn-image/RebornImage.vue'
import RebornInput from '../reborn-input/RebornInput.vue'
import RebornPopup from '../reborn-popup/RebornPopup.vue'
import theme, { searchBoxInputUi } from './reborn-search-box.config'

export interface SkuAttribute {
  label: string
  value: any
  [key: string]: any
}

export interface SearchBoxProps {
  modelValue?: string
  placeholder?: string
  size?: SearchBoxSize
  color?: SearchBoxColor
  mode?: 'associate' | 'sku'
  showDropdown?: boolean
  skuAttributes?: SkuAttribute[]
  saveHistory?: (history: string[]) => void
  removeHistory?: () => void
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
  modelValue: '',
  placeholder: '请输入搜索内容',
  size: 'sm',
  color: 'primary',
  mode: 'associate',
  showDropdown: true,
  skuAttributes: () => [],
  placeholderClass: 'text-gray-5',
  disabled: false,
  rounded: true,
  clearable: true,
  border: false,
})

const emit = defineEmits([
  'update:modelValue', // 输入内容变化时触发，参数为最新文本
  'search', // 点击键盘搜索/确认键时触发，参数为当前输入值；非空关键字会写入历史记录
  'clickCamera', // 点击右侧相机区域时触发（uniapp 端驼峰命名，对应 web 端的 click-camera）
  'selectSku', // SKU 模式选中属性时触发（uniapp 端驼峰命名，对应 web 端的 select-sku；当前 uniapp 实现声明保留，模板尚未触发）
  'focus', // 输入框聚焦时触发
  'blur', // 输入框失焦时触发
])

const isTranslated = ref(false)
const localHistory = ref<string[]>([])
const showSiteSelect = ref(false)

const STORAGE_KEY = 'reborn-search-history'

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

const loadHistory = () => {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY)
    localHistory.value = saved ? JSON.parse(saved) : []
  } catch {
    localHistory.value = []
  }
}

const addToHistory = (keyword: string) => {
  if (!keyword.trim()) {
    return
  }

  const nextHistory = [keyword, ...localHistory.value.filter(item => item !== keyword)].slice(0, 10)

  if (props.saveHistory) {
    props.saveHistory(nextHistory)
  } else {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(nextHistory))
  }

  localHistory.value = nextHistory
}

function onInput(value: any) {
  emit('update:modelValue', value)
}

function onFocus(event: any) {
  emit('focus', event)
}

function onBlur(event: any) {
  emit('blur', event)
}

function handleSearch() {
  const keyword = `${props.modelValue ?? ''}`.trim()

  if (keyword) {
    addToHistory(keyword)
  }

  emit('search', props.modelValue)
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
    <RebornInput :model-value="modelValue" :size="props.size" :color="props.color" :disabled="disabled"
      :rounded="rounded" :clearable="clearable" :border="border" :placeholder="placeholder"
      :placeholder-class="placeholderClass" :ui="inputUi" :separator="false" @update:model-value="onInput"
      @focus="onFocus" @blur="onBlur" @confirm="handleSearch">
      <template #leading>
        <RebornImage src="https://mall.leyifan.cn/static/h5/new_images/index_search_small.png?v=1" width="38"
          height="38" mode="widthFix" />
      </template>

      <template #trailing>
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

    <view :class="ui.siteSelector()" @tap="showSiteSelect = true">
      <RebornImage
        src="https://image2.leyifan.cn/reborn-mall-cdn/crmebimage/public/config/2025/02/11/7df4f7565d4145ecb24420683be2a059fj8kuhp23i.png"
        width="30px" height="30px" mode="heightFix" />
      <RebornImage src="https://mall.leyifan.cn/static/h5/new_images/site-expand.png" width="14px" height="14px"
        mode="heightFix" />
    </view>

    <!-- 站点选择弹出层 -->
    <RebornPopup v-model="showSiteSelect" position="right" title="选择站点" direction="right" custom-style="width: 80%;"
      :round="false">
      <view class="p-4">
        <text class="text-sm text-gray-500">站点选择列表占位...</text>
      </view>
    </RebornPopup>
  </view>
</template>
