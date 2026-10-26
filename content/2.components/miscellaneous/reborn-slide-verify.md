---
title: 滑块验证
description: 用于人机校验的滑块验证组件，向右拖动超过阈值即通过，支持失败回弹与自动重置。
category: 表单与输入
platform: uniapp
tags: [uniapp, form, verification]
---

::ComponentViewer{demoFile="RebornSlideVerifyDemo.vue" config="RebornSlideVerifyConfig" componentId="reborn-slide-verify" :componentFiles='[]' :uniappFiles='["RebornSlideVerify.vue", "reborn-slide-verify.config.ts"]'}
::

## 简介

SlideVerify 是 UniApp 的滑动确认组件，拖动达到阈值后请求将验证状态设为通过；Web 暂无独立实现。

`threshold` 决定通过距离，`size` 与 `shape` 决定轨道外观，`color` 决定强调色；这些维度可独立组合。

`loading` / `disabled` 控制交互，`autoReset` / `resetDelay` 控制重置；`v-model` 交由父级管理状态，未绑定时 `defaultVerified` 只负责本地初始值。

### 何时使用

- 需要滑动确认后继续操作——用 `threshold` 设置通过距离。
- 表单中需要维护通过状态——用 `v-model` 接收更新请求。
- 验证完成后需自动复位——用 `autoReset` 与 `resetDelay`。

### 何时不使用

- 连续数值选择——改用 `reborn-slider`。
- 服务端身份校验——本库暂无替代，需接入服务端验证；单次滑动不能证明身份。

## 用法

### 验证状态

`modelValue` 一旦传入便由父级持有；显式 `false` / `null` / `undefined` 都表示未通过，优先于 `defaultVerified`。

| 状态来源 | 行为 | 典型用途 |
| --- | --- | --- |
| `v-model` | 父级接收更新后才改变验证状态 | 表单统一管理 |
| 省略 `modelValue` | 本地管理，初始取 `defaultVerified` | 独立滑动确认 |
| `loading` / `disabled` | 暂停交互 | 等待外部校验 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RebornSlideVerify } from '@/components/reborn-slide-verify'
const verified = ref(false)
</script>
<template>
  <RebornSlideVerify v-model="verified" :threshold="0.92" />
