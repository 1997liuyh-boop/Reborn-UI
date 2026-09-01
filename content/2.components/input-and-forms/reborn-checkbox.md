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

Checkbox 是表单中的多选控件，Web 与 UniApp 两端同名同构。

它的核心设计是**绑定模式由 `modelValue` 的类型决定**：绑定布尔值即单项开关（Web 端还可用 `trueValue` / `falseValue` 自定义写回值），绑定数组即多选（按 `value` 存取选中项）。多选场景推荐用 `RebornCheckboxGroup` 统一管理数组、下发 `size` / `color` / `variant` / `disabled`，并可通过 `options` 快捷渲染、`max` 限制可选数量。

样式体系与 Button 同构：`color` 决定**语义**（7 种语义色），`variant` 决定**视觉强度**（`filled` 实底填充 / `outlined` 描边染色）；`indeterminate` 提供受控的半选状态，`checkbox` / `icon` 插槽支持从图标到整个勾选框的分层定制。

### 何时使用

- 表单中开关单个布尔选项，如「同意协议」。
- 一组可同时选中的选项，绑定数组或使用 `RebornCheckboxGroup`。
- 需要「全选 / 半选」交互，用 `indeterminate` 表达部分选中。
- 需要限制可选数量的多选，用 Group 的 `max`。

### 何时不使用

- 互斥的单选场景 —— 改用 `reborn-radio`。
- 即时生效的布尔开关（如设置项开/关）—— 改用 `reborn-switch`。
- 选项很多（如超过 7 个）的多选 —— 改用 `reborn-select` 的多选模式。

## 用法

### 基础用法

绑定布尔值即单项开关；标签文本用 `label` prop 或默认插槽（插槽优先）。

```vue
<script setup lang="ts">
import { ref } from "vue";

const agreed = ref(false);
</script>

<template>
  <RebornCheckbox
    v-model="agreed"
    label="我已阅读并同意用户协议"
  />
</template>
```

### 绑定模式

绑定值的类型决定行为，无需额外的模式开关：

| 绑定类型 | 行为 | 说明 |
| --- | --- | --- |
| `boolean` | 单项开关 | 选中写回 `true`，取消写回 `false`。 |
| 数组 | 多选 | 按 `value` 在数组中增删；未传 `value` 时以 `label` 兜底充当选中值。 |
| 自定义值 | 单项开关（**仅 Web**） | `trueValue` / `falseValue` 指定写回值，如 `"yes"` / `"no"`；数组模式下不生效。 |

```vue
<script setup lang="ts">
const fruits = ref(["apple"]);
const status = ref("no");
</script>

<template>
  <!-- 数组多选：多个复选框绑定同一数组 -->
  <RebornCheckbox v-model="fruits" value="apple" label="苹果" />
  <RebornCheckbox v-model="fruits" value="banana" label="香蕉" />

  <!-- 仅 Web：自定义写回值 -->
  <RebornCheckbox
    v-model="status"
    true-value="yes"
    false-value="no"
    label="是否寄送发票"
  />
</template>
```

不绑定 `v-model` 时组件进入非受控模式，可用 `defaultValue`（或布尔简写 `defaultChecked`）指定初始值，通过 `change` 事件拿到最新值。

### 颜色与变体

`color` 控制语义色，`variant` 控制视觉强度，两者自由组合：

| 变体 | 选中态外观 | 半选态外观 |
| --- | --- | --- |
| `filled`（默认） | 语义色填充，白色对勾 | 语义色填充，白色横线 |
| `outlined` | 透明底，语义色描边 + 语义色对勾 | 保持灰色描边，中央显示语义色实心小方块 |

```vue
<template>
  <RebornCheckbox v-model="a" color="primary" label="主色填充" />
  <RebornCheckbox v-model="b" color="success" variant="outlined" label="成功色描边" />
  <RebornCheckbox v-model="c" color="error" label="危险操作" />
</template>
```

### 尺寸

两端尺寸档位一致，勾选框为正方形、标签字号取全局字号令牌：

| `size` | 勾选框 | 标签字号 |
| --- | --- | --- |
| `sm` | 16px（`size-4`） | `--text-size-24` |
| `md`（默认） | 20px（`size-5`） | `--text-size-26` |
| `lg` | 24px（`size-6`） | `--text-size-28` |

```vue
<template>
  <RebornCheckbox v-model="v" size="sm" label="小号" />
  <RebornCheckbox v-model="v" size="md" label="中号" />
  <RebornCheckbox v-model="v" size="lg" label="大号" />
</template>
```

### 半选与全选

