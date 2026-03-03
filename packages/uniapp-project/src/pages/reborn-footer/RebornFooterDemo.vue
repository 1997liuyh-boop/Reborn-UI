<script setup lang="ts">
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornFooter from '@/components/reborn-footer/RebornFooter.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'

const counter = ref(0)
const fixedHeight = ref<number | null>(null)
const customBg = ref<string | null>(null)
</script>

<template>
  <RebornPage title="Footer 底部栏" description="固定在页面底部，并自动生成占位高度，避免遮挡内容。">
    <RebornCard title="控制项">
      <view class="flex flex-wrap gap-2">
        <button class="rounded bg-primary px-3 py-1 text-white" @click="counter++">
          触发重算高度(vt)
        </button>
        <button class="rounded bg-gray-6 px-3 py-1 text-white" @click="fixedHeight = fixedHeight ? null : 56">
          {{ fixedHeight ? '取消固定高度' : '固定高度 56px' }}
        </button>
        <button class="rounded bg-success px-3 py-1 text-white" @click="customBg = customBg ? null : '#dcfce7'">
          {{ customBg ? '恢复默认背景' : '设置浅绿色背景' }}
        </button>
      </view>
    </RebornCard>

    <RebornCard title="内容区">
      <view class="space-y-2 text-sm text-gray-6">
        <view
          v-for="i in 20" :key="i" class="
            rounded bg-gray-1 p-3
            dark:bg-gray-8
          "
        >
          列表内容 {{ i }}
        </view>
      </view>
    </RebornCard>

    <RebornFooter
      :vt="counter"
      :height="fixedHeight"
      :background-color="customBg"
      :ui="{ content: 'flex items-center justify-between px-4 py-3' }"
    >
      <text class="text-sm font-medium">当前重算次数：{{ counter }}</text>
      <button class="rounded bg-primary px-3 py-1 text-xs text-white" @click="counter++">
        操作
      </button>
    </RebornFooter>
  </RebornPage>
</template>
