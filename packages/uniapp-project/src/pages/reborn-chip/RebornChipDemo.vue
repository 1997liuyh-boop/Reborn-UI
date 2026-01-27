<script setup lang="ts">
import { ref } from 'vue'
import RebornChip from '@/components/reborn-chip/RebornChip.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'

import { chipColors, chipSizes, chipPositions } from '@/components/reborn-chip/reborn-chip.config'

const showChip = ref(true)
const currentColor = ref<typeof chipColors[number]>('primary')
const currentSize = ref<typeof chipSizes[number]>('md')
const currentPosition = ref<typeof chipPositions[number]>('top-right')
const chipText = ref('9')
</script>

<template>
  <RebornPage title="Chip" description="Chip component for counters and indicators.">
    <RebornCard title="Controls" custom-class="space-y-4">
      <view class="space-y-3">
        <view class="text-sm font-medium text-slate-500 dark:text-slate-200">Color</view>
        <view class="flex flex-wrap gap-2">
          <view v-for="c in chipColors" :key="c"
            class="w-6 h-6 rounded-full cursor-pointer ring-2 ring-offset-2 ring-transparent transition-all"
            :class="[`bg-${c}`, currentColor === c ? 'ring-slate-400 scale-110' : 'hover:scale-110']"
            :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
            @click="currentColor = c"></view>
        </view>
      </view>

      <view class="space-y-3">
        <view class="text-sm font-medium text-slate-500 dark:text-slate-200">Size</view>
        <view class="flex flex-wrap gap-2">
          <view v-for="s in chipSizes" :key="s"
            class="px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-colors"
            :class="currentSize === s ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-transparent text-slate-600 border-slate-300 hover:border-slate-400'"
            @click="currentSize = s">
            {{ s }}
          </view>
        </view>
      </view>

      <view class="space-y-3">
        <view class="text-sm font-medium text-slate-500 dark:text-slate-200">Position</view>
        <view class="flex flex-wrap gap-2">
          <view v-for="p in chipPositions" :key="p"
            class="px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-colors"
            :class="currentPosition === p ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'bg-transparent text-slate-600 border-slate-300 hover:border-slate-400'"
            @click="currentPosition = p">
            {{ p }}
          </view>
        </view>
      </view>

      <view class="flex flex-wrap items-center gap-3">
        <view class="text-sm text-slate-500">Text:</view>
        <input v-model="chipText" class="border rounded px-3 py-1 text-sm" />
        <view class="ml-auto">
          <view class="px-3 py-1 text-sm rounded border" @tap="showChip = !showChip">
            {{ showChip ? 'Hide' : 'Show' }}
          </view>
        </view>
      </view>
    </RebornCard>

    <RebornCard title="Preview" custom-class="flex flex-wrap gap-6 items-center">
      <RebornChip v-model:show="showChip" :color="currentColor" :size="currentSize" :position="currentPosition"
        :text="chipText">
        <view class="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <text class="text-xs text-slate-500">Target</text>
        </view>
      </RebornChip>

      <view class="flex flex-wrap gap-3">
        <RebornChip color="success" size="sm" text="1" />
        <RebornChip color="warning" size="md" text="2" />
        <RebornChip color="error" size="lg" text="3" />
      </view>
    </RebornCard>
  </RebornPage>
</template>
