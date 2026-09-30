---
title: Popup 弹出层
description: UniApp 弹出层，支持四向或居中显示、底部手势关闭、圆角与安全区适配。
category: 反馈
platform: uniapp
tags: [uniapp, tailwind, popup]
---

::ComponentViewer{demoFile="RebornPopupDemo.vue" config="RebornPopupConfig" componentId="reborn-popup" :componentFiles='[]' :uniappFiles='["RebornPopup.vue", "reborn-popup.config.ts", "RebornTransition.vue", "reborn-transition.config.ts", "RebornOverlay.vue", "reborn-overlay.config.ts", "RebornRootPortal.vue", "reborn-root-portal.config.ts"]'}
::

## 简介

Popup 是 UniApp 的边缘或居中弹出面板。Web 实现已重构为 `reborn-drawer`，原有移动端组件与依赖不变，不可混用两者 API。

`position` 控制四向或居中显示，`size` 控制尺寸；`showMask` 与 `maskClosable` 控制遮罩，`showHeader` 与 `showClose` 控制头部。

`swipeClose` 提供底部下滑关闭，安全区开关适配屏幕边缘；`rootPortal` 提供小程序根层挂载，生命周期事件反馈显示状态。

### 何时使用

- 底部操作面板：设置 `position="bottom"` 并开启 `swipeClose`。
- 移动端侧边选择器：设置 `position="left"` 或 `right`，并用 `size` 控制宽度。
- 小程序原生组件层级问题：开启 `rootPortal`。

### 何时不使用

- Web 抽屉编辑面板——改用 `reborn-drawer`。
- 锚定元素的轻量浮层——改用 `reborn-popover`。
- 只需要背景遮罩——改用 `reborn-overlay`。

## 用法

### 基础用法

通过 `v-model` 控制显隐，通过 `position` 选择方向。

| 维度 | 取值 | 典型用途 |
| --- | --- | --- |
| position | top / bottom / left / right / center | 底部操作、侧边选择或居中提示 |
| showHeader / showClose | boolean | 标题栏和关闭图标 |
| showMask / maskClosable | boolean | 遮罩显示与点击关闭 |
| swipeClose | boolean，仅 bottom 生效 | 下滑关闭 |

```vue
<template>
  <RebornPopup v-model="visible" position="bottom" title="筛选" :show-mask="true">
    <view class="p-[24rpx]">
      筛选内容
    </view>
  </RebornPopup>
</template>
```

## API

### Props

| 属性名                | 类型                                                                                   | 默认值      | 描述                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `v-model`             | `boolean`                                                                              | `false`     | 是否显示弹出层                                                                            |
| `position`            | `'top' \| 'bottom' \| 'left' \| 'right' \| 'center'`                                   | `'bottom'`  | 弹出位置，未指定 `transition` 时按方位选用动画                                            |
| `size`                | `number \| string`                                                                     | `'30%'`     | 面板尺寸：左右方向为宽度，上下方向为高度                                                  |
| `title`               | `string`                                                                               | `''`        | 头部标题文本                                                                              |
| `showHeader`          | `boolean`                                                                              | `true`      | 是否显示头部（包含标题和关闭图标）                                                        |
| `showClose`           | `boolean`                                                                              | `true`      | 是否显示关闭图标（位于头部右侧）                                                          |
| `round`               | `boolean`                                                                              | `true`      | 是否显示圆角，只圆朝内的一侧（居中为四角）                                                |
| `modal`               | `boolean`                                                                              | `true`      | 是否显示遮罩层；因 `showMask` 默认 `true` 且优先，单独设为 `false` 不生效                 |
| `showMask`            | `boolean`                                                                              | `true`      | `modal` 的别名，优先于 `modal`；关闭遮罩要传 `:show-mask="false"`                         |
| `closeOnClickModal`   | `boolean`                                                                              | `true`      | 是否可以通过点击遮罩层关闭；因 `maskClosable` 默认 `true` 且优先，单独设为 `false` 不生效 |
| `maskClosable`        | `boolean`                                                                              | `true`      | `closeOnClickModal` 的别名，优先；禁止点遮罩关闭要传 `:mask-closable="false"`             |
| `transition`          | `TransitionName`                                                                       | -           | 自定义过渡动画名称，覆盖 `position` 推导出的默认动画                                      |
| `duration`            | `number \| boolean`                                                                    | `300`       | 动画时长（ms），设为 `false` 禁用动画                                                     |
| `zIndex`              | `number`                                                                               | `25`        | 层级；因 `overlayZIndex` 默认 `25` 且优先，单独修改不生效                                 |
| `overlayZIndex`       | `number`                                                                               | `25`        | `zIndex` 的别名，非 0 时优先；调整层级请改这个                                            |
| `lockScroll`          | `boolean`                                                                              | `true`      | 是否在出现时锁定背景滚动；由遮罩层执行                                                    |
| `lazyRender`          | `boolean`                                                                              | `true`      | 是否在首次显示时才渲染内容                                                                |
| `swipeClose`          | `boolean`                                                                              | `true`      | 是否开启手势下滑关闭（仅 `position="bottom"` 时生效）                                     |
| `swipeCloseThreshold` | `number`                                                                               | `120`       | 手势关闭的触发阈值（手指竖直位移 px，不与阻尼位移混用）                                   |
| `color`               | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'neutral'` | 主题色，只影响滑动手柄颜色                                                                |
| `rootPortal`          | `boolean`                                                                              | `false`     | 是否使用 `reborn-root-portal` 渲染，解决小程序原生组件层级问题                            |
| `enablePortal`        | `boolean`                                                                              | `false`     | `rootPortal` 的别名，两者任一为真即启用                                                   |
| `modalStyle`          | `string`                                                                               | `''`        | 遮罩层的自定义样式                                                                        |
| `customClass`         | `string`                                                                               | `''`        | 面板本体（`base`）的自定义类名                                                            |
| `customStyle`         | `string`                                                                               | `''`        | 面板本体的自定义样式，追加在尺寸与安全区样式之后                                          |
| `safeAreaInsetBottom` | `boolean`                                                                              | `true`      | 是否开启底部安全区域适配（`position="bottom"` 时生效）                                    |
| `safeAreaInsetTop`    | `boolean`                                                                              | `true`      | 是否开启顶部安全区域适配（`position="top"` 时生效）                                       |
| `ui`                  | `object`                                                                               | -           | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                              |

### Emits

| 事件名              | 回调参数           | 描述                                                                            |
| ------------------- | ------------------ | ------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: boolean)` | 显隐状态变化时触发（`v-model` 同步）                                            |
| `open`              | `-`                | 进入过渡开始前触发（与 `before-enter` 同时）                                    |
| `opened`            | `-`                | 进入过渡结束后触发（与 `after-enter` 同时）                                     |
| `close`             | `-`                | 仅在组件内部关闭时触发（点遮罩、点关闭图标、下滑手势），外部改 `v-model` 不触发 |
| `closed`            | `-`                | 离开过渡结束后触发（与 `after-leave` 同时）                                     |
| `click-modal`       | `-`                | 点击遮罩层时触发                                                                |
| `before-enter`      | `-`                | 进入过渡开始前触发                                                              |
| `enter`             | `-`                | 进入过渡进行中触发（面板开始滑入）                                              |
| `after-enter`       | `-`                | 进入过渡结束后触发                                                              |
| `before-leave`      | `-`                | 离开过渡开始前触发                                                              |
| `leave`             | `-`                | 离开过渡进行中触发（面板开始滑出）                                              |
| `after-leave`       | `-`                | 离开过渡结束后触发                                                              |

