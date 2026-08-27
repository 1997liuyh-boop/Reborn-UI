---
title: 跑马灯
description: 用于横向或纵向无限循环滚动内容的跑马灯组件，支持悬停暂停与渐隐遮罩。
category: 杂项
tags: [css, tailwind, magic-ui]
badge: New
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornMarqueeDemo.vue" config="RebornMarqueeConfig" componentId="reborn-marquee" :componentFiles='["RebornMarquee.vue", "reborn-marquee.config.ts"]'}

#api

## API

| 属性名         | 类型                         | 默认值         | 说明                                                              |
| -------------- | ---------------------------- | -------------- | ----------------------------------------------------------------- |
| `class`        | `string`                     | `''`           | 应用于根容器的自定义类名。                                        |
| `reverse`      | `boolean`                    | `false`        | 反转滚动方向。                                                    |
| `pauseOnHover` | `boolean`                    | `false`        | 鼠标悬停时暂停动画。                                              |
| `orientation`  | `'horizontal' \| 'vertical'` | `'horizontal'` | 设置滚动方向。                                                    |
| `vertical`     | `boolean`                    | `false`        | `orientation="vertical"` 的兼容别名，传入后优先生效。             |
| `repeat`       | `number`                     | `4`            | 重复渲染插槽内容的次数。                                          |
| `overlay`      | `boolean`                    | `true`         | 是否显示两端的渐隐遮罩。                                          |
| `ui`           | `object`                     | `{}`           | 覆盖 `root`、`content`、`overlayStart`、`overlayEnd` 等插槽类名。 |

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件仅 Web 端提供：

| 键名           | 说明                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`         | 根容器。默认 `relative flex overflow-hidden`，`--duration` / `--gap` 两个 CSS 变量定义在这里，横向时补 `w-full`，纵向时改 `flex-col`。改这里可调整整体尺寸、圆角与滚动速度。 |
| `content`      | 内容轨道，按 `repeat` 次数重复渲染，动画（`animate-marquee` / `animate-marquee-vertical`）作用在它身上。`pauseOnHover` 的暂停类也叠加在这里。 |
| `overlayStart` | 起始端渐隐遮罩（横向为左侧、纵向为顶部）。仅 `overlay` 为 `true` 时渲染，默认宽/高 `24`、`pointer-events-none` 不拦截交互；换底色时需连同 `from-*` / `via-*` 一起覆盖。 |
| `overlayEnd`   | 结束端渐隐遮罩（横向为右侧、纵向为底部），其余同 `overlayStart`。                                                                             |

```vue
<template>
  <RebornMarquee
    :ui="{
      root: 'rounded-xl [--duration:20s]',
      content: 'items-stretch',
      overlayStart: 'w-12 from-gray-1',
      overlayEnd: 'w-12 from-gray-1',
    }"
  >
    <div v-for="i in 5" :key="i" class="px-4">条目 {{ i }}</div>
  </RebornMarquee>
</template>
```

## CSS 变量

- `--duration`：控制动画时长。
- `--gap`：控制重复项之间的间距。

#credits

- 灵感来自 [Magic UI](https://magicui.design/docs/components/marquee)。

::
