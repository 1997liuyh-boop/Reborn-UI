<script setup lang="ts">
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const

// ─── 演练场状态 ─────────────────────────────────────────────────

/** 演练场开关绑定值 */
const playValue = ref(true)
const currentSize = ref<typeof sizes[number]>('md')
const currentColor = ref<typeof colors[number]>('primary')
const isDisabled = ref(false)
const isLoading = ref(false)

/** change 触发次数，让交互「有回应」 */
const changeCount = ref(0)
function onPlayChange() {
  changeCount.value++
}

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 颜色矩阵演示 */
const colorValue = ref(true)
/** 形态演示 */
const typeValue = ref(true)
/** 自定义颜色演示 */
const customColorValue = ref(true)
/** 点内文本演示 */
const inlineValue = ref(true)
/** 尺寸演示 */
const sizeValue = ref(true)
/** 自定义取值演示：绑定 'yes' / 'no' 而非布尔 */
const customValue = ref('yes')
/** 拦截切换演示 */
const beforeChangeValue = ref(false)
/** 加载与插槽演示 */
const loadingValue = ref(true)
const iconValue = ref(true)
/** 样式定制演示 */
const styledValue = ref(true)

/** 二次确认：uni.showModal 取消时回滚本次切换 */
function handleBeforeChange() {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '提示',
      content: '确认切换状态吗？',
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      },
    })
  })
}
</script>

