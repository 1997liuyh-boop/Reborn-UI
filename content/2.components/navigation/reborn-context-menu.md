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
::

## 简介

Context Menu 是 web 端的上下文菜单组件：把触发区内容放进 `default` 插槽，在其上右键（`trigger` 默认 `contextmenu`，也可改为 `click` / `hover`）即可在指针位置弹出操作面板。菜单由 `items` 数据驱动，支持分组、图标、快捷键展示、危险色与多级子菜单（`children` 自动渲染为右侧悬浮子菜单）；不传 `items` 时可用 `content` 插槽完全自定义面板。弹层通过 `Teleport` 挂载并自动做视口边缘避让，同一时刻只保留一个根菜单打开。

适用场景：

- 文件列表、表格行等需要右键呼出操作菜单的区域。
- 需要分组、快捷键展示与多级子菜单的数据驱动菜单（`items` 传入）。
- 需要受控展开（`v-model:open`）或 hover 触发的浮层菜单。

不适用场景：

- uniapp 端不可用（仅 web）。
- 按钮触发的普通下拉操作菜单，改用 `reborn-dropdown`。
- 表单选值场景，改用 `reborn-select`。

## 用法

### 基础用法

`items` 传入二维数组即分组（组间自动加分隔线）；叶子项被点击时触发其 `onSelect` 回调与组件的 `select` 事件，随后整条菜单链关闭。

```vue
<script setup lang="ts">
import type { RebornContextMenuItem } from "~/components/reborn/ui/reborn-context-menu/RebornContextMenu.vue";

const items: RebornContextMenuItem[][] = [
  [
    { label: "复制链接", icon: "lucide:copy", kbds: ["Cmd", "C"] },
    { label: "重命名", icon: "lucide:pen" },
  ],
  [{ label: "删除", icon: "lucide:trash-2", color: "error", kbds: ["Del"] }],
];
</script>

<template>
  <RebornContextMenu :items="items" @select="(item) => console.log(item.label)">
    <div class="rounded-xl border border-dashed p-10 text-center">右键打开菜单</div>
  </RebornContextMenu>
</template>
```

### 多级子菜单

菜单项包含 `children` 时自动渲染为右侧悬浮子菜单，并保持同一套关闭链路；子菜单同样支持分组。

```vue
<script setup lang="ts">
const items = [
  {
    label: "分享到团队",
    icon: "lucide:users",
    children: [
      { label: "发送到设计组", icon: "lucide:pen-tool" },
      { label: "发送到前端组", icon: "lucide:code-xml" },
    ],
  },
];
</script>
```

### 触发方式与受控展开

`trigger` 支持 `contextmenu`（默认，指针位置弹出）、`click`、`hover` 三种；`hover` 模式下 `openDelay` / `closeDelay` 控制展开/收起延迟。绑定 `v-model:open` 可受控展开，也可通过模板 ref 调用暴露的 `close()`。

```vue
<template>
  <RebornContextMenu :items="items" trigger="click" v-model:open="menuOpen">
    <RebornButton variant="outline">点击打开</RebornButton>
  </RebornContextMenu>
</template>
```

### 自定义面板（content 插槽）

不传 `items` 时用 `content` 插槽自定义整块菜单面板，作用域提供 `close` 方法用于关闭菜单。

```vue
<template>
  <RebornContextMenu>
    <div class="rounded-xl border p-10">右键打开自定义面板</div>

    <template #content="{ close }">
      <div class="w-[220px] space-y-2 p-2">
        <button @click="applyTheme('ocean'); close()">Ocean 主题</button>
        <button @click="applyTheme('sand'); close()">Sand 主题</button>
      </div>
    </template>
  </RebornContextMenu>
</template>
```

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
| `openDelay`   | `hover` 模式下的展开延迟（毫秒）             | `number`                                                                                                                                                                                   | `40`                                                |
| `closeDelay`  | `hover` 模式下的收起延迟（毫秒）             | `number`                                                                                                                                                                                   | `120`                                               |
| `nested`      | 是否为嵌套子菜单实例（组件递归渲染 `children` 时内部使用，业务侧一般无需设置） | `boolean`                                                                                                                                                    | `false`                                             |
| `class`       | 追加到根容器（wrapper）的自定义类名          | `any`                                                                                                                                                                                      | -                                                   |
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

| 插槽名    | 作用域参数            | 说明                                                     |
| --------- | --------------------- | -------------------------------------------------------- |
| `default` | `{ open: boolean }`   | 触发区内容，在其上右键/点击/悬浮呼出菜单                 |
| `content` | `{ close: Function }` | 自定义菜单面板内容（替代 `items` 渲染），`close` 关闭菜单 |

### Expose

| 方法名    | 说明                                                    |
| --------- | ------------------------------------------------------- |
| `close()` | 手动关闭当前菜单（同步展开状态并触发 `update:open`）    |

## 注意事项

- 仅 web 端可用（当前仅提供 Web 实现，后续可按同名 API 补齐跨端）。
- `trigger` 默认 `contextmenu`（右键），`openDelay` / `closeDelay` 仅在 `hover` 模式下生效。
- `portal` 默认 `true`，通过 `Teleport` 挂载到 body（传字符串可指定挂载节点）；`modal` 默认 `false` 不显示遮罩。
- 含 `children` 的菜单项点击不触发 `select`，只有叶子项才会触发并随后关闭整条菜单链。
- 根菜单打开期间会锁定页面滚动，且同一时刻只保留一个根菜单打开（新开会关闭其他实例）。
- `content` 插槽存在时优先于 `items` 渲染；`nested` 为组件递归渲染子菜单的内部属性，业务侧一般无需设置。
