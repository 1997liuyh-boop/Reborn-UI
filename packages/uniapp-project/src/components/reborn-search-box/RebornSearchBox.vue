<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, useSlots, watch } from 'vue'
import RebornInput from '../reborn-input/RebornInput.vue'
import RebornSelect from '../reborn-select/RebornSelect.vue'
import RebornImage from '../reborn-image/RebornImage.vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { searchBoxSizes, searchBoxColors, searchBoxInputUi } from './reborn-search-box.config'

export interface SkuAttribute {
  label: string;
  value: any;
  [key: string]: any;
}

export interface SearchBoxProps {
  modelValue?: string
  placeholder?: string
  size?: typeof searchBoxSizes[number]
  color?: typeof searchBoxColors[number]
  mode?: "associate" | "sku";
  showDropdown?: boolean;
  skuAttributes?: SkuAttribute[];
  saveHistory?: (history: string[]) => void;
  removeHistory?: () => void;
  customClass?: any
  placeholderClass?: string
  disabled?: boolean
  rounded?: boolean
  clearable?: boolean
  border?: boolean
}

const props = withDefaults(defineProps<SearchBoxProps>(), {
  modelValue: '',
  placeholder: '请输入搜索内容',
  size: 'md',
  color: "primary",
  mode: "associate",
  showDropdown: true,
  skuAttributes: () => [],
  placeholderClass: 'text-gray-5',
  disabled: false,
  rounded: true,
  clearable: true,
  border: false,
})

const emit = defineEmits([
  'update:modelValue',
  'search',
  'click-camera',
  'select-sku',
  'focus',
  'blur',
])

const slots = useSlots()
const isExpanded = ref(false)
const inputFocus = ref(false)
const localHistory = ref<string[]>([])
const dropdownHeight = ref(0)
const { proxy } = getCurrentInstance()!

const sizeValue = ref('1')
const sizeSections = [
  { label: "Mercari", value: "1" },
  { label: "JDirectltems Auction", value: "2" },
  { label: "駿河屋", value: "3" },
  { label: "JDirectltems Fleamarket", value: "4" },
  { label: "Animate", value: "5" },
  { label: "Lashinbang", value: "6" },
];

const STORAGE_KEY = "reborn-search-history"

const loadHistory = () => {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY)
    localHistory.value = saved ? JSON.parse(saved) : []
  } catch (e) {
    localHistory.value = []
  }
}

const addToHistory = (keyword: string) => {
  if (!keyword.trim()) return
  const newHistory = [keyword, ...localHistory.value.filter((h) => h !== keyword)].slice(0, 10)
  if (props.saveHistory) {
    props.saveHistory(newHistory)
  } else {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(newHistory))
  }
  localHistory.value = newHistory
}

const handleClearHistory = () => {
  if (props.removeHistory) {
    props.removeHistory()
  } else {
    uni.removeStorageSync(STORAGE_KEY)
  }
  localHistory.value = []
}

const handleRemoveHistoryItem = (keyword: string) => {
  const newHistory = localHistory.value.filter((h) => h !== keyword)
  if (props.saveHistory) {
    props.saveHistory(newHistory)
  } else {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(newHistory))
  }
  localHistory.value = newHistory
}

const b = tv(theme)
const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
    expanded: isExpanded.value,
  })
  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn("relative", opts?.class, props.customClass) }),
    inputWrapper: (opts?: { class?: any }) => styles.inputWrapper({ class: cn(opts?.class) }),
    // 翻译切换按钮
    translateWrapper: (opts?: { class?: any }) => styles.translateWrapper({ class: cn(opts?.class) }),
    translateCardBase: (opts?: { class?: any }) => styles.translateCardBase({ class: cn(opts?.class) }),
    translateCardActive: (opts?: { class?: any }) => styles.translateCardActive({ class: cn(opts?.class) }),
    translateCardInactive: (opts?: { class?: any }) => styles.translateCardInactive({ class: cn(opts?.class) }),
  }
})

