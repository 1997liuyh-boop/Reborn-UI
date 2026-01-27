<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggleDarkMode } = useDarkMode()

const goToDemo = (path: string) => {
  uni.navigateTo({
    url: path
  })
}

</script>

<template>
  <page-meta :root-class="isDark ? 'dark' : ''" />
  <view class="
      flex min-h-screen w-full justify-center
      bg-[radial-gradient(circle_at_18%_20%,#e0f2fe,#fdf4ff_70%)] px-0 py-6
      text-slate-800
      dark:bg-slate-950 dark:bg-none dark:text-slate-200 transition-colors duration-300
    ">
    <view class="
        flex w-full flex-col space-y-6 px-4
        sm:px-5
        md:w-[94vw] md:max-w-[700px]
      ">
      <!-- Header -->
      <view class="py-10 text-center space-y-3">
        <view class="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          @click="toggleDarkMode">
          <view class="relative text-4xl font-black tracking-tight flex items-baseline">
            <text class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Reborn U
            </text>

            <view class="relative inline-flex flex-col items-center">
              <view class="absolute -top-5 -right-3.5 transition-all duration-500 ease-in-out"
                :class="isDark ? '-translate-y-1 rotate-0 opacity-100' : 'translate-y-0 rotate-270 opacity-100'">
                <view :class="isDark ? 'i-meteocons-clear-day-fill' : 'i-meteocons-extreme-drizzle-fill'"
                  class="size-6" />
              </view>

              <view
                class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transform translate-y-[1px] translate-x-1.5 font-bold text-2xl">
                I
              </view>
            </view>
          </view>
        </view>

        <view class="text-slate-500 dark:text-slate-400 font-medium tracking-wide text-sm uppercase opacity-80">
          Component Showcase
        </view>
      </view>

      <view class="grid grid-cols-2 gap-2">
        <view
          class="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 dark:text-slate-300 active:scale-95 transition-transform"
          @click="goToDemo('/pages/reborn-button/RebornButtonDemo')">
          <view class="i-lucide-layout-grid size-8 mb-2 text-blue-500" />
          Buttons
        </view>
        <view
          class="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 dark:text-slate-300 active:scale-95 transition-transform"
          @click="goToDemo('/pages/reborn-input/RebornInputDemo')">
          <view class="i-lucide-text-cursor-input size-8 mb-2 text-blue-500" />
          Input
        </view>
        <view
          class="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 dark:text-slate-300 active:scale-95 transition-transform"
          @click="goToDemo('/pages/reborn-input-number/RebornInputNumberDemo')">
          <view class="i-lucide-hash size-8 mb-2 text-blue-500" />
          Input Number
        </view>
        <view
          class="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 dark:text-slate-300 active:scale-95 transition-transform"
          @click="goToDemo('/pages/reborn-switch/RebornSwitchDemo')">
          <view class="i-lucide-toggle-right size-8 mb-2 text-blue-500" />
          Switch
        </view>
        <view
          class="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 dark:text-slate-300 active:scale-95 transition-transform"
          @click="goToDemo('/pages/reborn-checkbox/RebornCheckboxDemo')">
          <view class="i-lucide-check-square size-8 mb-2 text-blue-500" />
          Checkbox
        </view>

        <view
          class="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 dark:text-slate-300 active:scale-95 transition-transform"
          @click="goToDemo('/pages/reborn-badge/RebornBadgeDemo')">
          <view class="i-lucide-badge-check size-8 mb-2 text-blue-500" />
          Badge
        </view>

        <view
          class="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 dark:text-slate-300 active:scale-95 transition-transform"
          @click="goToDemo('/pages/tabs/index')">
          <view class="i-lucide-gallery-horizontal-end size-8 mb-2 text-blue-500" />
          Tabs
        </view>
      </view>

    </view>
  </view>
</template>
