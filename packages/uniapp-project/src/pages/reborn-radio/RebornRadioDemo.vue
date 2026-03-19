<script setup lang="ts">
import { ref } from 'vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'

const v1 = ref('1')
const v2 = ref('primary')
const v3 = ref('md')
const v4 = ref('2')
const v5 = ref('1')
const v6 = ref('1')
const v7 = ref('😀')
const radioGroupValue = ref('New York')

const emojis = [
  { value: '😀', label: '开心' },
  { value: '😍', label: '喜欢' },
  { value: '🤔', label: '思考' },
  { value: '🎉', label: '庆祝' },
]
</script>

<template>
  <RebornPage title="Radio 单选框" description="单选框组件，用于从多个选项中选择一个。">
    <RebornCard title="基础用法" custom-class="space-y-4">
      <view class="flex gap-4">
        <RebornRadio v-model="v1" label="苹果" value="1" />
        <RebornRadio v-model="v1" label="香蕉" value="2" />
      </view>
      <text class="text-sm text-gray-500">当前值: {{ v1 }}</text>
    </RebornCard>

    <RebornCard title="颜色" custom-class="space-y-4">
      <view class="flex flex-wrap gap-4">
        <RebornRadio v-model="v2" label="Primary" value="primary" color="primary" />
        <RebornRadio v-model="v2" label="Success" value="success" color="success" />
        <RebornRadio v-model="v2" label="Warning" value="warning" color="warning" />
        <RebornRadio v-model="v2" label="Error" value="error" color="error" />
      </view>
    </RebornCard>

    <RebornCard title="尺寸" custom-class="space-y-4">
      <view class="flex items-center gap-4">
        <RebornRadio v-model="v3" label="Small" value="sm" size="sm" />
        <RebornRadio v-model="v3" label="Medium" value="md" size="md" />
        <RebornRadio v-model="v3" label="Large" value="lg" size="lg" />
      </view>
    </RebornCard>

    <RebornCard title="禁用状态" custom-class="space-y-4">
      <view class="flex gap-4">
        <RebornRadio v-model="v4" label="未选中禁用" value="1" disabled />
        <RebornRadio v-model="v4" label="选中禁用" value="2" disabled />
      </view>
    </RebornCard>

    <RebornCard title="自定义图标" custom-class="space-y-4">
      <RebornRadio v-model="v5" label="自定义图标" value="1" active-icon="i-lucide-check-circle-2"
        inactive-icon="i-lucide-circle" />
    </RebornCard>

    <RebornCard title="自定义样式 (UI Prop)" custom-class="space-y-4">
      <RebornRadio v-model="v6" label="方框样式" value="1" :ui="{
        activeIcon: 'rounded-md',
        inactiveIcon: 'rounded-md',
        label: 'text-primary font-bold',
      }" active-icon="i-lucide-square-check" inactive-icon="i-lucide-square" />
    </RebornCard>

    <RebornCard title="自定义插槽 (Slot)" custom-class="space-y-4">
      <RebornRadioGroup v-model="v7">
        <RebornRadio v-for="e in emojis" :key="e.value" :value="e.value" :label="e.label">
          <template #active-icon>
            <text class="text-lg">{{ e.value }}</text>
          </template>
          <template #inactive-icon>
            <text class="text-lg opacity-30">{{ e.value }}</text>
          </template>
        </RebornRadio>
      </RebornRadioGroup>
      <text class="text-sm text-gray-500">选中: {{ v7 }}</text>
    </RebornCard>

    <RebornCard title="单选框组 (Radio Group)" custom-class="space-y-4">
      <RebornRadioGroup v-model="radioGroupValue" size="lg" color="primary">
        <RebornRadio label="纽约" value="New York" />
        <RebornRadio label="华盛顿" value="Washington" />
        <RebornRadio label="洛杉矶" value="Los Angeles" />
        <RebornRadio label="芝加哥" value="Chicago" />
      </RebornRadioGroup>
      <text class="text-sm text-gray-500">选中: {{ radioGroupValue }}</text>
    </RebornCard>
  </RebornPage>
</template>
