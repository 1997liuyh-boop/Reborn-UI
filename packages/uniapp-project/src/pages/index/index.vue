<script setup lang="ts">
import * as z from 'zod'
import { useDarkMode } from '@/composables/useDarkMode'
import RebornAffix from '@/components/reborn-affix/RebornAffix.vue'
import RebornBackTop from '@/components/reborn-back-top/RebornBackTop.vue'

const { isDark, toggleDarkMode } = useDarkMode()

// const scrollTop = ref(0)

// onPageScroll((e) => {
//   scrollTop.value = e.scrollTop
// })

const list = ['i-meteocons-clear-day-fill', 'i-meteocons-solar-eclipse-fill']
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
      { label: '表单', icon: 'i-lucide-layout-list', path: '/pages/reborn-form/RebornFormDemo' },
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
      { label: '图钉', icon: 'i-lucide-pin', path: '/pages/reborn-affix/RebornAffixDemo' },
      { label: '返回顶部', icon: 'i-lucide-arrow-big-up', path: '/pages/reborn-back-top/RebornBackTopDemo' },
      { label: '吸顶', icon: 'i-lucide-arrow-up-to-line', path: '/pages/reborn-sticky/RebornStickyDemo' },
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

// const newData = ref({ email: 'test@qq.com', password: "12345", newPassword: '123456789', telPhone: "123", price: 100, code: '1234', content: [], list: [{ name: '13', no: 3, money: 3 }, { name: '2', no: 2, money: 2 }] })


// const baseSchema = z.object({
//   email: z.email('邮箱格式不正确').refine(val => val.endsWith('@qq.com') || val.endsWith('@163.com'), '仅支持 QQ 或 163 邮箱'),
//   password: z.string().min(8, '密码至少8位').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/, '需包含大小写字母和特殊符号'),
//   newPassword: z.preprocess((val) => Number(val), z.number().refine(n => /^\d+(\.\d{1,2})?$/.test(n.toString()), '最多只能保留两位小数')),
//   telPhone: z.union([
//     z.literal(""),
//     z.string().regex(/^137\d{8}$/, '手机号格式不正确')
//   ]).optional(),
//   price: z.preprocess((val) => Number(val), z.number().refine(n => /^\d+(\.\d{1,2})?$/.test(n.toString()), '最多只能保留两位小数')),
//   code: z.string().length(4, '验证码必须为 4 位'),
//   content: z.array(z.string()).refine((val) => newData.value.price > 200 ? val.length > 2 : true, '价格大于200时，内容长度必须大于2'),
//   list: z.array(z.object({
//     name: z.string().min(2, 'Name 最少两个字符'),
//     no: z.coerce.number(),    // 强制转数字
//     money: z.coerce.number()  // 强制转数字
//   }))
//     .min(3, 'List 长度不能小于 3')
//     .refine((items) => {
//       // 逻辑：校验 no 和 money 是否递增
//       for (let i = 1; i < items.length; i++) {
//         if (items[i].no <= items[i - 1].no || items[i].money <= items[i - 1].money) {
//           return false;
//         }
//       }
//       return true;
//     }, {
//       message: 'no 和 money 必须是递增的'
//     })
// });

onMounted(async () => {

  // const itemSchema = baseSchema.shape.list.element;
  // const contentSchema = itemSchema.pick({ name: true })
  // const res = await contentSchema.safeParseAsync(newData.value.list[1])
  // console.log(res)
  // console.log(baseSchema instanceof z.ZodObject)
  // newData.value.price = 300
  // const fieldName = 'content';
  // const contentSchema = baseSchema.pick({ [fieldName]: true })
  // const res = await contentSchema.safeParseAsync(newData.value)
  // if (!res.success) console.log(res.error.issues)

  // const res2 = await baseSchema.safeParseAsync(newData.value)
  // if (!res2.success) console.log(res2.error.issues)
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
    <reborn-affix :right="20" :bottom="150" :no-snapping="true">
      <view class="w-10 h-10 flex flex-col items-center justify-center rounded-full bg-primary-500 overflow-hidden"
        @tap="toggleDarkMode">
        <view class="flex flex-col duration-300 transition-transform"
          :class="isDark ? '-translate-y-[20px]' : 'translate-y-[20px]'">
          <view v-for="item in list" :key="item" :class="item" class="text-white size-10" />
        </view>
      </view>
    </reborn-affix>
    <reborn-back-top />
  </view>
</template>
