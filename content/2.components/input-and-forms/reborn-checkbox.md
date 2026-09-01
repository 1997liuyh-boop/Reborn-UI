---
title: checkbox 多选框
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

::ComponentViewer{demoFile="RebornCheckboxDemo.vue" config="RebornCheckboxConfig" componentId="reborn-checkbox" :componentFiles='["RebornCheckbox.vue", "RebornCheckboxGroup.vue", "reborn-checkbox.config.ts"]' :uniappFiles='["RebornCheckbox.vue", "RebornCheckboxGroup.vue", "reborn-checkbox.config.ts"]'}
::

## 简介

Checkbox 是双端可用的多选框组件，`v-model` 支持两种绑定模式：绑定布尔值时是单个开关确认项；绑定数组时多个复选框共享同一数组实现多选，每项由 `value` 声明选中值。非数组模式下还可用 `trueValue` / `falseValue` 自定义选中/未选中对应的值。`indeterminate` 提供半选态，用于「全选」这类由子项推导状态的场景。`icon` 插槽可替换勾选图标，`checkbox` 插槽可整体替换勾选方块，`default` 插槽可自定义标签内容。

`variant` 提供 `filled` / `outlined` 两种样式变体，半选样式随变体自动切换。

`RebornCheckboxGroup` 双端可用，统一托管数组值并向下派发 `size` / `color` / `variant` / `disabled`，同时支持 `options` 数据驱动渲染、`direction` 排列方向与 `max` 数量上限。

适用场景：

- 表单中勾选一组可多选的选项（绑定数组或用 `RebornCheckboxGroup`）。
- 单个布尔确认项，如「同意协议」（绑定布尔）。
- 选中/未选中需要映射为自定义值（`trueValue` / `falseValue`）。
- 「全选 / 半选」联动的树形或分组勾选（`indeterminate`）。

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
  <RebornCheckbox
    v-model="agree"
    label="接受条款和条件"
  />
  <RebornCheckbox
    v-model="agree"
    label="禁用状态"
    disabled
  />
  <RebornCheckbox
    v-model="agree"
    label="错误色"
    color="error"
    size="lg"
  />
</template>
```

### 数组多选

`v-model` 绑定数组时进入多选模式：`value` 作为该项的选中值存入数组；未传 `value` 时用 `label` 兜底充当选中值。

```vue
<script setup lang="ts">
const selected = ref<string[]>(["Apple"]);
</script>

<template>
  <RebornCheckbox
    v-model="selected"
    value="Apple"
    label="苹果"
  />
  <RebornCheckbox
    v-model="selected"
    value="Huawei"
    label="华为"
  />
  <RebornCheckbox
    v-model="selected"
    value="Xiaomi"
    label="小米"
  />
</template>
```

### 自定义选中值（trueValue / falseValue）

非数组模式下，`trueValue` / `falseValue` 指定选中/未选中分别写回的值，适合后端字段为 `"1"` / `"0"` 之类的场景。

```vue
<script setup lang="ts">
const status = ref("1");
</script>

<template>
  <RebornCheckbox
    v-model="status"
    true-value="1"
    false-value="0"
    label="启用"
  />
</template>
```

### 样式变体（variant）

`variant` 决定选中态的表现形式，半选样式随变体自动切换，无需额外配置：

- `filled`（默认）：选中与半选都填充配色，图标为白色。
- `outlined`：选中不填充背景，只把边框与图标染成配色；半选时**边框保持默认灰色**，方块中央渲染一个宽高为勾选框一半的同色实心小方块。

```vue
<template>
  <!-- 选中时彩底白勾 -->
  <RebornCheckbox
    v-model="checked"
    label="填充"
  />
  <!-- 选中时白底彩边彩勾 -->
  <RebornCheckbox
    v-model="checked"
    variant="outlined"
    color="success"
    label="描边"
  />
  <!-- 整组统一下发 -->
  <RebornCheckboxGroup
    v-model="selected"
    :options="options"
    variant="outlined"
  />
</template>
```

### 半选与全选（indeterminate）

`indeterminate` 是**纯受控**属性：组件只负责渲染横线样式，不会自动清除。父级的半选态需由子项选中数量推导。

```vue
<script setup lang="ts">
import { computed, ref } from "vue";

const options = ["苹果", "香蕉", "橙子"];
const fruits = ref<string[]>(["苹果"]);

const isAll = computed(() => fruits.value.length === options.length);
const isPart = computed(() => fruits.value.length > 0 && !isAll.value);

function toggleAll() {
  fruits.value = isAll.value ? [] : [...options];
}
</script>

<template>
  <RebornCheckbox
    :model-value="isAll"
    :indeterminate="isPart"
    label="全选"
    @change="toggleAll"
  />
  <RebornCheckboxGroup v-model="fruits">
    <RebornCheckbox
      v-for="fruit in options"
      :key="fruit"
      :value="fruit"
      :label="fruit"
    />
  </RebornCheckboxGroup>
