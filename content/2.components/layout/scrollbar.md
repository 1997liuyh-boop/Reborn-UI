---
title: 滚动条 Scrollbar
description: 浮层式滚动条组件，滚动条悬浮于内容之上不挤压布局，提供 4/6/8 三档尺寸与颜色变量定制。
category: 布局
tags: [vue, component, scrollbar, layout]
---

::ComponentViewer{demoFile="ScrollbarDemo.vue" config="ScrollbarConfig" componentId="scrollbar" :componentFiles='["RebornScrollbar.vue", "scrollbar.css", "index.ts"]'}

#api

## API

`RebornScrollbar` 是一个浮层式滚动条组件：原生滚动条被彻底隐藏（宽度为 0），滚动条视觉由绝对定位的浮层 DOM 承担。因此滚动条悬浮于内容之上，内容可视宽度不受有无滚动条影响，不会产生布局抖动。

```vue
<!-- 默认 6px -->
<RebornScrollbar class="h-64">…</RebornScrollbar>

<!-- 4px / 8px -->
<RebornScrollbar :size="4" class="h-64">…</RebornScrollbar>
<RebornScrollbar :size="8" class="h-64">…</RebornScrollbar>

<!-- 常驻显示 + 仅纵向滚动 -->
<RebornScrollbar always :horizontal="false" class="h-64">…</RebornScrollbar>

<!-- 延迟 2 秒隐藏 -->
<RebornScrollbar :hide-delay="2000" class="h-64">…</RebornScrollbar>

<!-- 圆角内缩：auto 跟随容器圆角（默认），也可固定值或传 0 关闭 -->
<RebornScrollbar :inset="0" class="h-64 rounded-2xl">…</RebornScrollbar>

<!-- 显形轨道：true 用内置浅灰凹槽，或直接传颜色 -->
<RebornScrollbar track class="h-64">…</RebornScrollbar>
<RebornScrollbar track="rgb(16 185 129 / 0.14)" class="h-64">…</RebornScrollbar>

<!-- 颜色变量自定义 -->
<RebornScrollbar
  class="h-64"
  :style="{
    '--reborn-scrollbar-thumb': '#6366f1',
    '--reborn-scrollbar-thumb-hover': '#818cf8',
  }"
>…</RebornScrollbar>
```

> 组件需要一个确定的高度才能产生滚动，请在外层类名上给出 `h-*` 或由父容器约束高度。

## Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `size` | `number \| string` | `6` | 滚动条粗细。纯数字按 px 处理（如 `4` / `"8"`），也可传入带单位的值（如 `"0.5rem"`）。 |
| `always` | `boolean` | `false` | 是否常驻显示滚动条。为 `false` 时仅在悬停容器、滚动过程中或拖拽时淡入。 |
| `minThumbSize` | `number` | `20` | thumb 最小长度（px），防止内容极长时 thumb 小到无法拖拽。 |
| `horizontal` | `boolean` | `true` | 是否启用横向滚动条。为 `false` 时横向内容被裁剪。 |
| `hideDelay` | `number` | `800` | 停止滚动后隐藏滚动条的延迟（ms），仅 `always` 为 `false` 时生效。 |
| `inset` | `number \| 'auto'` | `'auto'` | 轨道两端的圆角安全内缩（px）。`'auto'` 按容器实际 `border-radius` 自动推算；传数值则固定为该值，传 `0` 关闭内缩。 |
| `track` | `boolean \| string` | `false` | 轨道是否显形。`false` 为完全透明的悬浮感；`true` 使用内置浅灰凹槽并自动适配暗色；传颜色字符串则用该颜色。 |
| `scrollDuration` | `number` | `400` | 命令式滚动（`setScrollTop` / `setScrollLeft`）的默认动画时长（ms），传 `0` 关闭动画。 |
| `wrapClass` | `string` | — | 附加到内部滚动层的类名，用于设置内边距等。 |
| `contentClass` | `string` | — | 附加到内容层的类名。 |

## Events

| 事件名 | 参数 | 说明 |
| --- | --- | --- |
| `scroll` | `{ scrollTop: number; scrollLeft: number }` | 滚动时触发，携带当前滚动偏移。 |

## Slots

| 插槽名 | 说明 |
| --- | --- |
| `default` | 滚动区域内容。 |

## 暴露方法

通过模板 ref 获取实例后调用：

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `update()` | `() => void` | 手动重新测量 thumb 尺寸与位置。内容尺寸变化已由 `ResizeObserver` 自动处理，一般无需调用。 |
| `refresh()` | `() => void` | 在 `update()` 之上额外重算圆角安全内缩。运行时动态改变容器 `border-radius` 后调用。 |
| `setScrollTop(value, options?)` | `(value: number, options?: ScrollToOptions) => Promise<void>` | 滚动到指定纵向偏移，默认带缓动动画。 |
| `setScrollLeft(value, options?)` | `(value: number, options?: ScrollToOptions) => Promise<void>` | 滚动到指定横向偏移，默认带缓动动画。 |
| `stopScroll()` | `() => void` | 中止进行中的滚动动画。 |
| `wrapRef` | `HTMLElement \| null` | 内部滚动层元素，可用于读取 `scrollTop` / `clientWidth` 等。 |