</template>
```

## API

### Props

| 属性                | 类型               | 默认值                              | 描述                                                                                                                 |
| :------------------ | :----------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `customClass`       | `any`              | `''`                                | 根节点额外 class（与 `ui.root` 合并）                                                                                |
| `customStyle`       | `any`              | `''`                                | 根节点内联样式；与 `width` 同时存在时会合并为同一 style 对象或拼接字符串                                             |
| `ui`                | `SlideVerifyUI`    | `{}`                                | 各区域 class 覆盖，见下文 **UI**                                                                                     |
| `size`              | `SlideVerifySize`  | `'md'`                              | 尺寸：`sm` \| `md` \| `lg`；在表单注入场景可被字段组 `size` 覆盖                                                     |
| `color`             | `SlideVerifyColor` | `'primary'`                         | 主题色，影响进度条浅色底、滑块图标色及 `splitText` 模式下已通过区标题颜色（`--color-{color}`）                       |
| `shape`             | `SlideVerifyShape` | `'pill'`                            | 容器形态：`pill` 胶囊形，`square` 为规范圆角方形                                                                     |
| `disabled`          | `boolean`          | `false`                             | 禁用交互；与表单字段组禁用态合并后为真时不可拖动                                                                     |
| `loading`           | `boolean`          | `false`                             | 加载中：展示加载文案与图标，阻止完成验证                                                                             |
| `threshold`         | `number`           | `0.92`                              | 通过阈值：默认 `0.92` 表示滑到约 92% 即通过；若传 **大于 1** 的数（如 `92`），内部会除以 100 当作比例                |
| `showThresholdText` | `boolean`          | `false`                             | 为 `true` 时用 `thresholdText` 生成默认提示（替换 `defaultText`）                                                    |
| `thresholdText`     | `string`           | `'拖动超过 {threshold}% 完成验证'`  | 阈值提示模板，`{threshold}` 会替换为百分比整数（如 `92`）                                                            |
| `duration`          | `number`           | `220`                               | 非拖拽时位移动画与通过 / 回弹相关过渡时长（ms）                                                                      |
| `defaultText`       | `string`           | `'向右滑动完成验证'`                | 未完成时的主提示文案（未开 `showThresholdText` 且未自定义 default 插槽时生效）                                       |
| `successText`       | `string`           | `'验证通过'`                        | 验证通过后的文案；`splitText` 时在已滑过区域显示                                                                     |
| `loadingText`       | `string`           | `'验证中...'`                       | `loading` 为 `true` 时的文案                                                                                         |
| `splitText`         | `boolean`          | `true`                              | 左右分层文案：仅在**未**使用默认插槽替换、且未验证、非加载、非失败展示时，左侧显示 `successText`，右侧 `defaultText` |
| `failText`          | `string`           | `'请拖动到最右侧'`                  | 未达阈值松手后的提示文案（若 `showFailText`）                                                                        |
| `showFailText`      | `boolean`          | `true`                              | 是否在失败时短暂展示 `failText`                                                                                      |
| `failDuration`      | `number`           | `900`                               | 失败文案显示时长（ms）                                                                                               |
| `autoReset`         | `boolean`          | `false`                             | 通过后是否在 `resetDelay` 后自动 `reset`                                                                             |
| `resetDelay`        | `number`           | `1200`                              | 自动重置延迟（ms）                                                                                                   |
| `thumbIcon`         | `string`           | `'i-lucide-chevrons-right'`         | 默认滑块图标（Uno / icon class）                                                                                     |
| `successIcon`       | `string`           | `'i-lucide-check'`                  | 通过后滑块图标                                                                                                       |
| `loadingIcon`       | `string`           | `'i-svg-spinners-180-ring-with-bg'` | 加载态滑块图标                                                                                                       |
| `defaultVerified`   | `boolean`          | `false`                             | 仅在未传 `modelValue` 时初始化本地值；不覆盖显式空值或 `false`，初始化不派发交互事件 |
| `modelValue` | `boolean` | `undefined` | 验证状态，对应 `v-model`；未传时本地管理，显式 `false` / `null` / `undefined` 均为未通过 |
| `showToast`         | `boolean`          | `false`                             | 通过后是否调用 `uni.showToast`                                                                                       |
| `toastText`         | `string`           | `''`                                | Toast 文案；空则用 `successText`                                                                                     |
| `width`             | `string`           | `''`                                | 轨道区域宽度，任意 CSS 单位（如 `'600rpx'`、`'80%'`）；默认不设置则撑满父级                                          |

`SlideVerifySize`：`sm` \| `md` \| `lg`

`SlideVerifyColor`：`primary` \| `secondary` \| `success` \| `info` \| `warning` \| `error` \| `neutral`

`SlideVerifyShape`：`pill` \| `square`

### Emits

| 事件名    | 回调参数                      | 描述                                                         |
| :-------- | :---------------------------- | :----------------------------------------------------------- |
| `update:modelValue` | `value: boolean` | 交互请求修改验证状态；父级拒收时保持父值 |
| `start`   | `payload: SlideVerifyPayload` | 开始拖动（触摸开始且通过交互校验后）                         |
| `drag`    | `payload: SlideVerifyPayload` | 拖动过程中连续触发                                           |
| `success` | `payload: SlideVerifyPayload` | 达到阈值并完成验证                                           |
| `fail`    | `payload: SlideVerifyPayload` | 松手时未达阈值                                               |
| `reset`   | —                             | 调用 `reset` 或自动重置将状态清空时                          |
| `change`  | `value: boolean`              | `v-model` 对应布尔值变化（与表单 `validate('change')` 联动） |

### 事件载荷（SlideVerifyPayload）

| 字段       | 类型      | 描述                          |
| :--------- | :-------- | :---------------------------- |
| `progress` | `number`  | 当前进度 **0–100**（整数）    |
| `offset`   | `number`  | 当前滑块水平偏移，单位 **px** |
| `verified` | `boolean` | 当前是否已通过                |

### Slots

| 插槽名    | 作用域参数                                  | 描述                                                                                                        |
| :-------- | :------------------------------------------ | :---------------------------------------------------------------------------------------------------------- |
| `default` | `{ verified, loading, progress, text, ui }` | 中间文案区：`text` 为当前展示文案（与内部 `displayText` 一致）；提供后**不再**使用内置 `splitText` 分层叠层 |
| `thumb`   | `{ verified, loading, progress, icon, ui }` | 滑块内容：`icon` 为当前应展示的图标 class；默认渲染为带 `icon` 的视图                                       |

作用域中的 `ui` 与组件内部 computed 一致，为各区域 **类名工厂**（`root`、`track`、`progress`、`content`、`text`、`thumb`、`thumbIcon`），可传入 `{ class: '...' }` 做一次性合并。

### Expose

| 名称     | 类型                  | 描述                                                                                   |
| :------- | :-------------------- | :------------------------------------------------------------------------------------- |
| `reset`  | `() => void`          | 清空失败态、归零位移、将 `v-model` 置 `false` 并 `emit('reset')`                       |
| `verify` | `() => Promise<void>` | 若尚未测量轨道则先测量，然后**直接**执行通过逻辑（等同拖到头）；用于服务端已校验等场景 |

### 自定义样式（ui）

| 名称                | 描述                                       |
| :------------------ | :----------------------------------------- |
| `root`              | 最外层容器                                 |
| `track`             | **未完成**态轨道                           |
| `progress`          | **未完成**态左侧进度条                     |
| `content`           | 中间内容区容器                             |
| `text`              | **未完成**态主文案                         |
| `thumb`             | **未完成**态滑块                           |
| `thumbIcon`         | **未完成**态滑块内图标                     |
| `verifiedTrack`     | **已完成**态轨道（不传则用内置成功色变体） |
| `verifiedProgress`  | **已完成**态进度条                         |
| `verifiedText`      | **已完成**态文案                           |
| `verifiedThumb`     | **已完成**态滑块                           |
| `verifiedThumbIcon` | **已完成**态滑块图标                       |

## 注意事项

- **`defaultVerified` 仅初始化本地值**。显式传入 `modelValue` 后以父值为准，父级拒收通过请求时保持未通过；移除绑定后恢复本地值，初始化不派发 `update:modelValue`、`change` 或 `success`。

- **手势**：触摸在滑块上处理；横向意图与纵向冲突时若判定为纵向会取消本次拖动。轨道使用 `touch-pan-y` 等以减轻与页面滚动的竞争。
- **测量**：宽高依赖 `uni.createSelectorQuery`，首次布局或 `size` / `customClass` / `ui` / `width` 变化时会重新测量；`verify()` 在宽为 0 时会先测量再完成。
- **表单**：使用字段组注入时，`disabled` 与 `size` 可与表单项联动，值变化会触发校验管道中的 `change`。
- **类型**：可从 `.vue` 引用 `RebornSlideVerifyProps`、`SlideVerifyPayload` 等，与 TS 项目中的事件处理一致。
