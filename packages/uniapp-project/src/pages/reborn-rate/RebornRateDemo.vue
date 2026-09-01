<script setup lang="ts">
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornInputNumber from '@/components/reborn-input-number/RebornInputNumber.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornRate from '@/components/reborn-rate/RebornRate.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

const val1 = ref(3)
const currentSize = ref<any>('md')
const currentColor = ref<any>('warning')
const maxCount = ref(5)
const isAllowHalf = ref(false)
const isShowValue = ref(true)
const isDisabled = ref(false)
const isReadonly = ref(false)

const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const
</script>

<template>
  <RebornPage title="评分" description="用于对事物进行评级操作的组件。">
    <!-- Custom Icon -->
    <RebornCard title="用法" custom-class="space-y-4">
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          基础
        </text>
        <RebornRate
          v-model="val1" :size="currentSize" :color="currentColor" :allow-half="isAllowHalf"
          :show-value="isShowValue" :disabled="isDisabled" :readonly="isReadonly" :count="maxCount"
        />
      </view>
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          爱心
        </text>
        <RebornRate
          v-model="val1" icon="i-lucide-heart" active-icon="i-lucide-heart" :size="currentSize"
          :color="currentColor" :allow-half="isAllowHalf" :show-value="isShowValue" :disabled="isDisabled"
          :readonly="isReadonly" :count="maxCount"
        />
      </view>
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          火焰
        </text>
        <RebornRate
          v-model="val1" icon="i-mdi-brightness-5" half-icon="i-mdi-brightness-6"
          active-icon="i-mdi-brightness-4" :size="currentSize" :color="currentColor" :allow-half="isAllowHalf"
          :show-value="isShowValue" :disabled="isDisabled" :readonly="isReadonly" :count="maxCount"
        />
      </view>
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          篮球
        </text>
        <RebornRate
          v-model="val1" icon="i-mdi-basketball" active-icon="i-mdi-basketball" :size="currentSize"
          :color="currentColor" :allow-half="isAllowHalf" :show-value="isShowValue" :disabled="isDisabled"
          :readonly="isReadonly" :count="maxCount"
        />
      </view>
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          图片 URL
        </text>
        <RebornRate
          v-model="val1" :size="currentSize" :color="currentColor" :allow-half="isAllowHalf"
          :show-value="isShowValue" :disabled="isDisabled" :readonly="isReadonly" :count="maxCount"
        >
          <template #icon="{ active, style }">
            <image
              src="https://www.leyifan.com/favicon.ico" class="size-full"
              :class="!active && 'opacity-30'" :style="style" mode="aspectFit"
            />
          </template>
        </RebornRate>
      </view>
    </RebornCard>
    <!-- Dynamic Configuration -->
    <RebornCard title="自定义" custom-class="flex flex-col gap-2">
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">尺寸 (Size)</text>
        <view class="flex flex-wrap gap-2">
          <view v-for="size in sizes" :key="size">
            <ReButton
              size="xs" :variant="currentSize === size ? 'filled' : 'outlined'"
              :color="currentSize === size ? 'primary' : 'neutral'" @tap="currentSize = size"
            >
              {{ size }}
            </ReButton>
          </view>
        </view>
      </view>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">颜色 (Color)</text>
        <view class="flex flex-wrap gap-2">
          <view
            v-for="c in colors" :key="c"
            class="
              size-4 cursor-pointer rounded-full ring-2 ring-transparent
              ring-offset-2 transition-all
            "
            :class="[
              `
                bg-${c}
              `,
              currentColor === c ? 'scale-110 ring-slate-400' : `
                hover:scale-110
              `,
            ]" :style="{ backgroundColor: `var(--color-${c}, ${c === 'neutral' ? '#737373' : ''})` }"
            @click="currentColor = c"
          />
        </view>
      </view>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">数量</text>
        <RebornInputNumber v-model="maxCount" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">半星</text>
        <RebornSwitch v-model="isAllowHalf" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">显示分数</text>
        <RebornSwitch v-model="isShowValue" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">禁用</text>
        <RebornSwitch v-model="isDisabled" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-sm text-slate-500">只读</text>
        <RebornSwitch v-model="isReadonly" size="sm" />
      </view>
    </RebornCard>
  </RebornPage>
</template>
