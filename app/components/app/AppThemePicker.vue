<script setup lang="ts">
/**
 * AppThemePicker —— 主题色切换
 *
 * 这里只负责把选中色系对应的预设名写到 <html data-theme-color="...">，
 * 真正的色值由 app/assets/theme/base.css 的 [data-theme-color] 规则给出。
 *
 * 不用 element.style 直接写 --color-primary：内联样式权重高于 .dark 类选择器，
 * 而暗色板的主色刻意取第 5 阶（第 6 阶在暗底上对比度不够），
 * 一旦写成内联样式，暗色下就会被浅色档的取阶顶掉。
 */
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import RebornPopover from '~/components/reborn/ui/reborn-popover/RebornPopover.vue'

/** 可选色系，首个为品牌蓝 */
interface ThemeColorOption {
  /** 色系名，存进 cookie */
  name: string
  /** base.css 里对应的预设名：品牌蓝的预设叫 brand，其余与色系名相同 */
  preset: string
  /** 中文名，用于悬停提示与读屏 */
  label: string
}

/**
 * 色块背景不写死十六进制：色块自己挂上 data-theme-color 后由 bg-primary 解析，色块与实际主色永远同源。
 * 品牌蓝的预设会把整条 brand 色阶写回原始蓝，所以页面切到其他色系时，品牌蓝色块依然是蓝色
 */
const colors: ThemeColorOption[] = [
  { name: 'blue', preset: 'brand', label: '品牌蓝' },
  { name: 'orange', preset: 'orange', label: '橙色' },
  { name: 'green', preset: 'green', label: '绿色' },
  { name: 'red', preset: 'red', label: '红色' },
]

/** 选中的色系。用 cookie 而非 localStorage：服务端渲染时也能读到，属性随首屏 HTML 一起下发 */
const themeColor = useCookie<string>('theme-color', { default: () => 'blue' })
/** cookie 可能是旧值或被篡改，认不出时回落到首个色系 */
const current = computed(() => colors.find(color => color.name === themeColor.value) ?? colors[0]!)

// SSR 阶段就把属性写进 <html>，避免首屏先按默认色渲染、水合后再跳一次色
useHead(computed(() => ({ htmlAttrs: { 'data-theme-color': current.value.preset } })))
</script>

<template>
  <RebornPopover placement="bottom-end" :ui="{ content: 'p-2' }">
    <template #default="{ open }">
      <!-- 与右侧 UColorModeButton（ghost 中性色）同尺寸同配色：32px 方形图标按钮。
           text 变体自带 h-auto!（文字按钮不占高度），宽高也要用 ! 才能盖过，合并时会替换掉它 -->
      <RebornButton
        variant="text"
        color="neutral"
        class="h-8! w-8! rounded-md px-0 text-default hover:bg-elevated"
        :class="{ 'bg-elevated': open }"
        aria-label="切换主题颜色"
        title="切换主题颜色"
      >
        <Icon name="lucide:palette" class="size-5" />
      </RebornButton>
    </template>

    <template #content>
      <div class="flex items-center gap-1.5" role="group" aria-label="主题颜色">
        <button
          v-for="color in colors"
          :key="color.name"
          type="button"
          :data-theme-color="color.preset"
          class="size-5 rounded-full bg-primary cursor-pointer transition-transform hover:scale-110 ring-offset-2 ring-offset-white dark:ring-offset-black"
          :class="current.name === color.name ? 'ring-2 ring-neutral-900 dark:ring-neutral-100' : ''"
          :title="color.label"
          :aria-label="`切换为${color.label}`"
          :aria-pressed="current.name === color.name"
          @click="themeColor = color.name"
        />
      </div>
    </template>
  </RebornPopover>
</template>
