---
title: 悬浮按钮 (Fab)
description: 用于固定位置悬浮操作入口的按钮组件，支持拖拽吸边与展开动作面板，双端可用。
category: 导航
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary 
---

::ComponentViewer{demoFile="RebornFabDemo.vue" config="RebornFabConfig" componentId="reborn-fab" :componentFiles='["RebornFab.vue", "reborn-fab.config.ts"]' :uniappFiles='["RebornFab.vue", "reborn-fab.config.ts"]' dependencies="clsx, tailwind-variants"}
::



## API

| 属性名 | 类型 | 默认值 | 描述 | 平台 |
| --- | --- | --- | --- | --- |
| `modelValue` | `boolean` | `false` | 绑定值，控制展开状态。 | 通用 |
| `active` | `boolean` | `false` | 是否默认展开。 | 通用 |
| `position` | `'left-top' \| 'right-top' \| 'left-bottom' \| 'right-bottom'` | `'right-bottom'` | 预设位置。 | 通用 |
| `top` | `string \| number` | - | 自定义顶部距离。 | 通用 |
| `bottom` | `string \| number` | - | 自定义底部距离。 | 通用 |
| `left` | `string \| number` | - | 自定义左侧距离。 | 通用 |
| `right` | `string \| number` | - | 自定义右侧距离。 | 通用 |
| `trigger` | `'click' \| 'hover'` | `'click'` | 触发方式（hover 仅 Web 有效）。 | 通用 |
| `direction` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 展开方向。 | 通用 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 主题颜色。 | 通用 |
| `disabled` | `boolean` | `false` | 是否禁用。 | 通用 |
| `draggable` | `boolean` | `false` | 是否可拖拽。拖拽结束后如果靠左侧会自动吸附到左边并向右展开，同理右侧吸附。 | 通用 |
| `attract` | `boolean` | `true` | 拖拽结束后是否自动吸附到最近的屏幕侧边。 | 通用 |
| `peekOnScroll` | `boolean` | `false` | 页面滚动时是否自动贴紧最近的屏幕侧边并只露出一半（滚动停止约 1s 后复位；点击、按下或悬停也会立即复位）。与 `attract` 相互独立。 | Web |
| `expandable` | `boolean` | `false` | 是否可展开显示动作面板。如果为 false 将直接触发 click。 | 通用 |
| `gap` | `{ top?: number; left?: number; right?: number; bottom?: number }` | `{ top: 32, left: 32, right: 32, bottom: 32 }` | 限制拖拽边界与快捷定位计算偏移值的间距计算。 | 通用 |
| `inactiveIcon` | `string` | `'lucide:plus'` | 非激活状态图标（Web 版默认依赖 nuxt-icon）。 | 通用 |
| `activeIcon` | `string` | `'lucide:plus'` | 激活状态图标。 | 通用 |
| `zIndex` | `number` | `99` | 组件全局层级 z-index。 | 通用 |
| `customClass` | `string` | - | 自定义类名。 | Web |
| `customStyle` | `string \| CSSProperties` | - | 自定义样式。 | 通用 |

## Emits

| 事件名 | 参数 | 描述 | 平台 |
| --- | --- | --- | --- |
| `update:modelValue` | `(value: boolean)` | 更新展开状态绑定值。 | 通用 |
| `click` | `()` | 当组件非可展开(`expandable` 为假)状态下被点击时触发。 | 通用 |

## Slots

| 名称 | 参数 | 描述 |
| --- | --- | --- |
| `default` | `{ isActive, isExpanded, isAnimating, isDragging, isAttracting, isPeeking }` | 动作面板内容。可解构获取展开与位移状态。 |
| `trigger` | `{ isActive, isExpanded, isAnimating, isDragging, isAttracting, isPeeking }` | 自定义主触发按钮的渲染内容。 |

## Expose

| 方法 | 描述 | 平台 |
| --- | --- | --- |
| `open()` | 展开动作面板。 | 通用 |
| `close()` | 收起动作面板。 | 通用 |
| `restore()` | 从 `peekOnScroll` 的半隐藏状态立即复位。 | Web |

## UI

### Web 版本 `ui`
| 名称 | 描述 |
| --- | --- |
| `root` | 最外层固定位置的绝对容器样式。 |
| `trigger` | 触发器主按钮样式。 |
| `icon` | 触发器内部图标样式。 |
| `actions` | 动作面板外层容器样式。 |

### UniApp 版本 `ui`
| 名称 | 描述 |
| --- | --- |
| `root` | 最外层固定位置的绝对容器样式。 |
| `trigger` | 触发器主按钮样式。 |
| `icon` | 触发器内部图标组件类名。 |
| `actions` | 动作面板外层容器样式。 |