`ScrollToOptions`：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `animated` | `boolean` | `true` | 是否使用动画滚动。传 `false` 立即落位。 |
| `duration` | `number` | `scrollDuration` | 本次动画时长（ms）。 |

```vue
<script setup lang="ts">
const scrollbarRef = ref()

async function jump() {
  // 目标值自动夹紧到 [0, 最大可滚动距离]，动画结束后 Promise 才 resolve
  await scrollbarRef.value.setScrollTop(600, { duration: 800 })
  console.log('滚动完成')
}
</script>

<template>
  <RebornScrollbar ref="scrollbarRef" :scroll-duration="600" class="h-64">…</RebornScrollbar>
</template>
```

滚动动画采用 `requestAnimationFrame` + `easeInOutCubic` 缓动实现，而非原生 `behavior: 'smooth'`，因此时长与曲线完全可控。用户滚轮、触摸、拖拽 thumb 或点击轨道时会自动中止动画，避免手势与动画互相打架；被打断时 Promise 同样 resolve，`await` 不会挂起。

## CSS 变量

在组件元素或任意祖先上设置均可生效。

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `--reborn-scrollbar-size` | `6px` | 滚动条粗细（`size` 属性即写入该变量）。 |
| `--reborn-scrollbar-radius` | `999px` | thumb 圆角。 |
| `--reborn-scrollbar-gap` | `2px` | 滚动条与容器边缘的间距。 |
| `--reborn-scrollbar-inset` | 自动计算 | 轨道两端的圆角安全内缩（`inset` 属性即写入该变量）。容器无圆角时为 `0`。 |
| `--reborn-scrollbar-track` | `transparent` | 轨道颜色（`track` 属性传颜色字符串时即写入该变量）。 |
| `--reborn-scrollbar-thumb` | `rgb(113 113 122 / 0.35)` | thumb 颜色。 |
| `--reborn-scrollbar-thumb-hover` | `rgb(113 113 122 / 0.6)` | thumb 悬停颜色。 |
| `--reborn-scrollbar-thumb-active` | `rgb(113 113 122 / 0.8)` | thumb 拖拽中颜色。 |

暗色适配：`.dark` 祖先下自动把 thumb 三档颜色切换为 `rgb(161 161 170 / 0.4 · 0.65 · 0.85)`，无需额外配置。

## 圆角容器适配

组件根元素为 `overflow: hidden`，容器一旦带上 `rounded-*`，紧贴边缘的轨道两端就会落进圆角弧线的裁剪区，thumb 滚到顶端 / 末端时会被削掉一角。

组件在挂载与尺寸变化时会读取容器实际的 `border-radius`，按弧线与轨道外沿的交点求出安全内缩量并写入 `--reborn-scrollbar-inset`：

`inset = ceil(R - √(R² - (R - gap)²))`

其中 `R` 为圆角半径、`gap` 为 `--reborn-scrollbar-gap`。以默认的 `rounded-2xl`（16px）配 `gap: 2px` 为例，内缩量为 9px，轨道上下各让出 9px，thumb 在两端都完整可见。容器无圆角时内缩为 `0`，行为与直角容器完全一致。

thumb 的长度与拖拽行程都以内缩后的轨道长度为基准，因此拖拽、点击轨道跳转与滚轮位置始终保持一致。

内缩策略由 `inset` 属性控制：默认 `'auto'` 即上述自动推算；传数值可固定内缩（例如直角容器上留出视觉余白），传 `0` 则完全贴边。

> 圆角是「只改样式不改尺寸」的变化，`ResizeObserver` 不会触发。运行时动态改变容器 `border-radius` 后，需在 `nextTick()` 后调用实例的 `refresh()` 重算；`inset` 属性本身的变化由组件内部自动处理。

## 为什么不用原生滚动条

浏览器原生滚动条无法同时满足「不占宽度」与「自定义粗细 / 悬停色」两项诉求：

- **`overflow: overlay` 已在 Chromium 121+ 被移除**，computed 值回退为 `auto`，原生滚动条会实打实占用约 15px 宽度，无法悬浮于内容之上。
- **Chromium 下只要元素的 `scrollbar-width` / `scrollbar-color` 为非 `auto` 值**（注意 `scrollbar-color` 会从祖先继承），浏览器就切换到标准滚动条通道，**所有 `::-webkit-scrollbar` 伪元素规则整体失效**，自定义粗细与 hover / active 颜色全部无法生效。

因此本组件改为「隐藏原生滚动条 + 绝对定位自绘 thumb」：滚动层通过 `scrollbar-width: none` 把原生滚动条宽度压到 0，`clientWidth` 恒等于容器宽度；滚动条浮层绝对定位、不参与文档流，粗细与各状态颜色完全由 CSS 变量掌控。

::
