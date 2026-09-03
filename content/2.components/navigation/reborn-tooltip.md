---
title: Tooltip 文字提示
description: 文字提示气泡组件：多触发行为、自动翻转与贴边偏移、可控显隐，仅 web 端。
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

## API

### Props

| 属性名               | 说明                                                                                     | 类型                                                      | 默认值       |
| -------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------ |
| `title`              | 提示文字。显式传 `null` 或空串可禁用；未传时回落到 `content`                             | `string \| null`                                          | -            |
| `content`            | 提示内容                                                                                 | `string`                                                  | -            |
| `placement`          | 出现方向与对齐方式，同时接受驼峰命名别名（`topLeft` 等）                                 | `TooltipPlacement`                                        | `'bottom'`   |
| `color`              | 自定义背景颜色，面板与箭头同步着色，文字固定为白色                                       | `string`                                                  | -            |
| `arrow`              | 箭头显隐；对象形式的 `pointAtCenter` 让箭头指向触发元素中心而非对齐端                    | `boolean \| { pointAtCenter?: boolean }`                  | `true`       |
| `autoAdjustOverflow` | 气泡放不下时自动翻转到对侧并做贴边偏移                                                   | `boolean`                                                 | `true`       |
| `trigger`            | 触发行为，可传数组组合多种触发方式                                                       | `'hover' \| 'focus' \| 'click' \| 'contextMenu'` 或其数组 | `'hover'`    |
| `defaultOpen`        | 非受控模式下的初始显隐                                                                   | `boolean`                                                 | `false`      |
| `destroyOnHidden`    | 关闭后是否销毁提示层 DOM；默认隐藏保留                                                   | `boolean`                                                 | `false`      |
| `fresh`              | 关闭期间文案是否保持实时更新；默认关闭时缓存最后一次显示的文案（`content` 插槽始终实时） | `boolean`                                                 | `false`      |
| `getPopupContainer`  | 浮层渲染父节点，默认渲染到 body 上                                                       | `(triggerNode: HTMLElement) => HTMLElement`               | `() => body` |
| `mouseEnterDelay`    | 鼠标移入后延时多少才显示，单位：秒；传入时优先于 `openDelay`                             | `number`                                                  | -            |
| `mouseLeaveDelay`    | 鼠标移出后延时多少才隐藏，单位：秒；传入时优先于 `closeDelay`                            | `number`                                                  | -            |
| `openDelay`          | 打开延时（毫秒）                                                                         | `number`                                                  | `100`        |
| `closeDelay`         | 关闭延时（毫秒）                                                                         | `number`                                                  | `100`        |
| `zIndex`             | 提示层 z-index，未传时用样式默认值                                                       | `number`                                                  | -            |
| `disabled`           | 是否禁用                                                                                 | `boolean`                                                 | `false`      |
| `v-model:open`       | 受控显示状态；不绑定时组件内部自管理显隐                                                 | `boolean`                                                 | -            |

### TooltipPlacement

- `top` / `top-start` / `top-end`
- `bottom` / `bottom-start` / `bottom-end`
- `left` / `left-start` / `left-end`
- `right` / `right-start` / `right-end`
- 驼峰等价别名：`topLeft` / `topRight` / `bottomLeft` / `bottomRight` / `leftTop` / `leftBottom` / `rightTop` / `rightBottom`

### Emits

| 事件名        | 参数               | 说明                            |
| ------------- | ------------------ | ------------------------------- |
| `open`        | -                  | 提示层显示后触发（经打开延时）  |
| `close`       | -                  | 提示层关闭后触发（经关闭延时）  |
| `openChange`  | `(open: boolean)`  | 显示隐藏变化时触发              |
| `update:open` | `(value: boolean)` | open 变化时触发（v-model 同步） |

### Slots

| 插槽名    | 说明                                                |
| --------- | --------------------------------------------------- |
| `default` | 触发提示的元素                                      |
| `content` | 自定义提示内容（可承载 HTML 富内容），优先级最高    |

### Expose

| 方法名    | 说明                                                |
| --------- | --------------------------------------------------- |
| `open()`  | 手动打开提示层（仍受 `disabled` 与打开延时约束）    |
| `close()` | 手动关闭提示层（经关闭延时后隐藏）                  |

## 注意事项

- 仅 web 端可用。
- 视觉规格对齐设计稿：面板底色 `gray-10`（暗色主题下自然反色为浅底）、文字 14px/150%、内边距 8px、圆角 8px、宽度上限 240px；箭头为 7×18 的圆头曲线，与面板同色实色填充，连接处无缝。
- 触发元素放在 `default` 插槽内；`content` 插槽优先级高于 `title` / `content` 属性。
- `disabled` 为 `true`、`title` 为 `null`/空串、或既无文案也无 `content` 插槽时不会弹出；文案中途变为空会立即关闭提示。
- 贴边时沿交叉轴偏移并调整箭头位置，触发元素滚出视口过多时提示层随之滚出；主轴放不下时自动翻转到对侧（`autoAdjustOverflow`）。
- 提示层默认 `Teleport` 到 body 渲染（`getPopupContainer` 可改挂载点，容器带 CSS transform 时 fixed 定位会错位）。
- `trigger` 含 `click` / `contextMenu` 时点击触发器与提示层以外的区域会关闭提示。
- 显示期间按 Escape 可关闭；鼠标移入提示层本身不会关闭（可选中提示文本）。
