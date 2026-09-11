<script setup lang="ts">
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornInputNumber from '@/components/reborn-input-number/RebornInputNumber.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornSlider from '@/components/reborn-slider/RebornSlider.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

const val1 = ref(30)
const val2 = ref([50, 70])
const isDisabled = ref(false)
const isShowValue = ref(true)
const step = ref(10)
const max = ref(100)

// 动态配置
const currentSize = ref<any>('md')
const currentColor = ref<any>('primary')

const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const

/** 间断点演示 */
const stopsValue = ref(30)

/** 刻度标记演示：50 分单独给了强调色 */
const sliderMarks = {
  0: '0 分',
  8: '8 分',
  37: '37 分',
  50: { style: { color: 'var(--color-error)' }, label: '50 分' },
  100: '100 分',
}
const marksFreeValue = ref(30)
const markSnapValue = ref(37)

/** 自定义提示演示 */
const tempValue = ref(26)
/** 温度格式化：给数值补上单位 */
function formatTemp(value: number) {
  return `${value}°C`
}

/** Tooltip 显隐控制演示 */
const tipOpenValue = ref(60)
const tipHiddenValue = ref(80)

/** 事件演示 */
const eventValue = ref(50)
/** change 触发次数（拖拽过程实时累加） */
const changeCount = ref(0)
/** 最近一次 changeComplete 载荷 */
const lastComplete = ref('—')
function onSliderChange() {
  changeCount.value++
}
function onSliderComplete(value: number | number[]) {
  lastComplete.value = JSON.stringify(value)
}

/** 垂直模式演示 */
const verticalValue = ref(30)
const verticalRange = ref([20, 60])

/** 范围整体拖拽演示 */
const dragRange = ref([30, 60])

/** 禁用指定滑块演示：下标 0（值较小的一端）被禁用 */
const partialDisabledRange = ref([30, 70])
</script>

