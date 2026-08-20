---
title: DropdownSelect 下拉选择
description: 用于从 options 列表下拉选择单个值的选择器组件，仅 uniapp 端。
category: 表单与输入
tags: [uniapp, dropdown, select, form]
navigation:
  badges:
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

::warning
仅 UniApp 端组件。Web 端表单选值请使用 `reborn-select`，操作菜单请使用 `reborn-dropdown`。
::
::ComponentViewer{demoFile="RebornDropdownSelectDemo.vue" config="RebornDropdownSelectConfig" componentId="reborn-dropdown-select" :componentFiles='[]' :uniappFiles='["RebornDropdownSelect.vue", "reborn-dropdown-select.config.ts"]'}
::

## 简介

DropdownSelect 是一个轻量的下拉单选控件：传入 `options` 选项数组并用 `v-model` 绑定选中值即可使用。组件内部由 `RebornSelectTrigger` 触发器与 `RebornTransition` 过渡动画组成，点击触发器原地展开选项面板，选中选项或点击遮罩后自动收起，适合筛选条件、简单表单等只需要「就地展开选一项」的场景。

适用场景：

- UniApp 页面中需要轻量的下拉单选控件（`options` + `v-model`）。
- 需要 `clearable` 一键清空已选值的筛选条件选择。

不适用场景：

- Web 端不可用（仅 UniApp）；Web 端表单选值改用 `reborn-select`，操作菜单改用 `reborn-dropdown`。
- 多层级数据选择，改用 `reborn-cascader`。

## 用法

### 基础用法

`options` 为 `{ label, value }` 数组，选中值通过 `v-model` 绑定，变更时触发 `change` 事件。可通过 `color` 与 `size` 调整主题色和尺寸。

```vue
<script setup lang="ts">
import { ref } from "vue";
import RebornDropdownSelect from "@/components/reborn-dropdown-select/RebornDropdownSelect.vue";

const value = ref("");
const options = [
  { label: "选项一", value: "1" },
  { label: "选项二", value: "2" },
  { label: "选项三", value: "3" },
];
</script>

<template>
  <RebornDropdownSelect
    v-model="value"
    :options="options"
    color="primary"
    size="md"
    placeholder="请选择"
    @change="(val) => console.log('change:', val)"
  />
</template>
```

### 默认选中

`v-model` 初始值与某个选项的 `value` 相同时，触发器直接显示对应 `label`。

```vue
<script setup lang="ts">
import { ref } from "vue";

const value = ref("2"); // 默认选中「选项二」
</script>

<template>
  <RebornDropdownSelect
    v-model="value"
    :options="options"
  />
</template>
```

### 可清除与禁用

`clearable` 默认关闭，开启后触发器上出现清空按钮，点击将值重置为 `null` 并触发 `change`；`disabled` 禁用整个控件。

```vue
<template>
  <!-- 可清除 -->
  <RebornDropdownSelect
    v-model="value1"
    :options="options"
    clearable
  />

  <!-- 禁用 -->
  <RebornDropdownSelect
    v-model="value2"
    :options="options"
    disabled
  />
</template>
```

## API

### Props

| 属性名        | 类型                                                                                   | 默认值      | 描述                                                         |
| :------------ | :------------------------------------------------------------------------------------- | :---------- | :----------------------------------------------------------- |
| `modelValue`  | `any`                                                                                  | `-`         | 选中值，支持 `v-model` 双向绑定，与选项的 `value` 字段比较。 |
| `options`     | `Option[]`（`{ label: string, value: any }`）                                          | `[]`        | 下拉选项数组。                                               |
| `placeholder` | `string`                                                                               | `'请选择'`  | 未选中任何值时触发器显示的占位文本。                         |
| `disabled`    | `boolean`                                                                              | `false`     | 是否禁用（整体半透明且不可交互）。                           |
| `size`        | `'sm' \| 'md' \| 'lg'`                                                                 | `'md'`      | 触发器与选项行的尺寸。                                       |
| `color`       | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 主题色，作用于选中项高亮与勾选图标。                         |
| `clearable`   | `boolean`                                                                              | `false`     | 是否显示清空按钮，点击后将值重置为 `null`。                  |
| `ui`          | `Partial<{ wrapper, trigger, content, item, itemText, itemIcon, empty, mask }>`        | `{}`        | 按内部结构键覆盖类名，见下方「自定义样式（ui）」。           |
| `customClass` | `any`                                                                                  | `-`         | 追加到最外层容器的自定义类名。                               |

### Emits

| 事件名              | 参数           | 描述                                                |
| :------------------ | :------------- | :-------------------------------------------------- |
| `update:modelValue` | `(value: any)` | 选中值更新时触发（`v-model` 内部事件）。            |
| `change`            | `(value: any)` | 选中选项或点击清空按钮时触发，清空时参数为 `null`。 |

### 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的 Tailwind/Uno 类名：

| 键名       | 说明                                     |
| :--------- | :--------------------------------------- |
| `wrapper`  | 最外层相对定位容器。                     |
| `trigger`  | 触发器（`RebornSelectTrigger`）。        |
| `content`  | 下拉选项面板容器。                       |
| `item`     | 单个选项行。                             |
| `itemText` | 选项文本。                               |
| `itemIcon` | 选中项右侧勾选图标。                     |
| `empty`    | `options` 为空时的「无数据」占位。       |
| `mask`     | 展开时铺满屏幕、用于点击收起的透明遮罩。 |

## 注意事项

- 仅 UniApp 端可用，Web 端请改用 `reborn-select` / `reborn-dropdown`。
- 选中判定为 `option.value === modelValue` 的全等比较，注意保持绑定值与选项 `value` 的类型一致（如同为字符串或同为数字）。
- `clearable` 默认关闭，需要清空按钮时须显式开启；清空后 `modelValue` 变为 `null` 而非空字符串。
- 下拉面板通过绝对定位展开在触发器下方（`z-index: 999`），若外层容器设置了 `overflow: hidden` 会被裁剪，可参考演示为容器开启 overflow visible。
- 面板最大高度为 `400rpx`，超出的选项内部滚动。
