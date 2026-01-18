<script setup lang="ts">
import { ref } from 'vue'
import RebornBadge from '@/components/reborn-badge/reborn-badge.vue'
import RebornButton from '@/components/reborn-button/reborn-button.vue'
import RebornInput from '@/components/reborn-input/reborn-input.vue'
import RebornInputNumber from '@/components/reborn-input-number/reborn-input-number.vue'
import RebornSwitch from '@/components/reborn-switch/reborn-switch.vue'
import RebornTabs from '@/components/reborn-tabs/reborn-tabs.vue'

const inputValue = ref('')
const inputNumberValue = ref(1)
const switchValue = ref(false)
const showBadge = ref(true)
const activeTab = ref(0) // Assuming index based, or check if it needs value
const tabList = [
  { label: 'Tab 1', value: 0 },
  { label: 'Tab 2', value: 1 },
  { label: 'Tab 3', value: 2 },
]

onLoad(() => {
  console.log('Reborn UI Showcase Loaded')
})
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

      <!-- Buttons -->
      <view class="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 space-y-4">
        <view class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <view class="w-1 h-5 bg-blue-500 rounded-full"></view>
          Buttons
        </view>
        <view class="flex flex-wrap gap-3">
          <RebornButton>Default</RebornButton>
          <RebornButton variant="outline">Outline</RebornButton>
          <RebornButton color="error">Danger</RebornButton>
          <RebornButton color="success">success</RebornButton>
          <RebornButton color="warning">warning</RebornButton>
          <RebornButton color="info">info</RebornButton>
          <RebornButton color="neutral">neutral</RebornButton>
          <RebornButton loading>Loading</RebornButton>
        </view>
      </view>

      <!-- Badges -->
      <view class="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 space-y-4">
        <view class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <view class="w-1 h-5 bg-indigo-500 rounded-full"></view>
          Badges
        </view>
        <view class="flex items-center gap-3 pl-2 flex-wrap">
          <RebornBadge label="New" />
          <RebornBadge label="Beta" variant="outline" />
          <RebornBadge label="Admin" color="secondary" />
          <RebornBadge label="99+" color="error" />
          <RebornBadge v-if="showBadge" label="Closable Badge" closable color="error" @close="showBadge = false" />
        </view>
      </view>

      <!-- Inputs -->
      <view class="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 space-y-5">
        <view class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <view class="w-1 h-5 bg-violet-500 rounded-full"></view>
          Form Inputs
        </view>
        <view class="space-y-4">
          <view>
            <view class="text-sm text-slate-500 mb-1.5 ml-1">Text Input</view>
            <RebornInput v-model="inputValue" placeholder="Type something..." />
          </view>
          <view>
            <view class="text-sm text-slate-500 mb-1.5 ml-1">Number Input</view>
            <RebornInputNumber v-model="inputNumberValue" />
          </view>
          <view class="flex items-center justify-between p-2">
            <view class="text-sm text-slate-500">Switch Toggle</view>
            <RebornSwitch v-model="switchValue" />
          </view>
        </view>
      </view>

      <!-- Tabs -->
      <view class="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 space-y-4">
        <view class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <view class="w-1 h-5 bg-fuchsia-500 rounded-full"></view>
          Tabs
        </view>
        <RebornTabs v-model="activeTab" :list="tabList" />
        <view class="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-500">
          Active Content: Tab {{ activeTab + 1 }}
        </view>
      </view>

    </view>
  </view>
</template>
