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

## CSS 变量

- `--duration`：控制动画时长。
- `--gap`：控制重复项之间的间距。

#credits

- 灵感来自 [Magic UI](https://magicui.design/docs/components/marquee)。

::
