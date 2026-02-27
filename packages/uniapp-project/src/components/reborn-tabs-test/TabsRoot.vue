<script setup lang="ts">
import type { TabsProps } from './types'
import { useVModel } from '@vueuse/core'
import { computed, provide, ref, toRef } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'

import theme from './reborn-tabs.config'

export type { TabsProps }

const props = withDefaults(defineProps<TabsProps>(), {
  defaultActive: 0,
  type: 'line',
  variant: 'primary',
  size: 'md',
  orientation: 'horizontal',
  sticky: false,
  swipeable: false,
  shrink: false,
  scrollspy: false,
  activationMode: 'automatic',
  ignorePageScroll: false,
})

const emit = defineEmits<{
  (e: 'update:active', value: number): void
  (e: 'click-tab', value: number, event: any): void
}>()

const activeIndex = useVModel(props, 'active', emit, {
  defaultValue: props.defaultActive,
  passive: true,
})

const b = tv(theme)
const type = toRef(props, 'type')
const variant = toRef(props, 'variant')
const size = toRef(props, 'size')
const orientation = toRef(props, 'orientation')
const sticky = toRef(props, 'sticky')
const swipeable = toRef(props, 'swipeable')
const shrink = toRef(props, 'shrink')
const scrollspy = toRef(props, 'scrollspy')
const uiOverrides = computed(() => props.ui ?? {})

const ui = computed(() => b({
  type: type.value,
  variant: variant.value,
  size: size.value,
  orientation: orientation.value,
  sticky: sticky.value,
  shrink: shrink.value,
  scrollspy: scrollspy.value,
}))

const triggerCounter = ref(0)
const contentCounter = ref(0)

// Simple ID generator for coordination
const rootId = `tabs-${Math.random().toString(36).substring(2, 9)}`

function registerTrigger(index?: number) {
  if (typeof index === 'number') {
    triggerCounter.value = Math.max(triggerCounter.value, index + 1)
    return index
  }
  const value = triggerCounter.value
  triggerCounter.value += 1
  return value
}

function registerContent(index?: number) {
  if (typeof index === 'number') {
    contentCounter.value = Math.max(contentCounter.value, index + 1)
    return index
  }
  const value = contentCounter.value
  contentCounter.value += 1
  return value
}

// Map of index -> unique ID string (needed for scroll-into-view or selector queries)
const contentIds = ref<Record<number, string>>({})

function registerContentId(index: number, id: string) {
  contentIds.value[index] = id
}

function unregisterContentId(index: number) {
  delete contentIds.value[index]
}

const currentScrollToId = ref('')

function scrollToContent(index: number) {
  const id = contentIds.value[index]
  if (id) {
    currentScrollToId.value = id

    if (!props.ignorePageScroll) {
      // In UniApp, we can try to scroll the page to the content
      uni.pageScrollTo({
        selector: `#${id}`,
        duration: 300,
        fail: () => {
          // If ID not found or in a scroll-view, this might fail or do nothing.
          // We could emit an event for manual handling
          // console.warn(`[TabsRoot] Could not scroll to content #${id}. If content is inside a scroll-view, please handle scrolling manually.`);
        },
      })
    }
  }
}

const direction = ref<'next' | 'prev'>('next')

function setActiveIndex(value: number) {
  const currentDefault = activeIndex.value ?? 0
  if (value > currentDefault) {
    direction.value = 'next'
  }
  else if (value < currentDefault) {
    direction.value = 'prev'
  }
  activeIndex.value = value
}

function onTabClick(value: number, event: any) {
  if (props.activationMode === 'manual') {
    // Manual mode handled by Trigger
  }
  emit('click-tab', value, event)
}

provide('TabsContext', {
  rootId,
  activeIndex,
  type,
  variant,
  size,
  orientation,
  swipeable,
  contentCounter,
  activationMode: toRef(props, 'activationMode'),
  sticky,
  scrollspy,
  registerTrigger,
  registerContent,
  registerContentId,
  unregisterContentId,
  scrollToContent,
  setActiveIndex,
  onTabClick,
  ui,
  uiOverrides,
  direction, // Provide direction to context
})

defineExpose({
  activeIndex,
})
</script>

<template>
  <view :class="cn(ui.root(), uiOverrides.root, props.customClass)">
    <slot :ui="ui" :ui-overrides="uiOverrides" :current-scroll-to-id="currentScrollToId" :root-id="rootId" />
  </view>
</template>
