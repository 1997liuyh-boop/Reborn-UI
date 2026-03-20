<script setup lang="ts">
import type { ButtonProps } from '@/components/reborn-button/RebornButton.vue'
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornColorPicker from '@/components/reborn-color-picker/RebornColorPicker.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

// Demo State
const demoVariant = ref<ButtonProps['variant']>('solid')
const demoColor = ref<ButtonProps['color']>('primary')
const demoSize = ref<ButtonProps['size']>('md')
const colorPicker = ref('#000000')
const demoLoading = ref(false)
const demoDisabled = ref(false)
const demoSquare = ref(false)
const demoLabel = ref('Reborn UI')
const customButtonColor = ref('#6366f1')

// Options
const variants: ButtonProps['variant'][] = ['solid', 'outline', 'soft', 'subtle']
const colors: ButtonProps['color'][] = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral']
const sizes: ButtonProps['size'][] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']

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
      <view class="
            flex min-h-[160px] items-center justify-center rounded-lg border
            border-dashed border-slate-300 bg-slate-100 p-8
            dark:border-slate-700 dark:bg-slate-950/50
          ">
        <RebornButton :variant="demoVariant" :color="demoColor" :size="demoSize" :loading="demoLoading"
          :disabled="demoDisabled" :square="demoSquare" @click="handleClick">
          {{ demoLabel }}
        </RebornButton>
      </view>

      <RebornText color="neutral">
        按钮类型
      </RebornText>
      <view>
        <RebornButton v-for="v in variants" :key="v" variant="outline" gap
          :color="demoVariant === v ? 'primary' : 'neutral'" size="sm" :square="false" custom-class="rounded-full"
          @click="demoVariant = v">
          {{ v }}
        </RebornButton>
      </view>

      <RebornText color="neutral">
        按钮颜色
      </RebornText>
      <view class="flex flex-wrap gap-2">
        <view v-for="c in colors" :key="c" class="
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
          @click="demoColor = c" />
      </view>

      <RebornText color="neutral">
        按钮大小
      </RebornText>
      <view>
        <RebornButton v-for="s in sizes" :key="s" variant="outline" :color="demoSize === s ? 'primary' : 'neutral'"
          size="sm" gap :square="false" custom-class="rounded-full" @click="demoSize = s">
          {{ s }}
        </RebornButton>
      </view>
      <RebornText color="neutral">
        其他状态
      </RebornText>
      <view class="flex flex-col flex-wrap gap-4">
        <RebornSwitch v-model="demoLoading" active-label="加载中" inactive-label="取消加载" />
        <RebornSwitch v-model="demoDisabled" active-label="禁用" inactive-label="启用" />
        <RebornSwitch v-model="demoSquare" active-label="紧凑" inactive-label="正常" />
      </view>
    </RebornCard>


    <RebornCard title="图标" overflow-visible>
      <RebornButton>
        <template #leading>
          <view class="i-lucide-mail size-4" />
        </template>
        Login with Email
      </RebornButton>
      <RebornButton variant="outline">
        Next Step
        <template #trailing>
          <view class="i-lucide-arrow-right size-4" />
        </template>
      </RebornButton>
      <view>
        <RebornButton size="md" variant="soft" custom-class="w-10 h-10 p-0">
          <view class="i-lucide-settings size-6" />
        </RebornButton>
        <RebornButton size="lg" color="error" custom-class="rounded-full p-0 w-10 h-10" gap>
          <view class="i-lucide-trash-2 size-6" />
        </RebornButton>
      </view>
    </RebornCard>

    <!-- 自定义颜色：通过 CSS 变量 + customClass 传入任意色值 -->
    <RebornCard title="自定义颜色" overflow-visible>
      <view class="flex flex-col gap-4">
        <view class="flex flex-wrap items-center gap-3">
          <RebornText color="neutral">
            选择颜色
          </RebornText>
          <RebornColorPicker v-model="customButtonColor" :content="{ side: 'top', align: 'start', sideOffset: 8 }" />
          <RebornText color="neutral" class="text-24">
            {{ customButtonColor }}
          </RebornText>
        </view>
        <view class="flex flex-wrap gap-3" :style="{ '--btn-custom': customButtonColor }">
          <RebornButton
            custom-class="!bg-[var(--btn-custom)] !border-[var(--btn-custom)] border border-solid text-white"
            @click="handleClick">
            Solid 自定义色
          </RebornButton>
          <RebornButton variant="outline"
            custom-class="!border-[var(--btn-custom)] !text-[var(--btn-custom)] border border-solid bg-transparent"
            @click="handleClick">
            Outline 自定义色
          </RebornButton>
        </view>
      </view>
    </RebornCard>
  </RebornPage>
</template>
