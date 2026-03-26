<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, useSlots, watch } from 'vue'
import RebornInput from '../reborn-input/RebornInput.vue'
import RebornSelect from '../reborn-select/RebornSelect.vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { searchBoxSizes, searchBoxInputUi } from './reborn-search-box.config'

export interface SkuAttribute {
  label: string;
  value: any;
  [key: string]: any;
}

export interface SearchBoxProps {
  modelValue?: string
  placeholder?: string
  size?: typeof searchBoxSizes[number]
  color?: "primary" | "blue" | "green" | "orange";
  mode?: "associate" | "sku";
  showDropdown?: boolean;
  skuAttributes?: SkuAttribute[];
  saveHistory?: (history: string[]) => void;
  removeHistory?: () => void;
  customClass?: any
  placeholderClass?: string
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
      styles.wrapper({
        class: cn(
          "relative",
          opts?.class,
          props.customClass
        ),
      }),
    inputWrapper: (opts?: { class?: any }) => styles.inputWrapper({ class: cn(opts?.class) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class) }),
    trailing: (opts?: { class?: any }) => styles.trailing({ class: cn(opts?.class) }),
    cameraIcon: (opts?: { class?: any }) => styles.cameraIcon({ class: cn(opts?.class) }),
    searchButton: (opts?: { class?: any }) => styles.searchButton({ class: cn(opts?.class) }),
    searchIcon: (opts?: { class?: any }) => styles.searchIcon({ class: cn(opts?.class) }),
    // Dropdown Panel
    dropdown: (opts?: { class?: any }) => styles.dropdown({ class: cn(opts?.class) }),
    section: (opts?: { class?: any }) => styles.section({ class: cn(opts?.class) }),
    sectionTitle: (opts?: { class?: any }) => styles.sectionTitle({ class: cn(opts?.class) }),
    historyTags: (opts?: { class?: any }) => styles.historyTags({ class: cn(opts?.class) }),
    historyTag: (opts?: { class?: any }) => styles.historyTag({ class: cn(opts?.class) }),
    deleteIcon: (opts?: { class?: any }) => styles.deleteIcon({ class: cn(opts?.class) }),
    clearAll: (opts?: { class?: any }) => styles.clearAll({ class: cn(opts?.class) }),
    associateList: (opts?: { class?: any }) => styles.associateList({ class: cn(opts?.class) }),
    associateItem: (opts?: { class?: any }) => styles.associateItem({ class: cn(opts?.class) }),
    skuWrapper: (opts?: { class?: any }) => styles.skuWrapper({ class: cn(opts?.class) }),
    skuItem: (opts?: { class?: any }) => styles.skuItem({ class: cn(opts?.class) }),
    skuLabel: (opts?: { class?: any }) => styles.skuLabel({ class: cn(opts?.class) }),
    skuValue: (opts?: { class?: any }) => styles.skuValue({ class: cn(opts?.class) }),
    dropdownOuter: (opts?: { class?: any }) => styles.dropdownOuter({ class: cn(opts?.class) }),
    separator: (opts?: { class?: any }) => styles.separator({ class: cn(opts?.class) }),
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
    wrapper: `${base.wrapper} ${isExpanded.value ? "" : "ring-0"}`.trim(),
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
  // Delay to allow selection from dropdown
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

onMounted(() => {
  loadHistory()
  updateWrapperHeight()
  if (isExpanded.value) updateHeight()
})
</script>

<template>
  <view :class="ui.wrapper()">
    <view class="reborn-search-box__wrapper" :class="ui.inputWrapper()">
      <RebornInput :model-value="modelValue" :placeholder="placeholder" :class="ui.input()" :focus="inputFocus"
        :placeholder-class="placeholderClass" :ui="inputUi" :separator="false" @input="onInput" @focus="onFocus"
        @blur="onBlur" @confirm="handleSearch">
        <template #leading>
          <view class="flex flex-row items-center">
            <RebornSelect v-model="sizeValue" color="primary" :options="sizeSections" size="sm"
              :trigger-ui="{ wrapper: 'border-0! bg-transparent!' }" :clearable="false" @tap.stop>
              <template #tag="{ selectItem }">
                <view class="text-ellipsis w-100 text-28 text-gray-8">{{ selectItem[0]?.label || '' }}</view>
              </template>
            </RebornSelect>
            <view class="mx-12" :class="ui.separator()" />
          </view>
        </template>
        <template #trailing>
          <view class="flex flex-row items-center gap-12">
            <slot name="trailing" :ui="ui">
              <view class="i-lucide-camera" :class="ui.cameraIcon()" @tap.stop="handleCameraClick" />
            </slot>

            <view :class="ui.searchButton()" @tap.stop="handleSearch" class="h-full px-24">
              <slot name="search-button" :ui="ui">
                <view class="i-lucide-search" :class="ui.searchIcon()" />
              </slot>
            </view>
          </view>
        </template>
      </RebornInput>
    </view>

    <!-- 下拉面板 -->
    <view :class="ui.dropdownOuter()" :style="{
      height: isExpanded ? `${dropdownHeight}px` : '0px',
      top: `${inputHeight}px`,
      opacity: isExpanded ? 1 : 0,
      pointerEvents: isExpanded ? 'auto' : 'none'
    }">
      <view class="reborn-dropdown__content" :class="ui.dropdown()" :style="{ paddingTop: `${inputHeight * 2}px` }"
        @tap.stop>
        <slot name="dropdown" :ui="ui" :history="localHistory">
          <!-- Associate Mode -->
          <template v-if="mode === 'associate'">
            <!-- Recent Searches Section -->
            <view v-if="localHistory.length > 0" :class="ui.section()">
              <view :class="ui.sectionTitle()">
                <text>最近搜索</text>
                <text :class="ui.clearAll()" @tap.stop="handleClearHistory">清空全部</text>
              </view>
              <view :class="ui.historyTags()">
                <slot name="history" :history="localHistory" :ui="ui">
                  <view v-for="h in localHistory" :key="h" :class="ui.historyTag()" @tap.stop="selectHistory(h)">
                    <text>{{ h }}</text>
                    <view class="i-lucide-x" :class="ui.deleteIcon()" @tap.stop="handleRemoveHistoryItem(h)" />
                  </view>
                </slot>
              </view>
            </view>
            <!-- Associate List Section (Placeholder or Slot) -->
            <view v-if="$slots['associate-list']" :class="ui.section()">
              <slot name="associate-list" :ui="ui" />
            </view>
          </template>

          <!-- SKU Mode -->
          <template v-else-if="mode === 'sku'">
            <text :class="ui.sectionTitle()">属性搜索</text>
            <view :class="ui.skuWrapper()">
              <slot name="sku-list" :ui="ui" :attributes="skuAttributes">
                <view v-for="attr in skuAttributes" :key="attr.label" :class="ui.skuItem()" @tap.stop="selectSku(attr)">
                  <text :class="ui.skuLabel()">{{ attr.label }}</text>
                  <text :class="ui.skuValue()">{{ attr.value }}</text>
                </view>
              </slot>
            </view>
          </template>
        </slot>
      </view>
    </view>
  </view>
</template>

<style scoped>
.z-60 {
  z-index: 60;
}
</style>
