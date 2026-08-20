---
title: Sticky 吸顶
description: 用于页面滚动时将内容吸附在顶部或底部的吸顶组件。
category: 导航
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::tip
UniApp 端依赖页面的滚动事件来计算吸顶效果。你需要：
1. 在页面中监听 `onPageScroll`。
2. 将滚动距离传递给组件的 `:scroll-top` 属性。

```typescript
const scrollTop = ref(0)
onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
})
```

Web 端组件内部通过 `useWindowScroll` 自动监听窗口滚动，无需传入 `scrollTop`。
::


::ComponentViewer{demoFile="RebornStickyDemo.vue" config="RebornStickyConfig" componentId="reborn-sticky" :componentFiles='["RebornSticky.vue", "reborn-sticky.config.ts"]' :uniappFiles='["RebornSticky.vue", "reborn-sticky.config.ts"]'}
::

## 简介

Sticky 的效果与 CSS `position: sticky` 一致：内容随页面正常排布，滚动到距顶部 `offsetTop` 的位置后固定；组件内部用「占位容器 + 定位内容」双层结构，吸附时自动保留原高度，页面不会跳动。`default` 插槽提供 `isSticky` 作用域参数，可根据吸附状态切换内容样式。

两端能力有差异：Web 端额外支持吸底（`position="bottom"`）、目标容器边界（`target`）与吸底占位策略（`bottomPlaceholder`）；UniApp 端为纯吸顶实现，依赖 `scrollTop` 感知页面滚动。

适用场景：

- 列表分组标题、筛选栏等滚动到顶部后需保持可见。
- 需要根据吸附状态调整内容样式（利用 `isSticky` 作用域参数）。
- Web 端页面底部的操作条随滚动吸底，并限制在某个容器范围内。

不适用场景：

- 固定位置且可拖拽的悬浮元素，改用 `reborn-affix`。
- 滚动一定距离后出现的返回顶部按钮，改用 `reborn-back-top`。

## 用法

### 基础用法

直接包裹需要吸顶的内容即可，`offsetTop` 控制吸附时距离顶部的偏移（px）。多个 Sticky 依次设置递增的 `offsetTop` 可实现分组标题逐级堆叠：

```vue
<template>
  <RebornSticky>
    <div class="h-10 bg-primary text-white flex items-center px-3">分组 A</div>
  </RebornSticky>
  <div v-for="i in 10" :key="i" class="p-3">Item {{ i }}</div>

  <RebornSticky :offset-top="40">
    <div class="h-10 bg-amber-500 text-white flex items-center px-3">分组 B</div>
  </RebornSticky>
  <div v-for="i in 10" :key="i" class="p-3">Item {{ i }}</div>
</template>
```

### 根据吸附状态调整样式

`default` 插槽会传出 `{ isSticky }`，吸附时可切换背景、阴影等样式：

```vue
<template>
  <RebornSticky>
    <template #default="{ isSticky }">
      <div
        class="h-10 flex items-center px-3 transition-shadow"
        :class="isSticky ? 'bg-white shadow-md' : 'bg-transparent'"
      >
        筛选栏 {{ isSticky ? '(已吸顶)' : '' }}
      </div>
    </template>
  </RebornSticky>
</template>
```

### 限制在目标容器内（仅 Web）

通过 `target` 指定 CSS 选择器或 DOM 元素后，吸附元素只在该容器范围内固定；滚动越过容器底部时会停靠在容器内侧，不会跑出容器：

```vue
<template>
  <div id="section-a" class="relative">
    <RebornSticky target="#section-a" :offset-top="0">
      <div class="h-10 bg-green-500 text-white flex items-center px-3">仅在 Section A 内吸顶</div>
    </RebornSticky>
    <div v-for="i in 20" :key="i" class="p-3">Section A - {{ i }}</div>
  </div>
</template>
```

### 吸底模式（仅 Web）

`position="bottom"` 时内容吸附在视口底部，常用于底部操作条。`bottomBoundary` 控制越过 `target` 底部后的停靠基准，`bottomPlaceholder` 控制吸底固定后的占位策略（`keep` 保留高度、`none` 完全不占位）：

```vue
<template>
  <RebornSticky
    position="bottom"
    target="#content"
    bottom-boundary="target"
    bottom-placeholder="none"
  >
    <div class="h-12 bg-white shadow flex items-center justify-end gap-2 px-4">
      <button class="rounded bg-primary px-4 py-1 text-white">提交</button>
    </div>
  </RebornSticky>
</template>
```

### UniApp 用法

UniApp 端必须把 `onPageScroll` 的滚动距离传给 `scrollTop`；当吸顶元素上方还有标题等内容、测量位置与实际吸顶点不一致时，可用 `stickyTriggerLead` 让吸顶判定提前若干 px：

```vue
<script setup lang="ts">
import RebornSticky from '@/components/reborn-sticky/RebornSticky.vue'

const scrollTop = ref(0)
onPageScroll((e) => {
  scrollTop.value = e.scrollTop
})
</script>

<template>
  <RebornSticky :scroll-top="scrollTop" :offset-top="0">
    <view class="h-[80rpx] flex items-center bg-primary px-[24rpx] text-white">
      吸顶标题
    </view>
  </RebornSticky>
</template>
```

## API

### Props

