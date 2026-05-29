<script setup lang="ts">
import { inject, computed } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-breadcrumb.config'

export interface RebornBreadcrumbItemProps {
  to?: string | object
  replace?: 'navigate' | 'redirect' | 'switchTab' | 'reLaunch'
  target?: string
  customClass?: any
  ui?: any
}

const props = withDefaults(defineProps<RebornBreadcrumbItemProps>(), {
  replace: 'navigate',
  ui: () => ({})
})

const context = inject<any>('breadcrumb', {
  separator: '/',
  ui: theme.slots
})

const b = tv(theme)
const ui = computed(() => {
  const styles = b({
    active: !!props.to
  })
  return {
    item: (opts?: { class?: any }) => styles.item({ class: cn(opts?.class, props.ui?.item) }),
    link: (opts?: { class?: any }) => styles.link({ class: cn(opts?.class, props.ui?.link, props.customClass) }),
    separator: (opts?: { class?: any }) => styles.separator({ class: cn(opts?.class, props.ui?.separator) }),
  }
})

function handleClick() {
  if (!props.to) { return }

  let url = ''
  if (typeof props.to === 'string') {
    url = props.to
  } else if (typeof props.to === 'object') {
    url = (props.to as any).path || ''
  }

  if (!url) { return }

  const navMap = {
    navigate: uni.navigateTo,
    redirect: uni.redirectTo,
    switchTab: uni.switchTab,
    reLaunch: uni.reLaunch
  }

  const navFn = navMap[props.replace] || uni.navigateTo
  navFn({ url })
}
</script>

<template>
  <view :class="ui.item()">
    <view :class="ui.link({ class: 'reborn-breadcrumb-item__link' })" @tap="handleClick">
      <slot />
    </view>
    <view :class="ui.separator()">
      <slot name="separator">
        <template v-if="context.separatorIcon">
          <view v-if="typeof context.separatorIcon === 'string'" :class="context.separatorIcon" />
          <!-- #ifdef H5 || APP-PLUS -->
          <component :is="context.separatorIcon" v-else />
          <!-- #endif -->
        </template>
        <template v-else>
          <text>{{ context.separator }}</text>
        </template>
      </slot>
    </view>
  </view>
</template>
