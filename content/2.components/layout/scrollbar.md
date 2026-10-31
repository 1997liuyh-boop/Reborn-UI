---
title: Scrollbar 滚动条
description: 不挤压布局的浮层滚动条，支持粗细与颜色定制、固定头部避让、双轴动画及静默定位。
category: 布局
platform: web
series: reborn
tags: [vue, component, scrollbar, layout]
---

::ComponentViewer{demoFile="ScrollbarDemo.vue" config="ScrollbarConfig" componentId="scrollbar" :componentFiles='["RebornScrollbar.vue", "RebornScrollbarBars.vue", "scrollbar.css", "index.ts"]'}

::

## 简介

`RebornScrollbar` 是一个浮层式滚动条组件：原生滚动条被彻底隐藏（宽度为 0），滚动条视觉由绝对定位的浮层 DOM 承担。因此滚动条悬浮于内容之上，内容可视宽度不受有无滚动条影响，不会产生布局抖动。

`size` 决定粗细，`track` 决定轨道显形，`inset` 决定轨道两端的内缩（默认四周都留出与贴边一侧相同的间距，圆角容器自动加大）；`verticalOffset` 独立排除顶部固定区域，仅影响纵向轨道和滑块比例，不改变横向几何或内容布局。

`always` / `hideDelay` 控制显示时机，`bounce` 控制滚轮到达边缘时的 2px 回弹，`horizontal` 控制横向溢出，`wrapClass` / `contentClass` 设置内部类名。`scrollTo` 支持双轴同步动画，旧 `setScrollTop` / `setScrollLeft` 保留单轴默认动画和静默选项；当前组件仅提供 Web 实现。

### 何时使用

- 面板要求有无滚动条时内容宽度一致——通过 `size` 定制浮层粗细，不预留占位。
- 长列表只需纵向滚动——设置 `horizontal="false"` 裁剪横向内容。
- 固定表头上方不能出现纵向轨道——向 `verticalOffset` 传入实际表头累计高度（px）。
- 容器带圆角——保留 `inset="auto"`，防止滑块端部被裁剪。
- 需要提示已经滚到尽头——保留 `bounce`（默认开启），到达边缘时内容轻微回弹，不会生硬停住。
- 需要调整命令式定位节奏——通过 `scrollDuration` 指定默认动画时长（ms）。

### 何时不使用

- 整页 `html` / `body` 滚动——改用站点全局原生滚动条样式。
- 只要求隐藏滚动条、无需拖拽浮层——改用 `scrollbar-hide` 工具类。
- UniApp 小程序内滚动——改用平台 `scroll-view`。

## 用法

### 显隐时机

`always` 默认关闭，仅在悬停、拖拽或滚动时显示；`hideDelay` 默认 800ms，`always` 开启后常驻显示。

| 配置 | 行为 | 典型用途 |
| --- | --- | --- |
| `always=false` | 停止滚动后按 `hideDelay` 淡出 | 弹出面板 |
| `always=true` | 溢出时常驻显示 | 长列表 |

```vue
<template>
  <!-- 常驻显示 + 仅纵向滚动 -->
  <RebornScrollbar always :horizontal="false" class="h-64">…</RebornScrollbar>
  <!-- 延迟 2 秒隐藏 -->
  <RebornScrollbar :hide-delay="2000" class="h-64">…</RebornScrollbar>
</template>
```

### 边缘回弹

`bounce` 默认开启：滚轮把内容送到顶部 / 底部（横向为最左 / 最右），或已在边缘还继续朝外滚时，滚动层朝越界方向位移 2px 后收回，提示已到边界。

有固定表头时，可用 `bounceTarget` 指定内容层内的回弹目标，例如 `bounce-target=":scope > table > tbody"` 只移动表体，固定表头与滚动层保持原位。目标应保留原有布局占位，避免回弹改变滚动边界；未匹配到元素时不播放回弹。

