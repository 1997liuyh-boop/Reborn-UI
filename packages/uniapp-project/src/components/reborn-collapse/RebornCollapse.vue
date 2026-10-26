<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, shallowRef, watch } from 'vue'
import { useBooleanModel } from '@/composables/useBooleanModel'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-collapse.config'

export interface RebornCollapseProps {
  customClass?: any
  ui?: {
    root?: any
    trigger?: any
    content?: any
  }
}

const props = withDefaults(defineProps<RebornCollapseProps>(), {
  customClass: '',
  ui: () => ({}),
})

defineModel<boolean>({ default: undefined })
const collapse = useBooleanModel('modelValue')

// 获取组件实例
const { proxy } = getCurrentInstance()!

const b = tv(theme)
const ui = computed(() => b())
const overrides = computed(() => props.ui || {})

// 开合状态只由模型持有，像素高度只负责过渡。
const isOpened = computed(() => !!collapse.value)
// null 表示 height: auto。初始状态直接落到终态，挂载时不做过渡，也就不会先撑开再收回。
// auto 能等于内容高度的前提是内容节点留在文档流里（见 reborn-collapse.config.ts 的 content）。
const height = shallowRef<number | null>(isOpened.value ? null : 0)
let token = 0
let measureTimer: ReturnType<typeof setTimeout> | undefined
let transitionTimer: ReturnType<typeof setTimeout> | undefined

function cancelTransition() {
  token++
  clearTimeout(measureTimer)
  clearTimeout(transitionTimer)
}

function updateHeight() {
  cancelTransition()
  // 已收起且高度已是 0：无需测量，否则会先写入内容高度、再回到 0，出现一次展开闪动
  if (!isOpened.value && height.value === 0) return
  const current = token
  nextTick(() => {
    if (current !== token) return
    measureTimer = setTimeout(() => {
      uni.createSelectorQuery().in(proxy).select('.reborn-collapse__content')
        .boundingClientRect((data) => {
          if (current !== token) return
          const node = data as UniApp.NodeInfo
          height.value = node?.height ?? 0
          transitionTimer = setTimeout(() => {
            if (current === token) height.value = isOpened.value ? null : 0
          }, isOpened.value ? 300 : 20)
        }).exec()
    }, 20)
  })
}

function show() { collapse.value = true }
function hide() { collapse.value = false }
function toggle() { collapse.value = !isOpened.value }

watch(isOpened, updateHeight)
onBeforeUnmount(cancelTransition)

defineExpose({
  show,
  hide,
  toggle,
  resize: updateHeight,
})
</script>

<template>
  <view :class="ui.root({ class: cn(props.customClass, overrides?.root) })">
    <view @click="toggle">
      <slot :open="isOpened" />
    </view>
    <view :class="ui.trigger({ class: overrides?.trigger })" :style="{ height: height === null ? 'auto' : `${height}px` }">
      <view class="reborn-collapse__content" :class="ui.content({ class: overrides?.content })">
        <slot name="content" />
      </view>
    </view>
  </view>
</template>
