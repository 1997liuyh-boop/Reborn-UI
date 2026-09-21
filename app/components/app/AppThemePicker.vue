<script setup lang="ts">
/**
 * AppThemePicker —— 主题色切换
 *
 * 这里只负责把选中的色系名写到 <html data-theme-color="...">，
 * 真正的色值由 app/assets/theme/base.css 的 [data-theme-color] 规则给出。
 *
 * 不用 element.style 直接写 --color-primary：内联样式权重高于 .dark 类选择器，
 * 而暗色板的主色刻意取第 5 阶（第 6 阶在暗底上对比度不够），
 * 一旦写成内联样式，暗色下就会被浅色档的取阶顶掉。
 */

/** 可选色系。色块背景不写死十六进制，挂上 data-theme-color 后由 bg-primary 自己解析，色块与实际主色永远同源 */
const colors = [
    { name: 'brand', label: '品牌蓝' },
    { name: 'orange', label: '橙色' },
    { name: 'green', label: '绿色' },
    { name: 'red', label: '红色' },
]

/** 选中的色系。用 cookie 而非 localStorage：服务端渲染时也能读到，属性随首屏 HTML 一起下发 */
const themeColor = useCookie<string>('theme-color', { default: () => 'brand' })

// SSR 阶段就把属性写进 <html>，避免首屏先按默认色渲染、水合后再跳一次色
useHead(computed(() => ({ htmlAttrs: { 'data-theme-color': themeColor.value } })))
</script>

<template>
  <UPopover :ui="{ content: 'p-2' }">
    <template #default="{ open }">
      <UButton
        icon="i-lucide-palette" color="neutral" variant="ghost"
        :class="{ 'bg-neutral-100 dark:bg-neutral-800': open }" aria-label="切换主题颜色"
      />
    </template>

    <template #content>
      <div class="flex items-center gap-1.5">
        <button
          v-for="color in colors" :key="color.name" :data-theme-color="color.name" class="size-5 rounded-full bg-primary cursor-pointer transition-transform hover:scale-110 ring-offset-2 ring-offset-white dark:ring-offset-black" :class="[
            themeColor === color.name ? 'ring-2 ring-neutral-900 dark:ring-neutral-100' : ''
          ]" :title="color.label" :aria-label="`切换为${color.label}`" @click="themeColor = color.name"
        />
      </div>
    </template>
  </UPopover>
</template>
