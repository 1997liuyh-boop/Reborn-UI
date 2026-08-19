---
title: Context Menu
description: 用于在目标区域右键、点击或悬浮弹出操作面板的上下文菜单组件，仅 web 端。
category: 导航
badge: New
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornContextMenuDemo.vue" config="RebornContextMenuConfig" componentId="reborn-context-menu" :componentFiles='["RebornContextMenu.vue", "reborn-context-menu.config.ts"]'}

#api

## API

### Props

| 属性名        | 说明                                         | 类型                                                                                                                                                                                       | 默认值                                              |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `items`       | 菜单数据，支持单层数组或分组数组             | `RebornContextMenuItem[] \| RebornContextMenuItem[][]`                                                                                                                                     | `[]`                                                |
| `size`        | 菜单尺寸                                     | `'sm' \| 'md' \| 'lg'`                                                                                                                                                                     | `'md'`                                              |
| `trigger`     | 触发方式                                     | `'contextmenu' \| 'click' \| 'hover'`                                                                                                                                                      | `'contextmenu'`                                     |
| `content`     | 弹出方向、对齐和偏移配置                     | `{ side?: 'top' \| 'right' \| 'bottom' \| 'left', align?: 'start' \| 'center' \| 'end', sideOffset?: number }`                                                                             | `{ side: 'bottom', align: 'start', sideOffset: 8 }` |
| `open`        | 受控展开状态，对应 `v-model:open`            | `boolean`                                                                                                                                                                                  | `false`                                             |
| `defaultOpen` | 非受控初始展开状态                           | `boolean`                                                                                                                                                                                  | `false`                                             |
| `portal`      | 是否通过 `Teleport` 挂载到 `body` 或指定节点 | `boolean \| string`                                                                                                                                                                        | `true`                                              |
| `dismissible` | 是否允许点击外部区域关闭                     | `boolean`                                                                                                                                                                                  | `true`                                              |
| `modal`       | 是否显示遮罩层                               | `boolean`                                                                                                                                                                                  | `false`                                             |
| `disabled`    | 是否禁用触发区                               | `boolean`                                                                                                                                                                                  | `false`                                             |
| `openDelay`   | `hover` 模式下的展开延迟                     | `number`                                                                                                                                                                                   | `40`                                                |
| `closeDelay`  | `hover` 模式下的收起延迟                     | `number`                                                                                                                                                                                   | `120`                                               |
| `ui`          | UI 样式覆盖配置                              | `Partial<{ wrapper, trigger, contentWrapper, content, group, separator, item, itemLeading, itemBody, itemLabel, itemDescription, itemTrailing, itemKbd, itemArrow, empty, bridge, mask }>` | `{}`                                                |

### RebornContextMenuItem

| 字段          | 说明                     | 类型                                                          |
| ------------- | ------------------------ | ------------------------------------------------------------- |
| `label`       | 菜单主文案               | `string`                                                      |
| `description` | 次级描述文案             | `string`                                                      |
| `icon`        | 菜单图标                 | `string`                                                      |
| `kbds`        | 快捷键提示               | `string[]`                                                    |
| `type`        | 菜单项类型，支持分隔线   | `'item' \| 'separator'`                                       |
| `disabled`    | 是否禁用当前项           | `boolean`                                                     |
| `color`       | 菜单项语义色             | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'error'` |
| `children`    | 子菜单数据，支持继续分组 | `RebornContextMenuItem[] \| RebornContextMenuItem[][]`        |
| `onSelect`    | 点击回调                 | `(event: MouseEvent) => void`                                 |

### Events

| 事件名        | 说明                 | 参数                                               |
| ------------- | -------------------- | -------------------------------------------------- |
| `update:open` | 展开状态变化时触发   | `(value: boolean)`                                 |
| `select`      | 点击叶子菜单项时触发 | `(item: RebornContextMenuItem, event: MouseEvent)` |

### Slots

- `default`: 触发区插槽，提供作用域参数 `{ open: boolean }`
- `content`: 自定义菜单面板内容，适合使用自定义卡片或轻量布局

### Expose

| 方法名    | 说明             |
| --------- | ---------------- |
| `close()` | 手动关闭当前菜单 |

## 使用说明

- 顶层组件推荐使用默认的 `contextmenu` 模式，适合编辑器画布、文件卡片、表格行等业务场景。
- 当菜单项包含 `children` 时，组件会自动渲染为右侧悬浮子菜单，并保持同一套关闭链路。
- 如果需要完全自定义面板，可以不传 `items`，直接使用 `#content` 插槽。

## 平台说明

- **Web**: 提供右键触发、窗口边缘避让、快捷键展示和多级子菜单。
- **UniApp**: 当前仅提供 Web 示例，后续可按同名 API 补齐跨端实现。
