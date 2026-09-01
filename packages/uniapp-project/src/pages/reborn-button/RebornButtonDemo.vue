<script setup lang="ts">
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornColorPicker from '@/components/reborn-color-picker/RebornColorPicker.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import { buttonColors, buttonVariants, buttonSizes } from '@/components/reborn-button/reborn-button.config'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'

// Demo State
const demoVariant = ref<(typeof buttonVariants)[number]>('filled')
const demoColor = ref<(typeof buttonColors)[number]>('primary')
const demoSize = ref<(typeof buttonSizes)[number]>('md')
const demoLoading = ref(false)
const demoDisabled = ref(false)
const demoSquare = ref(false)
const demoLabel = ref('Reborn UI')
const customButtonColor = ref('#6366f1')

// Options Mapping
const variantOptions = (buttonVariants as unknown as string[]).map(v => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v as (typeof buttonVariants)[number] }))
const colorOptions = (buttonColors as unknown as string[]).map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c as (typeof buttonColors)[number] }))
const baseSizeOptions = buttonSizes.map(s => ({ label: s.toUpperCase(), value: s as (typeof buttonSizes)[number] }))


function handleClick() {
  copyContent('Reborn UI')
  uni.showToast({
    title: 'click',
    icon: 'none',
  })
}
function copyContent(text: string) {
  uni.setClipboardData({
    data: text, // 要复制的字符串
    success() {
      // 复制成功后的回调
      uni.showToast({
        title: '复制成功',
        icon: 'success',
        duration: 2000,
      })
    },
    fail(err) {
      // 复制失败后的回调
      uni.showToast({
        title: '复制失败',
        icon: 'none',
      })
      console.error('复制失败:', err)
    },
  })
}
</script>

