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
    <RebornButton variant="outlined">点击打开</RebornButton>
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

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件仅 Web 端提供。**`ui` 不会自动下发给子菜单**——递归渲染的子级 `RebornContextMenu` 只继承 `size` / `portal` 等属性，需要统一外观时请用全局配置或对每层单独传入。

| 键名              | 说明                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`         | 最外层包裹节点，右键与 hover 事件绑定在它身上。默认 `relative`，`class` prop 也并到该节点。                                                                  |
| `trigger`         | 触发器包裹层，包住 default 插槽的内容，默认无类名——需要让触发区撑满时在这里加 `block w-full`。                                                               |
| `mask`            | 遮罩层。**仅 `modal` 为真、菜单打开且非子菜单时渲染**，默认 `fixed inset-0 z-[9999] bg-black/15 backdrop-blur-[1px]`。                                       |
| `contentWrapper`  | 面板的定位层（过渡动画的 `custom-class`）。默认 `fixed left-0 top-0 z-[10000]`，`transform` 由定位计算写入内联样式，层级改这里。                             |
| `content`         | 面板本体。默认 `relative min-w-[220px] overflow-hidden rounded-2xl border bg-white/95 p-2 shadow-… backdrop-blur-xl`，面板宽度、底色、圆角、内边距都在这里。 |
| `bridge`          | 触发器与面板之间的透明桥接层，防止鼠标移动途中关闭。**仅 `trigger="hover"` 时渲染**，默认 `absolute inset-0 z-[-1]`。                                        |
| `group`           | 菜单项分组容器（`items` 传二维数组时每组一个），默认 `flex flex-col gap-1`；组内项间距改这里。                                                               |
| `separator`       | 分隔线。**仅菜单项 `type: 'separator'` 时渲染**，默认 `my-2 h-px bg-gray-200/70`。                                                                           |
| `empty`           | 空态文案「暂无可用操作」。**仅 `items` 为空且未填充 `content` 插槽时渲染**，默认 `px-3 py-2 text-sm text-gray-500`。                                          |
| `item`            | 单个菜单项 `<button>`。默认 `group/item relative flex w-full select-none items-center gap-3 rounded-xl text-left transition-all`；行高、hover 底色、圆角改这里，禁用态与 `color` 由内部变体处理。 |
| `itemLeading`     | 菜单项前置图标位，默认 `flex size-5 shrink-0 items-center justify-center text-gray-500`；图标本身由菜单项的 `icon` 字段决定。                                 |
| `itemBody`        | 标题 + 描述的纵向容器，默认 `min-w-0 flex-1`。                                                                                                              |
| `itemLabel`       | 菜单项标题，默认 `truncate font-medium text-gray-900`。                                                                                                      |
| `itemDescription` | 菜单项描述。**仅该项配了 `description` 时渲染**，默认 `mt-0.5 text-xs leading-5 text-gray-500`。                                                             |
| `itemTrailing`    | 菜单项右侧区域（快捷键或子菜单箭头），默认 `ml-auto flex items-center gap-2 pl-4`。                                                                          |
| `itemKbd`         | 快捷键小键帽。**仅该项配了 `kbds` 时渲染**，默认 `rounded-md border bg-gray-50 px-1.5 py-0.5 text-[11px] font-medium uppercase text-gray-500`。              |
| `itemArrow`       | 子菜单展开箭头。**仅该项含 `children` 时渲染**，默认 `text-gray-400 transition-transform group-hover/item:translate-x-0.5`。                                  |

```vue
<template>
  <RebornContextMenu
    :items="items"
    :ui="{
      content: 'min-w-[260px] rounded-xl',
      item: 'py-2 hover:bg-primary/10',
      itemLabel: 'text-sm',
      itemKbd: 'bg-white',
    }"
  >
    <div class="p-8">右键点我</div>
  </RebornContextMenu>
</template>
```

## 注意事项

- 仅 web 端可用（当前仅提供 Web 实现，后续可按同名 API 补齐跨端）。
- `trigger` 默认 `contextmenu`（右键），`openDelay` / `closeDelay` 仅在 `hover` 模式下生效。
- `portal` 默认 `true`，通过 `Teleport` 挂载到 body（传字符串可指定挂载节点）；`modal` 默认 `false` 不显示遮罩。
- 含 `children` 的菜单项点击不触发 `select`，只有叶子项才会触发并随后关闭整条菜单链。
- 根菜单打开期间会锁定页面滚动，且同一时刻只保留一个根菜单打开（新开会关闭其他实例）。
- `content` 插槽存在时优先于 `items` 渲染；`nested` 为组件递归渲染子菜单的内部属性，业务侧一般无需设置。
