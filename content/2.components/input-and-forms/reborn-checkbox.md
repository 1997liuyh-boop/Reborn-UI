---
title: 多选框
description: 用于开关单项或组合多选的多选框组件，双端可用，支持布尔与数组两种绑定。
category: 表单与输入
tags: [css, tailwind, checkbox, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornCheckboxDemo.vue" config="RebornCheckboxConfig" componentId="reborn-checkbox" :componentFiles='["RebornCheckbox.vue", "reborn-checkbox.config.ts"]' :uniappFiles='["RebornCheckbox.vue", "reborn-checkbox.config.ts"]'}
::

## 简介

Checkbox 是双端可用的多选框组件，`v-model` 支持两种绑定模式：绑定布尔值时是单个开关确认项；绑定数组时多个复选框共享同一数组实现多选，每项由 `value` 声明选中值。非数组模式下还可用 `trueValue` / `falseValue` 自定义选中/未选中对应的值。`icon` 插槽可替换勾选图标，`default` 插槽可自定义标签内容。

适用场景：

- 表单中勾选一组可多选的选项（绑定数组）。
- 单个布尔确认项，如「同意协议」（绑定布尔）。
- 选中/未选中需要映射为自定义值（`trueValue` / `falseValue`）。

不适用场景：

- 一组互斥选项只能选一个，改用 `reborn-radio`。
- 即时生效的设置开关，改用 `reborn-switch`。

## 用法

### 基础用法（布尔绑定）

`v-model` 绑定布尔值即为单个开关项；`label` 显示标签文本。

```vue
<script setup lang="ts">
import { ref } from "vue";

const agree = ref(false);
</script>

<template>
  <RebornCheckbox v-model="agree" label="接受条款和条件" />
  <RebornCheckbox v-model="agree" label="禁用状态" disabled />
  <RebornCheckbox v-model="agree" label="错误色" color="error" size="lg" />
</template>
```

### 数组多选

`v-model` 绑定数组时进入多选模式：`value` 作为该项的选中值存入数组；未传 `value` 时用 `label` 兜底充当选中值。

```vue
<script setup lang="ts">
const selected = ref<string[]>(["Apple"]);
</script>

<template>
  <RebornCheckbox v-model="selected" value="Apple" label="苹果" />
  <RebornCheckbox v-model="selected" value="Huawei" label="华为" />
  <RebornCheckbox v-model="selected" value="Xiaomi" label="小米" />
</template>
```

### 自定义选中值（trueValue / falseValue）

非数组模式下，`trueValue` / `falseValue` 指定选中/未选中分别写回的值，适合后端字段为 `"1"` / `"0"` 之类的场景。

```vue
<script setup lang="ts">
const status = ref("1");
</script>

<template>
  <RebornCheckbox v-model="status" true-value="1" false-value="0" label="启用" />
</template>
```

### 图标插槽与样式定制

`icon` 插槽（作用域 `{ checked }`）替换勾选图标；`ui` 覆盖内部各区域样式类。Web 端还可用 `RebornCheckboxGroup` 统一下发 `size` / `color` / `disabled` 并管理数组值。

```vue
<template>
  <RebornCheckbox
    v-model="checked"
    label="自定义图标"
    :ui="{ control: 'size-8 rounded-full' }"
  >
    <template #icon="{ checked }">
      <view :class="checked ? 'i-lucide-heart' : 'i-lucide-heart-crack'" />
    </template>
  </RebornCheckbox>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `boolean \| (string \| number)[]` | `false` | 受控选中状态（布尔）或选中值数组（多选模式）。 |
| `defaultValue` | `boolean \| (string \| number)[]` | `false` | 非受控模式下的初始值。 |
| `value` | `string \| number` | `""` | 该项的选中值，仅在绑定数组（或 web 端 CheckboxGroup）时生效。 |
| `label` | `string` | `""` | 标签文本；数组模式下未传 `value` 时兜底充当选中值。 |
| `trueValue` | `string \| number` | `true` | 选中时写回的值（仅非数组模式生效）。 |
| `falseValue` | `string \| number` | `false` | 未选中时写回的值（仅非数组模式生效）。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `readOnly` | `boolean` | `false` | **仅 UniApp**。仅展示状态，不响应点击（由外层接管选中逻辑，避免微信小程序端与 `v-model` 叠加导致闪勾）。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 选中色值。 |
| `class` | `string` | `""` | **仅 Web**。追加到根节点的自定义类名。 |
| `customClass` | `string` | - | **仅 UniApp**。追加到根节点的自定义类名。 |
| `ui` | `object` | `{}` | 覆盖内部各区域样式类，见下方「自定义样式（ui）」。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: boolean \| (string \| number)[])` | 绑定值更新时触发，参数为最新值（布尔、数组或 `trueValue` / `falseValue` 自定义值）。 |
| `change` | `(value: any)` | **仅 Web**。用户切换选中状态后触发，参数与 `update:modelValue` 相同。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `icon` | `{ checked }` | 自定义勾选框内的图标，替代默认对勾。 |
| `default` | - | 自定义标签内容，替代 `label` 文本。 |

## 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的样式类：

| 键名 | 说明 |
| --- | --- |
| `wrapper` | 根容器。 |
| `input` | **仅 Web**。隐藏的原生 checkbox。 |
| `control` | 勾选框方块。 |
| `icon` | 勾选图标。 |
| `label` | 标签文本。 |

## 注意事项

- web 与 uniapp 双端可用；额外类名 web 端用 `class`，uniapp 端用 `customClass`。
- 绑定模式由 `modelValue` 类型决定：数组即多选（按 `value` 存取），非数组即布尔/自定义值开关；`trueValue` / `falseValue` 在数组模式下不生效。
- `change` 事件仅 web 端触发，双端通用逻辑请监听 `update:modelValue`。
- `readOnly` 仅 uniapp 端存在：选中态完全由外层数据驱动，点击不改变值，适合卡片整体可点、内部复选框仅作展示的场景。
- `RebornCheckboxGroup` 仅 web 端提供；uniapp 端多选直接让多个复选框绑定同一数组即可。
- 在 `RebornForm` 中使用时，切换会自动触发表单项的 `change` 校验；uniapp 示例中自定义尺寸建议用 rpx（如 `ui.control` 传 `w-[48rpx] h-[48rpx]`）。
