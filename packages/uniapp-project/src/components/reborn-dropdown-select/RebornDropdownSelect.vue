<script setup lang="ts">
import type { dropdownSelectColors, dropdownSelectSizes } from './reborn-dropdown-select.config'
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import RebornSelectTrigger from '@/components/reborn-select-trigger/RebornSelectTrigger.vue'
import RebornTransition from '@/components/reborn-transition/RebornTransition.vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-dropdown-select.config'

interface Option {
  label: string
  value: any
}

interface Props {
  modelValue?: any
  options?: Option[]
  placeholder?: string
  disabled?: boolean
  size?: typeof dropdownSelectSizes[number]
  color?: typeof dropdownSelectColors[number]
  clearable?: boolean
  ui?: Partial<{
    wrapper?: string
    trigger?: string
    panel?: string
    content?: string
    item?: string
    itemText?: string
    itemIcon?: string
    empty?: string
    mask?: string
  }>
  customClass?: any
}

defineOptions({
  name: 'RebornDropdownSelect',
})

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  placeholder: '请选择',
  disabled: false,
  size: 'md',
  color: 'primary',
  clearable: false,
  ui: () => ({}),
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)

const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option ? option.label : ''
})

// ui 样式系统
const b = tv(theme)
const ui = computed(() => {
  const styles = b({
    color: props.color,
    size: props.size,
    disabled: props.disabled,
  })

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, props.ui?.wrapper) }),
    trigger: (opts?: { class?: any }) => styles.trigger({ class: cn(opts?.class, props.ui?.trigger) }),
    panel: (opts?: { class?: any }) => styles.panel({ class: cn(opts?.class, props.ui?.panel) }),
    content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, props.ui?.content) }),
    item: (opts?: { class?: any, selected?: boolean }) => styles.item({ selected: opts?.selected, class: cn(opts?.class, props.ui?.item) }),
    itemText: (opts?: { class?: any, selected?: boolean }) => styles.itemText({ selected: opts?.selected, class: cn(opts?.class, props.ui?.itemText) }),
    itemIcon: (opts?: { class?: any }) => styles.itemIcon({ class: cn(opts?.class, props.ui?.itemIcon) }),
    empty: (opts?: { class?: any }) => styles.empty({ class: cn(opts?.class, props.ui?.empty) }),
    mask: (opts?: { class?: any }) => styles.mask({ class: cn(opts?.class, props.ui?.mask) }),
  }
})

// ─── 面板展开 / 收起动画 ─────────────────────────────────────────

/**
 * 面板走「高度 0 → 实测高度」的展开动画（与 Web 端 Select 一致），不再用整块位移的 fade-down。
 * 小程序没有 scrollHeight 可读，高度靠 createSelectorQuery 测量 content 节点后内联写入外壳；
 * 展开完成后把高度放开为 auto，选项变化时面板自然增减，收起时再测一次当前高度作为起点。
 */
const proxy = getCurrentInstance()?.proxy
/** 面板是否挂在 DOM 上：收起动画结束后才真正移除 */
const panelRendered = ref(false)
/** 外壳内联高度：数值为动画中的像素值，null 表示 auto */
const panelHeight = ref<number | null>(0)
const panelOpacity = ref(0)
/** 动画时长，需与 panel 槽位的 duration-200 一致 */
const PANEL_DURATION = 200
/** 每次开合递增，用于丢弃上一轮尚未执行完的定时回调 */
let animationToken = 0
let animationTimer: ReturnType<typeof setTimeout> | null = null

const panelStyle = computed(() => {
  const height = panelHeight.value === null ? 'auto' : `${panelHeight.value}px`
  return `height: ${height}; opacity: ${panelOpacity.value};`
})

function clearAnimationTimer() {
  if (animationTimer) {
    clearTimeout(animationTimer)
    animationTimer = null
  }
}

/** 测量 content 节点的高度（已被 max-h 裁过），测不到时按 0 处理 */
function measureContentHeight(): Promise<number> {
  return new Promise((resolve) => {
    nextTick(() => {
      const query = uni.createSelectorQuery().in(proxy)
      query.select('.reborn-dropdown-select__content').boundingClientRect()
      query.exec((res) => {
        resolve(Math.ceil(res?.[0]?.height || 0))
      })
    })
  })
}

/** 下一帧再写目标值，保证起始状态先被渲染，过渡才会真正发生 */
function nextFrame(fn: () => void) {
  animationTimer = setTimeout(fn, 20)
}

async function openPanel() {
  const token = ++animationToken
  clearAnimationTimer()
  panelRendered.value = true
  panelHeight.value = 0
  panelOpacity.value = 0
  const height = await measureContentHeight()
  if (token !== animationToken) {
    return
  }
  nextFrame(() => {
    if (token !== animationToken) {
      return
    }
    panelHeight.value = height
    panelOpacity.value = 1
    animationTimer = setTimeout(() => {
      if (token === animationToken) {
        panelHeight.value = null
      }
    }, PANEL_DURATION)
  })
}

async function closePanel() {
  const token = ++animationToken
  clearAnimationTimer()
  if (!panelRendered.value) {
    return
  }
  // 从 auto 收起前先把当前高度钉成像素值，否则 height 无法过渡
  const height = await measureContentHeight()
  if (token !== animationToken) {
    return
  }
  panelHeight.value = height
  nextFrame(() => {
    if (token !== animationToken) {
      return
    }
    panelHeight.value = 0
    panelOpacity.value = 0
    animationTimer = setTimeout(() => {
      if (token === animationToken) {
        panelRendered.value = false
      }
    }, PANEL_DURATION)
  })
}

watch(isOpen, (open) => {
  if (open) {
    openPanel()
  }
  else {
    closePanel()
  }
})

onBeforeUnmount(clearAnimationTimer)

// ─── 交互 ───────────────────────────────────────────────────────

function toggleDropdown() {
  if (props.disabled) {
    return
  }
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function selectOption(option: Option) {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  closeDropdown()
}

function onClear() {
  emit('update:modelValue', null)
  emit('change', null)
}
</script>

<template>
  <view :class="ui.wrapper({ class: props.customClass })">
    <RebornSelectTrigger
      :custom-class="ui.trigger()" :text="selectedLabel" :placeholder="placeholder"
      :disabled="disabled" :size="size" :color="color" :focus="isOpen" :clearable="clearable" @open="toggleDropdown"
      @clear="onClear"
    />

    <!-- 遮罩：点击收起 -->
    <RebornTransition :show="isOpen" name="fade" :duration="200">
      <view :class="ui.mask()" @tap="closeDropdown" />
    </RebornTransition>

    <!-- 面板外壳：高度与透明度由脚本按开合阶段内联写入，形成自顶向下的展开 / 收起 -->
    <view v-if="panelRendered" :class="ui.panel()" :style="panelStyle">
      <view :class="ui.content()">
        <view
          v-for="(item, index) in options" :key="index" :class="ui.item({ selected: item.value === modelValue })"
          @tap.stop="selectOption(item)"
        >
          <text :class="ui.itemText({ selected: item.value === modelValue })">{{ item.label }}</text>
          <text v-if="item.value === modelValue" class="i-lucide-check" :class="ui.itemIcon()" />
        </view>
        <view v-if="options.length === 0" :class="ui.empty()">
          无数据
        </view>
      </view>
    </view>
  </view>
</template>