| 触发方式 | 是否回弹 | 原因 |
| --- | --- | --- |
| 滚轮 / 触控板滚到边缘、在边缘继续滚 | 回弹，一次手势只弹一次 | 滚轮停顿 200ms 视为手势结束，触控板惯性不会连弹 |
| 拖拽滑块、点击轨道 | 不回弹 | 位置由用户直接指定，没有「冲过头」的过程 |
| `scrollTo` 等命令式滚动 | 不回弹 | 自带缓动收尾 |
| 触屏 | 不回弹 | 移动端浏览器自带越界效果，叠加会弹两次 |

```vue
<template>
  <RebornScrollbar class="h-64">默认到边回弹</RebornScrollbar>
  <RebornScrollbar :bounce="false" class="h-64">关闭回弹</RebornScrollbar>
</template>
```

::tip
默认位移加在滚动层上而不是内容层：内容层向上平移会缩小可滚动区域，停在底部时 `scrollTop` 会被浏览器夹回，回弹结束后就不再贴底；平移滚动层不改变任何滚动量，`scroll` 事件也不会因回弹多派发。嵌套滚动时只有最内层在该方向能滚动的实例回弹，外层不跟着弹。
::

### 边距与圆角自适应

`inset` 默认让轨道四周都不贴边，圆角容器自动加大两端内缩；传数值可固定内缩。轨道贴边一侧（纵向条的右侧、横向条的底部）留 `--reborn-scrollbar-gap`（默认 2px），两端至少留出同样的距离。组件根元素为 `overflow: hidden`，容器一旦带上 `rounded-*`，轨道两端还会落进圆角弧线的裁剪区，thumb 滚到顶端 / 末端时会被削掉一角。

组件在挂载与尺寸变化时会读取容器实际的 `border-radius`，按弧线与轨道外沿的交点求出安全内缩量，与 `gap` 取较大值后写入 `--reborn-scrollbar-inset`：

`inset = max(gap, ceil(R - √(R² - (R - gap)²)))`

其中 `R` 为圆角半径、`gap` 为 `--reborn-scrollbar-gap`。以默认的 `rounded-2xl`（16px）配 `gap: 2px` 为例，内缩量为 9px，轨道上下各让出 9px，thumb 在两端都完整可见。容器无圆角时内缩等于 `gap`，轨道上、下、右（横向为左、右、下）都留 2px。

thumb 的长度与拖拽行程都以内缩后的轨道长度为基准，因此拖拽、点击轨道跳转与滚轮位置始终保持一致。

内缩策略由 `inset` 属性控制：默认 `'auto'` 即上述自动推算；传数值可固定内缩（例如加大两端留白），传 `0` 则两端贴边。

> 圆角是「只改样式不改尺寸」的变化，`ResizeObserver` 不会触发。运行时动态改变容器 `border-radius` 后，需在 `nextTick()` 后调用实例的 `refresh()` 重算；`inset` 属性本身的变化由组件内部自动处理。

| `inset` | 行为 | 典型用途 |
| --- | --- | --- |
| `'auto'` | 取 `gap` 与圆角推算值的较大者 | 直角与圆角面板通用 |
| 正数 | 固定内缩（px） | 固定轨道留白 |
| `0` | 两端贴边 | 需要轨道占满整条边 |

```vue
<template>
  <RebornScrollbar class="h-64 rounded-2xl">自动内缩</RebornScrollbar>
  <RebornScrollbar :inset="12" class="h-64">固定 12px 内缩</RebornScrollbar>
  <RebornScrollbar :inset="0" class="h-64">两端贴边</RebornScrollbar>
</template>
```

### 轨道与配色

`track` 默认透明，传 `true` 使用内置浅灰轨道并适配暗色，也可传颜色字符串。

| `track` | 外观 | 典型用途 |
| --- | --- | --- |
| `false` | 透明轨道 | 只显示滑块 |
| `true` | 内置浅灰轨道 | 提示可拖拽区域 |
| 颜色字符串 | 自定义轨道色 | 与内容配色协调 |

