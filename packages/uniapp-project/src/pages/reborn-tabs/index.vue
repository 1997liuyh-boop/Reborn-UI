<script setup lang="ts">
import type { TabsItem } from '@/components/reborn-tabs/RebornTabs.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'

import RebornPage from '@/components/reborn-page/RebornPage.vue'
import { TabsColors, TabsSizes, TabsVariants } from '@/components/reborn-tabs/reborn-tabs.config'
import RebornTabs from '@/components/reborn-tabs/RebornTabs.vue'

const tabs = ref<TabsItem[]>([])

const activeTab = ref('1')
function handleChange(index: number) {
  console.log('Selected tab:', index)
}

const activeShortTab = ref('6')
const currentColor = ref<typeof TabsColors[number]>('primary')
const currentSize = ref<typeof TabsSizes[number]>('xs')
const currentVariant = ref<typeof TabsVariants[number]>('line')
const shortTabs = ref<TabsItem[]>([
  { label: 'Tab 1', value: '1' },
  { label: 'Tab 2', value: '2' },
  { label: 'Tab 3', value: '3' },
  { label: 'Tab 4', value: '4' },
  { label: 'Tab 5', value: '5' },
  { label: 'Tab 6', value: '6' },
  { label: 'Tab 7', value: '7' },
  { label: 'Tab 8', value: '8' },
  { label: 'Tab 9', value: '9' },
  { label: 'Tab 10', value: '10' },
])

onMounted(() => {
  for (let i = 0; i < 20; i++) {
    tabs.value.push({ label: `Tab${i}`, value: `${i}`, disabled: [2, 8, 10].includes(i) })
  }
})
</script>

<template>
  <RebornPage title="Tabs 标签页" description="用于在不同内容区域之间进行切换的标签页组件，支持横向滚动、填充布局等多种展示方式">
    <RebornCard title="基础用法">
      <view class="flex flex-col gap-4">
        <view class="space-y-3">
          <view
            class="
              text-sm font-medium text-slate-500
              dark:text-slate-200
            "
          >
            Color
          </view>
          <view class="flex flex-wrap gap-2">
            <view
              v-for="c in TabsColors" :key="c"
              class="
                size-6 cursor-pointer rounded-full ring-2 ring-transparent
                ring-offset-2 transition-all
              "
              :class="[`
                bg-${c}
              `, currentColor === c ? 'scale-110 ring-slate-400' : `
                hover:scale-110
              `]"
              :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
              @click="currentColor = c"
            />
          </view>
        </view>

        <view class="space-y-3">
          <view
            class="
              text-sm font-medium text-slate-500
              dark:text-slate-200
            "
          >
            Size
          </view>
          <view class="flex flex-wrap gap-2">
            <view
              v-for="s in TabsSizes" :key="s"
              class="
                cursor-pointer rounded-full border px-3 py-1.5 text-xs
                transition-colors
              "
              :class="currentSize === s ? `
                border-slate-900 bg-slate-900 text-white
                dark:bg-white dark:text-slate-900
              ` : `
                border-slate-300 bg-transparent text-slate-600
                hover:border-slate-400
              `"
              @click="currentSize = s"
            >
              {{ s }}
            </view>
          </view>
        </view>

        <view class="space-y-3">
          <view
            class="
              text-sm font-medium text-slate-500
              dark:text-slate-200
            "
          >
            Variants
          </view>
          <view class="flex flex-wrap gap-2">
            <view
              v-for="p in TabsVariants" :key="p"
              class="
                cursor-pointer rounded-full border px-3 py-1.5 text-xs
                transition-colors
              "
              :class="currentVariant === p ? `
                border-slate-900 bg-slate-900 text-white
                dark:bg-white dark:text-slate-900
              ` : `
                border-slate-300 bg-transparent text-slate-600
                hover:border-slate-400
              `"
              @click="currentVariant = p"
            >
              {{ p }}
            </view>
          </view>
        </view>
        <RebornTabs
          v-model="activeShortTab" :list="shortTabs" :color="currentColor" :size="currentSize"
          :variant="currentVariant"
        />
      </view>
    </RebornCard>
    <RebornCard title="填充模式 (Fill)">
      <RebornTabs v-model="activeShortTab" :list="shortTabs" fill @change="handleChange" />
    </RebornCard>
    <RebornCard title="对齐方式 (Justify Center)">
      <RebornTabs v-model="activeShortTab" :list="shortTabs" justify="center" @change="handleChange" />
    </RebornCard>
    <RebornCard title="对齐方式 (Justify End)" description="Tabs are aligned to the end.">
      <RebornTabs v-model="activeShortTab" :list="shortTabs" justify="end" @change="handleChange" />
    </RebornCard>
    <RebornCard title="卡片模式(部分禁用)">
      <RebornTabs v-model="activeTab" :list="tabs" variant="card" @change="handleChange" />
    </RebornCard>
  </RebornPage>
</template>
