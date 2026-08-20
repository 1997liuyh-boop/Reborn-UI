---
title: 走马灯 Carousel
description: 用于循环展示多个内容项的轮播组件，支持多项显示、卡片模式与纵向布局，仅 web 端。
category: 导航
tags: [css, tailwind, carousel, slider, motion]
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---


::ComponentViewer{demoFile="RebornCarouselDemo.vue" config="RebornCarouselConfig" componentId="reborn-carousel" :componentFiles='["RebornCarousel.vue", "reborn-carousel.config.ts"]'}
::

## 简介

Carousel 是仅 web 端的轮播组件，基于原生 CSS Scroll Snap 实现，不依赖第三方轮播库。默认插槽里的每个直接子节点即一张幻灯片，支持一屏多项（`slidesPerview`，注意该拼写为源码真实拼写）、无限循环（`loop`）、自动播放（`autoplay`）、卡片模式（`type="card"`）、纵向滚动与缩略图联动（`thumbs`），并按 `breakpoints` 做响应式配置。`v-model` 绑定当前激活索引，组件对外暴露 `next` / `prev` / `goTo` 方法可编程控制。

适用场景：

- 首页 banner、图片或卡片列表的自动轮播展示。
- 需要一屏显示多项（`slidesPerview`）并按断点响应式调整的横向滑动列表。
- 需要缩略图联动（`thumbs`）、自定义箭头/指示器插槽的轮播场景。

不适用场景：

- uniapp 端不可用（仅 web），小程序轮播需另行实现。
- 苹果卡片风格的展示型轮播，改用 `apple-card-carousel`。
- 轮播用户评价文案，改用 `testimonial-slider` 或 `animated-testimonials`。

## 用法

### 基础用法（自动播放与循环）

默认插槽的每个直接子节点即一张幻灯片；`loop` 开启无缝循环，`autoplay` 传 `true`（默认 3000ms）或 `{ delay }` 配置间隔，`pagination` 开启指示器。

```vue
<template>
  <RebornCarousel
    v-model="active"
    loop
    :autoplay="{ delay: 4000 }"
    :pagination="{ clickable: true, type: 'dot' }"
    height="240px"
  >
    <img v-for="src in images" :key="src" :src="src" class="h-full w-full object-cover" />
  </RebornCarousel>
</template>
```

### 一屏多项与响应式断点

`slidesPerview` 控制一屏显示张数，`spaceBetween` 控制间距；`breakpoints` 以最小视口宽度为键覆盖断点配置。

```vue
<template>
  <RebornCarousel
    :slides-perview="1"
    :space-between="12"
    :breakpoints="{
      640: { slidesPerview: 2 },
      1024: { slidesPerview: 3, spaceBetween: 20 },
    }"
  >
    <div v-for="item in cards" :key="item.id" class="rounded-xl bg-neutral-100 p-4">
      {{ item.title }}
    </div>
  </RebornCarousel>
</template>
```

### 缩略图联动

`thumbs` 开启缩略图面板，`position` 支持 `top` / `bottom` / `left` / `right`，缩略图内容自动取主插槽对应项的缩小版。

```vue
<template>
  <RebornCarousel
    loop
    height="320px"
    :thumbs="{ position: 'bottom', arrow: 'hover', loop: true }"
  >
    <img v-for="src in images" :key="src" :src="src" class="h-full w-full object-cover" />
  </RebornCarousel>
</template>
```

## API

| 属性名              | 类型                                                                          | 默认值         | 描述                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `modelValue`        | `number \| null`                                                              | `null`         | 当前激活项索引，支持 `v-model`。未传时使用内部状态。                                                 |
| `slidesPerview`     | `number \| "auto"`                                                            | `1`            | 一屏展示的项目数量；设为 `"auto"` 时根据子项自身宽高决定可见项。                                     |
| `spaceBetween`      | `number`                                                                      | `0`            | 轮播项之间的间距，单位 `px`。                                                                        |
| `centeredSlides`    | `boolean`                                                                     | `false`        | 是否让当前激活项居中显示。                                                                           |
| `loop`              | `boolean`                                                                     | `false`        | 是否启用循环切换。                                                                                   |
| `autoplay`          | `boolean \| { delay?: number }`                                               | `false`        | 自动播放配置；传 `true` 时使用默认间隔 `3000ms`。                                                    |
| `pagination`        | `null \| { clickable?: boolean, type?: 'line' \| 'dot' \| 'fraction' \| 'button' }` | `null`         | 指示器配置；支持线条、圆点、分数和按钮四种类型。                                                     |
| `trigger`           | `"hover" \| "click"`                                                          | `"hover"`      | 指示器切换触发方式。                                                                                 |
| `indicatorPosition` | `"inside" \| "outside" \| "none"`                                             | `"inside"`     | 指示器位置。                                                                                         |
| `indicatorOffset`   | `number`                                                                      | `undefined`    | 指示器偏移量 (px)；垂直模式下为侧边间距，水平模式下为底部/外部间距。                                 |
| `color`             | `"primary" \| ... \| "neutral"`                                               | `"primary"`    | 轮播的主题颜色，影响 active 状态下的指示器和图标颜色。                                               |
| `arrow`             | `"hover" \| "always" \| "never"`                                              | `"hover"`      | 箭头显示策略。                                                                                       |
| `motionBlur`        | `boolean`                                                                     | `false`        | 是否对非激活项增加动态模糊效果。                                                                     |
| `height`            | `string`                                                                      | `"auto"`       | 轮播容器高度；设为 `"auto"` 时随内容自适应。                                                         |
| `type`              | `"default" \| "card"`                                                         | `"default"`    | 展示类型；`card` 模式会强化中间项层级，并按子项自身尺寸布局。                                        |
| `direction`         | `"horizontal" \| "vertical"`                                                  | `"horizontal"` | 轮播方向。                                                                                           |
| `initialSlide`      | `number`                                                                      | `0`            | 初始激活项索引；当 `modelValue` 为空时生效。                                                         |
| `breakpoints`       | `Record<number, BreakpointConfig>`                                            | `{}`           | 响应式配置；可在断点中覆盖 `slidesPerview`、`spaceBetween`、`type`、`direction` 等参数。             |
| `grabCursor`        | `boolean`                                                                     | `false`        | 是否启用抓取光标。                                                                                   |
| `autoSize`          | `boolean`                                                                     | `false`        | 是否不强行将幻灯片等宽拉伸，完全使用子项自身的内在宽高。                                             |
| `thumbs`            | `null \| { position?: 'top' \| 'bottom' \| 'left' \| 'right', loop?: boolean, arrow?: 'hover' \| 'always' \| 'never' }` | `null`         | 联动缩略图面板配置；为 `null` 时不显示缩略图。                                                       |
| `class`             | `any`                                                                         | `-`            | 追加到根节点的自定义类名。                                                                           |
| `ui`                | `object`                                                                      | `{}`           | 细粒度样式覆盖对象，用于重写各个 UI 区域的样式。                                                     |

