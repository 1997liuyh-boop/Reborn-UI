---
title: Tooltip 文字提示
description: 用于鼠标悬停时在元素旁显示文字提示气泡的组件，仅 web 端。
category: 导航
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornTooltipDemo.vue" config="RebornTooltipConfig" componentId="reborn-tooltip" :componentFiles='["RebornTooltip.vue", "reborn-tooltip.config.ts"]' :uniappFiles='["RebornTooltip.vue", "reborn-tooltip.config.ts"]'}
::

## 简介

Tooltip 是 web 端的文字提示气泡：把触发元素放进 `default` 插槽，鼠标悬停（经 `openDelay` 延时）后在其旁边弹出提示。短文本用 `content` 属性传入；富内容用 `content` 插槽承载且优先级更高。提示层通过 `Teleport` 挂载到 body，支持 12 种 `placement` 定位、`dark` / `light` 两种主题，超出视口时自动钳制回可视区域，按 Escape 可关闭。

适用场景：

- 悬停解释图标、按钮或缩写的含义（`content` 属性传入短文本）。
- 需要控制提示的方向与主题（`placement`、`effect` dark / light）。
- 需要受控显示（`v-model:open`）或用 `content` 插槽自定义提示内容。

不适用场景：

- 承载可交互的复杂内容，改用 `reborn-popover`。
- uniapp 端项目：仅 web 实现，无 uniapp 版本。

## 用法

### 基础用法

`content` 指定提示文本，`placement` 指定弹出位置（默认 `bottom`）。

```vue
<template>
  <RebornTooltip content="删除后不可恢复" placement="top">
    <RebornButton color="error" variant="outlined">删除</RebornButton>
  </RebornTooltip>
</template>
```

### 主题、箭头与延时

`effect` 切换 `dark`（默认）/ `light` 主题；`arrow` 控制箭头显隐；`openDelay` / `closeDelay` 调整显隐延时（默认各 100ms）。

```vue
<template>
  <RebornTooltip content="浅色主题" effect="light">
    <RebornButton variant="outlined">Light</RebornButton>
  </RebornTooltip>

  <RebornTooltip content="无箭头，延时 500ms" :arrow="false" :open-delay="500">
    <RebornButton variant="outlined">Delay</RebornButton>
  </RebornTooltip>
</template>
```

### 自定义内容与受控显示

`content` 插槽承载富内容（优先于 `content` 属性）；绑定 `v-model:open` 可受控显隐，也可通过模板 ref 调用暴露的 `open()` / `close()`。

```vue
<script setup lang="ts">
import { ref } from "vue";

const visible = ref(false);
</script>

<template>
  <RebornTooltip v-model:open="visible" placement="right">
    <template #content>
      按 <kbd>Ctrl</kbd> + <kbd>S</kbd> 保存
    </template>
    <RebornButton>保存</RebornButton>
  </RebornTooltip>
</template>
```

## API

### Props

| 属性名         | 说明                                     | 类型                | 默认值     |
| -------------- | ---------------------------------------- | ------------------- | ---------- |
| `content`      | 提示内容                                 | `string`            | -          |
| `placement`    | 出现方向与对齐方式                       | `TooltipPlacement`  | `'bottom'` |
| `effect`       | 主题效果                                 | `'dark' \| 'light'` | `'dark'`   |
| `arrow`        | 是否显示箭头                             | `boolean`           | `true`     |
| `openDelay`    | 打开延时（毫秒）                         | `number`            | `100`      |
| `closeDelay`   | 关闭延时（毫秒）                         | `number`            | `100`      |
| `disabled`     | 是否禁用                                 | `boolean`           | `false`    |
| `v-model:open` | 受控显示状态；不绑定时组件内部自管理显隐 | `boolean`           | -          |

### TooltipPlacement

- `top` / `top-start` / `top-end`
- `bottom` / `bottom-start` / `bottom-end`
- `left` / `left-start` / `left-end`
- `right` / `right-start` / `right-end`

### Emits

| 事件名        | 参数               | 说明                                  |
| ------------- | ------------------ | ------------------------------------- |
| `open`        | -                  | 提示层显示后触发（经 openDelay 延时） |
| `close`       | -                  | 提示层关闭后触发（经 closeDelay 延时） |
| `update:open` | `(value: boolean)` | open 变化时触发（v-model 同步）       |

### Slots

| 插槽名    | 说明                                      |
| --------- | ----------------------------------------- |
| `default` | 触发提示的元素                            |
| `content` | 自定义提示内容，优先级高于 `content` 属性 |

### Expose

| 方法名    | 说明                                                    |
| --------- | ------------------------------------------------------- |
| `open()`  | 手动打开提示层（仍受 `disabled` 与 `openDelay` 约束）   |
| `close()` | 手动关闭提示层（经 `closeDelay` 延时后隐藏）            |

## 注意事项

- 仅 web 端可用。
- 触发元素放在 `default` 插槽内；`content` 插槽优先级高于 `content` 属性。
- `openDelay` / `closeDelay` 默认各 100ms；`effect` 默认 `'dark'`，`placement` 默认 `'bottom'`。
- `disabled` 为 `true` 或既无 `content` 属性也无 `content` 插槽时不会弹出；`content` 属性中途变为空会立即关闭提示。
- 提示层 `Teleport` 到 body 渲染，位置超出视口时自动钳制回可视区域，箭头仍会尽量指向触发元素中心。
- 显示期间按 Escape 可关闭；鼠标移入提示层本身不会关闭（可选中提示文本）。
