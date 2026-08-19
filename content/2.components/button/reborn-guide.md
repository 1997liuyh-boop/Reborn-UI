---
title: 引导 Guide
description: 用于按步骤高亮页面元素并弹出说明的新手引导组件，仅 web 端。
category: 反馈
tags: [css, tailwind, guide, tour]
badge: New
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornGuideDemo.vue" config="RebornGuideConfig" componentId="reborn-guide" :componentFiles='["RebornGuide.vue", "reborn-guide.config.ts"]'}
::

## Props 属性

| 属性名              | 类型                  | 默认值    | 说明                        | 必传 |
| :------------------ | :-------------------- | :-------- | :-------------------------- | :--- |
| `v-model:current`   | `number`              | `-1`      | 当前步骤索引，`-1` 隐藏引导 | N    |
| `steps`             | `GuideStep[]`         | `[]`      | 引导步骤数组                | Y    |
| `mode`              | `'popup' \| 'dialog'` | `'popup'` | 引导框类型                  | N    |
| `hideCounter`       | `boolean`             | `false`   | 隐藏计数器                  | N    |
| `hidePrev`          | `boolean`             | `false`   | 隐藏上一步按钮              | N    |
| `hideSkip`          | `boolean`             | `false`   | 隐藏跳过按钮                | N    |
| `finishButtonProps` | `ButtonProps`         | `{}`      | 完成按钮属性                | N    |
| `nextButtonProps`   | `ButtonProps`         | `{}`      | 下一步按钮属性              | N    |
| `prevButtonProps`   | `ButtonProps`         | `{}`      | 上一步按钮属性              | N    |
| `skipButtonProps`   | `ButtonProps`         | `{}`      | 跳过按钮属性                | N    |
| `showOverlay`       | `boolean`             | `true`    | 是否出现遮罩层              | N    |
| `highlightPadding`  | `number`              | `8`       | 高亮框内边距                | N    |
| `zIndex`            | `number`              | `999999`  | 提示框层级                  | N    |

## Events 事件

| 事件名            | 参数                                                                         | 说明               |
| :---------------- | :--------------------------------------------------------------------------- | :----------------- |
| `change`          | `(current: number, context?: { e: MouseEvent, total: number })`              | 当前步骤变化时触发 |
| `finish`          | `(context: { e: MouseEvent, current: number, total: number })`               | 点击完成按钮时触发 |
| `next-step-click` | `(context: { e: MouseEvent, next: number, current: number, total: number })` | 点击下一步时触发   |
| `prev-step-click` | `(context: { e: MouseEvent, prev: number, current: number, total: number })` | 点击上一步时触发   |
| `skip`            | `(context: { e: MouseEvent, current: number, total: number })`               | 点击跳过按钮时触发 |

## Slots 插槽

| 插槽名    | 插槽参数                             | 说明         |
| :-------- | :----------------------------------- | :----------- |
| `counter` | `{ current: number, total: number }` | 自定义计数器 |

## GuideStep 步骤类型

| 属性名             | 类型                               | 默认值     | 说明                                | 必传 |
| :----------------- | :--------------------------------- | :--------- | :---------------------------------- | :--- |
| `element`          | `string \| () => Element \| null`  | -          | 高亮的节点选择器或函数              | Y    |
| `body`             | `string`                           | -          | 步骤提示框内容                      | N    |
| `title`            | `string`                           | -          | 步骤标题                            | N    |
| `placement`        | `string`                           | `'bottom'` | 引导框位置（12种popup + 2种dialog） | N    |
| `offset`           | `[number\|string, number\|string]` | `[0, 0]`   | 相对 placement 的偏移               | N    |
| `mode`             | `'popup' \| 'dialog'`              | -          | 步骤级模式覆盖                      | N    |
| `highlightPadding` | `number`                           | -          | 步骤级高亮内边距                    | N    |
| `showOverlay`      | `boolean`                          | -          | 步骤级遮罩覆盖                      | N    |
