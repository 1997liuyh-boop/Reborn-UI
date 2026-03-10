<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { imageMode } from './reborn-image.config'
import { computed, ref } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-image.config'

export interface ImageProps {
  customClass?: ClassValue
  src: string
  mode?: typeof imageMode[number] // 图片裁剪、缩放的模式
  preview?: boolean // 是否显示边框
  previewList?: string[]
  height?: string | number
  width?: string | number
  showLoading?: boolean // 是否显示加载状态
  lazyLoad?: boolean // 是否懒加载
  fadeShow?: boolean // 图片显示动画效果
  webp?: boolean // 是否解码webp格式
  showMenuByLongpress?: boolean // 是否长按显示菜单
  round?: boolean // 是否显示圆角
  ui?: Partial<{
    root: ClassValue
    error: ClassValue
    errorIcon: ClassValue
    loading: ClassValue
    loadingIcon: ClassValue
    inner: ClassValue
  }>
}

const props = withDefaults(defineProps<ImageProps>(), {
  mode: 'aspectFill',
  preview: false,
  height: 120,
  width: 120,
  showLoading: true,
  lazyLoad: false,
  webp: false,
  showMenuByLongpress: false,
  round: false,
})

// 事件定义
const emit = defineEmits(['load', 'error'])

const b = tv(theme)

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b({
    round: props.round,
  })
  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
    error: (opts?: { class?: any }) => styles.error({ class: cn(opts?.class, uiOverrides.value.error) }),
    errorIcon: (opts?: { class?: any }) => styles.errorIcon({ class: cn(opts?.class, uiOverrides.value.errorIcon) }),
    loading: (opts?: { class?: any }) => styles.loading({ class: cn(opts?.class, uiOverrides.value.loading) }),
    loadingIcon: (opts?: { class?: any }) => styles.loadingIcon({ class: cn(opts?.class, uiOverrides.value.loadingIcon) }),
    inner: (opts?: { class?: any }) => styles.inner({ class: cn(opts?.class, uiOverrides.value.inner) }),
  }
})

// 加载状态
const isLoading = ref(true)
// 加载失败状态
const isError = ref(false)

function getUnit(val: string | number | undefined | null): string | undefined {
  if (val == null || val === '') { return undefined }

  if (typeof val === 'string') {
    // 如果包含单位则直接返回，否则补 rpx
    const hasUnit = /px|rpx|%|vw|vh$/.test(val)
    return hasUnit ? val : `${val}rpx`
  }
  return `${val}rpx`
}

// 图片加载成功
function onLoad(e: any) {
  isLoading.value = false
  isError.value = false
  emit('load', e)
}

// 图片加载失败
function onError(e: any) {
  isLoading.value = false
  isError.value = true
  emit('error', e)
}

// 图片点击
function onTap() {
  if (props.preview) {
    // 修正逻辑：优先使用 previewList，如果没有则用当前 src 组成数组
    const urls = (props.previewList && props.previewList.length > 0)
      ? props.previewList
      : [props.src]

    uni.previewImage({
      urls, // 此时 urls 必定是 string[]
      current: props.src,
    })
  }
}
</script>

<template>
  <view :class="ui.root({ class: props.customClass })" :style="{
    width: getUnit(width),
    height: getUnit(height),
  }">
    <view v-if="isError" :class="ui.error()">
      <slot name="error">
        <!-- <view :class="absolute w-[2px] h-full bg-current rotate-45"></view>
				<view :class="absolute w-[2px] h-full bg-current -rotate-45"></view> -->
        <view :class="ui.errorIcon()">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
              <path
                d="m3 16l7-3l4 1.818M16 10a2 2 0 1 1 0-4a2 2 0 0 1 0 4m.879 11.121L19 19m2.121-2.121L19 19m0 0l-2.121-2.121M19 19l2.121 2.121" />
              <path d="M13 21H3.6a.6.6 0 0 1-.6-.6V3.6a.6.6 0 0 1 .6-.6h16.8a.6.6 0 0 1 .6.6V13" />
            </g>
          </svg>
        </view>
      </slot>
    </view>
    <view v-else-if="isLoading && showLoading" :class="ui.loading()">
      <slot name="loading">
        <view :class="ui.loadingIcon()" class="
            size-6 animate-spin rounded-full border-2 border-gray-3
            border-t-blue-500
          " />
      </slot>
    </view>
    <image :class="ui.inner()" :src="src" :mode="mode" :lazy-load="lazyLoad" :webp="webp"
      :show-menu-by-longpress="showMenuByLongpress" @load="onLoad" @error="onError" @tap="onTap" />
    <slot />
  </view>
</template>
