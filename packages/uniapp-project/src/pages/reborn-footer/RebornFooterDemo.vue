<script setup lang="ts">
import { ref } from 'vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornFooter from '@/components/reborn-footer/RebornFooter.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'

const counter = ref(0)
const fixedHeight = ref<number | null>(null)
const customBg = ref<boolean>(false)
</script>

<template>
  <RebornPage title="Footer 底部栏" description="固定在页面底部，并自动生成占位高度，避免遮挡内容。">
    <view>
      <RebornCard title="控制项">
        <view class="flex flex-wrap items-center gap-2">
          <RebornButton :fluid="true" @click="counter++">
            触发重算高度(vt)
          </RebornButton>
          <RebornButton :fluid="true" @click="fixedHeight = fixedHeight ? null : 56">
            {{ fixedHeight ? '取消固定高度' : '固定高度 56px' }}
          </RebornButton>
          <RebornButton :fluid="true" @click="customBg = !customBg">
            {{ customBg ? '恢复默认背景' : '设置浅绿色背景' }} ({{ customBg }})
          </RebornButton>
        </view>
      </RebornCard>

      <RebornCard title="内容区">
        <view class="space-y-2 text-sm text-gray-6">
          <view v-for="i in 20" :key="i" class="
            rounded bg-gray-1 p-3
            dark:bg-gray-8
          ">
            列表内容 {{ i }}
          </view>
        </view>
      </RebornCard>

      <RebornFooter :vt="counter" :height="fixedHeight"
        :ui="{ content: 'flex items-center justify-between px-4 py-3', base: `${customBg ? 'bg-green-4' : 'bg-white dark:bg-gray-8'}` }">
        <text class="text-sm font-medium">当前重算次数：{{ counter }}</text>
        <button class="rounded bg-primary px-3 py-1 text-xs text-white" @click="counter++">
          操作
        </button>
      </RebornFooter>
    </view>
  </RebornPage>
</template>
