<script setup lang="ts">
import { ref } from 'vue'
import RebornTabs from '@/components/reborn-tabs/reborn-tabs.vue'

import type { CheckboxProps } from '@/components/re-checkbox/ReCheckbox.vue'

import TabsRoot from '@/components/re-tabs/TabsRoot.vue'
import TabsList from '@/components/re-tabs/TabsList.vue'
import TabsTrigger from '@/components/re-tabs/TabsTrigger.vue'
import TabsContent from '@/components/re-tabs/TabsContent.vue'
import type { TabsProps } from "@/components/re-tabs/types";

const activeTab = ref(0) // Assuming index based, or check if it needs value
const tabList = [
  { label: 'Tab 1', value: 0 },
  { label: 'Tab 2', value: 1 },
  { label: 'Tab 3', value: 2 },
]

const size = ref<CheckboxProps["size"]>("md");

const activeIndex = ref(0)
const manyTabs = Array.from({ length: 20 }, (_, i) => `Tab ${i + 1}`)
const type = ref<TabsProps["type"]>("line");
const variant = ref<TabsProps["variant"]>("primary");
const orientation = ref<TabsProps["orientation"]>("horizontal");
const sticky = ref<boolean>(true);
const shrink = ref<boolean>(true);
const scrollspy = ref<boolean>(true);
const swipeable = ref<boolean>(true);
const activationMode = ref<TabsProps["activationMode"]>("manual");

onLoad(() => {
  console.log('Reborn UI Showcase Loaded')
})

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

      <view
        class="h-[500px] min-w-0 overflow-hidden bg-white rounded-lg flex flex-col border border-gray-200 dark:border-gray-800 shadow-sm">
        <view class="p-4 flex-none border-b border-gray-100 dark:border-gray-800" v-if="sticky">
          <view class="text-sm text-gray-500">Scroll down to see sticky header behavior.</view>
        </view>

        <TabsRoot v-model:active="activeIndex" :type="type" :variant="variant" :size="size" :orientation="orientation"
          :sticky="sticky" :shrink="shrink" :scrollspy="scrollspy" :swipeable="swipeable"
          :activationMode="activationMode" :ignore-page-scroll="true" class="flex-1 h-full min-h-0"
          v-slot="{ currentScrollToId }">
          <TabsList class="bg-white z-10">
            <TabsTrigger v-for="(tab, index) in manyTabs" :key="tab" :index="index">
              {{ tab }}
            </TabsTrigger>
          </TabsList>

          <!-- Content Wrapper for Independent Scrolling -->
          <scroll-view scroll-y scroll-with-animation :scroll-into-view="currentScrollToId"
            class="flex-1 h-full min-h-0 relative bg-gray-50 dark:bg-gray-900/50">
            <TabsContent v-for="(tab, index) in manyTabs" :key="tab" :index="index">
              <view class="min-h-[500px] p-6">
                <view class="text-lg font-medium">{{ tab }} Content</view>
                <view class="text-gray-500 mt-2">
                  Currently showing content for {{ tab }}.
                  {{ sticky ? 'Try scrolling down!' : '' }}
                </view>
              </view>
            </TabsContent>
          </scroll-view>
        </TabsRoot>
      </view>

    </view>
  </view>
</template>
