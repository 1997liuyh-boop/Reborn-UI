---
title: Dropdown 下拉菜单
description: 用于将一组操作折叠进浮层菜单的下拉组件，悬停或点击展开，仅 web 端。
category: 杂项
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornDropdownDemo.vue" config="RebornDropdownConfig" componentId="reborn-dropdown" :componentFiles='["reborn-dropdown.config.ts", "RebornDropdown.vue", "RebornDropdownItem.vue"]'}
::

# API

## Dropdown Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `splitButton` | `boolean` | `false` | 是否呈现为按钮组模式，左侧为功能按钮，右侧为触发下拉的箭头按钮 |
| `hideOnClick` | `boolean` | `true` | 点击菜单项后是否自动隐藏下拉菜单 |
| `trigger` | `'hover' \| 'click'` | `'hover'` | 下拉菜单的触发方式。hover 为鼠标悬停触发，click 为点击触发 |
| `disabled` | `boolean` | `false` | 是否禁用下拉菜单 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 下拉菜单尺寸规格 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 下拉菜单主题颜色 |
| `placement` | `'bottom-start' \| 'bottom' \| 'bottom-end' \| 'top-start' \| 'top' \| 'top-end'` | `'bottom-start'` | 下拉面板的弹出位置 |
| `portal` | `boolean` | `true` | 浮层是否传送到 `body`。默认开启，浮层按文档坐标锚定触发器，不受祖先 `overflow` / `transform` 裁剪；关闭后浮层留在触发器内，随父容器一起滚动、一起被裁剪 |
| `ui` | `Partial<{...}>` | `{}` | UI 局部重写配置，详见下方 UI 对象说明 |

## Dropdown Events

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `command` | 菜单项被点击时触发 | `(key: string) => void` |
| `visible-change` | 下拉面板展开/收起状态变化时触发 | `(visible: boolean) => void` |

## Dropdown Slots

| 插槽名 | 说明 |
| :--- | :--- |
| `default` | 触发下拉的元素。split-button 模式下为左侧功能按钮的内容 |
| `dropdown` | 下拉菜单面板内容，通常放入 RebornDropdownItem |

## DropdownItem Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `command` | `string` | `""` | 点击时通过 RebornDropdown 的 `command` 事件传递的标识值 |
| `divided` | `boolean` | `false` | 是否在该菜单项上方显示一条分隔线 |
| `disabled` | `boolean` | `false` | 是否禁用该菜单项 |

## DropdownItem Slots

| 插槽名 | 说明 |
| :--- | :--- |
| `default` | 菜单项文字内容 |
| `icon` | 菜单项左侧图标 |

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件仅 Web 端提供；`ui` 传给 `RebornDropdown`，菜单项相关的键会自动下发给每个 `RebornDropdownItem`：

| 键名         | 说明                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`    | 最外层容器，默认 `relative inline-flex`，`class` prop 也并到这里；整体占位与外边距改这里。                                                     |
| `trigger`    | 普通模式的触发器。默认 `inline-flex items-center cursor-pointer select-none outline-none transition-colors`。**`splitButton` 为真时不渲染。**  |
| `splitRoot`  | split-button 模式的触发器外框，把左右两半包在一起。**仅 `splitButton` 为真时渲染**，默认 `flex w-full items-center overflow-hidden`，圆角与边框加这里。 |
| `splitMain`  | split-button 左半边的主按钮区，默认 `inline-flex items-center justify-center`（模板另加 `flex-1` 撑开）。                                      |
| `splitArrow` | split-button 右半边的箭头按钮，默认 `inline-flex items-center justify-center border-l border-white/20`，分隔线颜色改这里。                     |
| `dropdown`   | 下拉面板容器，默认 `overflow-hidden p-2 w-auto!`，面板底色、圆角、内边距、最大高度改这里。                                                     |
| `item`       | 单个菜单项。默认 `flex w-full cursor-pointer select-none items-center gap-2 text-gray-7 transition-colors`，禁用态走 `data-[disabled=true]`；hover 底色、行高改这里。 |
| `divider`    | 菜单项上方的分隔线。**仅该项 `divided` 为真时渲染**，默认 `my-1 border-t border-gray-2`。                                                      |
| `label`      | 菜单项的文字节点，默认 `flex-1 truncate`；它在 default 插槽外层，填充插槽后依然生效。                                                          |

```vue
<template>
  <RebornDropdown
    :items="items"
    :ui="{
      dropdown: 'rounded-xl shadow-lg p-1',
      item: 'rounded-lg px-3 py-2 hover:bg-primary/10',
      label: 'text-sm',
    }"
  />
</template>
```

## 示例代码

### 基础用法

```vue
<template>
  <RebornDropdown @command="handleCommand">
    <RebornButton>下拉菜单</RebornButton>
    <template #dropdown>
      <RebornDropdownItem command="new">新建</RebornDropdownItem>
      <RebornDropdownItem command="edit">编辑</RebornDropdownItem>
      <RebornDropdownItem command="delete" divided>删除</RebornDropdownItem>
    </template>
  </RebornDropdown>
</template>

<script setup lang="ts">
import { RebornDropdown, RebornDropdownItem } from "~/components/reborn/ui/reborn-dropdown";

function handleCommand(key: string) {
  console.log("点击了:", key);
}
</script>
```

### Split Button 模式

```vue
<template>
  <RebornDropdown split-button @command="handleCommand">
    提交操作
    <template #dropdown>
      <RebornDropdownItem command="submit">直接提交</RebornDropdownItem>
      <RebornDropdownItem command="draft">保存草稿</RebornDropdownItem>
      <RebornDropdownItem command="preview" divided>预览</RebornDropdownItem>
    </template>
  </RebornDropdown>
</template>
```

### Click 触发 + 不自动关闭

```vue
<template>
  <RebornDropdown trigger="click" :hide-on-click="false" @command="handleCommand">
    <RebornButton variant="outline">设置</RebornButton>
    <template #dropdown>
      <RebornDropdownItem command="profile">个人资料</RebornDropdownItem>
      <RebornDropdownItem command="security" divided>安全设置</RebornDropdownItem>
      <RebornDropdownItem command="logout" divided>
        <template #icon>
          <Icon name="lucide:log-out" class="size-4" />
        </template>
        退出登录
      </RebornDropdownItem>
    </template>
  </RebornDropdown>
</template>
```

## 平台差异与注意事项

- **Web 端**：基于鼠标事件（`mouseenter`/`mouseleave`）实现 hover 触发，关闭带有 120ms 延迟防抖，防止快速移动时闪烁。Click 模式下通过 `document.addEventListener('click')` 捕获外部点击以自动关闭。
- 下拉面板使用 `RebornTransition` 实现进入/离开过渡动画。
- `RebornDropdownItem` 通过 `provide/inject` 与父组件通信，确保嵌套层级不受限制。
- 若 UniApp 端后续适配，Props 参数名与 Emit 事件名应保持一致。
::
