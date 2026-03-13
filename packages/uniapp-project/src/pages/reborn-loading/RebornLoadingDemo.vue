<script setup lang="ts">
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornLoading from '@/components/reborn-loading/RebornLoading.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornColorPicker from '@/components/reborn-color-picker/RebornColorPicker.vue'
import { LoadingTypes, LoadingColors } from '@/components/reborn-loading/reborn-loading.config'

const demoColor = ref<typeof LoadingColors[number] | null>('primary')
const demoType = ref<typeof LoadingTypes[number]>('outline')
const colorValue = ref<string>('#000000')

const demoColorChange = (color: typeof LoadingColors[number]) => {
  demoColor.value = color
}
const onChange = (color: string) => {
  colorValue.value = color
  demoColor.value = null
}
</script>
<template>
  <RebornPage title="Loading" description="加载组件">
    <RebornCard title="配置" custom-class="space-y-4" overflowVisible>

      <reborn-loading :type="demoType" :color="demoColor ? demoColor : colorValue" size="80rpx" />
      <view class="space-y-3">
        <view class="
                text-sm font-medium text-slate-500
                dark:text-slate-200
              ">
          按钮颜色
        </view>
        <view class="flex flex-wrap gap-2">
          <view v-for="c in LoadingColors" :key="c" class="
                  size-6 cursor-pointer rounded-full ring-2 ring-transparent
                  ring-offset-2 transition-all
                " :class="[
                  `
                    bg-${c}
                  `,
                  demoColor === c ? 'scale-110 ring-slate-400' : `
                    hover:scale-110
                  `,
                ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
            @click="demoColorChange(c)" />
        </view>
      </view>
      <RebornColorPicker v-model="colorValue" @onChange="onChange" />
      <RebornRadioGroup v-model="demoType">
        <RebornRadio v-for="t in LoadingTypes" :key="t" :value="t" :label="t" />
      </RebornRadioGroup>
    </RebornCard>
  </RebornPage>
</template>
