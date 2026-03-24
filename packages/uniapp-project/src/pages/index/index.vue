<script setup lang="ts">
import RebornAffix from '@/components/reborn-affix/RebornAffix.vue'
import RebornBackTop from '@/components/reborn-back-top/RebornBackTop.vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggleDarkMode } = useDarkMode()

const list = ['i-meteocons-clear-day-fill', 'i-meteocons-solar-eclipse-fill']
const menuItems = [
  {
    label: '基础组件',
    children: [
      { label: '文本', icon: 'i-lucide-text', path: '/pages/reborn-text/index' },
      { label: '按钮', icon: 'i-lucide-mouse', path: '/pages/reborn-button/RebornButtonDemo' },
      { label: '图片', icon: 'i-lucide-image', path: '/pages/reborn-image/RebornImageDemo' },
      { label: '徽章', icon: 'i-lucide-badge-check', path: '/pages/reborn-badge/RebornBadgeDemo' },
      { label: '根节点传送门', icon: 'i-lucide-arrow-right-left', path: '/pages/reborn-root-portal/RebornRootPortalDemo' },
    ],
  },
  {
    label: '表单组件',
    children: [
      { label: '表单', icon: 'i-lucide-layout-list', path: '/pages/reborn-form/RebornFormDemo' },
      { label: '输入框', icon: 'i-lucide-text-cursor-input', path: '/pages/reborn-input/RebornInputDemo' },
      { label: '验证码', icon: 'i-lucide-key-round', path: '/pages/reborn-input-otp/RebornInputOtpDemo' },
      { label: '数字输入', icon: 'i-mdi-numbers', path: '/pages/reborn-input-number/RebornInputNumberDemo' },
      { label: '文本域', icon: 'i-lucide-form-input', path: '/pages/reborn-textarea/RebornTextareaDemo' },
      { label: '开关', icon: 'i-lucide-toggle-right', path: '/pages/reborn-switch/RebornSwitchDemo' },
      { label: '单选框', icon: 'i-lucide-circle', path: '/pages/reborn-radio/RebornRadioDemo' },
      { label: '复选框', icon: 'i-lucide-check-square', path: '/pages/reborn-checkbox/RebornCheckboxDemo' },
      { label: '选择器', icon: 'i-lucide-list', path: '/pages/reborn-select/RebornSelectDemo' },
      { label: '日期选择器', icon: 'i-lucide-calendar', path: '/pages/reborn-select-date/RebornSelectDateDemo' },
      {
        label: '评分',
        icon: 'i-lucide-star',
        path: '/pages/reborn-rate/RebornRateDemo',
      },
      { label: '滑块', icon: 'i-lucide-sliders-horizontal', path: '/pages/reborn-slider/RebornSliderDemo' },
      { label: '选择器视图', icon: 'i-lucide-list-checks', path: '/pages/reborn-picker-view/RebornPickerViewDemo' },
      { label: '下拉选择', icon: 'i-lucide-chevron-down-circle', path: '/pages/reborn-dropdown-select/RebornDropdownSelectDemo' },
      { label: '级联选择', icon: 'i-lucide-square-stack', path: '/pages/reborn-cascader/RebornCascaderDemo' },
    ],
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
      { label: '悬浮按钮', icon: 'i-lucide-mouse-pointer-2', path: '/pages/reborn-fab/RebornFabDemo' },
      { label: '底部栏', icon: 'i-lucide-panel-bottom', path: '/pages/reborn-footer/RebornFooterDemo' },
      { label: '标签栏', icon: 'i-lucide-dock', path: '/pages/reborn-tabbar/RebornTabbarDemo' },
      { label: '瀑布流', icon: 'i-mdi-waterfall', path: '/pages/reborn-waterfall/RebornWaterfallDemo' },
      { label: '分页', icon: 'i-lucide-list-ordered', path: '/pages/reborn-pagination/RebornPaginationDemo' },
    ],
  },
  {
    label: '状态组件',
    children: [
      { label: '标签', icon: 'i-lucide-circle-dot', path: '/pages/reborn-chip/RebornChipDemo' },
      { label: '变体标签', icon: 'i-lucide-bookmark', path: '/pages/reborn-variant-tag/RebornVariantTagDemo' },
      { label: '加载', icon: 'i-lucide-loader', path: '/pages/reborn-loading/RebornLoadingDemo' },
    ],
  },
  {
    label: '其他组件',
    children: [
      { label: '二维码', icon: 'i-lucide-qr-code', path: '/pages/reborn-qrcode/RebornQrcodeDemo' },
      { label: '弹出层', icon: 'i-lucide-layers-2', path: '/pages/reborn-popup/RebornPopupDemo' },
      { label: '弹出气泡', icon: 'i-lucide-layers', path: '/pages/reborn-popover/RebornPopoverDemo' },
      { label: '过渡动画', icon: 'i-lucide-move', path: '/pages/reborn-transition/RebornTransitionDemo' },
      { label: '遮罩层', icon: 'i-lucide-square', path: '/pages/reborn-overlay/RebornOverlayDemo' },
      { label: '提示框', icon: 'i-lucide-message-square', path: '/pages/reborn-toast/RebornToastDemo' },
      { label: '加载更多', icon: 'i-lucide-arrow-down-circle', path: '/pages/reborn-loadmore/RebornLoadmoreDemo' },
      { label: '拖拽排序', icon: 'i-lucide-move', path: '/pages/reborn-draggable/RebornDraggableDemo' },
      { label: '取色器', icon: 'i-lucide-palette', path: '/pages/reborn-color-picker/RebornColorPickerDemo' },
    ],
  },
]

