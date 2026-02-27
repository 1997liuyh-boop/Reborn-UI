<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  padding?: boolean
  customClass?: string
}>(), {
  padding: true,
  customClass: '',
})
</script>

<template>
  <view class="space-y-3">
    <view
      v-if="title" class="
        text-sm font-medium uppercase tracking-wider text-slate-500
        dark:text-slate-200
      "
    >
      {{ title }}
    </view>
    <view
      class="
        overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm
        dark:border-gray-700 dark:bg-gray-800
      "
      :class="[padding ? 'p-4' : '', customClass]"
    >
      <slot />
    </view>
  </view>
</template>
