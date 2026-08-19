---
title: Popover
description: 用于点击或悬停触发气泡浮层的双端组件，可配置定位方向、箭头与遮罩。
category: 导航
badge: New
navigation:
  badges:
    - label: NEW
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornPopoverDemo.vue" config="RebornPopoverConfig" componentId="reborn-popover" :componentFiles='["RebornPopover.vue", "reborn-popover.config.ts"]' :uniappFiles='["RebornPopover.vue", "reborn-popover.config.ts"]'}

#api

## API

### Props

| 属性名        | 说明                                       | 类型                                                                                                        | 默认值                                               |
| ------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `mode`        | 触发方式                                   | `'click' \| 'hover'`                                                                                        | `'click'`                                            |
| `content`     | 弹出层定位配置                             | `{ side: 'top' \| 'bottom' \| 'left' \| 'right', align: 'start' \| 'center' \| 'end', sideOffset: number }` | `{ side: 'bottom', align: 'center', sideOffset: 8 }` |
| `arrow`       | 是否显示小箭头                             | `boolean`                                                                                                   | `false`                                              |
| `open`        | 受控状态，对应 `v-model:open`              | `boolean`                                                                                                   | `false`                                              |
| `defaultOpen` | 非受控初始状态                             | `boolean`                                                                                                   | `false`                                              |
| `modal`       | 是否显示遮罩层                             | `boolean`                                                                                                   | `false`                                              |
| `dismissible` | 是否允许点击外部区域关闭                   | `boolean`                                                                                                   | `true`                                               |
| `portal`      | 是否使用 Teleport 挂载到 `body` 或指定节点 | `boolean \| string`                                                                                         | `true`                                               |
| `openDelay`   | hover 模式下的打开延迟                     | `number`                                                                                                    | `0`                                                  |
| `closeDelay`  | hover 模式下的关闭延迟                     | `number`                                                                                                    | `120`                                                |
| `ui`          | UI 样式覆盖配置                            | `Partial<{ wrapper, trigger, contentWrapper, content, arrow, bridge, mask }>`                               | `{}`                                                 |

### Slots

- `default`: 触发器区域插槽，提供作用域参数 `{ open: boolean }`
- `content`: 气泡内部内容区域

### Expose 方法

| 方法名    | 说明                 |
| --------- | -------------------- |
| `close()` | 手动关闭当前 Popover |

## 动画

- Web 端默认会根据 `side` 方向叠加对应的 `fade-*` 位移动画与 `zoom-in` 缩放动画。
- 例如底部弹出时，会使用 `fade-up + zoom-in`；顶部弹出时，会使用 `fade-down + zoom-in`。

## 平台说明

- **Web**: 使用 `Teleport` 挂载，带基础的边缘修正与位置计算。
- **UniApp**: 保持与 Web 一致的定位思路，但不提供完整的越界翻转能力。