```vue
<template>
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
</template>
```

> 组件需要一个确定的高度才能产生滚动，请在外层类名上给出 `h-*` 或由父容器约束高度。

### 尺寸档位

`size` 默认继承 6px，支持任意像素数值或带单位的字符串；容器需由 `h-*` 或父布局约束高度。

```vue
<template>
  <!-- 默认 6px -->
  <RebornScrollbar class="h-64">…</RebornScrollbar>
  <!-- 4px / 8px -->
  <RebornScrollbar :size="4" class="h-64">…</RebornScrollbar>
  <RebornScrollbar :size="8" class="h-64">…</RebornScrollbar>
</template>
```

### 命令式滚动动画

`scrollTo` 在同一动画中更新指定的两轴；`setScrollTop` / `setScrollLeft` 继续默认使用动画。三者均返回 `Promise<void>`，默认时长由 `scrollDuration` 决定。

| 选项 | 行为 | 典型用途 |
| --- | --- | --- |
| `animated: true`（默认） | 共用一条缓动时间线 | 同时回到左上角 |
| `animated: false` | 立即定位 | 初始化位置 |
| `silent: true` | 仍触发 `scroll`，但不淡入滚动条 | 打开面板时定位选中项 |

```vue
<script setup lang="ts">
import { ref } from "vue";
import RebornScrollbar from "~/components/reborn/ui/scrollbar/RebornScrollbar.vue";
const scrollbarRef = ref<InstanceType<typeof RebornScrollbar>>();
async function jump() {
  // 两轴同时归零；目标夹紧，完成或取消都会结束等待。
  await scrollbarRef.value?.scrollTo({ top: 0, left: 0 }, { animated: true });
}
</script>
<template>
  <button type="button" @click="jump">回到左上角</button>
  <RebornScrollbar ref="scrollbarRef" :scroll-duration="600" class="h-64">
    <div class="h-96 w-[1200px]">可双向滚动的内容</div>
  </RebornScrollbar>
</template>
```

保留单轴调用，例如 `await scrollbarRef.value?.setScrollTop(600, { duration: 800 })`。未指定轴不会被写入；`duration: 0`、没有位移、无 rAF 环境或系统开启 `prefers-reduced-motion: reduce` 时立即完成。目标值夹紧到各轴原生可滚动范围，不叠加 `verticalOffset`。

滚动动画采用 `requestAnimationFrame` + `easeInOutCubic` 缓动实现，而非原生 `behavior: 'smooth'`，因此时长与曲线完全可控。用户滚轮、触摸、拖拽 thumb 或点击轨道时会自动中止动画，避免手势与动画互相打架；被打断时 Promise 同样 resolve，`await` 不会挂起。

### 双向滚动

`horizontal` 默认开启，内容横向溢出时显示底部轨道，两条轨道均可拖拽或点击定位；关闭后裁剪横向内容。

| `horizontal` | 行为 | 典型用途 |
| --- | --- | --- |
| `true`（默认） | 允许横向滚动 | 宽表格、画布 |
| `false` | 裁剪横向内容 | 单列菜单 |

```vue
<template>
  <RebornScrollbar always class="h-64">
    <div class="h-96 w-[1200px]">可双向滚动的内容</div>
  </RebornScrollbar>
</template>
```

#### 固定头部避让

`verticalOffset` 默认 0；传入固定区域的实际高度（px），纵向轨道从 `inset + 有效偏移` 开始，横向轨道不变。组件不负责固定头部，固定样式由使用方提供。

实际联动见 `app/components/reborn/examples/reborn-table/RebornTableDemo.vue` 的「固定表头」演示：切换固定表头开关可对比轨道范围。Table 已按实际 `thead` 累计高度传入偏移，关闭固定或隐藏表头时归零，无需调用方硬编码高度。

