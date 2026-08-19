---
title: Popup 弹出层
description: 支持无重绘滑动展开的高级弹出面板组件。
category: 导航
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornPopupDemo.vue" config="RebornPopupConfig" componentId="reborn-popup" :componentFiles='["RebornPopup.vue", "reborn-popup.config.ts", "RebornTransition.vue", "reborn-transition.config.ts", "RebornOverlay.vue", "reborn-overlay.config.ts", "RebornRootPortal.vue", "reborn-root-portal.config.ts"]' :uniappFiles='["RebornPopup.vue", "reborn-popup.config.ts", "RebornTransition.vue", "reborn-transition.config.ts", "RebornOverlay.vue", "reborn-overlay.config.ts", "RebornRootPortal.vue", "reborn-root-portal.config.ts"]'}

#api
## Props
| 属性 | 类型 | 默认值 | 说明 | 平台 |
| :--- | :--- | :--- | :--- | :--- |
| `v-model` | `boolean` | `false` | 是否显示弹出层 | 通用 |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'center'` | `'bottom'` | 弹出层的位置 | 通用 |
| `size` | `number \| string` | `'30%'` | 弹出层的大小 (宽度或高度) | 通用 |
| `title` | `string` | `''` | 弹出层的标题 | 通用 |
| `showHeader` | `boolean` | `true` | 是否显示头部 | 通用 |
| `showClose` | `boolean` | `true` | 是否显示关闭按钮 | 通用 |
| `resizable` | `boolean` | `false` | 是否可以通过拖拽调整大小 | Web |
| `swipeClose` | `boolean` | `true` | 是否开启手势滑动关闭 (仅限底部位置) | UniApp |
| `swipeCloseThreshold` | `number` | `150` | 手势滑动关闭的阈值 | UniApp |
| `rootPortal` / `enablePortal` | `boolean` | `false` | 是否开启插件内部 portal 渲染 (uniapp) | UniApp |
| `appendToBody` | `boolean` | `false` | 是否将弹出层插入至 `body` 节点 | Web |
| `lockScroll` | `boolean` | `true` | 是否在出现时锁定 body 滚动 | 通用 |
| `closeOnClickModal` | `boolean` | `true` | 是否可以通过点击遮罩层关闭 | 通用 |
| `closeOnPressEscape` | `boolean` | `true` | 是否可以通过按下 ESC 键关闭 | Web |
| `openDelay` | `number` | `0` | 开启延迟 (ms) | Web |
| `closeDelay` | `number` | `0` | 关闭延迟 (ms) | Web |
| `destroyOnClose` | `boolean` | `false` | 关闭时是否销毁内部元素 | Web |
| `modal` | `boolean` | `true` | 是否需要遮罩层 | 通用 |
| `transition` | `string` | `''` | 自定义过渡动画名称 | 通用 |
| `round` | `boolean` | `true` | 是否显示圆角样式 | 通用 |
| `zIndex` | `number` | `2000` | 弹出层的层级 | 通用 |
| `duration` | `number` | `350` | 动画时长 (ms) | 通用 |
| `safeAreaInsetBottom` | `boolean` | `true` | 是否开启底部安全区域适配 | 通用 |
| `safeAreaInsetTop` | `boolean` | `true` | 是否开启顶部安全区域适配 | 通用 |
| `lazyRender` | `boolean` | `true` | 是否在显示时才渲染内容 | 通用 |
| `color` | `string` | `'neutral'` | 主题色 (仅影响 UniApp 滑动手柄) | UniApp |

## Emits
| 事件名 | 回调参数 | 说明 | 平台 |
| :--- | :--- | :--- | :--- |
| `open` | `-` | 开启弹出层时触发 (动画开始) | 通用 |
| `opened` | `-` | 开启且动画完成时触发 | 通用 |
| `close` | `-` | 关闭弹出层时触发 | 通用 |
| `closed` | `-` | 关闭且动画完成时触发 | 通用 |
| `click-modal` | `-` | 点击遮罩层时触发 | 通用 |
| `before-enter` | `-` | 过渡开始前触发 | UniApp |
| `after-enter` | `-` | 过渡结束后触发 | UniApp |
| `before-leave` | `-` | 离开过渡开始前触发 | UniApp |
| `after-leave` | `-` | 离开过渡结束后触发 | UniApp |
| `open-auto-focus` | `-` | 自动聚焦至打开状态 | Web |
| `close-auto-focus` | `-` | 自动聚焦至关闭状态 | Web |
| `resize` | `size: number` | 拖拽缩放中触发 | Web |

## Expose
| 方法名 | 说明 | 平台 |
| :--- | :--- | :--- |
| `handleClose` | 手动关闭弹出层 | 通用 |

## UI 配置 (Slots & Variants)

### Slots
- `header`: 头部区域，可自定义标题和操作。 (通用)
- `default`: 弹窗主体内容。 (通用)
- `footer`: 底部页脚区域。 (仅 Web)

### Variants
- **position**: `top`, `bottom`, `left`, `right`, `center` (通用)
- **round**: `true`, `false` (通用)
- **color**: `primary`, `success`, `warning`, `error`, `neutral` (仅 UniApp)

## 平台差异说明

### 交互方式
- **Web 端**: 支持 `resizable` 属性，允许用户通过边缘拖拽调整弹窗宽度/高度。支持 `appendToBody` 将弹窗挂载到 DOM 顶层。
- **UniApp 端**: 重点优化了移动端手势。当 `position="bottom"` 时支持 `swipeClose`，弹窗顶部会出现滑动手柄，用户可下拉关闭，且带有精细的阻尼感和弹簧回弹效果。

### 渲染机制
- **Web 端**: 使用 Vue 3 原生 `Teleport` 实现挂载。
- **UniApp 端**: 内置了 `reborn-root-portal` 以解决某些平台（如小程序）中原生组件层级过高的问题。
::
