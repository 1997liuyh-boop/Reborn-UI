<script setup lang="ts">
import { ref } from 'vue'
import { badgeColors, badgeSizes, badgeVariants } from '@/components/reborn-badge/reborn-badge.config'
import RebornBadge from '@/components/reborn-badge/RebornBadge.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

// 演练场状态
const color = ref<(typeof badgeColors)[number]>('primary')
const variant = ref<(typeof badgeVariants)[number]>('filled')
const size = ref<(typeof badgeSizes)[number]>('md')
const label = ref('乐一番')
const closable = ref(false)
const square = ref(false)
const round = ref(false)
const showBadge = ref(true)

/** 可选中标签演示数据：四种视觉风格各一个 */
const checkTags = ref(
  badgeVariants.map((v, i) => ({
    label: ['热销', '新品', '包邮', '自营'][i] ?? v,
    variant: v as (typeof badgeVariants)[number],
    checked: i === 0,
  })),
)

/** 处理关闭事件 */
function handleClose() {
  uni.showToast({ title: '徽标已关闭！', icon: 'none' })
}

/** 处理可选中标签的 change 事件 */
function handleCheckChange(label: string, checked: boolean) {
  uni.showToast({ title: `${label} → ${checked ? '选中' : '取消'}`, icon: 'none' })
}
</script>

<template>
  <RebornPage title="Badge 徽标" description="用于展示状态、数量或重要标识的微型标签。支持多种色彩、感官风格及交互状态。">
    <!-- Playground Section -->
    <RebornCard title="交互演练场" custom-class="overflow-hidden p-0">
      <!-- Preview -->
      <view class="flex-1 p-10 flex items-center justify-center min-h-[300rpx] bg-blue-1">
        <RebornBadge
          v-model:show="showBadge" :color="color" :variant="variant" :size="size" :label="label"
          :closable="closable" :square="square" :round="round" @close="handleClose"
        />
      </view>
      <!-- Controls -->
      <view class="space-y-2">
        <text class="text-[10px] font-bold uppercase tracking-widest text-slate-400">内容文本</text>
        <RebornInput v-model="label" placeholder="输入标签文字" />
      </view>

      <view class="space-y-2">
        <text class="text-[10px] font-bold uppercase tracking-widest text-slate-400">预设色彩</text>
        <RebornRadioGroup v-model="color">
          <RebornRadio v-for="item in badgeColors" :key="item" :value="item" :show-icon="false">
            <template #default="{ isChecked }">
              <view class="relative flex size-5">
                <view
                  v-if="isChecked" class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  :class="`bg-${item}`"
                />
                <view class="relative inline-flex size-5 rounded-full" :class="`bg-${item}`" />
              </view>
            </template>
          </RebornRadio>
        </RebornRadioGroup>
      </view>

      <view class="space-y-2">
        <text class="text-[10px] font-bold uppercase tracking-widest text-slate-400">视觉风格</text>
        <RebornRadioGroup v-model="variant">
          <RebornRadio v-for="item in badgeVariants" :key="item" :value="item" :label="item" />
        </RebornRadioGroup>
      </view>

      <view class="space-y-2">
        <text class="text-[10px] font-bold uppercase tracking-widest text-slate-400">尺寸规格</text>
        <RebornRadioGroup v-model="size">
          <RebornRadio v-for="item in badgeSizes" :key="item" :value="item" :label="item" />
        </RebornRadioGroup>
      </view>

      <view class="space-y-2">
        <view class="text-[10px] font-bold uppercase tracking-widest text-slate-400">关闭图标</view>
        <RebornSwitch v-model="closable" active-label="显示" inactive-label="隐藏" />
      </view>

      <view class="space-y-2">
        <view class="text-[10px] font-bold uppercase tracking-widest text-slate-400">圆角（round）</view>
        <RebornSwitch v-model="round" active-label="圆角" inactive-label="直角" />
      </view>

      <view class="space-y-2">
        <view class="text-[10px] font-bold uppercase tracking-widest text-slate-400">显示控制</view>
        <RebornSwitch v-model="showBadge" active-label="显示" inactive-label="隐藏" />
      </view>
    </RebornCard>

    <!-- Variants Matrix -->
    <RebornCard title="变体矩阵 (Variants Matrix)">
      <view v-for="v in badgeVariants" :key="v">
        <text class="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{{ v }}</text>
        <view class="flex flex-wrap items-center gap-1">
          <RebornBadge v-for="c in badgeColors" :key="c" :variant="v" :color="c" size="sm" :label="c" />
        </view>
      </view>
    </RebornCard>

    <!-- Round -->
    <RebornCard title="圆角标签 (Round)">
      <view class="flex flex-wrap items-center gap-2">
        <RebornBadge v-for="v in badgeVariants" :key="v" :variant="v" color="primary" round :label="v" />
        <RebornBadge color="success" variant="soft" round closable label="可关闭胶囊" />
      </view>
    </RebornCard>

    <!-- Check Tag -->
    <RebornCard title="可选中标签 (Check Tag)">
      <view class="flex flex-wrap items-center gap-2">
        <RebornBadge
          v-for="item in checkTags" :key="item.label" v-model:checked="item.checked" check
          :variant="item.variant" color="primary" :label="`${item.variant} · ${item.label}`"
          @change="handleCheckChange(item.label, $event)"
        />
        <RebornBadge check disabled variant="soft" color="primary" label="disabled" />
      </view>
    </RebornCard>

    <!-- Icons & Slots -->
    <RebornCard title="图标集成 (Icons)">
      <view>
        <RebornBadge icon="i-lucide-check" label="Success" color="success" />
        <RebornBadge icon="i-lucide-alert-circle" label="Warning" color="warning" gap />
        <RebornBadge icon="i-lucide-info" label="Info" color="info" gap />
        <RebornBadge icon="i-lucide-star" square color="primary" variant="soft" gap />
      </view>
    </RebornCard>
  </RebornPage>
</template>