`indeterminate` 是**纯受控属性**：组件只负责渲染半选样式，不会在用户点击后自动清除，需由外层根据子项选中数量推导。典型的「全选」写法：

```vue
<script setup lang="ts">
const options = ["苹果", "香蕉", "橘子"];
const selected = ref<string[]>(["苹果"]);

const checkAll = computed(() => selected.value.length === options.length);
const indeterminate = computed(
  () => selected.value.length > 0 && selected.value.length < options.length,
);

function onCheckAll(value: boolean) {
  selected.value = value ? [...options] : [];
}
</script>

<template>
  <RebornCheckbox
    :model-value="checkAll"
    :indeterminate="indeterminate"
    label="全选"
    @change="onCheckAll"
  />
  <RebornCheckboxGroup
    v-model="selected"
    :options="options"
  />
</template>
```

### 复选框组

`RebornCheckboxGroup` 统一管理选中数组并向子项下发 `size` / `color` / `variant` / `disabled`。`options` 接受 `string | number | CheckboxOption` 混合数组（传入后默认插槽不再渲染）；`max` 限制最多可选数量，达到上限后未选中项自动禁用（已选中项仍可取消）；`direction="vertical"` 纵向排列。

```vue
<template>
  <!-- options 快捷渲染 + 最多选 2 项 -->
  <RebornCheckboxGroup
    v-model="selected"
    :max="2"
    :options="['苹果', '香蕉', { label: '橘子（禁用）', value: '橘子', disabled: true }]"
  />

  <!-- label 插槽统一定制选项文案 -->
  <RebornCheckboxGroup
    v-model="selected"
    :options="fruits"
  >
    <template #label="{ data }">
      <span class="font-medium">{{ data.label }}</span>
    </template>
  </RebornCheckboxGroup>

  <!-- 也可手动排布子项 -->
  <RebornCheckboxGroup
    v-model="selected"
    direction="vertical"
  >
    <RebornCheckbox value="a" label="选项 A" />
    <RebornCheckbox value="b" label="选项 B" />
  </RebornCheckboxGroup>
</template>
```

### 插槽深度定制

定制分三层：`icon` 插槽只换勾选框内的图标；`checkbox` 插槽整体替换勾选方块（此时 `ui.control` / `ui.icon` 不再生效）；默认插槽自定义标签内容。

```vue
<template>
  <!-- 换图标：半选时作用域参数 indeterminate 为 true -->
  <RebornCheckbox v-model="a" label="收藏">
    <template #icon="{ indeterminate }">
      <Icon :name="indeterminate ? 'lucide:minus' : 'lucide:star'" class="size-4" />
    </template>
  </RebornCheckbox>

  <!-- 整体替换勾选框：做成卡片式多选 -->
  <RebornCheckbox v-model="fruits" value="apple">
    <template #checkbox="{ checked }">
      <div
        class="rounded-ui-xs border border-solid px-4 py-2 transition-colors"
        :class="checked ? 'border-primary text-primary' : 'border-gray-3'"
      >
        苹果
      </div>
    </template>
  </RebornCheckbox>
</template>
```

### 与表单组联动

复选框处于 `RebornForm` 内时自动继承表单级配置：尺寸按 `FormItem` > `Form` > 自身 `size` 回退，`Form` 级 `disabled` 强制禁用；用户切换选中会自动触发表单项的 `change` 校验，校验失败时勾选框显示错误描边。

```vue
<template>
  <RebornForm :model="form" :rules="rules">
    <RebornFormItem prop="agreed">
      <RebornCheckbox v-model="form.agreed" label="我已阅读并同意用户协议" />
    </RebornFormItem>
  </RebornForm>
</template>
```

## API