const updateHeight = () => {
  setTimeout(() => {
    const query = uni.createSelectorQuery().in(proxy)
    query.select('.reborn-dropdown__content')
      .boundingClientRect((data) => {
        const node = data as UniApp.NodeInfo
        if (node && node.height !== undefined) {
          dropdownHeight.value = node.height
        }
      })
      .exec()
  }, 100)
}

const wrapperHeight = ref(80)

const updateWrapperHeight = () => {
  const query = uni.createSelectorQuery().in(proxy)
  query.select('.reborn-search-box__wrapper')
    .boundingClientRect((data) => {
      const node = data as UniApp.NodeInfo
      if (node && node.height !== undefined) {
        wrapperHeight.value = node.height
      }
    })
    .exec()
}

watch(isExpanded, (val) => {
  if (val) {
    updateHeight()
  } else {
    dropdownHeight.value = 0
  }
})

const inputHeight = computed(() => wrapperHeight.value / 2);

const inputUi = computed(() => {
  const base = searchBoxInputUi[props.size];
  return {
    ...base,
    wrapper: `bg-white`
  };
});

function onInput(v: any) {
  emit('update:modelValue', v)
}

function onFocus(e: any) {
  isExpanded.value = true
  emit('focus', e)
}

function onBlur(e: any) {
  // 延迟关闭，以允许从下拉列表中选择
  setTimeout(() => {
    isExpanded.value = false
  }, 200)
  emit('blur', e)
}

function handleSearch() {
  addToHistory(props.modelValue || '')
  emit('search', props.modelValue)
  isExpanded.value = false
  uni.hideKeyboard()
}

function selectHistory(keyword: string) {
  emit('update:modelValue', keyword)
  addToHistory(keyword)
  emit('search', keyword)
  isExpanded.value = false
}

function selectSku(attr: SkuAttribute) {
  emit('select-sku', attr)
  isExpanded.value = false
}

function handleCameraClick() {
  emit('click-camera')
}

const isTranslated = ref(false)
function toggleTranslate() {
  isTranslated.value = !isTranslated.value
}

onMounted(() => {
  loadHistory()
  updateWrapperHeight()
  if (isExpanded.value) updateHeight()
})
</script>

<template>
  <view :class="ui.wrapper()">
    <view class="reborn-search-box__wrapper" :class="ui.inputWrapper()">
      <RebornInput :model-value="modelValue" @update:model-value="onInput" :size="props.size" :color="props.color"
        :disabled="disabled" :rounded="rounded" :clearable="clearable" :border="border" :placeholder="placeholder"
        :focus="inputFocus" :placeholder-class="placeholderClass" :ui="inputUi" :separator="false" @focus="onFocus"
        @blur="onBlur" @confirm="handleSearch">
        <template #leading>
          <RebornImage src="https://mall.leyifan.cn/static/h5/new_images/index_search_small.png?v=1" width="38"
            height="38" mode="widthFix" />
        </template>
        <template #trailing>
          <view class="flex flex-row items-center gap-2 h-full">
            <!-- 翻译/原文 切换按钮 -->
            <view :class="ui.translateWrapper()" @tap.stop="toggleTranslate">
              <!-- 「译」卡片：激活时向右下偏移至前景 -->
              <view :class="[
                ui.translateCardBase(),
                'left-[0rpx] top-[12rpx]',
                isTranslated
                  ? ['translate-x-[38rpx] translate-y-[12rpx]', ui.translateCardActive()]
                  : ui.translateCardInactive()
              ]">
                译
              </view>
              <!-- 「原」卡片：激活时留在右下前景，非激活时向左上收起 -->
              <view :class="[
                ui.translateCardBase(),
                'left-[38rpx] top-[24rpx]',
                isTranslated
                  ? ['-translate-x-[38rpx] -translate-y-[12rpx]', ui.translateCardInactive()]
                  : ui.translateCardActive()
              ]">
                原
              </view>
            </view>
            <!-- 分割线 -->
            <view class="w-[1px] h-1/2 bg-gray-4" />
            22
          </view>
        </template>
      </RebornInput>
    </view>
  </view>
</template>
