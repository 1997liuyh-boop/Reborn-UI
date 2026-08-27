---
title: BackTop
description: 用于长页面滚动超过阈值后显示返回顶部按钮的跨端导航组件。
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
uniapp 端此组件依赖页面的滚动事件来控制显示/隐藏。你需要：
1. 在父组件中监听 `onPageScroll`。
2. 将 `scrollTop` 传递给组件的 `:scroll-top` 属性。

```typescript
const scrollTop = ref(0)
onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
})
```

Web 端组件默认自动监听 `window` 滚动，无需传入 `scrollTop`；传入后则以传入值为准。
::

::ComponentViewer{demoFile="RebornBackTopDemo.vue" config="RebornBackTopConfig" componentId="reborn-back-top" :componentFiles='["RebornBackTop.vue", "reborn-back-top.config.ts"]' :uniappFiles='["RebornBackTop.vue", "reborn-back-top.config.ts"]'}
::

## 简介

BackTop 是双端可用的返回顶部按钮：页面滚动距离超过 `threshold`（默认 300px）后淡入显示，点击后平滑滚回顶部并触发 `click` 事件。uniapp 端需通过 `onPageScroll` 把 `scrollTop` 传入组件；web 端默认自动监听 `window` 滚动。支持预设色彩与尺寸，TabBar 页面可用 `isTab` 自动抬高避让。

适用场景：

- 长列表、长文章页面需要一键回到顶部时。
- uniapp TabBar 页面需要按钮自动抬高避开 TabBar（`isTab`）时。
- 需要预设色彩（`primary` / `success` 等）与尺寸（`sm` / `md` / `lg`）的回顶按钮。

不适用场景：

- 需要可拖拽的悬浮入口，改用 `reborn-affix`。
- 常驻的悬浮操作按钮，改用 `reborn-fab`。

## 用法

### 基础用法（uniapp）

页面里监听 `onPageScroll` 并把 `scrollTop` 传给组件；滚动超过 `threshold` 后按钮出现，点击自动回到顶部。

```vue
<script setup lang="ts">
import { ref } from "vue";
import { onPageScroll } from "@dcloudio/uni-app";

const scrollTop = ref(0);
onPageScroll((e) => {
  scrollTop.value = e.scrollTop;
});
</script>

<template>
  <RebornBackTop :scroll-top="scrollTop" :threshold="300" color="primary" size="md" />
</template>
```

### TabBar 页面与自定义内容

`isTab` 为 `true` 时按钮自动抬高 50px 避开 TabBar；默认插槽可完全替换按钮内容。

```vue
<template>
  <RebornBackTop :scroll-top="scrollTop" is-tab @click="onBackTop">
    <view class="h-[80rpx] w-[80rpx] rounded-full bg-black/70 text-center leading-[80rpx]">
      <text class="text-24 text-white">顶部</text>
    </view>
  </RebornBackTop>
</template>
```

## API

### Props

| 属性名     | 类型      | 默认值    | 描述                                                                 |
| ---------- | --------- | --------- | -------------------------------------------------------------------- |
| `scrollTop`| `number`  | `0`       | 当前页面的滚动距离。uniapp 端必须通过 `onPageScroll` 传入；web 端不传时自动监听 `window` 滚动。 |
| `threshold`| `number`  | `300`     | 滚动多少距离后显示回到顶部按钮。 |
| `bottom`   | `number`  | `20`      | 底部距离 (px)。 |
| `duration` | `number`  | `300`     | 滚动回顶部的动画时长 (ms)。web 端使用 CSS 平滑滚动，此参数仅作兼容保留。 |
| `isTab`    | `boolean` | `false`   | 是否是 TabBar 页面。如果是，组件会自动抬高 50px 以避开 TabBar。 |
| `safeArea` | `boolean` | `true`    | 是否适配安全区域（避让底部黑条）。 |
| `showProgress` | `boolean` | `false` | 是否在按钮边缘展示滚动进度环。**仅 web 端可用**；传了自定义默认插槽时不生效。 |
| `scrollRange` | `number` | `-`      | 可滚动总距离 (px)，用于换算进度百分比。不传时按 `document` 实测（文档高度 − 视口高度）；用 `scrollTop` 接管滚动数值时应一并传入。**仅 web 端可用**。 |
| `color`    | `string`  | `primary` | 按钮颜色。可选值：`primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`。 |
| `size`     | `string`  | `md`      | 按钮大小。可选值：`sm`, `md`, `lg`。 |
| `ui`       | `object`  | `{}`      | 覆盖各个 slots 的样式，见下方「自定义样式（ui）」。 |

### Emits

| 事件名  | 回调参数 | 说明                                                                 |
| ------- | -------- | -------------------------------------------------------------------- |
| `click` | `-`      | 点击返回顶部按钮时触发；组件已先发起回到顶部滚动，无需在回调中重复处理。 |

### Slots

| 名称      | 描述   |
| --------- | ------ |
| `default` | 自定义按钮内容，替换默认的圆形箭头按钮。 |

## 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的类名：

| 键名      | 描述   |
| --------- | ------ |
| `wrapper` | 外层容器，负责定位和动画。 |
| `base`    | 按钮主体，包含背景色和圆角。 |
| `icon`    | 所有的图标或文字内容。 |
| `progress` | 进度环 SVG 根节点，负责绝对定位与起始角度（仅 `showProgress` 开启时渲染）。 |
| `progressTrack` | 进度环底环（未走完的那一圈）。 |
| `progressBar` | 进度环本体，长度随滚动进度增长。 |

## 注意事项

- web 与 uniapp 双端可用；uniapp 端必须通过 `onPageScroll` 把 `scrollTop` 传入组件，否则按钮不会随滚动显示。
- `threshold` 默认 300px，滚动超过该距离才显示按钮。
- `isTab` 为 `true` 时组件自动抬高 50px 避开 TabBar；`safeArea` 默认开启底部安全区适配（web 端安全区高度视为 0）。
- `duration` 仅 uniapp 端生效；web 端使用 CSS `smooth` 平滑滚动，动画时长由浏览器决定。
- 自定义按钮外观用默认插槽，细粒度样式覆盖用 `ui` 对象（`wrapper` / `base` / `icon` / `progress` / `progressTrack` / `progressBar`）。
- `showProgress` 进度环画在**内置按钮内部**，一旦传了自定义默认插槽，按钮结构由插槽接管，进度环不会渲染。
- 进度环目前**仅 web 端可用**：默认按 `document` 实测总高度（并用 `ResizeObserver` 观察文档高度变化，图片/懒加载撑高页面后会自动重算）；uniapp 端只拿得到 `scrollTop`、缺少总高来源，需另用 `createSelectorQuery` 测量，暂未实现。
- 用 `scrollTop` 接管滚动数值时请一并传 `scrollRange`，否则进度百分比会按错误的总距离换算。