### BreakpointConfig

| 属性名              | 类型                              | 描述                           |
| ------------------- | --------------------------------- | ------------------------------ |
| `slidesPerview`     | `number \| "auto"`                | 覆盖当前断点下的一屏显示数量。 |
| `spaceBetween`      | `number`                          | 覆盖当前断点下的间距。         |
| `centeredSlides`    | `boolean`                         | 覆盖当前断点下的居中策略。     |
| `arrow`             | `"hover" \| "always" \| "never"`  | 覆盖箭头显示策略。             |
| `indicatorPosition` | `"inside" \| "outside" \| "none"` | 覆盖指示器位置。               |
| `motionBlur`        | `boolean`                         | 覆盖动态模糊效果。             |
| `height`            | `string`                          | 覆盖容器高度。                 |
| `type`              | `"default" \| "card"`             | 覆盖展示类型。                 |
| `direction`         | `"horizontal" \| "vertical"`      | 覆盖轮播方向。                 |

## Events

| 事件名              | 参数     | 描述                       |
| ------------------- | -------- | -------------------------- |
| `update:modelValue` | `number` | 当前激活项索引变化时触发。 |
| `change`            | `number` | 轮播项切换完成后触发。     |

## Slots

| 插槽名       | Props                                              | 描述                                                   |
| ------------ | -------------------------------------------------- | ------------------------------------------------------ |
| `default`    | `-`                                                | 轮播内容插槽，可放任意卡片、图片、文本块或自定义布局。 |
| `prev`       | `{ prev: Function }`                               | 自定义上一页箭头。                                     |
| `next`       | `{ next: Function }`                               | 自定义下一页箭头。                                     |
| `indicators` | `{ activeIndex: number, count: number, goTo: Function }` | 自定义指示器区域。                                     |

## Expose

| 方法名 | 参数              | 描述                                                                                                 |
| ------ | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `prev` | `-`               | 平滑滚动切换到上一张；`loop` 下可从首张无缝回到末张，非 `loop` 已在首张时无操作；触发 `change` 并重置自动播放计时。 |
| `next` | `-`               | 平滑滚动切换到下一张；`loop` 下可从末张无缝回到首张，非 `loop` 已在末张时无操作；触发 `change` 并重置自动播放计时。 |
| `goTo` | `(index: number)` | 带平滑滚动动画跳转到指定索引（从 0 起，`loop` 下越界自动取模）；同步 `v-model`、触发 `change` 并重置自动播放计时。 |

## UI 对象

`ui` 支持覆盖以下区域：

- `wrapper`
- `root`
- `viewport`
- `track`
- `slide`
- `slideInner`
- `slideActive`
- `slideInactive`
- `arrowGroup`
- `arrow`
- `indicatorWrapper`
- `indicators`
- `indicator`
- `indicatorActive`
- `indicatorInactive`

## 使用注意事项

- 当 `centeredSlides=true` 且 `slidesPerview` 为数字时，首尾项目会保留部分预览，这是预期行为。
- 如果你希望卡片模式拥有更明显的“舞台感”，建议使用 `slidesPerview="auto"` 并为子项设置固定宽度。
- 当 `type="card"` 或 `slidesPerview="auto"` 时，组件不会参与子项宽高计算，建议直接在插槽内容上声明宽度。
- `height="auto"` 更适合内容高度差异较大的横向轮播；纵向轮播通常建议给出明确高度。
- `trigger="hover"` 更适合桌面端；如果场景兼顾触屏，建议使用 `click`。

## 平台差异与注意事项

- 当前 Web 版本基于原生滚动和组件内部状态实现，不依赖第三方轮播库。
- Web 端支持鼠标悬停显示箭头、悬停触发指示器等交互；如果未来补充 UniApp 版本，这类交互需按触屏语义调整。
- 如果后续需要做跨端统一，建议优先保持以下参数命名一致：`slidesPerview`、`spaceBetween`、`loop`、`autoplay`、`direction`、`initialSlide`。
