---
title: Popover 
description: 点击或悬浮元素，弹出一个可定制内容的气泡区域。
badge: New
navigation:
  badges:
    - label: 通
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornPopoverDemo.vue" config="RebornPopoverConfig" componentId="reborn-popover" :componentFiles='["RebornPopover.vue", "reborn-popover.config.ts"]' :uniappFiles='["RebornPopover.vue", "reborn-popover.config.ts"]'}

#api
## API

### Props

| 属性名 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `mode` | 触发方式 | `'click' \| 'hover'` | `'click'` |
| `content` | 弹出层定位配置 | `{ side: 'top'\|'bottom'\|'left'\|'right', align: 'start'\|'center'\|'end', sideOffset: number }` | `{ side: 'bottom', align: 'center', sideOffset: 8 }` |
| `arrow` | 是否显示小箭头 | `boolean` | `false` |
| `open` | 受控状态 (v-model:open) | `boolean` | `false` |
| `modal` | 是否开启模态模式 (显示遮罩层) | `boolean` | `false` |
| `dismissible` | 是否允许点击外部区域关闭 | `boolean` | `true` |
| `portal` | 是否使用 Teleport 将组件挂载到 body 下 | `boolean \| string` | `true` |
| `ui` | UI 样式覆盖配置 | `Partial<{ wrapper, trigger, content, arrow, mask }>` | `{}` |

### Slots

- `default`: 触发器区域插槽，提供作用域参数 `{ open: boolean }`。
- `content`: 气泡内实际展示的内容区域。

### Expose 方法

| 方法名 | 说明 |
|---|---|
| `close()` | 手动关闭当前气泡弹层 (仅在 click 模式下有效) |

## 平台差异与开发指南

- **Web**: 原生 Vue 独立封装实现，支持 `Teleport` 挂载，内置基于窗口和滚动条的基础边缘位置调整与十二方位定位计算。
- **UniApp**: 核心定位逻辑与 Web 保持一致（计算 `boundingClientRect`），且支持微信小程序。受限于跨平台环境，暂不提供全维度的自由边缘越界翻转。
::

