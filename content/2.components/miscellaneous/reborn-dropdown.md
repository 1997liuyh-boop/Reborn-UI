---
title: Dropdown 下拉菜单
description: 将动作或菜单折叠到下拉菜单中，悬停或点击触发元素以展开更多操作。
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

## UI 对象说明

通过 `ui` 属性可以重写内部元素的样式：

| 属性 | 说明 |
| :--- | :--- |
| `wrapper` | 最外层容器 |
| `trigger` | 触发元素（普通模式） |
| `splitMain` | split-button 模式下左侧功能按钮区域 |
| `splitArrow` | split-button 模式下右侧箭头按钮 |
| `dropdown` | 下拉面板容器 |
| `item` | 菜单项 |
| `divider` | 分隔线 |
| `icon` | 菜单项图标区域 |
| `label` | 菜单项文字区域 |

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
