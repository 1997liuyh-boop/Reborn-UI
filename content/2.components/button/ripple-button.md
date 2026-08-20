---
title: 波纹按钮
description: 用于点击时产生可自定义颜色与时长波纹反馈的按钮组件。
category: 按钮
tags: [css, tailwind, button, magic-ui]
---

::ComponentViewer{demoFile="RippleButtonDemo.vue" config="RippleButtonConfig" componentId="ripple-button" :componentFiles='["RippleButton.vue"]'}

#credits

- 灵感来自 [Magic UI 的 Ripple Button](https://magicui.design/docs/components/ripple-button) 组件。
- 感谢 [kalix127](https://github.com/kalix127) 对该组件的移植。

::

## 简介

Ripple Button 在每次点击时以点击坐标为圆心生成一圈向外扩散并淡出的波纹（Material 风格涟漪），波纹直径取按钮宽高的较大值，动画结束后自动移除。波纹颜色由 `rippleColor` 控制、扩散时长由 `duration` 控制；按钮内容经默认插槽传入，点击通过 `click` 事件抛出。仅 Web 端可用。

适用场景：

- 落地页 CTA 需要点击波纹反馈动效时。
- 需要 Material 风格点击涟漪的按钮。
- 需要自定义波纹颜色（`rippleColor`）与动画时长的营销按钮。

不适用场景：

- 常规业务表单按钮，改用 `reborn-button`（同时支持 Web 与 UniApp）。
- 需要持续闪光动画吸引注意，改用 `shimmer-button`。
- 需要渐变边框动效，改用 `gradient-button`。

## 用法

### 基础用法

内容经默认插槽传入，点击监听组件声明的 `click` 事件：

```vue
<template>
  <RippleButton @click="onClick">Click me!</RippleButton>
</template>

<script setup lang="ts">
function onClick(event: MouseEvent) {
  console.log("clicked at", event.clientX, event.clientY);
}
</script>
```

### 自定义波纹

`rippleColor` 支持任意 CSS 颜色（默认浅蓝 `#ADD8E6`，深色按钮上建议换成半透明白），`duration` 为波纹扩散时长（毫秒）：

```vue
<template>
  <RippleButton
    ripple-color="rgba(255, 255, 255, 0.6)"
    :duration="900"
    class="bg-zinc-900 text-white"
  >
    深色波纹按钮
  </RippleButton>
</template>
```

## API

### Props

| 属性名        | 类型     | 默认值      | 描述                                             |
| ------------- | -------- | ----------- | ------------------------------------------------ |
| `class`       | `string` | -           | 用于自定义样式的额外 CSS 类。                    |
| `rippleColor` | `string` | `"#ADD8E6"` | 波纹效果的颜色，支持任意 CSS 颜色值。            |
| `duration`    | `number` | `600`       | 波纹扩散动画的持续时间（毫秒）。                 |

### Emits

| 事件名  | 回调参数              | 描述                       |
| ------- | --------------------- | -------------------------- |
| `click` | `(event: MouseEvent)` | 点击按钮时触发。           |

### Slots

| 插槽名    | 描述                                     |
| --------- | ---------------------------------------- |
| `default` | 按钮显示内容，渲染在波纹层之上。         |

## 注意事项

- 仅 Web 端可用。
- `duration` 单位为毫秒（默认 `600`），控制波纹扩散时长。
- 波纹默认颜色为浅蓝 `#ADD8E6`，深色背景下需自行调整 `rippleColor`（如半透明白）。
- 波纹以点击位置为圆心、按钮宽高较大值为直径，依赖 `overflow-hidden` 裁剪；用 `class` 改写样式时不要移除溢出裁剪，否则波纹会溢出按钮。
- 组件无 `disabled` 处理，禁用态需自行控制（如加 `pointer-events-none` 类）。