<template>
  <RebornPage title="滑块" description="用于在一定范围内选择数值的滑动组件。">
    <!-- 演练场 -->
    <RebornCard title="自定义" custom-class="space-y-4">
      <RebornSlider
        v-model="val1" :size="currentSize" :color="currentColor" :show-value="isShowValue"
        :step="step" :max="max" :disabled="isDisabled"
      />

      <view class="flex justify-between">
        <text class="text-24 text-gray-6">尺寸 (Size)</text>
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
        <text class="text-24 text-gray-6">颜色 (Color)</text>
        <view class="flex flex-wrap gap-2">
          <view
            v-for="c in colors" :key="c"
            class="
              size-[32rpx] cursor-pointer rounded-full ring-2 ring-transparent
              ring-offset-2 transition-all
            "
            :class="currentColor === c ? 'scale-110 ring-gray-4' : ''"
            :style="{ backgroundColor: `var(--color-${c})` }"
            @click="currentColor = c"
          />
        </view>
      </view>
      <view class="flex justify-between">
        <text class="text-24 text-gray-6">显示值</text>
        <RebornSwitch v-model="isShowValue" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-24 text-gray-6">步长值</text>
        <RebornInputNumber v-model="step" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-24 text-gray-6">最大值</text>
        <RebornInputNumber v-model="max" :max="100" :min="20" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-24 text-gray-6">禁用</text>
        <RebornSwitch v-model="isDisabled" size="sm" />
      </view>
    </RebornCard>

    <!-- 间断点 -->
    <RebornCard title="间断点" custom-class="space-y-4">
      <text class="text-24 text-gray-6">show-stops 后按步长在轨道上显示间断点</text>
      <RebornSlider v-model="stopsValue" :step="10" show-stops show-value />
    </RebornCard>

    <!-- 范围选择 -->
    <RebornCard title="范围选择器" custom-class="space-y-4">
      <text class="text-24 text-gray-6">默认最右侧滑块为激活态（大一号），触摸可切换激活对象：{{ val2.join(' ~ ') }}</text>
      <RebornSlider v-model:values="val2" range />
    </RebornCard>

    <!-- 刻度标记 -->
    <RebornCard title="刻度标记" custom-class="space-y-6">
      <text class="text-24 text-gray-6">marks 的 key 必须在 [min, max] 内；step="mark" 时取值只能落在刻度上，点按刻度文字可跳转</text>
      <RebornSlider v-model="marksFreeValue" :marks="sliderMarks" show-value />
      <RebornSlider v-model="markSnapValue" step="mark" :marks="sliderMarks" color="error" show-value />
    </RebornCard>

    <!-- 自定义提示 -->
    <RebornCard title="自定义提示与 Tooltip 控制" custom-class="space-y-6">
      <text class="text-24 text-gray-6">tooltip.formatter 格式化气泡内容；open 强制常显 / 隐藏</text>
      <RebornSlider v-model="tempValue" :min="16" :max="32" :tooltip="{ formatter: formatTemp }" />
      <RebornSlider v-model="tipOpenValue" :tooltip="{ open: true }" />
      <RebornSlider v-model="tipHiddenValue" :tooltip="{ open: false }" />
    </RebornCard>

    <!-- 事件 -->
    <RebornCard title="事件" custom-class="space-y-4">
      <RebornSlider v-model="eventValue" @change="onSliderChange" @change-complete="onSliderComplete" />
      <text class="text-24 text-gray-6 font-mono">change × {{ changeCount }} · changeComplete: {{ lastComplete }}</text>
    </RebornCard>

    <!-- 垂直模式 -->
    <RebornCard title="垂直模式" custom-class="space-y-4">
      <text class="text-24 text-gray-6">vertical 开启垂直方向，长度由 height 给出；reverse 后从上往下递增</text>
      <view class="flex flex-row items-start gap-12">
        <RebornSlider v-model="verticalValue" vertical height="180px" />
        <RebornSlider v-model:values="verticalRange" vertical height="180px" range color="success" />
        <RebornSlider v-model="verticalValue" vertical height="180px" reverse color="info" />
      </view>
    </RebornCard>

    <!-- 范围整体拖拽 -->
    <RebornCard title="范围整体拖拽" custom-class="space-y-4">
      <text class="text-24 text-gray-6">draggable-track 后按住选区拖动，整段区间平移且间距不变</text>
      <RebornSlider v-model:values="dragRange" range draggable-track show-value />
    </RebornCard>

    <!-- 禁用指定滑块 -->
    <RebornCard title="禁用指定滑块" custom-class="space-y-4">
      <text class="text-24 text-gray-6">disabled 传数组按下标单独禁用：左端禁用后成为不可越过的边界</text>
      <RebornSlider v-model:values="partialDisabledRange" range :disabled="[true, false]" show-value />
    </RebornCard>

    <!-- 图标 -->
    <RebornCard title="两侧图标" custom-class="space-y-4">
      <text class="text-24 text-gray-6">prefix-icon / suffix-icon 传 iconify 类名，#prefix / #suffix 插槽可完全接管</text>
      <RebornSlider v-model="val1" prefix-icon="i-lucide-volume" suffix-icon="i-lucide-volume-2" />
    </RebornCard>

    <!-- 自定义样式 -->
    <RebornCard title="自定义样式" custom-class="space-y-4">
      <view class="space-y-2">
        <text class="text-24 text-gray-6">自定义轨道与滑块（thumb 插槽的 style 是百分比定位，需自带 translate 居中）</text>
        <RebornSlider
          v-model="val1" :ui="{
            track: 'bg-purple-100 dark:bg-purple-900',
            progress: 'bg-purple-500',
          }"
        >
          <template #thumb="{ value }">
            <view
              :style="{ ...value.style, width: '30px', height: '20px' }"
              class="
                pointer-events-none absolute top-1/2 z-[1] -translate-x-1/2
                -translate-y-1/2 rounded-full border-2 border-solid border-white
                bg-warning text-center text-24 text-white
              "
            >
              {{ value.value }}
            </view>
          </template>
        </RebornSlider>
      </view>
    </RebornCard>
  </RebornPage>
</template>