### Checkbox Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `boolean \| (string \| number \| boolean)[]` | - | 绑定值（`v-model`）：布尔为单项开关，数组为多选。 |
| `defaultValue` | `boolean \| (string \| number \| boolean)[]` | - | 非受控模式下的初始值，优先级高于 `defaultChecked`。 |
| `defaultChecked` | `boolean` | `false` | 非受控模式下的默认选中状态，等价于 `defaultValue` 传布尔值。 |
| `value` | `string \| number \| boolean` | - | 该项的选中值，数组模式（或组内）生效；未传时以 `label` 兜底。 |
| `label` | `string` | - | 标签文本；提供默认插槽时被插槽内容覆盖。 |
| `indeterminate` | `boolean` | `false` | 是否为半选状态。纯受控属性，组件不会自动清除。 |
| `trueValue` | `string \| number` | `true` | 选中时写回的值，仅非数组模式生效。 |
| `falseValue` | `string \| number` | `false` | 未选中时写回的值，仅非数组模式生效。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸；组内由 Group 统一下发，表单组内被组尺寸覆盖。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 语义色。 |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | 样式变体，含义见「颜色与变体」。 |
| `class` | `any` | - | 追加到根节点的自定义类名。 |
| `ui` | `object` | - | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `boolean \| (string \| number \| boolean)[]` | - | 绑定值（`v-model`）：布尔为单项开关，数组为多选。 |
| `defaultValue` | `boolean \| (string \| number \| boolean)[]` | - | 非受控模式下的初始值，优先级高于 `defaultChecked`。 |
| `defaultChecked` | `boolean` | `false` | 非受控模式下的默认选中状态，等价于 `defaultValue` 传布尔值。 |
| `value` | `string \| number \| boolean` | - | 该项的选中值，数组模式（或组内）生效；未传时以 `label` 兜底。 |
| `label` | `string` | - | 标签文本；提供默认插槽时被插槽内容覆盖。 |
| `indeterminate` | `boolean` | `false` | 是否为半选状态。纯受控属性，组件不会自动清除。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `readOnly` | `boolean` | `false` | 仅展示状态，不响应点击；由外层接管选中逻辑，避免微信小程序端与 `v-model` 叠加导致闪勾。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸；组内由 Group 统一下发，表单组内被组尺寸覆盖。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 语义色。 |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | 样式变体，含义见「颜色与变体」。 |
| `customClass` | `any` | - | 追加到根节点的自定义类名（对应 Web 端 `class`）。 |
| `ui` | `object` | - | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

UniApp 端不提供 `trueValue` / `falseValue`，布尔模式固定写回 `true` / `false`。
:::

::

### Checkbox Emits

两端事件名与参数一致（UniApp 端第二个参数为 tap 事件对象）：

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: boolean \| (string \| number \| boolean)[])` | 绑定值更新时触发，参数为最新值（布尔、数组，Web 端还可能是 `trueValue` / `falseValue` 自定义值）。 |
| `change` | `(value: any, ev: Event)` | 用户切换选中状态后触发，第一个参数与 `update:modelValue` 相同，第二个为原生事件。组内被 `max` 上限拦截时不触发。 |

### Checkbox Slots

两端插槽名与作用域参数一致：

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `checkbox` | `{ checked, disabled, indeterminate }` | 整体替换勾选方块；填充后 `ui.control` / `ui.icon` 不再生效。 |
| `icon` | `{ checked, disabled, indeterminate }` | 自定义勾选框内的图标，替代默认对勾（半选时默认为一条横线）。 |
| `default` | - | 自定义标签内容，替代 `label` 文本。 |

### CheckboxGroup Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `(string \| number \| boolean)[]` | - | 受控的选中值数组（`v-model`）。 |
| `defaultValue` | `(string \| number \| boolean)[]` | `[]` | 非受控模式下的初始选中值数组。 |
| `max` | `number` | - | 最多可选数量，达到上限后未选中项自动禁用（已选中项仍可取消）。 |
| `options` | `(string \| number \| CheckboxOption)[]` | - | 选项数据。传入后由组自行渲染子项，默认插槽不再生效。 |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 子项排列方向。 |
| `disabled` | `boolean` | `false` | 是否整组禁用。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 统一下发给子项的尺寸。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 统一下发给子项的语义色。 |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | 统一下发给子项的样式变体。 |
| `class` | `any` | - | 追加到根节点的自定义类名。 |
| `ui` | `object` | - | 覆盖根节点样式类，键名为 `root`。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `(string \| number \| boolean)[]` | - | 受控的选中值数组（`v-model`）。 |
| `defaultValue` | `(string \| number \| boolean)[]` | `[]` | 非受控模式下的初始选中值数组。 |
| `max` | `number` | - | 最多可选数量，达到上限后未选中项自动禁用（已选中项仍可取消）。 |
| `options` | `(string \| number \| CheckboxOption)[]` | - | 选项数据。传入后由组自行渲染子项，默认插槽不再生效。 |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 子项排列方向。 |
| `disabled` | `boolean` | `false` | 是否整组禁用。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 统一下发给子项的尺寸。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 统一下发给子项的语义色。 |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | 统一下发给子项的样式变体。 |
| `customClass` | `any` | - | 追加到根节点的自定义类名（对应 Web 端 `class`）。 |
| `ui` | `object` | - | 覆盖根节点样式类，键名为 `root`。 |
:::

::

### CheckboxGroup Emits

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: (string \| number \| boolean)[])` | 选中值数组更新时触发。 |
| `change` | `(value: (string \| number \| boolean)[], ev: Event)` | 选中项变化时触发，第二个参数为触发本次变化的原生事件。 |