<template>
  <RebornPage title="开关" description="允许用户在两种状态之间即时切换的控件。" custom-class="flex flex-col gap-y-4">
    <!-- 演练场 -->
    <RebornCard title="自定义" custom-class="space-y-4">
      <view class="flex items-center justify-between">
        <RebornSwitch
          v-model="playValue" :size="currentSize" :color="currentColor" active-label="开启"
          inactive-label="关闭" :disabled="isDisabled" :loading="isLoading" @change="onPlayChange"
        />
        <text class="text-24 text-gray-6 font-mono">change × {{ changeCount }}</text>
      </view>

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
        <text class="text-24 text-gray-6">禁用</text>
        <RebornSwitch v-model="isDisabled" size="sm" />
      </view>
      <view class="flex justify-between">
        <text class="text-24 text-gray-6">加载中</text>
        <RebornSwitch v-model="isLoading" size="sm" />
      </view>
    </RebornCard>

    <!-- 颜色 -->
    <RebornCard title="颜色" custom-class="space-y-4">
      <text class="text-24 text-gray-6">开启态轨道取语义色，关闭态统一为中性灰</text>
      <view class="flex flex-wrap items-center gap-4">
        <RebornSwitch v-for="c in colors" :key="c" v-model="colorValue" :color="c" />
      </view>
    </RebornCard>

    <!-- 尺寸 -->
    <RebornCard title="尺寸" custom-class="space-y-4">
      <text class="text-24 text-gray-6">sm 16×28 / md 24×44 / lg 32×60，滑块四周留白固定 2px</text>
      <view class="flex flex-wrap items-center gap-6">
        <RebornSwitch v-for="s in sizes" :key="s" v-model="sizeValue" :size="s" :active-label="s" />
      </view>
    </RebornCard>

    <!-- 自定义颜色 -->
    <RebornCard title="自定义颜色" custom-class="space-y-4">
      <text class="text-24 text-gray-6">ui.activeTrack / ui.inactiveTrack 分别设置两态背景与 ring，ui.track 设置通用轨道样式</text>
      <view class="flex flex-wrap items-center gap-6">
        <RebornSwitch v-model="customColorValue" :ui="{ activeTrack: 'bg-[#13ce66] ring-[#0f9d4e]', inactiveTrack: 'bg-[#ff4949] ring-[#d9363e]' }" />
        <RebornSwitch v-model="customColorValue" :ui="{ track: 'ring-2', activeTrack: 'bg-primary ring-primary/40', inactiveTrack: 'bg-[#f5f7fa] ring-[#dcdfe6]' }" />
      </view>
    </RebornCard>

    <!-- 形态 -->
    <RebornCard title="形态" custom-class="space-y-4">
      <text class="text-24 text-gray-6">type：circle 胶囊圆形（默认）/ round 圆角方形 / line 细线轨道 + 悬浮滑块</text>
      <view class="flex flex-wrap items-center gap-6">
        <RebornSwitch v-model="typeValue" type="circle" active-label="circle" />
        <RebornSwitch v-model="typeValue" type="round" active-label="round" />
        <RebornSwitch v-model="typeValue" type="line" active-label="line" />
      </view>
    </RebornCard>

    <!-- 点内文本 -->
    <RebornCard title="点内文本" custom-class="space-y-4">
      <text class="text-24 text-gray-6">inline-prompt 把两侧文案渲染进开关内部，文案建议 1-2 字；line 型不生效</text>
      <view class="flex flex-wrap items-center gap-6">
        <RebornSwitch v-model="inlineValue" inline-prompt active-label="开" inactive-label="关" />
        <RebornSwitch
          v-model="inlineValue" inline-prompt type="round" size="lg" color="success"
          active-label="ON" inactive-label="OFF"
        />
      </view>
      <text class="text-24 text-gray-6">固定宽度下长文本超出省略；auto-width 让轨道随文本撑开完整显示</text>
      <view class="flex flex-wrap items-center gap-6">
        <RebornSwitch v-model="inlineValue" inline-prompt size="lg" active-label="已开启通知" inactive-label="已关闭通知" />
        <RebornSwitch
          v-model="inlineValue" inline-prompt auto-width size="lg" active-label="已开启通知"
          inactive-label="已关闭通知"
        />
      </view>
    </RebornCard>

    <!-- 取值与拦截 -->
    <RebornCard title="取值与拦截" custom-class="space-y-4">
      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">自定义取值（当前 {{ customValue }}）</text>
        <RebornSwitch
          v-model="customValue" active-value="yes" inactive-value="no" active-label="Yes"
          inactive-label="No"
        />
      </view>
      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">切换前拦截（beforeChange + showModal 二次确认）</text>
        <RebornSwitch v-model="beforeChangeValue" :before-change="handleBeforeChange" active-label="需确认" />
      </view>
    </RebornCard>

    <!-- 加载与插槽 -->
    <RebornCard title="加载与插槽" custom-class="space-y-4">
      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">loading 期间锁定交互</text>
        <RebornSwitch v-model="loadingValue" active-label="加载中" loading />
      </view>
      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">thumb 插槽自定义加载图标</text>
        <RebornSwitch v-model="loadingValue" active-label="自定义 Loading 图标" loading>
          <template #thumb="{ loading }">
            <view v-if="loading" class="i-lucide-loader flex size-[32rpx] animate-spin p-0.5 text-primary" />
          </template>
        </RebornSwitch>
      </view>
      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">active / inactive 插槽按开关状态渲染滑块内图标</text>
        <RebornSwitch v-model="iconValue" active-label="勾选 / 叉号" color="success">
          <template #active>
            <view class="i-lucide-check flex size-[28rpx] text-success" />
          </template>
          <template #inactive>
            <view class="i-lucide-x flex size-[28rpx] text-gray-5" />
          </template>
        </RebornSwitch>
      </view>
    </RebornCard>

    <!-- 样式定制 -->
    <RebornCard title="样式定制" custom-class="space-y-4">
      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">方形轨道（ui.track / ui.thumb）</text>
        <RebornSwitch
          v-model="styledValue" active-label="方形 UI"
          :ui="{ track: 'rounded-ui-2xs', thumb: 'rounded-ui-2xs' }"
        />
      </view>
      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">超大尺寸：只覆写宽高，选中位移自动适配</text>
        <RebornSwitch
          v-model="styledValue" active-label="自定义 XL" :ui="{
            track: 'h-[36px] w-[64px]',
            thumb: '[--re-switch-thumb-size:64rpx]',
          }"
        />
      </view>
    </RebornCard>
  </RebornPage>
</template>
