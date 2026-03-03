<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import { isHarmony } from '@/lib/device'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import { rebornFooterOffset } from './offset'
import theme from './reborn-footer.config'

export interface RebornFooterProps {
  // 最小高度，小于该高度时，不显示
  minHeight?: number
  // 监听值，触发更新
  vt?: number
  // 内容高度
  height?: number | null
  ui?: {
    placeholder?: ClassValue
    wrapper?: ClassValue
    base?: ClassValue
    content?: ClassValue
  }
}

defineOptions({
  name: 'RebornFooter',
})
const props = withDefaults(defineProps<RebornFooterProps>(), {
  minHeight: 30,
  vt: 0,
  height: null,
})

const { proxy } = getCurrentInstance()!

const b = tv(theme)

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b()

  return {
    placeholder: (opts?: { class?: any }) => styles.placeholder({ class: cn(opts?.class, uiOverrides.value.placeholder) }),
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base) }),
    content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
  }
})

const placeholderHeight = ref(0)
const visible = ref(true)

const contentStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props.height != null) {
    style.height = `${props.height}px`
  }

  return style
})

function getSafeAreaHeight(type: 'top' | 'bottom') {
  const { safeAreaInsets } = uni.getWindowInfo()

  if (type === 'top') {
    return safeAreaInsets.top
  }

  let h = safeAreaInsets.bottom

  // #ifdef APP-ANDROID
  if (h === 0) {
    h = 16
  }
  // #endif

  return h
}

function setHeight(val: number) {
  placeholderHeight.value = val + 5
  visible.value = val > props.minHeight + getSafeAreaHeight('bottom')
  rebornFooterOffset.set(visible.value ? val : 0)
}

function getHeight() {
  if (props.height != null) {
    setHeight(props.height + getSafeAreaHeight('bottom'))
    return
  }

  nextTick(() => {
    setTimeout(() => {
      uni.createSelectorQuery()
        .in(proxy)
        .select('#reborn-footer-node')
        .boundingClientRect((res) => {
          setHeight(Math.floor((res as NodeInfo).height ?? 0))
        })
        .exec()
    }, isHarmony() ? 50 : 0)
  })
}

onMounted(() => {
  watch(
    () => props.vt,
    () => {
      visible.value = true
      getHeight()
    },
    { immediate: true },
  )
})
</script>

<template>
  <view v-if="visible" :class="ui.placeholder()" :style="{ height: `${placeholderHeight}px` }" />

  <view :class="ui.wrapper()">
    <view v-if="visible" id="reborn-footer-node" :class="ui.base()">
      <view :class="ui.content()" :style="contentStyle">
        <slot />
      </view>
    </view>
  </view>
</template>