</template>
```

### 复选框组（options / direction / max）

`RebornCheckboxGroup` 传入 `options` 后由组自行渲染子项，此时**默认插槽不再生效**；`direction` 控制排列方向，`max` 限制最多选中数量（选满后未选中项自动禁用）。

```vue
<script setup lang="ts">
const roles = ref<string[]>(["dev"]);

const roleOptions = [
  { label: "管理员", value: "admin" },
  { label: "开发", value: "dev" },
  { label: "运维", value: "ops", disabled: true },
];
</script>

<template>
  <RebornCheckboxGroup
    v-model="roles"
    :options="roleOptions"
    :max="2"
    direction="vertical"
    color="success"
  >
    <template #label="{ data }">
      <span>{{ data.label }} - {{ data.value }}</span>
    </template>
  </RebornCheckboxGroup>
</template>
```

### 图标插槽与样式定制

`icon` 插槽（作用域 `{ checked, disabled, indeterminate }`）替换勾选图标；`checkbox` 插槽整体替换勾选方块；`ui` 覆盖内部各区域样式类。

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

| 属性名         | 类型                                                                                   | 默认值      | 描述                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `modelValue`     | `boolean \| (string \| number \| boolean)[]`                                           | `false`     | 受控选中状态（布尔）或选中值数组（多选模式）。                                                           |
| `defaultValue`   | `boolean \| (string \| number \| boolean)[]`                                           | `false`     | 非受控模式下的初始值，优先级高于 `defaultChecked`。                                                      |
| `defaultChecked` | `boolean`                                                                              | `false`     | 非受控模式下的默认选中状态，等价于 `defaultValue` 传布尔值。                                             |
| `value`          | `string \| number \| boolean`                                                          | `""`        | 该项的选中值，仅在绑定数组（或置于 `RebornCheckboxGroup` 内）时生效。                                    |
| `label`          | `string`                                                                               | `""`        | 标签文本；数组模式下未传 `value` 时兜底充当选中值。                                                      |
| `indeterminate`  | `boolean`                                                                              | `false`     | 是否为半选状态。纯受控属性，组件不会自动清除，需由外层根据子项选中数量推导。                             |
| `trueValue`    | `string \| number`                                                                     | `true`      | 选中时写回的值（仅非数组模式生效）。                                                                     |
| `falseValue`   | `string \| number`                                                                     | `false`     | 未选中时写回的值（仅非数组模式生效）。                                                                   |
| `disabled`     | `boolean`                                                                              | `false`     | 是否禁用。                                                                                               |
| `readOnly`     | `boolean`                                                                              | `false`     | **仅 UniApp**。仅展示状态，不响应点击（由外层接管选中逻辑，避免微信小程序端与 `v-model` 叠加导致闪勾）。 |
| `size`         | `"sm" \| "md" \| "lg"`                                                                 | `"md"`      | 尺寸大小。                                                                                               |
| `color`        | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 选中色值。                                                                                               |
| `variant`      | `"filled" \| "outlined"`                                                               | `"filled"`  | 样式变体。`filled` 选中/半选填充配色、图标为白色；`outlined` 选中只染边框与图标、不填充背景，半选保持灰色边框并在中央显示同色实心小方块。 |
| `class`        | `string`                                                                               | `""`        | **仅 Web**。追加到根节点的自定义类名。                                                                   |
| `customClass`  | `string`                                                                               | -           | **仅 UniApp**。追加到根节点的自定义类名。                                                                |
| `ui`           | `object`                                                                               | `{}`        | 覆盖内部各区域样式类，见下方「自定义样式（ui）」。                                                       |

### Emits

| 事件名              | 参数                                                  | 描述                                                                                |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: boolean \| (string \| number \| boolean)[])` | 绑定值更新时触发，参数为最新值（布尔、数组或 `trueValue` / `falseValue` 自定义值）。 |
| `change`            | `(value: any, ev: Event)`                             | 用户切换选中状态后触发，第一个参数与 `update:modelValue` 相同，第二个为原生事件。    |

### Slots

| 插槽名     | 作用域参数                                | 描述                                                             |
| ---------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `checkbox` | `{ checked, disabled, indeterminate }`    | 整体替换勾选方块；填充后 `ui.control` / `ui.icon` 不再生效。      |
| `icon`     | `{ checked, disabled, indeterminate }`    | 自定义勾选框内的图标，替代默认对勾（半选时默认为一条横线）。      |
| `default`  | -                                         | 自定义标签内容，替代 `label` 文本。                              |

### CheckboxGroup Props

