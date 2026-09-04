---
title: radio 单选框
description: 用于在一组互斥选项中选择单项的单选框组件，支持圆点与按钮两种类型。
category: 表单与输入
tags: [css, tailwind, radio, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornRadioDemo.vue" config="RebornRadioConfig" componentId="reborn-radio" :componentFiles='["RebornRadio.vue", "reborn-radio.config.ts"]' :uniappFiles='["RebornRadio.vue", "reborn-radio.config.ts"]'}
::

## 简介

Radio 是单选框组件：每个选项通过 `value` 声明自己的值，选中态由绑定值与 `value` 严格相等决定。推荐用 `RebornRadioGroup` 包裹，由 Group 的 `v-model` 统一管理选中值，并下发 `type` / `size` / `color` / `disabled`；也支持通过 `options` 快捷渲染选项列表。

适用场景：

- 表单中性别、支付方式等互斥选项的单选。
- 视图/模式切换等分段选择（`type="button"` 分段按钮风格）。
- 需要实体按钮观感的单选（`type="pure-button"`，复用 `RebornButton` 拼接渲染）。

不适用场景：

- 可同时选中多项，改用 `reborn-checkbox`。
- 单个布尔开关的即时切换，改用 `reborn-switch`。
- 选项很多（如超过 5-7 个）时，改用 `reborn-select`。

## 用法

### 基础用法

选项放入 `RebornRadioGroup`，由 Group 的 `v-model` 统一管理；选项文案写在 `RebornRadio` 的默认插槽中。

```vue
<script setup lang="ts">
import { ref } from "vue";

const fruit = ref("apple");
</script>

<template>
  <RebornRadioGroup v-model="fruit">
    <RebornRadio value="apple">苹果</RebornRadio>
    <RebornRadio value="banana">香蕉</RebornRadio>
    <RebornRadio
      value="orange"
      disabled
    >
      橘子
    </RebornRadio>
  </RebornRadioGroup>
</template>
```

### 按钮类型与尺寸

`type="button"` 呈现分段按钮风格；`size` 支持 `sm` / `md` / `lg`，`radio` 类型下圆形图标直径分别为 `12 / 14 / 16px`，`button` 与 `pure-button` 类型下高度取 `RebornButton` 同款令牌，分别为 `24 / 32 / 40px`。

```vue
<template>
  <RebornRadioGroup
    v-model="mode"
    type="button"
    size="lg"
  >
    <RebornRadio value="day">日视图</RebornRadio>
    <RebornRadio value="week">周视图</RebornRadio>
    <RebornRadio value="month">月视图</RebornRadio>
  </RebornRadioGroup>
</template>
```

### 实体按钮拼接（pure-button）

`type="pure-button"` 复用 `RebornButton` 渲染每个选项：首尾圆角、中间直角、相邻边框折叠拼接（`direction="vertical"` 时为首个顶部圆角、最后一个底部圆角，成员等宽拉伸）。未选中态为 `gray-4` 边框 + `gray-9` 文字，禁用未选中为 `gray-2` 底 + `gray-5` 文字；选中态外观随 `variant`（见下方「样式变体」）。`button-props` 可统一透传按钮参数（其中 `variant` 只作用于未选中态）。

```vue
<template>
  <RebornRadioGroup
    v-model="align"
    type="pure-button"
    color="success"
    :button-props="{ variant: 'soft', borderStyle: 'dashed' }"
    :options="['左对齐', '居中', '右对齐']"
  />
</template>
```

### 样式变体

`variant` 支持 `outlined`（默认）/ `filled`，作用于选中态外观：

- `radio` 圆点：`outlined` 为透明底 + 语义色外圈与圆点；`filled` 为语义色实底外圈 + 白色中心圆点。
- `button` 分段按钮：`outlined` 为浮起高亮语义色文字；`filled` 为语义色实底 + 白色字体。
- `pure-button` 实体按钮：`outlined` 为语义色描边 + 语义色文字；`filled` 为语义色实底 + 白色字体。

```vue
<template>
  <RebornRadioGroup
    v-model="v"
    variant="filled"
    :options="fruits"
  />
</template>
```

### 语义色彩

`color` 支持 `primary` / `secondary` / `success` / `info` / `warning` / `error` / `neutral`，作用于选中态的圆点、分段按钮高亮与实体按钮实底；组内单个 `RebornRadio` 也可用自身 `color` 覆盖。

```vue
<template>
  <RebornRadioGroup
    v-model="v"
    color="warning"
    :options="fruits"
  />
</template>
```

### options 快捷传参

`options` 接受 `string | number | RadioOption` 混合数组，对象形式可携带 `disabled`；配合 `label` 插槽可统一定制选项文案。

```vue
<template>
  <RebornRadioGroup
    v-model="city"
    :options="['北京', '上海', { label: '深圳（禁用）', value: '深圳', disabled: true }]"
  />

  <RebornRadioGroup
    v-model="pay"
    :options="payOptions"
  >
    <template #label="{ data }">
      <span class="font-medium">{{ data.label }}</span>
    </template>
  </RebornRadioGroup>
</template>
```

### 方向与非受控

`direction="vertical"` 纵向排列；不绑定 `v-model` 时可用 `default-value` 指定初始值，通过 `change` 事件拿到最新值。

```vue
<template>
  <RebornRadioGroup
    default-value="banana"
    direction="vertical"
    :options="fruits"
    @change="onChange"
  />
</template>
```

### radio 插槽深度定制

`radio` 插槽（作用域含 `checked` / `disabled`）完全接管单选框的渲染，可做成卡片式选择等任意外观。

```vue
<template>
  <RebornRadioGroup v-model="plan">
    <RebornRadio
      v-for="p in plans"
      :key="p.value"
      :value="p.value"
    >
      <template #radio="{ checked }">
        <div :class="checked ? 'border-primary text-primary' : 'border-gray-3'">
          {{ p.label }}
        </div>
      </template>
    </RebornRadio>
  </RebornRadioGroup>
</template>
```

## API

### Radio Props

| 属性名       | 类型                            | 默认值    | 描述                                                              |
| ------------ | ------------------------------- | --------- | ----------------------------------------------------------------- |
| `modelValue` | `string \| number \| boolean`   | -         | 绑定值（`v-model`），与 `value` 严格相等时呈选中态。              |
| `value`      | `string \| number \| boolean`   | `true`    | 选项的 value。                                                    |
| `type`       | `"radio" \| "button" \| "pure-button"` | `"radio"` | 单选的类型；组内使用时以 Group 下发为准。                 |
| `color`      | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 语义色；不传时取 Group 下发值，组内可用于单项覆盖。 |
| `variant`    | `"filled" \| "outlined"`        | `"outlined"` | 样式变体，作用于选中态外观；不传时取 Group 下发值。          |
| `disabled`   | `boolean`                       | `false`   | 是否禁用。                                                        |
| `buttonProps`| `ButtonProps`                   | -         | `pure-button` 类型下透传给 `RebornButton` 的参数（`variant` 只作用于未选中态）。 |
| `class`      | `string`                        | -         | 追加到根节点的自定义类名。                                        |
| `ui`         | `object`                        | `{}`      | 覆盖内部各区域样式类，见下方「自定义样式（ui）」。                |

### Radio Emits

| 事件名              | 参数                                              | 描述                                       |
| ------------------- | ------------------------------------------------- | ------------------------------------------ |
| `update:modelValue` | `(value: string \| number \| boolean)`            | 选中值变化时更新绑定值。                   |
| `change`            | `(value: string \| number \| boolean, ev: Event)` | 值改变时触发（点击已选中项不会触发）。     |

### Radio Slots

| 插槽名    | 作用域参数                | 描述                                     |
| --------- | ------------------------- | ---------------------------------------- |
| `radio`   | `{ checked, disabled }`   | 自定义单选框，完全接管渲染。             |
| `default` | -                         | 选项文案内容。                           |

### RadioGroup Props

| 属性名         | 类型                                        | 默认值         | 描述                                             |
| -------------- | ------------------------------------------- | -------------- | ------------------------------------------------ |
| `modelValue`   | `string \| number \| boolean`               | -              | 绑定值（`v-model`）。                            |
| `defaultValue` | `string \| number \| boolean`               | `""`           | 默认值（非受控状态，未绑定 `v-model` 时生效）。  |
| `type`         | `"radio" \| "button" \| "pure-button"`      | `"radio"`      | 单选框组的类型。                                 |
| `color`        | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 语义色，作用于选中态。 |
| `variant`      | `"filled" \| "outlined"`                    | `"outlined"`   | 样式变体：filled 实底（语义色背景 + 白色前景）/ outlined 描边。 |
| `size`         | `"sm" \| "md" \| "lg"`                      | `"md"`         | 单选框组的尺寸（受 Form / FormItem 尺寸继承）。  |
| `options`      | `Array<string \| number \| RadioOption>`    | -              | 选项列表；传入后组件内部渲染，可省略默认插槽。   |
| `direction`    | `"horizontal" \| "vertical"`                | `"horizontal"` | 单选框组的方向。                                 |
| `disabled`     | `boolean`                                   | `false`        | 是否禁用整组。                                   |
| `buttonProps`  | `ButtonProps`                               | -              | `pure-button` 类型下统一透传给每个 `RebornButton` 的参数。 |
| `class`        | `string`                                    | -              | 追加到根节点的自定义类名。                       |

### RadioGroup Emits

| 事件名              | 参数                                   | 描述                     |
| ------------------- | -------------------------------------- | ------------------------ |
| `update:modelValue` | `(value: string \| number \| boolean)` | 选中值变化时更新绑定值。 |
| `change`            | `(value: string \| number \| boolean)` | 值改变时触发。           |

### RadioGroup Slots

| 插槽名    | 作用域参数              | 描述                                                |
| --------- | ----------------------- | --------------------------------------------------- |
| `radio`   | `{ checked, disabled }` | 自定义单选框，透传给 `options` 渲染出的每个选项。   |
| `label`   | `{ data: RadioOption }` | 自定义选项文案，作用域参数为归一化后的选项对象。    |
| `default` | -                       | 手动书写的 `RebornRadio` 子项（未传 `options` 时）。|

### RadioOption

| 参数名     | 类型               | 默认值  | 描述           |
| ---------- | ------------------ | ------- | -------------- |
| `label`    | `string`           | -       | 文案。         |
| `value`    | `string \| number` | -       | 选项的 value。 |
| `disabled` | `boolean`          | `false` | 是否禁用。     |

## 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的样式类（两端结构不同，键位分别列出）：

### Web 端

| 键名    | 说明                          |
| ------- | ----------------------------- |
| `root`  | 根节点容器。                  |
| `icon`  | 圆形图标外圈（`radio` 类型）。|
| `dot`   | 选中态实心圆点。              |
| `label` | 标签文本。                    |

### UniApp 端

| 键名           | 说明                                       |
| -------------- | ------------------------------------------ |
| `root`         | 根节点容器。                               |
| `wrapper`      | 图标与文案的内层行容器（对齐用）。         |
| `activeIcon`   | 选中态图标（语义色渐变底，尺寸随 size）。  |
| `inactiveIcon` | 未选中态图标（灰色描边，尺寸随 size）。    |
| `label`        | 标签文本。                                 |

## 注意事项

- 选中态由绑定值与 `value` 严格相等判断，注意字符串与数字类型不一致会导致无法选中；点击已选中项不会再次触发事件（单选框不能取消选中）。
- 使用 `RebornRadioGroup` 时绑定值由 Group 的 `v-model` 管理，单个 Radio 不需要再绑 `v-model`；`type` / `size` / `disabled` 也由 Group 统一下发。
- `options` 与默认插槽二选一：传了 `options` 时默认插槽不渲染。
- `pure-button` 类型下选中态外观随 `variant`（filled 实底白字 / outlined 语义色描边+文字）+ `color` 语义色，`buttonProps.variant` 只影响未选中态；首尾圆角由组容器按 `size` 取 `RebornButton` 同款圆角令牌恢复。
- uniapp 端组件尚未对齐本次新 API（仍为旧版 `size` / `color` / `activeIcon` 等参数），跨端使用请以各端源码面板为准。