| 属性名               | 类型                               | 默认值      | 平台        | 描述                                                                                     |
| :------------------- | :--------------------------------- | :---------- | :---------- | :--------------------------------------------------------------------------------------- |
| `offsetTop`          | `number`                           | `0`         | 通用        | 吸顶偏移量，单位 px。                                                                     |
| `zIndex`             | `number`                           | `100`       | 通用        | 吸附后的层级。                                                                            |
| `scrollTop`          | `number`                           | `0`         | 仅 UniApp   | 当前页面滚动距离，通常通过 `onPageScroll` 传入；不传则无法判断吸附。                      |
| `isNeedNavbarHeight` | `boolean`                          | `true`      | 通用        | 是否在吸顶偏移上叠加导航栏高度（主要影响 UniApp H5 端）。                                 |
| `navbarHeight`       | `number`                           | `44`        | 通用        | 导航栏高度 (px)。UniApp 端默认 `44`，Web 端默认 `0`。                                     |
| `stickyTriggerLead`  | `number`                           | `0`         | 仅 UniApp   | 吸顶判定提前量 (px)，用于根节点上方还有标题等导致测量 top 与实际吸顶点不对齐的场景。      |
| `target`             | `string \| HTMLElement`            | `undefined` | 仅 Web      | 目标容器（CSS 选择器或 DOM 元素）。吸附元素始终保持在该容器内，越界后停靠在容器边缘。     |
| `sticky`             | `boolean`                          | `true`      | 仅 Web      | 手动控制是否启用吸附；设为 `false` 时内容恢复普通文档流。                                 |
| `position`           | `'top' \| 'bottom'`                | `'top'`     | 仅 Web      | 固定位置：`top` 吸顶，`bottom` 吸底。                                                     |
| `bottomBoundary`     | `'parent' \| 'target'`             | `'parent'`  | 仅 Web      | 吸底越界后的边界基准：`parent` 保持旧逻辑，`target` 按目标容器底部向上 `offsetTop` 停靠。 |
| `bottomPlaceholder`  | `'auto' \| 'keep' \| 'none'`       | `'auto'`    | 仅 Web      | 吸底固定后的占位策略：`auto` 保持旧逻辑，`keep` 保留高度，`none` 不参与页面排版。         |
| `ui`                 | `{ wrapper?: string, content?: string }` | `undefined` | 仅 Web | 覆盖内部节点类名，键位见下方「自定义样式（ui）」。                                        |

### Emits

| 事件名   | 回调参数                                                          | 平台   | 描述                                                             |
| :------- | :---------------------------------------------------------------- | :----- | :--------------------------------------------------------------- |
| `change` | `(isSticky: boolean)`                                             | 仅 Web | 吸顶/吸底状态切换时触发，`isSticky` 为切换后的固定状态。         |
| `resize` | `(rect: { height, width, left, top })`                            | 仅 Web | 组件尺寸或位置变化时触发，`rect` 为最新的宽高与页面绝对位置 (px)。 |

### Slots

| 插槽名    | 作用域参数               | 描述                                             |
| :-------- | :----------------------- | :----------------------------------------------- |
| `default` | `{ isSticky: boolean }`  | 自定义内容，`isSticky` 表示当前是否处于吸附状态。 |

### Expose

| 名称          | 类型/签名                                  | 平台      | 描述                                                                 |
| :------------ | :----------------------------------------- | :-------- | :------------------------------------------------------------------- |
| `isSticky`    | `ComputedRef<boolean>`                     | 通用      | 当前是否处于吸附状态。                                               |
| `getRect`     | `() => void`                               | 仅 UniApp | 重新测量组件的位置与尺寸并更新内部 rect，内容高度变化后可手动调用。  |
| `height`      | `ComputedRef<number>`                      | 仅 Web    | 组件当前高度。                                                       |
| `position`    | `ComputedRef<'top' \| 'bottom'>`           | 仅 Web    | 固定位置方向。                                                       |
| `rect`        | `{ height, width, left, top }`             | 仅 Web    | 位置和尺寸矩形对象。                                                 |
| `forceUpdate` | `() => Promise<void>`                      | 仅 Web    | 强制刷新尺寸信息，用于处理 `v-if` 切换等导致的 DOM 变化。            |

### 自定义样式（ui）

`ui` 属性（仅 Web）按以下键覆盖对应节点类名：

| 键名      | 说明                                                       |
| :-------- | :--------------------------------------------------------- |
| `wrapper` | 外层占位容器，吸附时保持文档流占位，防止页面跳动。         |
| `content` | 实际内容容器，吸附时切换为 `fixed` / `absolute` 定位。     |

## 注意事项

- UniApp 页面滚动场景必须把 `onPageScroll` 的滚动距离传给 `scrollTop`，否则无法正确判断吸附。
- `isNeedNavbarHeight` 默认 `true`：UniApp H5 端会自动叠加 `navbarHeight`（默认 44px）作为吸顶偏移；Web 端 `navbarHeight` 默认 0，页面存在固定导航栏时需自行传入。
- UniApp 端组件初始位置只在挂载时测量一次，若之后在组件上方动态插入内容改变了它的位置，吸顶判定会不准，可通过 ref 调用 `getRect` 重新测量。
- Web 端吸底模式下 `bottomPlaceholder` 为 `keep` / `none` 时，内容恒定以 overlay（脱离文档流）方式渲染，`isSticky` 仅作为样式信号；`none` 完全不占纵向空间，`keep` 恒定保留原高度。
- Web 端子内容含 `reborn-collapse` 展开/收起动画时，组件会临时冻结吸顶判定约 400ms，避免动画期间状态抖动；此为内部行为，无需干预。
- `target` 指定后，滚动越过目标容器底部时元素会停靠在容器边缘（`absolute` 定位），不会跟随视口继续滚动。
