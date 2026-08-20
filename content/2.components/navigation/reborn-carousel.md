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

#api

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

| 方法名 | 参数              | 描述             |
| ------ | ----------------- | ---------------- |
| `prev` | `-`               | 切换到上一项。   |
| `next` | `-`               | 切换到下一项。   |
| `goTo` | `(index: number)` | 跳转到指定索引。 |

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

::