function goToDemo(path: string) {
  uni.navigateTo({
    url: path,
  })
}
</script>

<template>
  <page-meta :root-class="isDark ? 'dark' : ''" />
  <view
    class="
      flex min-h-screen w-full justify-center
      bg-[radial-gradient(circle_at_18%_20%,#e0f2fe,#fdf4ff_70%)] px-0 py-6
      text-slate-800 transition-colors duration-300
      dark:bg-slate-950 dark:bg-none dark:text-slate-200
    "
  >
    <view
      class="
        flex w-full flex-col space-y-6 px-4
        sm:px-5
        md:w-[94vw] md:max-w-[700px]
      "
    >
      <!-- Header -->
      <view class="space-y-3 py-10 text-center">
        <view
          class="
            flex cursor-pointer items-center justify-center transition-transform
            active:scale-95
          " @click="toggleDarkMode"
        >
          <view class="flex items-baseline gap-1">
            <text
              v-for="(char, index) in 'Reborn U'" :key="index" class="
                text-4xl font-black text-blue-5
                dark:text-orange-5
              "
            >
              {{ char }}
            </text>

            <view
              class="
                relative h-4 w-2 bg-gradient-to-b from-blue-700 to-orange-500
              "
            >
              <view
                class="
                  absolute -left-2 -top-5 transition-all duration-500
                  ease-in-out
                " :class="isDark ? '-translate-y-1 rotate-0 opacity-100' : `
                  rotate-270 translate-y-0 opacity-100
                `"
              >
                <view
                  :class="isDark ? 'i-meteocons-clear-day-fill' : `
                    i-meteocons-extreme-drizzle-fill
                  `" class="size-6"
                />
              </view>
            </view>
          </view>
        </view>

        <view
          class="
            text-sm font-medium uppercase tracking-wide text-slate-500
            opacity-80
            dark:text-slate-400
          "
        >
          Component Showcase
        </view>
      </view>

      <view v-for="(item, index) in menuItems" :key="index">
        <view
          class="
            mb-2 text-20 font-medium text-gray-7
            dark:text-gray-3
          "
        >
          {{ item.label }}({{ item.children.length }})
        </view>
        <view class="grid grid-cols-3 gap-2">
          <view
            v-for="(child, index) in item.children" :key="index" class="
              flex flex-col items-center justify-center rounded-xl bg-white p-4
              text-20 font-medium text-gray-7 shadow-sm transition-transform
              active:scale-95
              dark:bg-slate-900 dark:text-gray-3
            " @click="goToDemo(child.path)"
          >
            <view class="mb-2 size-4 text-blue-500" :class="[child.icon]" />
            {{ child.label }}
          </view>
        </view>
      </view>
    </view>
    <RebornAffix :right="20" :bottom="150" :no-snapping="true">
      <view
        class="
          bg-primary-500 flex size-10 flex-col items-center justify-center
          overflow-hidden rounded-full
        " @tap="toggleDarkMode"
      >
        <view
          class="flex flex-col transition-transform duration-300"
          :class="isDark ? '-translate-y-[20px]' : 'translate-y-[20px]'"
        >
          <view
            v-for="item in list" :key="item" :class="item" class="
              size-10 text-white
            "
          />
        </view>
      </view>
    </RebornAffix>
    <RebornBackTop />
  </view>
</template>