```vue
<template>
  <!-- 示例头部为 48px；实际表格应测量整个 thead 的高度再传入 -->
  <RebornScrollbar :vertical-offset="48" :inset="0" class="h-64">
    <div class="bg-default sticky top-0 flex h-12 items-center">固定标题</div>
    <div v-for="row in 30" :key="row" class="p-3">内容 {{ row }}</div>
  </RebornScrollbar>
</template>
```

有效偏移夹紧到 `[0, max(clientHeight - 2 × inset, 0)]`，负数和非有限值按 0 处理。轨道长度为 `max(clientHeight - 2 × inset - 有效偏移, 0)`，滑块比例为 `(clientHeight - 有效偏移) / (scrollHeight - 有效偏移)`，最短滑块仍受轨道长度上限约束。实际最大滚动距离保持 `scrollHeight - clientHeight`，拖拽与轨道点击使用相同几何。

固定区域高度变化时直接更新 `verticalOffset`；取消固定或隐藏头部时传 0，组件自动刷新并移除纵轨额外的内联定位，恢复原有 CSS。仅视窗高度小于两端内缩总和时显式使用 0px 轨道高度，防止负尺寸。

### 不占布局宽度

`size` 只改变浮层粗细，不占用内容宽度；滚动层隐藏原生滚动条，纵横轨道绝对定位、不参与文档流，内容可视宽度不会随是否溢出而改变。

```vue
<template>
  <RebornScrollbar :size="8" always class="h-64">
    <div v-for="row in 30" :key="row" class="w-full p-3">整行内容 {{ row }}</div>
  </RebornScrollbar>
</template>
```

现有 Demo 的「不占布局宽度」用相同内容对比本组件与原生 `overflow-auto` 容器，可切换内容量观察滚动前后的内容宽度。原生滚动条是否占位取决于系统与浏览器的滚动条策略。

## API

### Props

| 属性名             | 类型                | 默认值   | 描述                                                                                                                |
| ---------------- | ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `size`           | `number \| string`  | -      | 缺省继承 CSS 变量的 6px。纯数字按 px 处理（如 `4` / `"8"`），也可传入带单位的值（如 `"0.5rem"`）。                               |
| `always`         | `boolean`           | `false`  | 是否常驻显示滚动条。为 `false` 时仅在悬停容器、滚动过程中或拖拽时淡入；命令式滚动传 `silent: true` 时不算滚动过程。 |
| `minThumbSize`   | `number`            | `20`     | thumb 最小长度（px），防止内容极长时 thumb 小到无法拖拽。                                                           |
| `horizontal`     | `boolean`           | `true`   | 是否启用横向滚动条。为 `false` 时横向内容被裁剪。                                                                   |
| `hideDelay`      | `number`            | `800`    | 停止滚动后隐藏滚动条的延迟（ms），仅 `always` 为 `false` 时生效。                                                   |
| `inset`          | `number \| 'auto'`  | `'auto'` | 轨道两端的内缩（px）。`'auto'` 取 `--reborn-scrollbar-gap` 与按容器 `border-radius` 推算值中的较大者，轨道四周都不贴边；传数值则固定为该值，传 `0` 两端贴边。 |
| `bounce`         | `boolean`           | `true`   | 滚轮滚到顶部 / 底部（横向为最左 / 最右）时是否播放 2px 回弹。只响应滚轮与触控板；拖拽滑块、点击轨道、命令式滚动与触屏不回弹，系统开启减少动态效果时不播放。 |
| `bounceTarget`   | `string`            | —        | 回弹目标的 CSS 选择器，在内容层内匹配首个元素。不传时回弹整个滚动层；指定后未匹配到元素则不回弹。变更目标时取消旧目标的回弹。 |
| `verticalOffset` | `number` | `0` | 顶部固定内容高度（px）。负数或非有限值按 0 处理，最大夹至两端内缩后的可用高度；纵轨起点为有效偏移 + 内缩，仅纵向轨道、可视高度与内容高度扣除此偏移，动态变化自动刷新。 |
| `track`          | `boolean \| string` | `false`  | 轨道是否显形。`false` 为完全透明的悬浮感；`true` 使用内置浅灰凹槽并自动适配暗色；传颜色字符串则用该颜色。           |
| `scrollDuration` | `number`            | `400`    | 命令式滚动（`scrollTo` / `setScrollTop` / `setScrollLeft`）的默认动画时长（ms），传 `0` 关闭动画。                               |
| `wrapClass`      | `string`            | —        | 附加到内部滚动层的类名，用于设置内边距等。                                                                          |
| `contentClass`   | `string`            | —        | 附加到内容层的类名。                                                                                                |

