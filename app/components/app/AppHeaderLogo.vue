<script setup lang="ts">
/**
 * 顶栏 Logo：几何模块化字标 Reborn + [UI]
 * - UI 放在圆角容器里，呼应 Button / Border / Radius / Container
 * - 纯色 currentColor，跟随文字色（亮/暗自动切换）
 * - 无渐变、无阴影、无 3D
 */
const appConfig = useAppConfig()
const alt = computed(() => appConfig.header?.logo?.alt || appConfig.header?.title || 'Reborn UI')
</script>

<template>
  <span
    class="inline-flex h-12 shrink-0 items-center text-default"
    :aria-label="alt"
    role="img"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 168 32"
      class="h-12 w-auto"
      fill="none"
      aria-hidden="true"
    >
      <!--
        模块化字标：
        - Reborn：几何无衬线字重
        - [UI]：圆角矩形容器（Button / Card / Radius）
        - 间距对齐 4px 网格
      -->
      <text
        x="0"
        y="22"
        fill="currentColor"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        font-size="18"
        font-weight="700"
        letter-spacing="-0.4"
      >Reborn</text>

      <!-- UI 容器：圆角 = Radius，描边 = Border，内边距 = Spacing -->
      <rect
        x="78"
        y="4"
        width="36"
        height="24"
        rx="6"
        stroke="currentColor"
        stroke-width="1.75"
      />
      <text
        x="96"
        y="21"
        text-anchor="middle"
        fill="currentColor"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        font-size="13"
        font-weight="750"
        letter-spacing="0.8"
      >UI</text>

      <!-- 右侧 2×2 网格模块（Grid / Spacing），强化组件库语汇 -->
      <g fill="currentColor">
        <rect
          x="124"
          y="8"
          width="6"
          height="6"
          rx="1.2"
        />
        <rect
          x="133"
          y="8"
          width="6"
          height="6"
          rx="1.2"
          opacity="0.45"
        />
        <rect
          x="124"
          y="17"
          width="6"
          height="6"
          rx="1.2"
          opacity="0.45"
        />
        <rect
          x="133"
          y="17"
          width="6"
          height="6"
          rx="1.2"
        />
      </g>
    </svg>
  </span>
</template>