### CheckboxGroup Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | - | 手动排布子项；传入 `options` 时该插槽不渲染。 |
| `checkbox` | `{ checked, disabled }` | 透传给每个子项的 `checkbox` 插槽，整体替换勾选方块。 |
| `label` | `{ data: CheckboxOption }` | 自定义 `options` 每一项的标签内容。 |

### CheckboxOption

| 字段名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `label` | `string` | - | 选项文案，复杂内容请改用 `label` 插槽。 |
| `value` | `string \| number \| boolean` | - | 选项的值，必填。 |
| `disabled` | `boolean` | `false` | 是否禁用该选项。 |
| `indeterminate` | `boolean` | `false` | 该选项是否为半选状态。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 键名 | 说明 |
| --- | --- |
| `wrapper` | 根容器。 |
| `input` | 隐藏的原生 checkbox（`sr-only`），承担焦点环与读屏语义。 |
| `control` | 勾选框方块；填充 `checkbox` 插槽后失效。 |
| `icon` | 勾选图标；填充 `checkbox` 插槽后失效，`outlined` 半选态也不渲染该节点。 |
| `dot` | `outlined` 半选时居中的实心小方块，仅该状态下渲染。 |
| `label` | 标签文本。 |
| `root` | `RebornCheckboxGroup` 的根容器（该组件唯一的 ui 键）。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 键名 | 说明 |
| --- | --- |
| `wrapper` | 根容器。 |
| `control` | 勾选框方块；填充 `checkbox` 插槽后失效。 |
| `icon` | 勾选图标；填充 `checkbox` 插槽后失效，`outlined` 半选态也不渲染该节点。 |
| `dot` | `outlined` 半选时居中的实心小方块，仅该状态下渲染。 |
| `label` | 标签文本。 |
| `root` | `RebornCheckboxGroup` 的根容器（该组件唯一的 ui 键）。 |

UniApp 端没有原生 input 节点，`ui.input` 不适用。
:::

::

```vue
<template>
  <RebornCheckbox
    v-model="v"
    label="自定义样式"
    :ui="{ control: 'rounded-full', label: 'font-medium' }"
  />
</template>
```

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 自定义类名 | `class` | `customClass` |
| 自定义写回值 | `trueValue` / `falseValue` | 不支持，布尔模式固定 `true` / `false` |
| 只读展示 | 无（用 `disabled` 或外层拦截） | `readOnly` prop |
| 底层实现 | 隐藏原生 `input[type=checkbox]`（焦点环 / 读屏 mixed 语义） | 自绘节点 + tap 事件 |
| `ui` 键位 | `wrapper` / `input` / `control` / `icon` / `dot` / `label` | `wrapper` / `control` / `icon` / `dot` / `label` |
| 尺寸与变体 | `sm` / `md` / `lg`，`filled` / `outlined`，勾选框 16 / 20 / 24px | 与 Web 完全一致 |

## 注意事项

- **绑定模式由 `modelValue` 类型决定**：数组即多选（按 `value` 存取），非数组即布尔/自定义值开关；`trueValue` / `falseValue` 仅 Web 端存在，且数组模式下不生效。
- **`indeterminate` 只负责渲染**。组件不会在用户点击后自动清除半选；半选态与选中态可同时成立，此时视觉上以半选为准。
- **`options` 与默认插槽互斥**。传入 `options` 后默认插槽不再渲染；需要复杂标签内容时用 `label` 插槽而非在 `options.label` 里塞 HTML。
- **`checkbox` 插槽整体替换勾选方块**。此时 `ui.control` / `ui.icon` 静默失效，样式请写在插槽内容上。
- **`outlined` 半选态渲染的是 `dot` 节点而非图标**，且刻意不改边框颜色，`ui.icon` 与 `#icon` 插槽的默认内容都不参与渲染。小方块的实现是「与勾选框同尺寸同圆角、再整体 `scale-50`」，圆角天然与外框等比，调整大小请改缩放比例（覆盖 `ui.dot`）。
- **`max` 拦截时不抛事件**。组内选中数量达到上限后，点击未选中项既不改值也不触发 `change`。
- **`readOnly` 仅 UniApp 端存在**：选中态完全由外层数据驱动，点击不改变值，适合卡片整体可点、内部复选框仅作展示的场景。
- 在 `RebornForm` 中使用时，切换会自动触发表单项的 `change` 校验；UniApp 示例中自定义尺寸建议用 rpx（如 `ui.control` 传 `w-[48rpx] h-[48rpx]`）。