<template>
  <RebornPage title="Button 按钮" description="就是按钮 用于触发操作或导航到另一个页面">
    <RebornCard title="基础用法" overflow-visible>
      <view class="relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900/40">
        <!-- 装饰背景 -->
        <view
          class="absolute -right-20 -top-20 size-48 rounded-full bg-primary/20 blur-3xl transition-transform duration-1000" />
        <view class="absolute -left-20 -bottom-20 size-48 rounded-full bg-blue-500/15 blur-3xl" />
        <view class="absolute inset-0 bg-linear-to-tr from-transparent via-primary/5 to-transparent" />

        <view class="
              relative flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border
              border-white/40 p-8 shadow-2xl backdrop-blur-xl bg-white/20
              dark:border-white/10 dark:bg-black/30
            ">
          <RebornButton :variant="demoVariant" :color="demoColor" :size="demoSize" :loading="demoLoading"
            :disabled="demoDisabled" :square="demoSquare" @click="handleClick">
            {{ demoLabel }}
          </RebornButton>

          <view class="mt-4 flex gap-2">
            <RebornButton :size="demoSize" variant="circle" :color="demoColor" :loading="demoLoading"
              :disabled="demoDisabled">
              <view class="i-lucide-plus" />
            </RebornButton>
            <RebornButton :size="demoSize" variant="circle" :color="demoColor" :loading="demoLoading"
              :disabled="demoDisabled">
              <view class="i-lucide-share-2" />
            </RebornButton>
          </view>
        </view>
      </view>

      <RebornText :size="28" color="neutral" class="mt-8 font-semibold">
        按钮类型 (Variants)
      </RebornText>
      <view class="flex flex-wrap gap-2">
        <RebornButton v-for="item in variantOptions" :key="item.value" variant="outlined"
          :color="demoVariant === item.value ? 'primary' : 'neutral'" size="sm" custom-class="rounded-full"
          @click="demoVariant = item.value">
          {{ item.label }}
        </RebornButton>
      </view>

      <RebornText :size="28" color="neutral" class="mt-6 font-semibold">
        按钮颜色 (Colors)
      </RebornText>
      <RebornRadioGroup v-model="demoColor">
        <RebornRadio v-for="item in colorOptions" :key="item.value" :value="item.value" :showIcon="false">
          <template #default="{ isChecked }">
            <view class="relative flex size-5">
              <view v-if="isChecked" class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                :class="`bg-${item.value}`">
              </view>
              <view class="relative inline-flex size-5 rounded-full" :class="`bg-${item.value}`"></view>
            </view>
          </template>
        </RebornRadio>
      </RebornRadioGroup>

      <RebornText :size="28" color="neutral" class="mt-6 font-semibold">
        标准尺寸 (Base Sizes)
      </RebornText>
      <view class="flex flex-wrap gap-2">
        <RebornButton v-for="item in baseSizeOptions" :key="item.value" variant="outlined"
          :color="demoSize === item.value ? 'primary' : 'neutral'" size="sm" custom-class="rounded-full"
          @click="demoSize = item.value">
          {{ item.label }}
        </RebornButton>
      </view>

      <RebornText :size="28" color="neutral" class="mt-6 font-semibold">
        其他状态 (States)
      </RebornText>
      <view class="flex flex-col gap-4">
        <RebornSwitch v-model="demoLoading" active-label="加载中 (Loading)" inactive-label="取消加载" />
        <RebornSwitch v-model="demoDisabled" active-label="禁用 (Disabled)" inactive-label="启用" />
        <RebornSwitch v-model="demoSquare" active-label="紧凑布局 (Square)" inactive-label="常规布局" />
      </view>
    </RebornCard>

    <RebornCard title="图标与文本" overflow-visible>
      <view class="flex flex-wrap gap-4">
        <RebornButton :loading="demoLoading">
          <template #leading>
            <view class="i-lucide-mail size-4" />
          </template>
          Login with Email
        </RebornButton>

        <RebornButton variant="outlined" color="secondary" :loading="demoLoading">
          Next Step
          <template #trailing>
            <view class="i-lucide-arrow-right size-4" />
          </template>
        </RebornButton>

        <RebornButton variant="soft" color="success" :loading="demoLoading">
          <template #leading>
            <view class="i-lucide-check size-4" />
          </template>
          Completed
        </RebornButton>
      </view>

      <view class="mt-6 flex flex-wrap items-center gap-4">
        <RebornButton size="sm" variant="circle" :loading="demoLoading">
          <view class="i-lucide-plus" />
        </RebornButton>
        <RebornButton size="md" variant="circle" :loading="demoLoading">
          <view class="i-lucide-settings" />
        </RebornButton>
        <RebornButton size="lg" variant="circle" :loading="demoLoading">
          <view class="i-lucide-user" />
        </RebornButton>
        <RebornButton size="xl" variant="circle" color="error" :loading="demoLoading">
          <view class="i-lucide-trash-2" />
        </RebornButton>
      </view>
    </RebornCard>

    <RebornCard title="组合展示" overflow-visible>
      <view class="flex flex-col gap-6">
        <view class="flex flex-col gap-2">
          <RebornText :size="24" color="neutral">
            不同 Variant 下的 Loading 表现 (Primary Color)
          </RebornText>
          <view class="flex flex-wrap gap-3">
            <RebornButton variant="filled" loading>Filled</RebornButton>
            <RebornButton variant="outlined" loading>Outlined</RebornButton>
            <RebornButton variant="soft" loading>Soft</RebornButton>
            <RebornButton variant="subtle" loading>Subtle</RebornButton>
          </view>
        </view>

        <view class="flex flex-col gap-2">
          <RebornText :size="24" color="neutral">
            不同 Color 下的 Loading 表现 (Subtle Variant)
          </RebornText>
          <view class="flex flex-wrap gap-3">
            <RebornButton color="success" variant="subtle" loading>Success</RebornButton>
            <RebornButton color="warning" variant="subtle" loading>Warning</RebornButton>
            <RebornButton color="error" variant="subtle" loading>Error</RebornButton>
            <RebornButton color="info" variant="subtle" loading>Info</RebornButton>
          </view>
        </view>
      </view>
    </RebornCard>

    <!-- 自定义颜色：通过 CSS 变量 + customClass 传入任意色值 -->
    <RebornCard title="高级自定义" overflow-visible>
      <view class="flex flex-col gap-4">
        <view class="flex flex-wrap items-center gap-3">
          <RebornText :size="28" color="neutral">
            自定义主题色
          </RebornText>
          <RebornColorPicker v-model="customButtonColor" :content="{ side: 'top', align: 'start', sideOffset: 8 }" />
          <RebornText color="neutral" :size="24" class="text-24">
            {{ customButtonColor }}
          </RebornText>
        </view>
        <view class="flex flex-wrap gap-3" :style="{ '--btn-custom': customButtonColor }">
          <RebornButton
            custom-class="!bg-[var(--btn-custom)] !border-[var(--btn-custom)] border border-solid text-white shadow-lg active:scale-95"
            @click="handleClick">
            Filled Custom
          </RebornButton>
          <RebornButton variant="outlined"
            custom-class="!border-[var(--btn-custom)] !text-[var(--btn-custom)] border border-solid bg-transparent"
            @click="handleClick">
            Outlined Custom
          </RebornButton>
        </view>
      </view>
    </RebornCard>
  </RebornPage>
</template>
