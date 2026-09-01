<script setup lang="ts">
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornDropdownSelect from '@/components/reborn-dropdown-select/RebornDropdownSelect.vue'
import { dropdownSelectColors, dropdownSelectSizes } from '@/components/reborn-dropdown-select/reborn-dropdown-select.config'

const demoColor = ref<typeof dropdownSelectColors[number]>('primary')
const demoSize = ref<typeof dropdownSelectSizes[number]>('md')
const value1 = ref('')
const value2 = ref('2')
const value3 = ref('')
const value4 = ref('')

const options = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' },
  { label: '选项四', value: '4' },
]
</script>

<template>
  <RebornPage title="DropdownSelect 下拉选择">
    <RebornCard title="基础用法" custom-class="space-y-4" overflow-visible>
      <view class="text-sm font-medium text-slate-500 dark:text-slate-200">
        颜色
      </view>
      <view class="flex flex-wrap gap-2">
        <view v-for="c in dropdownSelectColors" :key="c" class="
              size-6 cursor-pointer rounded-full ring-2 ring-transparent
              ring-offset-2 transition-all
            " :class="[
              `bg-${c}`,
              demoColor === c ? 'scale-110 ring-slate-400' : `hover:scale-110`,
            ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
          @click="demoColor = c" />
      </view>

      <view class="text-sm font-medium text-slate-500 dark:text-slate-200">
        尺寸
      </view>
      <view>
        <RebornButton v-for="s in dropdownSelectSizes" :key="s" variant="outlined" gap
          :color="demoSize === s ? 'primary' : 'neutral'" size="sm" :square="false" custom-class="rounded-full"
          @click="demoSize = s">
          {{ s }}
        </RebornButton>
      </view>

      <RebornDropdownSelect v-model="value1" :options="options" :color="demoColor" :size="demoSize" placeholder="请选择" />
      <text class="text-sm text-gray-500">当前值: {{ value1 }}</text>
    </RebornCard>

    <RebornCard title="默认选中" custom-class="space-y-4" overflow-visible>
      <RebornDropdownSelect v-model="value2" :options="options" />
    </RebornCard>

    <RebornCard title="禁用状态" custom-class="space-y-4" overflow-visible>
      <RebornDropdownSelect v-model="value3" :options="options" disabled />
    </RebornCard>

    <RebornCard title="可清除" custom-class="space-y-4" overflow-visible>
      <RebornDropdownSelect v-model="value4" :options="options" clearable />
    </RebornCard>
  </RebornPage>
</template>
