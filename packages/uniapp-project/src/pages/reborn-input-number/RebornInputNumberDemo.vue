<script setup lang="ts">
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornInputNumber from '@/components/reborn-input-number/RebornInputNumber.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'

const val1 = ref(1)
const val2 = ref(10)
const val3 = ref(5)

// Dynamic Configuration
const currentSize = ref<any>('sm')
const currentColor = ref<any>('primary')
const currentShape = ref<any>('circle')

const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const
const shapes = ['square', 'circle'] as const
const variants = ['outlined', 'filled', 'borderless', 'underlined'] as const
const cursors = ['start', 'end', 'all'] as const

const variantValue = ref(3)
// 按钮位置（左 / 右堆叠）
const positionValue = ref(5)
const precisionValue = ref(1.5)
const focusValue = ref(8)

/** 组件实例引用，用于调用暴露出的 focus(cursor) */
const focusInputRef = ref<any>(null)

/** 按指定落位方式聚焦输入框 */
function focusAt(cursor: typeof cursors[number]) {
  focusInputRef.value?.focus(cursor)
}
</script>

<template>
  <RebornPage title="数字输入框" description="带有加减控制的数字输入组件。">
    <!-- Dynamic Configuration -->
    <RebornCard title="动态配置" custom-class="flex flex-col gap-2">
      <!-- Size -->
      <view class="space-y-3">
        <text class="text-sm text-slate-500">尺寸 (Size)</text>
        <view class="flex flex-wrap gap-2">
          <ReButton
            v-for="size in sizes" :key="size" size="xs"
            :variant="currentSize === size ? 'filled' : 'outlined'"
            :color="currentSize === size ? 'primary' : 'neutral'" @tap="currentSize = size"
          >
            {{ size }}
          </ReButton>
        </view>
      </view>

      <!-- Shape -->
      <view class="space-y-3">
        <text class="text-sm text-slate-500">形状 (Shape)</text>
        <view class="flex flex-wrap gap-2">
          <ReButton
            v-for="shape in shapes" :key="shape" size="xs"
            :variant="currentShape === shape ? 'filled' : 'outlined'"
            :color="currentShape === shape ? 'primary' : 'neutral'" @tap="currentShape = shape"
          >
            {{ shape }}
          </ReButton>
        </view>
      </view>

      <!-- Color -->
      <view class="space-y-3">
        <text class="text-sm text-slate-500">颜色 (Color)</text>
        <view class="flex flex-wrap gap-2">
          <view
            v-for="c in colors" :key="c"
            class="
              size-6 cursor-pointer rounded-full ring-2 ring-transparent
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

      <view class="flex justify-center pt-4">
        <RebornInputNumber v-model="val3" :size="currentSize" :color="currentColor" :shape="currentShape" />
      </view>
    </RebornCard>

    <!-- Basic -->
    <RebornCard title="基础用法" custom-class="space-y-3">
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          默认
        </text>
        <RebornInputNumber v-model="val1" />
      </view>
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          禁用状态
        </text>
        <RebornInputNumber v-model="val1" disabled />
      </view>
    </RebornCard>

    <!-- Limits & Step -->
    <RebornCard title="限制与步长" custom-class="space-y-3">
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          Min 5, Max 20, Step 5
        </text>
        <RebornInputNumber v-model="val2" :min="5" :max="20" :step="5" />
      </view>
    </RebornCard>

    <!-- Controls Position -->
    <RebornCard title="按钮位置" custom-class="space-y-3">
      <text class="text-sm text-slate-500">
        controls-position 支持 left / right 上下堆叠，堆叠按钮与输入区之间以分割线隔开（触屏端常显，web 端悬停滑入）。
      </text>
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          右侧堆叠 right
        </text>
        <RebornInputNumber v-model="positionValue" controls-position="right" shape="square" />
      </view>
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          左侧堆叠 left
        </text>
        <RebornInputNumber v-model="positionValue" controls-position="left" shape="square" />
      </view>
    </RebornCard>

    <!-- Variant -->
    <RebornCard title="形态变体" custom-class="space-y-3">
      <text class="text-sm text-slate-500">
        outlined / filled / borderless / underlined，underlined 会强制压平圆角，此时 shape 不生效。
      </text>
      <view v-for="v in variants" :key="v" class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          {{ v }}
        </text>
        <RebornInputNumber v-model="variantValue" :variant="v" shape="square" color="primary" />
      </view>
    </RebornCard>

    <!-- Precision & Prefix / Suffix -->
    <RebornCard title="精度与前后缀" custom-class="space-y-3">
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          precision=2, step=0.5
        </text>
        <RebornInputNumber v-model="precisionValue" :precision="2" :step="0.5" :max="10" input-type="digit" />
      </view>
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          prefix / suffix 插槽
        </text>
        <RebornInputNumber v-model="precisionValue" :max="10" shape="square">
          <template #prefix>
            <text>¥</text>
          </template>
          <template #suffix>
            <text>元</text>
          </template>
        </RebornInputNumber>
      </view>
    </RebornCard>

    <!-- Keyboard / Wheel / Focus -->
    <RebornCard title="键盘、滚轮与焦点" custom-class="space-y-3">
      <text class="text-sm text-slate-500">
        keyboard 控制 ↑ / ↓ 步进，仅 H5 生效：小程序与 App 的原生输入框不派发 keydown。
        changeOnWheel 在 uniapp 侧为空实现，仅为与 web 端同名同签名而保留。
      </text>
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          keyboard 关闭
        </text>
        <RebornInputNumber v-model="focusValue" :keyboard="false" :max="99" />
      </view>
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          focus(cursor)
        </text>
        <RebornInputNumber ref="focusInputRef" v-model="focusValue" :max="99" shape="square" />
      </view>
      <view class="flex flex-wrap gap-2">
        <ReButton v-for="c in cursors" :key="c" size="xs" variant="outlined" color="primary" @tap="focusAt(c)">
          focus('{{ c }}')
        </ReButton>
      </view>
    </RebornCard>

    <!-- Custom Color -->
    <RebornCard title="自定义颜色" custom-class="space-y-3">
      <view class="flex items-center justify-between">
        <text
          class="
            text-sm text-slate-600
            dark:text-gray-5
          "
        >
          Purple Theme
        </text>
        <RebornInputNumber
          v-model="val3" :ui="{
            wrapper: 'ring-purple-500 dark:ring-purple-500 focus-within:ring-purple-500/20',
            divider: 'bg-purple-500 dark:bg-purple-500!',
            button: 'hover:text-purple-600 dark:hover:text-purple-600',
          }"
        />
      </view>
    </RebornCard>

    <!-- Width Adjustment -->
    <RebornCard title="宽度调整" custom-class="space-y-3">
      <!-- Full Width -->
      <view class="space-y-2">
        <text class="text-sm text-slate-500">全宽 (Full Width)</text>
        <RebornInputNumber v-model="val3" :ui="{ wrapper: 'w-full' }" />
      </view>

      <view class="flex gap-2">
        <!-- Narrow -->
        <view class="space-y-2">
          <text class="text-sm text-slate-500">窄 (Narrow)</text>
          <RebornInputNumber v-model="val3" :ui="{ input: 'w-8' }" />
        </view>
        <!-- Wide -->
        <view class="space-y-2">
          <text class="text-sm text-slate-500">宽 (Wide)</text>
          <RebornInputNumber v-model="val3" :ui="{ input: 'w-24' }" />
        </view>
      </view>
    </RebornCard>

    <!-- Fully Customized -->
    <RebornCard title="完全自定义" custom-class="space-y-3">
      <!-- Custom Button & Icon Size -->
      <view class="space-y-2">
        <text class="text-sm text-slate-500">自定义按钮与图标大小</text>
        <RebornInputNumber
          v-model="val3" :ui="{
            wrapper: 'h-12 border-indigo-100 bg-indigo-50/30 ring-indigo-200 focus-within:ring-indigo-300 rounded-lg',
            button: 'w-12 hover:bg-indigo-100 text-indigo-600 active:scale-90 transition-transform',
            input: 'w-20 text-indigo-700 font-bold text-lg',
            divider: 'bg-indigo-100 w-px group-focus-within:bg-indigo-200',
          }"
        >
          <!-- 与 web 端对齐的新插槽名 -->
          <template #minus>
            <view class="i-lucide-arrow-left size-5" />
          </template>
          <template #plus>
            <view class="i-lucide-arrow-right size-5" />
          </template>
        </RebornInputNumber>
      </view>

      <view class="flex items-center gap-8">
        <!-- Compact Dark Theme -->
        <view class="space-y-2">
          <text class="text-sm text-slate-500">紧凑深色主题</text>
          <RebornInputNumber
            v-model="val3" :ui="{
              wrapper: 'bg-slate-900 dark:bg-slate-900 border-slate-700 ring-slate-800 rounded-md h-8',
              input: 'text-white w-12 text-sm',
              button: 'text-slate-400 hover:text-white px-2',
              divider: 'bg-slate-700 w-px group-focus-within:bg-slate-600',
            }"
          />
        </view>

        <!-- Ultra Small Height Theme -->
        <view class="space-y-2">
          <text class="text-sm text-slate-500">超小高度主题 (h-7)</text>
          <RebornInputNumber
            v-model="val3" :ui="{
              wrapper: 'h-7 rounded bg-emerald-50 dark:bg-emerald-500 border-emerald-200 ring-emerald-200',
              input: 'text-emerald-700 text-xs w-10',
              button: 'text-emerald-600 dark:text-emerald-100 hover:text-emerald-800 dark:hover:text-warning px-1.5',
              divider: 'bg-emerald-200 w-px group-focus-within:bg-emerald-300',
            }"
          >
            <template #decrease-icon>
              <view class="i-lucide-heart-off size-3" />
            </template>
            <template #increase-icon>
              <view class="i-lucide-heart size-3" />
            </template>
          </RebornInputNumber>
        </view>
      </view>
    </RebornCard>
  </RebornPage>
</template>
