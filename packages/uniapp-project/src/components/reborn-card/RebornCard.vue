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
  <view class="flex flex-col gap-3">
    <slot name="title">
      <view v-if="title" class="
        text-sm font-medium uppercase tracking-wider text-slate-500
        dark:text-slate-200
      ">
        {{ title }}
      </view>
    </slot>
    <view class="
        rounded-xl border border-slate-200 bg-white shadow-sm
        dark:border-gray-700 dark:bg-gray-800 flex flex-col gap-3
      " :class="[padding ? 'p-4' : '', customClass, overflowVisible ? '' : 'overflow-hidden']">
      <slot />
    </view>
  </view>
</template>
