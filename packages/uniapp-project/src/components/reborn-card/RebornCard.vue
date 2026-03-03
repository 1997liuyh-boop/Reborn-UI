<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  padding?: boolean
  customClass?: string
  overflowVisible?: boolean
}>(), {
  padding: true,
  customClass: '',
  overflowVisible: false,
})
</script>

<template>
  <view class="space-y-3">
    <view v-if="title" class="
        text-sm font-medium uppercase tracking-wider text-slate-500
        dark:text-slate-200
      ">
      {{ title }}
    </view>
    <view class="
        rounded-xl border border-slate-200 bg-white shadow-sm
        dark:border-gray-700 dark:bg-gray-800
      " :class="[padding ? 'p-4' : '', customClass, overflowVisible ? '' : 'overflow-hidden']">
      <slot />
    </view>
  </view>
</template>
