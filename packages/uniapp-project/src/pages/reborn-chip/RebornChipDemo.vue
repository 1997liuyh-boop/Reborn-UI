<script setup lang="ts">
import { ref } from 'vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import { chipColors, chipPositions, chipSizes, chipVariants } from '@/components/reborn-chip/reborn-chip.config'
import RebornChip from '@/components/reborn-chip/RebornChip.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

/**
 * 角标锚点占位样式：只描边不填充。
 * 角标必须挂在一个宿主元素上才看得出定位效果，这里用虚线框表示「任意宿主」。
 */
const anchorClass = 'size-[96rpx] rounded-ui-md border-[length:2rpx] border-dashed border-gray-4'

/** 渲染文本节点的变体，用于在矩阵里区分「圆点类」与「文字类」 */
const textVariants: string[] = ['textDot', 'textOutline']

/** 色板选择器的底色：写成完整类名，动态拼接的 `bg-${c}` Tailwind 扫描不到 */
const swatchClass: Record<(typeof chipColors)[number], string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  error: 'bg-error',
  neutral: 'bg-neutral',
}

// 演练场状态
const variant = ref<(typeof chipVariants)[number]>('textDot')
const color = ref<(typeof chipColors)[number]>('primary')
const size = ref<(typeof chipSizes)[number]>('md')
const position = ref<(typeof chipPositions)[number]>('top-right')
const text = ref('9')
const inset = ref(false)
const showChip = ref(true)

/** 显隐控制演示：组件内部不会改写 show，由外部按钮切换 */
const hasUnread = ref(true)
</script>

