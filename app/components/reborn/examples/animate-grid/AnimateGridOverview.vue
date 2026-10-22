<script setup lang="ts">
/**
 * 总览卡片缩略：向左后方倾斜的 4×3 Logo 网格，其中一格被抬起并带绿色光晕
 *
 * 网格本身直接用组件；「抬起」原本由 useMouseInElement 检测到鼠标进入后给格子加
 * card-raised-big / card-raised-small 类，组件没有强制状态的 prop，
 * 缩略图禁交互，这里在挂载后给第 6 格及其上下左右的格子补上这两个类，定格悬停画面。
 * 抬起类自带无限循环的 drop-shadow 关键帧（滤镜动画每帧重绘），这里关掉动画、换成静态光晕。
 * 格数从 Demo 的 16 个减到 12 个：每格都会挂一个鼠标位置监听，越少越省。
 */
import cloudflare from './cloudflare.svg'

const cards = Array.from({ length: 12 }, () => ({ logo: cloudflare }))

/** 被抬起的格子下标，及其上下左右相邻格（与组件 adjacentCardItems 的 4 列规则一致） */
const RAISED_INDEX = 5
const ADJACENT_INDEXES = [4, 6, 1, 9]

const rootRef = useTemplateRef<HTMLElement>('rootRef')

onMounted(() => {
  const items = rootRef.value?.querySelectorAll<HTMLElement>('.card')
  if (!items) return
  items[RAISED_INDEX]?.classList.add('card-raised-big')
  ADJACENT_INDEXES.forEach(index => items[index]?.classList.add('card-raised-small'))
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative h-[110px] w-[193px]"
  >
    <div class="absolute top-0 left-0 w-[440px] origin-top-left scale-[0.438] [&_.card]:animate-none! [&_.card-raised-big]:[filter:drop-shadow(0_1px_6px_#38ef7d)]">
      <AnimateGrid :cards="cards">
        <template #logo="{ logo }">
          <img
            class="mx-auto h-10 w-auto"
            :src="logo"
            alt="Cloudflare"
          >
        </template>
      </AnimateGrid>
    </div>
  </div>
</template>