| 属性名         | 类型                                                                                   | 默认值         | 描述                                                                 |
| -------------- | -------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------- |
| `modelValue`   | `(string \| number \| boolean)[]`                                                      | -              | 受控的选中值数组。                                                   |
| `defaultValue` | `(string \| number \| boolean)[]`                                                      | `[]`           | 非受控模式下的初始选中值数组。                                       |
| `max`          | `number`                                                                               | -              | 最多可选中的数量，达到上限后未选中项自动禁用（已选中项仍可取消）。   |
| `options`      | `(string \| number \| CheckboxOption)[]`                                               | -              | 选项数据。传入后由组自行渲染子项，默认插槽不再生效。                 |
| `direction`    | `"horizontal" \| "vertical"`                                                           | `"horizontal"` | 子项排列方向。                                                       |
| `disabled`     | `boolean`                                                                              | `false`        | 是否整组禁用。                                                       |
| `size`         | `"sm" \| "md" \| "lg"`                                                                 | `"md"`         | 统一下发给子项的尺寸。                                               |
| `color`        | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"`    | 统一下发给子项的配色。                                               |
| `variant`      | `"filled" \| "outlined"`                                                               | `"filled"`     | 统一下发给子项的样式变体。                                           |
| `class`        | `string`                                                                               | `""`           | **仅 Web**。追加到根节点的自定义类名。                               |
| `customClass`  | `string`                                                                               | -              | **仅 UniApp**。追加到根节点的自定义类名。                            |
| `ui`           | `object`                                                                               | `{}`           | 覆盖根节点样式类，键名为 `root`。                                    |

### CheckboxGroup Events

| 事件名              | 参数                                                     | 描述                                                     |
| ------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| `update:modelValue` | `(value: (string \| number \| boolean)[])`               | 选中值数组更新时触发。                                   |
| `change`            | `(value: (string \| number \| boolean)[], ev: Event)`    | 选中项变化时触发，第二个参数为触发本次变化的原生事件。   |

### CheckboxGroup Slots

| 插槽名     | 作用域参数                 | 描述                                                             |
| ---------- | -------------------------- | ---------------------------------------------------------------- |
| `default`  | -                          | 手动排布子项；传入 `options` 时该插槽不渲染。                    |
| `checkbox` | `{ checked, disabled }`    | 透传给每个子项的 `checkbox` 插槽，整体替换勾选方块。             |
| `label`    | `{ data: CheckboxOption }` | 自定义 `options` 每一项的标签内容。                              |

### CheckboxOption

| 字段名          | 类型                          | 默认值  | 描述                                       |
| --------------- | ----------------------------- | ------- | ------------------------------------------ |
| `label`         | `string`                      | -       | 选项文案，复杂内容请改用 `label` 插槽。    |
| `value`         | `string \| number \| boolean` | -       | 选项的值，必填。                           |
| `disabled`      | `boolean`                     | `false` | 是否禁用该选项。                           |
| `indeterminate` | `boolean`                     | `false` | 该选项是否为半选状态。                     |

## 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的样式类：

| 键名      | 说明                                                    |
| --------- | ------------------------------------------------------- |
| `wrapper` | 根容器。                                                |
| `input`   | **仅 Web**。隐藏的原生 checkbox。                       |
| `control` | 勾选框方块；填充 `checkbox` 插槽后失效。                |
| `icon`    | 勾选图标；填充 `checkbox` 插槽后失效，`variant="outlined"` 的半选态也不会渲染该节点。 |
| `dot`     | `variant="outlined"` 半选时居中的实心小方块，仅该状态下渲染。 |
| `label`   | 标签文本。                                              |
| `root`    | `RebornCheckboxGroup` 的根容器（该组件唯一的 ui 键）。  |

## 注意事项

- web 与 uniapp 双端可用；额外类名 web 端用 `class`，uniapp 端用 `customClass`。
- 绑定模式由 `modelValue` 类型决定：数组即多选（按 `value` 存取），非数组即布尔/自定义值开关；`trueValue` / `falseValue` 在数组模式下不生效。
- `change` 事件双端均会触发，第二个参数是原生事件对象（uniapp 端为 tap 事件）。
- `readOnly` 仅 uniapp 端存在：选中态完全由外层数据驱动，点击不改变值，适合卡片整体可点、内部复选框仅作展示的场景。
- `RebornCheckboxGroup` 双端可用；也可以不用组，让多个复选框直接绑定同一数组。
- `indeterminate` 只负责渲染半选样式，组件不会在用户点击后自动清除；半选态与选中态可同时成立，此时视觉上以半选为准。
- 传入 `options` 后默认插槽不再渲染，两种写法互斥；需要复杂标签内容时用 `label` 插槽而非在 `options.label` 里塞 HTML。
- 填充 `checkbox` 插槽会整体替换勾选方块，此时 `ui.control` / `ui.icon` 静默失效，样式请写在插槽内容上。
- `variant="outlined"` 的半选态刻意不改边框颜色，且渲染的是 `dot` 节点而非图标，因此该状态下 `ui.icon` 与 `#icon` 插槽的默认内容都不参与渲染；要调整小方块的圆角或大小请覆盖 `ui.dot`。小方块的实现是「与勾选框同尺寸同圆角、再整体 `scale-50`」，所以圆角天然与外框等比，覆盖时改缩放比例即可。
- 在 `RebornForm` 中使用时，切换会自动触发表单项的 `change` 校验；uniapp 示例中自定义尺寸建议用 rpx（如 `ui.control` 传 `w-[48rpx] h-[48rpx]`）。
