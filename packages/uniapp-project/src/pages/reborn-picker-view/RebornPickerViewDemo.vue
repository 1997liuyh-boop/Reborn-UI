<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPickerView from '@/components/reborn-picker-view/RebornPickerView.vue'

const columns = [
  [
    { label: '周一', value: 1 },
    { label: '周二', value: 2 },
    { label: '周三', value: 3 },
    { label: '周四', value: 4 },
    { label: '周五', value: 5 },
  ],
  [
    { label: '上午', value: 1 },
    { label: '下午', value: 2 },
  ],
]

const value = shallowRef([0, 0])
const selectedValues = computed(() => value.value.map((index, column) => columns[column]?.[index]?.value))
</script>

<template>
  <RebornPage title="PickerView 选择器视图">
    <RebornCard title="基础用法">
      <view class="h-[300px] w-full bg-white rounded-lg overflow-hidden">
        <RebornPickerView
          :columns="columns"
          v-model:value="value"
        />
      </view>
      <view class="mt-4 text-sm text-gray-500">
        当前选中值: {{ selectedValues }}
      </view>
    </RebornCard>
  </RebornPage>
</template>
