<script setup lang="ts">
import type { ButtonProps } from '@/components/reborn-button/RebornButton.vue'
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

// Demo State
const demoVariant = ref<ButtonProps['variant']>('solid')
const demoColor = ref<ButtonProps['color']>('primary')
const demoSize = ref<ButtonProps['size']>('md')
const demoLoading = ref(false)
const demoDisabled = ref(false)
const demoSquare = ref(false)
const demoLabel = ref('Reborn UI')

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
  <RebornPage title="Button" description="Trigger an action or navigate to another page.">
    <!-- Interactive Playground -->
    <view class="space-y-4">
      <view class="
          flex items-center gap-2 text-lg font-bold text-slate-900
          dark:text-slate-100
        ">
        <view class="h-5 w-1 rounded-full bg-blue-500" />
        Playground
      </view>
      <view class="
          space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm
          dark:border-slate-800 dark:bg-slate-900
        ">
        <!-- Preview Area -->
        <view class="
            flex min-h-[160px] items-center justify-center rounded-lg border
            border-dashed border-slate-300 bg-slate-100 p-8
            dark:border-slate-700 dark:bg-slate-950/50
          ">
          <ReButton :variant="demoVariant" :color="demoColor" :size="demoSize" :loading="demoLoading"
            :disabled="demoDisabled" :square="demoSquare" @click="handleClick">
            {{ demoLabel }}
          </ReButton>
        </view>
        <!-- Controls -->
        <view class="
            grid gap-6
            sm:grid-cols-2
            lg:grid-cols-3
          ">
          <view class="space-y-3">
            <view class="
                text-sm font-medium text-slate-500
                dark:text-slate-200
              ">
              按钮类型
            </view>
            <view class="flex flex-wrap gap-2">
              <ReButton v-for="v in variants" :key="v" variant="outline"
                :color="demoVariant === v ? 'primary' : 'neutral'" size="sm" :square="false" custom-class="rounded-full"
                @click="demoVariant = v">
                {{ v }}
              </ReButton>
            </view>
          </view>

          <view class="space-y-3">
            <view class="
                text-sm font-medium text-slate-500
                dark:text-slate-200
              ">
              按钮颜色
            </view>
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
          </view>

          <view class="space-y-3">
            <view class="
                text-sm font-medium text-slate-500
                dark:text-slate-200
              ">
              按钮大小
            </view>
            <view class="flex flex-wrap gap-2">
              <ReButton v-for="s in sizes" :key="s" variant="outline" :color="demoSize === s ? 'primary' : 'neutral'"
                size="sm" :square="false" custom-class="rounded-full" @click="demoSize = s">
                {{ s }}
              </ReButton>
            </view>
          </view>

          <view class="
              space-y-3
              sm:col-span-2
              lg:col-span-3
            ">
            <view class="
                text-sm font-medium text-slate-500
                dark:text-slate-200
              ">
              States & Options
            </view>
            <view class="flex flex-col flex-wrap gap-4">
              <RebornSwitch v-model="demoLoading" active-label="加载中" inactive-label="取消加载" />
              <RebornSwitch v-model="demoDisabled" active-label="禁用" inactive-label="启用" />
              <RebornSwitch v-model="demoSquare" active-label="紧凑" inactive-label="正常" />
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Icons -->
    <view class="space-y-4">
      <view class="
          flex items-center gap-2 text-lg font-bold text-slate-900
          dark:text-slate-100
        ">
        <view class="h-5 w-1 rounded-full bg-orange-500" />
        With Icons
      </view>
      <view class="
          overflow-hidden rounded-xl border border-slate-200 bg-white p-6
          shadow-sm
          dark:border-slate-800 dark:bg-slate-900
        ">
        <view class="flex flex-wrap gap-4">
          <ReButton>
            <template #leading>
              <view class="i-lucide-mail size-4" />
            </template>
            Login with Email
          </ReButton>
          <ReButton variant="outline">
            Next Step
            <template #trailing>
              <view class="i-lucide-arrow-right size-4" />
            </template>
          </ReButton>
          <ReButton size="md" variant="soft" custom-class="p-2">
            <view class="i-lucide-settings size-4" />
          </ReButton>
          <ReButton size="lg" color="error" custom-class="rounded-full p-2">
            <view class="i-lucide-trash-2 size-6" />
          </ReButton>
        </view>
      </view>
    </view>
  </RebornPage>
</template>