<template>
  <RebornPage title="Chip 角标" description="叠加在宿主元素角上的圆点或计数角标，用于提示未读、在线等状态。">
    <!-- 交互演练场 -->
    <RebornCard title="交互演练场" custom-class="overflow-hidden">
      <!-- 预览区 -->
      <view
        class="
          flex min-h-[300rpx] flex-col items-center justify-center gap-[24rpx]
          bg-gray-2
        "
      >
        <RebornChip
          v-model:show="showChip" :variant="variant" :color="color" :size="size" :position="position"
          :text="text" :inset="inset"
        >
          <view
            class="
              flex size-[160rpx] items-center justify-center rounded-ui-md
              border-[length:2rpx] border-dashed border-gray-4
            "
          >
            <text class="text-24 text-gray-6">宿主</text>
          </view>
        </RebornChip>
        <text
          v-if="!textVariants.includes(variant)"
          class="px-[32rpx] text-center text-24 text-gray-6"
        >
          {{ variant }} 是纯图形角标，最大外径只有 32rpx，放不下文字，所以标签文本不显示。
        </text>
      </view>

      <!-- 控制项 -->
      <view class="flex flex-col gap-[16rpx]">
        <text class="text-24 font-medium text-gray-6">视觉变体</text>
        <RebornRadioGroup v-model="variant">
          <RebornRadio v-for="item in chipVariants" :key="item" :value="item">
            {{ item }}
          </RebornRadio>
        </RebornRadioGroup>
      </view>

      <view class="flex flex-col gap-[16rpx]">
        <text class="text-24 font-medium text-gray-6">颜色主题</text>
        <RebornRadioGroup v-model="color">
          <RebornRadio v-for="item in chipColors" :key="item" :value="item">
            <!-- radio 插槽完全接管渲染，做成纯色板选择 -->
            <template #radio="{ checked }">
              <view
                class="
                  size-[40rpx] rounded-full border-[length:4rpx] border-solid
                "
                :class="[
                  swatchClass[item],
                  checked ? 'border-gray-8' : 'border-transparent',
                ]"
              />
            </template>
          </RebornRadio>
        </RebornRadioGroup>
      </view>

      <view class="flex flex-col gap-[16rpx]">
        <text class="text-24 font-medium text-gray-6">尺寸规格</text>
        <RebornRadioGroup v-model="size">
          <RebornRadio v-for="item in chipSizes" :key="item" :value="item">
            {{ item }}
          </RebornRadio>
        </RebornRadioGroup>
      </view>

      <view class="flex flex-col gap-[16rpx]">
        <text class="text-24 font-medium text-gray-6">显示位置</text>
        <RebornRadioGroup v-model="position">
          <RebornRadio v-for="item in chipPositions" :key="item" :value="item">
            {{ item }}
          </RebornRadio>
        </RebornRadioGroup>
      </view>

      <view class="flex flex-col gap-[16rpx]">
        <text class="text-24 font-medium text-gray-6">标签文本（仅 textDot / textOutline 显示）</text>
        <RebornInput v-model="text" placeholder="输入角标文本" />
      </view>

      <view class="flex flex-col gap-[16rpx]">
        <text class="text-24 font-medium text-gray-6">内嵌模式</text>
        <RebornSwitch v-model="inset" active-label="内嵌" inactive-label="压角" />
      </view>

      <view class="flex flex-col gap-[16rpx]">
        <text class="text-24 font-medium text-gray-6">显示状态</text>
        <RebornSwitch v-model="showChip" active-label="显示" inactive-label="隐藏" />
      </view>
    </RebornCard>

    <!-- 基础用法 -->
    <RebornCard title="基础用法">
      <text class="text-24 text-gray-6">不传 variant 时按 text 自动选择：传了文本是 textDot 计数角标，不传是 solid 纯圆点。</text>
      <view class="flex flex-wrap items-center gap-[64rpx] p-[24rpx]">
        <RebornChip text="9">
          <view :class="anchorClass" />
        </RebornChip>
        <RebornChip text="99+" size="lg">
          <view :class="anchorClass" />
        </RebornChip>
        <RebornChip>
          <view :class="anchorClass" />
        </RebornChip>
      </view>
    </RebornCard>

    <!-- 变体 -->
    <RebornCard title="变体：圆点、圆环与文字角标">
      <text class="text-24 text-gray-6">solid / outline 只表达「有状态」；textDot / textOutline 会渲染 text。描边类变体垫了纸面色底。</text>
      <view class="flex flex-wrap items-end gap-[64rpx] p-[24rpx]">
        <view
          v-for="v in chipVariants"
          :key="v"
          class="flex flex-col items-center gap-[24rpx]"
        >
          <RebornChip :variant="v" color="error" text="8">
            <view :class="anchorClass" />
          </RebornChip>
          <text class="text-24 text-gray-6">{{ v }}</text>
        </view>
      </view>
    </RebornCard>

    <!-- 颜色 -->
    <RebornCard title="颜色：7 种语义色">
      <view v-for="v in chipVariants" :key="v" class="flex flex-col gap-[16rpx]">
        <text class="text-24 font-medium text-gray-6">{{ v }}</text>
        <view class="flex flex-wrap items-center gap-[48rpx] p-[24rpx]">
          <RebornChip v-for="c in chipColors" :key="c" :variant="v" :color="c" text="8">
            <view
              class="
                size-[64rpx] rounded-ui-md border-[length:2rpx] border-dashed
                border-gray-4
              "
            />
          </RebornChip>
        </view>
      </view>
    </RebornCard>

    <!-- 尺寸 -->
    <RebornCard title="尺寸：三档">
      <text class="text-24 text-gray-6">圆点直径 8 / 10 / 12rpx，圆环外径 16 / 24 / 32rpx，文字角标高 32 / 40 / 48rpx。</text>
      <view v-for="v in chipVariants" :key="v" class="flex flex-col gap-[16rpx]">
        <text class="text-24 font-medium text-gray-6">{{ v }}</text>
        <view class="flex flex-wrap items-center gap-[64rpx] p-[24rpx]">
          <view
            v-for="s in chipSizes"
            :key="s"
            class="flex flex-col items-center gap-[24rpx]"
          >
            <RebornChip :variant="v" :size="s" color="error" :text="textVariants.includes(v) ? '99+' : undefined">
              <view :class="anchorClass" />
            </RebornChip>
            <text class="text-24 text-gray-6">{{ s }}</text>
          </view>
        </view>
      </view>
    </RebornCard>

    <!-- 位置与内嵌 -->
    <RebornCard title="位置与内嵌：position 与 inset">
      <text class="text-24 text-gray-6">默认角标中心压在宿主角上，inset 取消平移，让角标整个落在宿主内部。</text>
      <view class="flex flex-wrap items-center gap-[64rpx] p-[24rpx]">
        <view
          v-for="p in chipPositions"
          :key="p"
          class="flex flex-col items-center gap-[24rpx]"
        >
          <RebornChip :position="p" color="error" text="3">
            <view :class="anchorClass" />
          </RebornChip>
          <text class="text-24 text-gray-6">{{ p }}</text>
        </view>
        <view
          v-for="p in chipPositions"
          :key="`inset-${p}`"
          class="flex flex-col items-center gap-[24rpx]"
        >
          <RebornChip :position="p" color="success" size="lg" inset>
            <view :class="anchorClass" />
          </RebornChip>
          <text class="text-24 text-gray-6">{{ p }} · inset</text>
        </view>
      </view>
    </RebornCard>

    <!-- 显隐控制 -->
    <RebornCard title="显隐控制：v-model:show">
      <text class="text-24 text-gray-6">show 为 false 时不渲染角标节点；组件自身没有关闭交互，显隐完全由外部赋值驱动。</text>
      <view class="flex flex-wrap items-center gap-[64rpx] p-[24rpx]">
        <RebornChip v-model:show="hasUnread" text="3" color="error">
          <view :class="anchorClass" />
        </RebornChip>
        <view
          class="
            rounded-ui-md border-[length:2rpx] border-solid border-gray-4
            px-[24rpx] py-[12rpx] text-28 text-gray-8
          "
          @tap="hasUnread = !hasUnread"
        >
          {{ hasUnread ? '标为已读' : '模拟新消息' }}
        </view>
      </view>
    </RebornCard>

    <!-- 组合场景 -->
    <RebornCard title="组合场景：在线状态、未读圆点与促销标">
      <view class="flex flex-wrap items-center gap-[64rpx] p-[24rpx]">
        <view class="flex flex-col items-center gap-[24rpx]">
          <!-- 头像在线状态：inset 让圆环嵌入圆形边缘内部 -->
          <RebornChip variant="outline" color="success" inset position="bottom-right">
            <image
              src="https://github.com/benjamincanac.png"
              class="size-[96rpx] rounded-full"
            />
          </RebornChip>
          <text class="text-24 text-gray-6">在线状态</text>
        </view>
        <view class="flex flex-col items-center gap-[24rpx]">
          <!-- 未读小红点：不传 text 自动取 solid -->
          <RebornChip color="error" size="lg">
            <view
              class="
                flex size-[80rpx] items-center justify-center rounded-full
                bg-gray-3
              "
            >
              <text class="text-24 text-gray-7">消息</text>
            </view>
          </RebornChip>
          <text class="text-24 text-gray-6">未读圆点</text>
        </view>
        <view class="flex flex-col items-center gap-[24rpx]">
          <RebornChip variant="textOutline" color="warning" text="SALE" size="sm">
            <view
              class="
                rounded-ui-md bg-gray-8 px-[32rpx] py-[16rpx] text-28
                text-gray-1
              "
            >
              立即解锁
            </view>
          </RebornChip>
          <text class="text-24 text-gray-6">按钮促销标</text>
        </view>
      </view>
    </RebornCard>
  </RebornPage>
</template>
