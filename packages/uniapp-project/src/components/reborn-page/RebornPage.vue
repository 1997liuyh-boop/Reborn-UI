<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { type PageUI } from './reborn-page.config'
import RebornToast from '@/components/reborn-toast/RebornToast.vue'

const props = defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  customClass: { type: String, default: '' },
  ui: {
    type: Object as PropType<PageUI>,
    default: () => ({}),
  },
})

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b()
  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
    header: (opts?: { class?: any }) => styles.header({ class: cn(opts?.class, uiOverrides.value.header) }),
    title: (opts?: { class?: any }) => styles.title({ class: cn(opts?.class, uiOverrides.value.title) }),
    description: (opts?: { class?: any }) => styles.description({ class: cn(opts?.class, uiOverrides.value.description) }),
    body: (opts?: { class?: any }) => styles.body({ class: cn(opts?.class, uiOverrides.value.body) }),
  }
})
</script>

<template>
  <view :class="ui.root({ class: props.customClass })">
    <view v-if="title || description || $slots.header" :class="ui.header()">
      <slot name="header">
        <view v-if="title" :class="ui.title()">
          {{ title }}
        </view>
        <view v-if="description" :class="ui.description()">
          {{ description }}
        </view>
      </slot>
    </view>

    <view :class="ui.body()">
      <slot />
    </view>

    <RebornToast />
  </view>
</template>

<script lang="ts">
export default {
  name: 'reborn-page',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>