### Slots

| 插槽名    | 作用域参数 | 描述                                                                     |
| --------- | ---------- | ------------------------------------------------------------------------ |
| `header`  | -          | 替换默认标题文本；关闭图标仍保留在右侧，`showHeader` 为 `false` 时不渲染 |
| `default` | -          | 面板主体内容，直接渲染在 `inner` 节点内，没有内边距与滚动包装            |

### Expose

| 方法名 | 签名 | 描述 |
| --- | --- | --- |
| `handleClose` | `() => void` | 手动关闭，触发关闭事件与动画 |

### 自定义样式（ui）

| 键名        | 说明 |
| ----------- | ---- |
| `base`      | 面板本体（过渡组件的 `custom-class`）。默认 `fixed bg-white`，位置类由 `position` 决定、圆角由 `round` 决定；底色与阴影改这里，`customClass` 也会并到同一节点。 |
| `inner`     | 面板内层容器，默认 `relative`，是手柄、头部与内容的直接父节点。整体内边距建议加在这里。 |
| `draw`      | 顶部的滑动手柄横条。默认 `mx-auto mt-2 h-1 w-10 rounded-full bg-gray-3`，`color` 非 `neutral` 时换成 `bg-<color>/50`。**仅 `position="bottom"` 且 `swipeClose` 为真时渲染**。 |
| `header`    | 头部容器。**仅 `showHeader` 为真时渲染**，默认 `flex items-center justify-between px-4 py-2`（标题靠左、关闭图标靠右）。 |
| `title`     | 标题文本 `<text>`，默认 `text-30 font-medium text-gray-9`。**填充 `header` 插槽会替换掉该节点**，`ui.title` 随之失效。 |
| `closeIcon` | 右上角关闭图标 `<text>`（内置 `i-lucide-x`）。**仅 `showHeader` 与 `showClose` 均为真时渲染**，默认 `text-gray-5 cursor-pointer`，字号即图标大小。 |

## 注意事项

- **Web 与 UniApp 名称已拆分。** Web 使用 reborn-drawer；本组件继续保留移动端原有 API，不提供 beforeClose、resizable 或 appendTo。
- **关闭遮罩使用 showMask，禁止遮罩关闭使用 maskClosable。** 两个别名默认 true 且优先，单独设置 modal 或 closeOnClickModal 为 false 不生效。
- **层级应设置 overlayZIndex。** 它默认 25 且优先于 zIndex，嵌套时需自行分配层级。
- **滚动锁定由遮罩执行。** showMask=false 时不渲染遮罩，也不会持有滚动锁。
- **手势关闭仅支持底部。** swipeCloseThreshold 默认 120px，快速下滑也可触发关闭。
- **默认插槽没有内边距或滚动包装。** 业务内容需自行添加布局；header 插槽仅替换标题，不替换右侧关闭图标。
- **内容默认懒渲染。** lazyRender=true 表示首次显示时才创建内容，安全区开关仅在对应方向生效。
