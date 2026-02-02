<script setup lang="ts">
import * as z from 'zod'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggleDarkMode } = useDarkMode()

const menuItems = [
  {
    label: '基础组件',
    children: [
      { label: '按钮', icon: 'i-lucide-mouse', path: '/pages/reborn-button/RebornButtonDemo' },
      { label: '图片', icon: 'i-lucide-image', path: '/pages/reborn-image/RebornImageDemo' },
      { label: '徽章', icon: 'i-lucide-badge-check', path: '/pages/reborn-badge/RebornBadgeDemo' },
      { label: '角标', icon: 'i-lucide-bell-dot', path: '/pages/reborn-chip/RebornChipDemo' },
    ]
  },
  {
    label: '表单组件',
    children: [
      { label: '输入框', icon: 'i-lucide-text-cursor-input', path: '/pages/reborn-input/RebornInputDemo' },
      { label: '计数器', icon: 'i-mdi-numbers', path: '/pages/reborn-input-number/RebornInputNumberDemo' },
      { label: '文本域', icon: 'i-lucide-form-input', path: '/pages/reborn-textarea/RebornTextareaDemo' },
      { label: '开关', icon: 'i-lucide-toggle-right', path: '/pages/reborn-switch/RebornSwitchDemo' },
      { label: '复选框', icon: 'i-lucide-check-square', path: '/pages/reborn-checkbox/RebornCheckboxDemo' },
    ]
  },
  {
    label: '布局组件',
    children: [
      { label: '标签页', icon: 'i-lucide-gallery-horizontal-end', path: '/pages/tabs/index' },
      { label: '标签页', icon: 'i-lucide-gallery-horizontal-end', path: '/pages/reborn-tabs/index' },
      { label: '折叠', icon: 'i-lucide-chevrons-down-up', path: '/pages/reborn-collapse/RebornCollapseDemo' },
    ]
  },
  {
    label: '状态组件',
    children: [

      { label: '标签', icon: 'i-lucide-circle-dot', path: '/pages/reborn-chip/RebornChipDemo' },
    ]
  },
]

const goToDemo = (path: string) => {
  uni.navigateTo({
    url: path
  })
}

const newData = ref({ email: 'test@qq.com', password: "12345", newPassword: '123456789' })

const schema = z.object({
  email: z.string().email('Invalid email'),
  newEmail: z.string().email('Invalid email'),
  password: z.string({ message: 'Password is required' })
    .min(8, 'Must be at least 8 characters'),
  newPassword: z.string({ message: 'Password is required' })
    .min(8, 'Must be at least 8 characters'),
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['newPassword'],      // 错误挂到 newPassword 上
      message: 'Passwords do not match',
    })
  }
})

onMounted(async () => {

  const r = schema
    .pick({ password: true, newPassword: true })
    .safeParse({
      password: newData.value.password,
      newPassword: '1234567289',
    })

  console.log(r.success)          // false
  if (!r.success) console.log(r.error.issues)
})

</script>

<template>
  <page-meta :root-class="isDark ? 'dark' : ''" />
  <view class="
      flex min-h-screen w-full justify-center
      bg-[radial-gradient(circle_at_18%_20%,#e0f2fe,#fdf4ff_70%)] px-0 py-6
      text-slate-800
      dark:bg-slate-950 dark:bg-none dark:text-slate-200 transition-colors duration-300
    ">
    <view class="
        flex w-full flex-col space-y-6 px-4
        sm:px-5
        md:w-[94vw] md:max-w-[700px]
      ">
      <!-- Header -->
      <view class="py-10 text-center space-y-3">
        <view class="flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          @click="toggleDarkMode">
          <view class="flex gap-1 items-baseline">
            <text v-for="(char, index) in 'Reborn U'" :key="index"
              class="text-4xl font-black text-blue-5 dark:text-orange-5">
              {{ char }}
            </text>

            <view class="bg-gradient-to-b from-blue-700 to-orange-500 h-4 w-2 relative">
              <view class="absolute -top-5 -left-2 transition-all duration-500 ease-in-out"
                :class="isDark ? '-translate-y-1 rotate-0 opacity-100' : 'translate-y-0 rotate-270 opacity-100'">
                <view :class="isDark ? 'i-meteocons-clear-day-fill' : 'i-meteocons-extreme-drizzle-fill'"
                  class="size-6" />
              </view>
            </view>
          </view>
        </view>

        <view class="text-slate-500 dark:text-slate-400 font-medium tracking-wide text-sm uppercase opacity-80">
          Component Showcase
        </view>
      </view>

      <view v-for="(item, index) in menuItems" :key="index">
        <view class="text-20 font-medium text-gray-7 dark:text-gray-3 mb-2">
          {{ item.label }}({{ item.children.length }})
        </view>
        <view class="grid grid-cols-4 gap-2">
          <view v-for="(child, index) in item.children" :key="index"
            class="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm text-20 flex flex-col items-center justify-center font-medium text-gray-7 dark:text-gray-3 active:scale-95 transition-transform"
            @click="goToDemo(child.path)">
            <view :class="[child.icon, 'size-4 mb-2 text-blue-500']" />
            {{ child.label }}
          </view>
        </view>
      </view>

    </view>
  </view>
</template>