### Emits

| 事件名   | 回调参数                                        | 描述                           |
| -------- | ------------------------------------------- | ------------------------------ |
| `scroll` | `{ scrollTop: number; scrollLeft: number }` | 滚动时触发，携带当前滚动偏移。 |

### Slots

| 插槽名    | 作用域参数 | 描述           |
| --------- | --- | -------------- |
| `default` | - | 滚动区域内容。 |

### Expose

通过模板 ref 获取实例后调用：

| 方法名                             | 签名                                                          | 描述                                                                                      |
| -------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `update`                       | `() => void`                                                  | 手动重新测量 thumb 尺寸与位置。内容尺寸变化已由 `ResizeObserver` 自动处理，一般无需调用。 |
| `refresh`                      | `() => void`                                                  | 在 `update()` 之上额外重算圆角安全内缩。运行时动态改变容器 `border-radius` 后调用。       |
| `scrollTo` | `(position: { top?: number; left?: number }, options?: ScrollToOptions) => Promise<void>` | 指定轴共用一次动画，未指定轴不写入；目标夹紧到各轴合法范围。新请求覆盖旧动画，结束或取消均 resolve。 |
| `setScrollTop`  | `(value: number, options?: ScrollToOptions) => Promise<void>` | 滚动到指定纵向偏移，默认带缓动动画。                                                      |
| `setScrollLeft` | `(value: number, options?: ScrollToOptions) => Promise<void>` | 滚动到指定横向偏移，默认带缓动动画。                                                      |
| `stopScroll`                   | `() => void`                                                  | 中止两轴共用的滚动动画并结束等待中的 Promise。                                                                    |
| `wrapRef`                        | `HTMLElement \| null`                                         | 内部滚动层元素，可用于读取 `scrollTop` / `clientWidth` 等。                               |

### 滚动选项

`ScrollToOptions` 供三种命令式滚动方法共用，不是组件 prop。`position` 的 `top` / `left` 单位均为 px。

| 字段       | 类型      | 默认值           | 说明                                                                                                                   |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `animated` | `boolean` | `true`           | 是否使用动画滚动。传 `false` 立即落位；系统启用减少动态效果时也立即落位。                                                                                |
| `duration` | `number`  | `scrollDuration` | 本次动画时长（ms）。                                                                                                   |
| `silent`   | `boolean` | `false`          | 静默滚动：本次滚动不让滚动条淡入，悬停与拖拽照常显示。用于打开面板时定位选中项等非用户发起的滚动，避免滚动条无故闪现。 |

### 自定义样式（ui）

组件没有 `ui` prop；根节点使用 `class`，内部滚动层使用 `wrapClass`，内容层使用 `contentClass`，均可传入 Tailwind 类名。

### CSS 变量

定义文件为 `app/components/reborn/ui/scrollbar/scrollbar.css`，通过 `app/assets/css/reborn-ui.css` 全局引入。可在组件元素的 `style` 中覆盖；根节点已定义默认值，仅在祖先赋值可能被根节点的默认值遮蔽。

