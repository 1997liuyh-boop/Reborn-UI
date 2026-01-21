<script setup lang="ts">

const goToDemo = (path: string) => {
  uni.navigateTo({
    url: path
  })
}

const goToButtonPage = () => {
  uni.navigateTo({
    url: '/pages/button/index'
  })
}

</script>

<template>
  <view class="
      flex min-h-screen w-full justify-center
      bg-[radial-gradient(circle_at_18%_20%,#e0f2fe,#fdf4ff_70%)] px-0 py-6
      text-slate-800
    ">
    <view class="
        flex w-full flex-col space-y-6 px-4
        sm:px-5
        md:w-[94vw] md:max-w-[700px]
      ">
      <!-- Header -->
      <view class="py-8 text-center space-y-2">
        <view
          class="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Reborn UI
        </view>
        <view class="text-slate-500 font-medium tracking-wide text-sm uppercase opacity-80">
          Component Showcase
        </view>
      </view>

      <view class="grid grid-cols-2 gap-2">
        <view
          class="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 active:scale-95 transition-transform"
          @click="goToButtonPage">
          <view class="i-lucide-layout-grid size-8 mb-2 text-blue-500" />
          Buttons
        </view>
        <view
          class="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 active:scale-95 transition-transform"
          @click="goToDemo('/pages/input/index')">
          <view class="i-lucide-text-cursor-input size-8 mb-2 text-blue-500" />
          Input
        </view>
        <view
          class="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 active:scale-95 transition-transform"
          @click="goToDemo('/pages/input-number/index')">
          <view class="i-lucide-hash size-8 mb-2 text-blue-500" />
          Input Number
        </view>
        <view
          class="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 active:scale-95 transition-transform"
          @click="goToDemo('/pages/switch/index')">
          <view class="i-lucide-toggle-right size-8 mb-2 text-blue-500" />
          Switch
        </view>
        <view
          class="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 active:scale-95 transition-transform"
          @click="goToDemo('/pages/checkbox/index')">
          <view class="i-lucide-check-square size-8 mb-2 text-blue-500" />
          Checkbox
        </view>

        <view
          class="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 active:scale-95 transition-transform"
          @click="goToDemo('/pages/badge/index')">
          <view class="i-lucide-badge-check size-8 mb-2 text-blue-500" />
          Badge
        </view>

        <view
          class="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center font-medium text-slate-700 active:scale-95 transition-transform"
          @click="goToDemo('/pages/tabs/index')">
          <view class="i-lucide-gallery-horizontal-end size-8 mb-2 text-blue-500" />
          Tabs
        </view>
      </view>

    </view>
  </view>
</template>
