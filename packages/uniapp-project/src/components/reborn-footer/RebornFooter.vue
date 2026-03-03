<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'

import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import { rebornFooterOffset } from './offset'
import theme from './reborn-footer.config'

defineOptions({
  name: 'RebornFooter',
})

const props = withDefaults(defineProps<FooterProps>(), {
  ui: () => ({}),
  minHeight: 30,
  vt: 0,
  height: null,
  backgroundColor: null,
})

interface FooterProps {
  ui?: Partial<{
    placeholder: ClassValue
    wrapper: ClassValue
    footer: ClassValue
    content: ClassValue
  }>
  minHeight?: number
  vt?: number
  height?: number | null
  backgroundColor?: string | null
  customClass?: any
}

const { proxy } = getCurrentInstance()!

const b = tv(theme)

const uiOverrides = computed(() => props.ui || {})
const ui = computed(() => {
  const styles = b()

  return {
    placeholder: (opts?: { class?: any }) =>
      styles.placeholder({ class: cn(opts?.class, uiOverrides.value.placeholder) }),
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    footer: (opts?: { class?: any }) =>
      styles.footer({ class: cn(opts?.class, uiOverrides.value.footer) }),
    content: (opts?: { class?: any }) =>
      styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
  }
})

const placeholderHeight = ref(0)
const visible = ref(true)

const contentStyle = computed(() => {
  if (props.height == null) {
    return undefined
  }

  return {
    height: `${props.height}px`,
  }
})

const footerStyle = computed(() => {
  if (props.backgroundColor == null) {
    return undefined
  }

  return {
    backgroundColor: props.backgroundColor,
  }
})

const placeholderStyle = computed(() => ({
  height: `${placeholderHeight.value}px`,
}))

function getSafeAreaHeight(type: 'top' | 'bottom') {
  const { safeAreaInsets } = uni.getWindowInfo()

  if (type === 'top') {
    return safeAreaInsets.top
  }

  let height = safeAreaInsets.bottom

  // #ifdef APP-ANDROID
  if (height === 0) {
    height = 16
  }
  // #endif

  return height
}

function setHeight(value: number) {
  placeholderHeight.value = value
  visible.value = value > props.minHeight + getSafeAreaHeight('bottom')
  rebornFooterOffset.set(visible.value ? value : 0)
}

function getHeight() {
  if (props.height != null) {
    setHeight(props.height + getSafeAreaHeight('bottom'))
    return
  }

  nextTick(() => {
    uni.createSelectorQuery()
      .in(proxy)
      .select('.reborn-footer')
      .boundingClientRect((res) => {
        setHeight(Math.floor((res as any)?.height ?? 0))
      })
      .exec()
  })
}

onMounted(() => {
  watch(
    () => props.vt,
    () => {
      visible.value = true
      getHeight()
    },
    {
      immediate: true,
    },
  )
})
</script>

<template>
  <view v-if="visible" :class="ui.placeholder()" :style="placeholderStyle" />

  <view :class="ui.wrapper()">
    <view v-if="visible" :class="ui.footer({ class: props.customClass })" :style="footerStyle">
      <view :class="ui.content()" :style="contentStyle">
        <slot />
      </view>
    </view>
  </view>
</template>