| 变量名                            | 默认值                    | 说明                                                                     |
| --------------------------------- | ------------------------- | ------------------------------------------------------------------------ |
| `--reborn-scrollbar-size`         | `6px`                     | 滚动条粗细（`size` 属性即写入该变量）。                                  |
| `--reborn-scrollbar-radius`       | `999px`                   | thumb 圆角。                                                             |
| `--reborn-scrollbar-gap`          | `2px`                     | 滚动条与容器边缘的间距。                                                 |
| `--reborn-scrollbar-inset`        | 自动计算                  | 轨道两端的内缩（`inset` 属性即写入该变量）。容器无圆角时等于 `--reborn-scrollbar-gap`。 |
| `--reborn-scrollbar-track`        | `transparent`             | 轨道颜色（`track` 属性传颜色字符串时即写入该变量）。                     |
| `--reborn-scrollbar-thumb`        | `rgb(113 113 122 / 0.35)` | thumb 颜色。                                                             |
| `--reborn-scrollbar-thumb-hover`  | `rgb(113 113 122 / 0.6)`  | thumb 悬停颜色。                                                         |
| `--reborn-scrollbar-thumb-active` | `rgb(113 113 122 / 0.8)`  | thumb 拖拽中颜色。                                                       |

暗色适配：`.dark` 祖先下自动把 thumb 三档颜色切换为 `rgb(161 161 170 / 0.4 · 0.65 · 0.85)`，无需额外配置。

## 注意事项

- **必须约束高度**。组件依赖滚动层的可视高度计算轨道，未设置 `h-*` 或父级高度约束时内容会直接撑开。
- **`verticalOffset` 只避让、不固定内容**。由使用方实测固定头部总高度并传入，非固定或无头部时传 0；不要把表头高度另行加到滚动目标里。
- **两轴同步动画用一次 `scrollTo`**。每次新请求都会取消旧动画；连续调用两个默认动画的单轴 setter 仍是后者接管，并不组成双轴动画。
- **取消也会结束 Promise**。`stopScroll`、用户滚轮、触摸、拖拽、轨道点击、新请求及卸载都会 resolve 旧请求；等待结束不等于必然到达目标。
- **静默定位仍派发事件**。`silent: true` 只抑制本次滚动引起的淡入，悬停与拖拽照常显示；无位移时不会挂静默标记，避免吞掉后续用户滚动。
- **减少动态效果时立即定位**。即使传 `animated: true`，系统的 `prefers-reduced-motion: reduce` 仍优先，避免强制动画。
- **默认回弹期间滚动层带 `transform`**。320ms 内滚动层内部的 `position: fixed` 元素会以滚动层为定位参照；内容里有未传送到 body 的固定定位元素时传 `:bounce="false"`。指定 `bounceTarget` 时仅匹配的目标带 `transform`。
- **仅修改圆角需手动刷新**。`ResizeObserver` 只观察尺寸；动态改 `border-radius` 后在 `nextTick()` 后调用 `refresh()`，`inset` 和 `verticalOffset` 的变化则会自动刷新。

### 为什么不用原生滚动条

浏览器原生滚动条无法同时满足「不占宽度」与「自定义粗细 / 悬停色」两项诉求：

- **`overflow: overlay` 已在 Chromium 121+ 被移除**，computed 值回退为 `auto`，原生滚动条会实打实占用约 15px 宽度，无法悬浮于内容之上。
- **Chromium 下只要元素的 `scrollbar-width` / `scrollbar-color` 为非 `auto` 值**（注意 `scrollbar-color` 会从祖先继承），浏览器就切换到标准滚动条通道，**所有 `::-webkit-scrollbar` 伪元素规则整体失效**，自定义粗细与 hover / active 颜色全部无法生效。

因此本组件改为「隐藏原生滚动条 + 绝对定位自绘 thumb」：滚动层通过 `scrollbar-width: none` 把原生滚动条宽度压到 0，`clientWidth` 恒等于容器宽度；滚动条浮层绝对定位、不参与文档流，粗细与各状态颜色完全由 CSS 变量掌控。
