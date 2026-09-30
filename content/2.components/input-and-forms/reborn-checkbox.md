---
title: checkbox 多选框
description: 用于开关单项或组合多选的多选框组件，双端可用，支持布尔与数组两种绑定。
category: 表单与输入
platform: both
tags: [css, tailwind, checkbox, uniapp]
badge: New
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

绑定布尔值即单项开关，选中写回 `true`、取消写回 `false`；标签文本用 `label` prop 或默认插槽（插槽优先）。`disabled` 只阻止用户切换，不会清掉已有的勾选结果。

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
  <RebornCheckbox
    :model-value="true"
    label="已勾选且禁用"
    disabled
  />
</template>
```

绑定值的类型决定行为，无需额外的模式开关：

| 绑定类型 | 行为 | 说明 |
| --- | --- | --- |
| `boolean` | 单项开关 | 选中写回 `true`，取消写回 `false`。 |
| 数组 | 多选 | 按 `value` 在数组中增删；未传 `value` 时以 `label` 兜底充当选中值。 |
| 自定义值 | 单项开关（**仅 Web**） | `trueValue` / `falseValue` 指定写回值，见「自定义真假值」；数组模式下不生效。 |

不绑定 `v-model` 时组件进入非受控模式，可用 `defaultValue`（或布尔简写 `defaultChecked`）指定初始值，之后由组件自行维护选中状态，通过 `change` 事件拿到最新值。

### 颜色与变体

`color` 控制语义色，`variant` 控制视觉强度，两者自由组合：

| 变体 | 选中态外观 | 半选态外观 |
| --- | --- | --- |
| `filled`（默认） | 语义色填充，白色对勾 | 语义色填充，白色横线 |
| `outlined` | 透明底，语义色描边 + 语义色对勾 | 保持灰色描边，中央显示语义色实心小方块（`dot` 节点） |

```vue
<template>
  <RebornCheckbox v-model="a" color="primary" label="主色填充" />
  <RebornCheckbox v-model="b" color="success" variant="outlined" label="成功色描边" />
  <RebornCheckbox v-model="c" color="error" label="危险操作" />
</template>
```

放进 `RebornCheckboxGroup` 后，组上的 `color` / `variant`（即使没写也有默认值 `primary` / `filled`）会覆盖子项自身的同名属性，需要单项不同配色时请不要放进组，或改用 `checkbox` 插槽自绘。

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

组内子项的尺寸一律取组的 `size`；单独使用时两端的回退顺序不同，见「注意事项」。

### 自定义真假值：true-value 与 false-value

**仅 Web 端**。布尔模式下用 `trueValue` / `falseValue` 指定选中与取消时写回的值，业务字段本身是 `"yes"` / `"no"` 之类的枚举时不必再做一层布尔转换。组件以 `modelValue === trueValue` 判断是否选中，所以几个勾选框绑定同一个字符串时，至多只有值相等的那一个显示选中。数组模式下这两个属性不生效。

```vue
<script setup lang="ts">
const invoice = ref("no");
</script>

<template>
  <RebornCheckbox
    v-model="invoice"
    true-value="yes"
    false-value="no"
    label="是否寄送发票"
  />
</template>
```

UniApp 端没有这两个属性，布尔模式固定写回 `true` / `false`。

### 复选框组：options 与手动排布

`RebornCheckboxGroup` 统一管理选中数组并向子项下发 `size` / `color` / `variant` / `disabled`。两种写法：`options` 接受 `string | number | CheckboxOption` 混合数组，由组自行渲染子项（传入后默认插槽不再渲染）；或在默认插槽里手动排布 `RebornCheckbox`，每项以 `value` 参与数组存取。禁用项不可切换，但它的值若已在数组中，会一直保持选中。

```vue
<template>
  <!-- options 快捷渲染 -->
  <RebornCheckboxGroup
    v-model="brands"
    :options="['Apple', 'Huawei', 'Xiaomi']"
  />

  <!-- 手动排布子项 -->
  <RebornCheckboxGroup v-model="checkList">
    <RebornCheckbox value="A" label="选项 A" />
    <RebornCheckbox value="B" label="选项 B" />
    <RebornCheckbox value="locked" label="选中且禁用" disabled />
  </RebornCheckboxGroup>
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

### 数据驱动：max、direction 与字段别名

`options` 的对象项可带 `disabled` 逐项禁用；`direction="vertical"` 纵向排列；`max` 限制最多可选数量，达到上限后未选中项自动禁用（已选中项仍可取消）。`label` 插槽可统一定制每项文案，作用域 `data` 是原始选项对象。

数据源字段名与组件预期不一致（如接口返回 `id` / `name`）时，用 `props` 配置别名，按给出的字段名去数据里取 `label` / `value` / `disabled` / `indeterminate`，不必先把数据改造一遍；原始字段仍会保留在 `label` 插槽的 `data` 参数里。

```vue
<template>
  <!-- 最多选 2 项，纵向排列，label 插槽定制文案 -->
  <RebornCheckboxGroup
    v-model="selected"
    :max="2"
    direction="vertical"
    :options="['苹果', '香蕉', { label: '橘子（禁用）', value: '橘子', disabled: true }]"
  >
    <template #label="{ data }">
      <span class="font-medium">{{ data.label }}</span>
    </template>
  </RebornCheckboxGroup>

  <!-- props 字段别名：数据是 id / name，映射后组件照常取到值与文本 -->
  <RebornCheckboxGroup
    v-model="roles"
    :options="[{ id: 'admin', name: '管理员' }, { id: 'dev', name: '开发' }]"
    :props="{ label: 'name', value: 'id' }"
  />
</template>
```

### 数组绑定：卡片式多选

不用组时，多个 `RebornCheckbox` 绑定同一个数组、各自给 `value`，同样是多选。这种写法不受组的 flex 布局约束，可以把勾选框放进任意结构，例如整块可点击的卡片。

```vue
<template>
  <label
    v-for="plan in plans"
    :key="plan.value"
    class="flex cursor-pointer items-start gap-4 rounded-xl border p-4"
  >
    <RebornCheckbox
      v-model="selectedPlans"
      :value="plan.value"
    />
    <span>{{ plan.title }}</span>
  </label>
</template>
```

### 自定义渲染：checkbox 插槽

`checkbox` 插槽整体替换勾选方块，作用域提供 `{ checked, disabled, indeterminate }`；填充后 `ui.control` / `ui.icon` / `ui.dot` 不再生效，样式写在插槽内容上。插槽内容仍处于组件的可点击区域里，点击照常切换选中。

```vue
<template>
  <RebornCheckbox
    v-for="tag in ['Vue', 'React', 'Svelte']"
    :key="tag"
    v-model="tags"
    :value="tag"
  >
    <template #checkbox="{ checked }">
      <span
        class="rounded-xl border px-3 py-1 text-xs"
        :class="checked ? 'border-primary bg-primary text-white' : 'border-gray-3'"
      >
        {{ tag }}
      </span>
    </template>
  </RebornCheckbox>
</template>
```

### 样式覆盖：ui 与 icon 插槽

只想调样式时用 `ui` 按节点覆盖类名（键位见「自定义样式（ui）」）；只想换勾选标记时用 `icon` 插槽，勾选方块、描边与配色仍由组件负责。

```vue
<template>
  <!-- ui 覆盖：全圆角勾选框 + 加粗标签 -->
  <RebornCheckbox
    v-model="a"
    label="全圆角"
    :ui="{ control: 'rounded-full', label: 'font-bold' }"
  />

  <!-- icon 插槽：半选时作用域参数 indeterminate 为 true -->
  <RebornCheckbox v-model="b" label="收藏">
    <template #icon="{ indeterminate }">
      <Icon :name="indeterminate ? 'lucide:minus' : 'lucide:star'" class="size-4" />
    </template>
  </RebornCheckbox>
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
| `trueValue` | `string \| number \| boolean` | `true` | 选中时写回的值，仅非数组模式生效。 |
| `falseValue` | `string \| number \| boolean` | `false` | 未选中时写回的值，仅非数组模式生效。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸；组内以 Group 的 `size` 为准，单独使用时的回退顺序见「注意事项」。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 语义色；组内以 Group 的 `color` 为准。 |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | 样式变体，含义见「颜色与变体」；组内以 Group 的 `variant` 为准。 |
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
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸；组内以 Group 的 `size` 为准，单独使用时的回退顺序见「注意事项」。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 语义色；组内以 Group 的 `color` 为准。 |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | 样式变体，含义见「颜色与变体」；组内以 Group 的 `variant` 为准。 |
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
| `checkbox` | `{ checked, disabled, indeterminate }` | 整体替换勾选方块；填充后 `ui.control` / `ui.icon` / `ui.dot` 不再生效。 |
| `icon` | `{ checked, disabled, indeterminate }` | 自定义勾选框内的图标，替代默认对勾（半选时默认为一条横线）；填充后 `ui.icon` / `ui.dot` 不再生效。 |
| `default` | - | 自定义标签内容，替代 `label` 文本。 |

### CheckboxGroup Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `(string \| number \| boolean)[]` | - | 受控的选中值数组（`v-model`）。 |
| `defaultValue` | `(string \| number \| boolean)[]` | `[]` | 非受控模式下的初始选中值数组。 |
| `max` | `number` | - | 最多可选数量，达到上限后未选中项自动禁用（已选中项仍可取消）。 |
| `options` | `(string \| number \| CheckboxOption \| Record<string, any>)[]` | - | 选项数据。传入后由组自行渲染子项，默认插槽不再生效。 |
| `props` | `CheckboxFieldNames` | - | `options` 的字段别名配置，按给出的字段名取 `label` / `value` / `disabled` / `indeterminate`。 |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 子项排列方向。 |
| `disabled` | `boolean` | `false` | 是否整组禁用。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 统一下发给子项的尺寸。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 统一下发给子项的语义色。 |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | 统一下发给子项的样式变体。 |
| `class` | `any` | - | 追加到根节点的自定义类名。 |
| `ui` | `object` | - | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `(string \| number \| boolean)[]` | - | 受控的选中值数组（`v-model`）。 |
| `defaultValue` | `(string \| number \| boolean)[]` | `[]` | 非受控模式下的初始选中值数组。 |
| `max` | `number` | - | 最多可选数量，达到上限后未选中项自动禁用（已选中项仍可取消）。 |
| `options` | `(string \| number \| CheckboxOption \| Record<string, any>)[]` | - | 选项数据。传入后由组自行渲染子项，默认插槽不再生效。 |
| `props` | `CheckboxFieldNames` | - | `options` 的字段别名配置，按给出的字段名取 `label` / `value` / `disabled` / `indeterminate`。 |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 子项排列方向。 |
| `disabled` | `boolean` | `false` | 是否整组禁用。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 统一下发给子项的尺寸。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 统一下发给子项的语义色。 |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | 统一下发给子项的样式变体。 |
| `customClass` | `any` | - | 追加到根节点的自定义类名（对应 Web 端 `class`）。 |
| `ui` | `object` | - | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |
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
| `checkbox` | `{ checked, disabled, indeterminate }` | 透传给每个子项的 `checkbox` 插槽，整体替换勾选方块。 |
| `label` | `{ data: CheckboxOption }` | 自定义 `options` 每一项的标签内容。 |

### CheckboxOption

| 字段名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `label` | `string` | - | 选项文案，复杂内容请改用 `label` 插槽。 |
| `value` | `string \| number \| boolean` | - | 选项的值，必填。 |
| `disabled` | `boolean` | `false` | 是否禁用该选项。 |
| `indeterminate` | `boolean` | `false` | 该选项是否为半选状态。 |
| `[key: string]` | `any` | - | 其他自定义属性，`label` 插槽可从 `data` 参数里拿到。 |

### CheckboxFieldNames

组上 `props` 属性的类型，四个键都可省略，省略的键回落到默认字段名：

| 字段名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `label` | `string` | `'label'` | 文本字段名。 |
| `value` | `string` | `'value'` | 值字段名。 |
| `disabled` | `string` | `'disabled'` | 禁用字段名。 |
| `indeterminate` | `string` | `'indeterminate'` | 半选字段名。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。前六个键写在 `RebornCheckbox` 上，`root` 写在 `RebornCheckboxGroup` 上；两端 `wrapper` 的合并顺序不同，见表内说明：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 键名 | 对应节点 | 默认关键类名 | 失效 / 渲染条件 |
| --- | --- | --- | --- |
| `wrapper` | 根 `<label>` | `relative inline-flex items-center gap-3 cursor-pointer select-none`；禁用时加 `cursor-not-allowed` | 始终渲染；与 `class` 合并时 `ui.wrapper` 在后，同类冲突以 `ui` 为准。`relative` 是 sr-only 隐藏 input 的包含块，覆盖时请保留，否则内滚动布局下 input 会锚到 `<html>` 把整页撑高。 |
| `input` | 隐藏的原生 `input[type=checkbox]` | `peer sr-only` | 始终渲染，承担焦点、键盘切换与读屏 mixed 语义；去掉 `sr-only` 会露出原生方框，去掉 `peer` 会让选中显形与焦点环失效。 |
| `control` | 勾选方块 | `rounded-sm border border-gray-4 bg-white`，尺寸 `size-4/5/6`，聚焦时 `ring-2 ring-primary/40`；校验失败 `border-red-5`；禁用 `bg-gray-2` | 填充 `checkbox` 插槽后不渲染。 |
| `icon` | 对勾 / 横线图标 | `size-4 opacity-0 scale-75 transition-all`，选中或半选时由 `control` 的规则显形；禁用 `text-gray-4` | 填充 `checkbox` 或 `icon` 插槽后不渲染；`outlined` 半选时换成 `dot` 节点。 |
| `dot` | `outlined` 半选时的实心小方块 | `size-full rounded-sm scale-50`，底色取语义色；禁用 `bg-gray-4` | 仅 `variant="outlined"` 且 `indeterminate` 时渲染；填充 `checkbox` 或 `icon` 插槽后不渲染。 |
| `label` | 标签文本容器 | `text-gray-9`，字号随 `size` 取 `--text-size-24/26/28` | 仅在传了 `label` 或默认插槽时渲染；组内用 `options` 时始终渲染。 |
| `root` | `RebornCheckboxGroup` 的根 `<div>` | `reborn-checkbox-group flex flex-wrap gap-4`，`direction` 追加 `flex-row items-center` / `flex-col items-start`，带 `role="group"` | 仅写在 `RebornCheckboxGroup` 上生效，是该组件唯一的键；与 `class` 合并时 `ui.root` 在后。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 键名 | 对应节点 | 默认关键类名 | 失效 / 渲染条件 |
| --- | --- | --- | --- |
| `wrapper` | 根 `<view>` | `group inline-flex items-center gap-3 cursor-pointer select-none`，并按状态追加 `is-checked` / `is-indeterminate` / `is-disabled` 标记类 | 始终渲染；与 `customClass` 合并时 `customClass` 在后，同类冲突以 `customClass` 为准。覆盖时不要去掉 `group`，选中、半选、禁用的显形都靠 `group-[.is-*]` 规则。 |
| `input` | 无 | `sr-only`（仅声明） | 脚本接收该键，但模板没有渲染原生 input 节点，传入无效。 |
| `control` | 勾选方块 | `rounded-md border border-gray-4 bg-white`，尺寸 `size-4/5/6`，无焦点环；校验失败 `border-error`；禁用 `bg-gray-2` | 填充 `checkbox` 插槽后不渲染。 |
| `icon` | 对勾 / 横线图标 | `size-4 opacity-0 scale-75 transition-all`，由 `group-[.is-checked]` / `group-[.is-indeterminate]` 显形；禁用 `text-gray-4` | 填充 `checkbox` 或 `icon` 插槽后不渲染；`outlined` 半选时换成 `dot` 节点。 |
| `dot` | `outlined` 半选时的实心小方块 | `w-full h-full rounded-md scale-50`，底色取语义色 | 仅 `variant="outlined"` 且 `indeterminate` 时渲染；填充 `checkbox` 或 `icon` 插槽后不渲染。 |
| `label` | 标签文本容器 | `text-gray-8 dark:text-gray-2`，字号随 `size`；校验失败 `text-error` | 仅在传了 `label` 或默认插槽时渲染；组内用 `options` 时始终渲染。 |
| `root` | `RebornCheckboxGroup` 的根 `<view>` | `reborn-checkbox-group flex flex-wrap gap-[24rpx]`，`direction` 追加 `flex-row items-center` / `flex-col items-start`，无 `role` | 仅写在 `RebornCheckboxGroup` 上生效，是该组件唯一的键；与 `customClass` 合并时 `ui.root` 在后。 |
:::

::

```vue
<template>
  <RebornCheckbox
    v-model="v"
    label="自定义样式"
    :ui="{ control: 'rounded-full', icon: 'size-3', label: 'font-medium' }"
  />
  <RebornCheckboxGroup
    v-model="list"
    :options="options"
    :ui="{ root: 'gap-8' }"
  />
</template>
```

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 自定义类名 | `class`，与 `ui.wrapper` 合并时 `ui` 优先 | `customClass`，与 `ui.wrapper` 合并时 `customClass` 优先 |
| 自定义写回值 | `trueValue` / `falseValue` | 不支持，布尔模式固定 `true` / `false` |
| 只读展示 | 无（用 `disabled` 或外层拦截） | `readOnly` prop |
| 底层实现 | 隐藏原生 `input[type=checkbox]`，支持键盘切换与焦点环，读屏可拿到 mixed 语义 | 自绘节点 + tap 事件，状态靠 `is-*` 标记类驱动，无焦点环 |
| 单独使用时的尺寸回退 | `FormItem` > `Form` > 自身 `size` | 自身 `size`（默认 `md`，表单尺寸实际不生效） |
| 勾选方块圆角 | `rounded-sm` | `rounded-md` |
| 校验失败样式 | 仅勾选框描边变红 | 勾选框描边与标签文字都变红 |
| `ui` 键位 | `wrapper` / `input` / `control` / `icon` / `dot` / `label` | 同名六个键，但 `input` 不渲染，传入无效 |
| 组根节点 | `role="group"`，间距 `gap-4` | 无 `role`，间距 `gap-[24rpx]` |

## 注意事项

- **绑定模式由 `modelValue` 类型决定**：数组即多选（按 `value` 存取），非数组即布尔/自定义值开关；`trueValue` / `falseValue` 仅 Web 端存在，且数组模式下不生效。
- **受控 / 非受控二选一**。绑定 `v-model` 即完全受控，值由外层数据决定；不绑定时以 `defaultValue`（优先）或 `defaultChecked` 起始并由组件内部维护。若只写单向的 `:model-value` 而不监听更新，组件会在用户点击后接管为内部状态（`defineModel` 的单向绑定语义），需要「只读展示」请配合 `disabled`（UniApp 端可用 `readOnly`）。
- **组内的 `size` / `color` / `variant` 以组为准**。组总会提供这三个值（未写时取默认值），所以子项自身的同名属性在组内不生效；`disabled` 则是组与子项任一为真即禁用。
- **单独使用时两端的尺寸回退不同**。Web 端按 `FormItem` > `Form` > 自身 `size` 回退；UniApp 端先取自身 `size`，而它默认就是 `md`，所以 `RebornForm` 的尺寸不会传到单独使用的复选框上，需要统一尺寸时请显式写 `size` 或放进组（组的尺寸为「表单尺寸 || 组尺寸」）。
- **`indeterminate` 只负责渲染**。组件不会在用户点击后自动清除半选；半选态与选中态可同时成立，此时视觉上以半选为准。
- **`options` 与默认插槽互斥**。传入 `options` 后默认插槽不再渲染；需要复杂标签内容时用 `label` 插槽而非在 `options.label` 里塞 HTML。
- **`checkbox` 插槽整体替换勾选方块**。此时 `ui.control` / `ui.icon` / `ui.dot` 静默失效，样式请写在插槽内容上。
- **`outlined` 半选态渲染的是 `dot` 节点而非图标**，且刻意不改边框颜色，`ui.icon` 不参与渲染。小方块的实现是「与勾选框同尺寸同圆角、再整体 `scale-50`」，圆角天然与外框等比，调整大小请改缩放比例（覆盖 `ui.dot`）。`dot` 位于 `icon` 插槽的默认内容里，填充 `icon` 插槽后它也不再渲染。
- **`max` 拦截时不抛事件**。组内选中数量达到上限后，点击未选中项既不改值也不触发 `change`。
- **`readOnly` 仅 UniApp 端存在**：选中态完全由外层数据驱动，点击不改变值，适合卡片整体可点、内部复选框仅作展示的场景。
- **在 `RebornForm` 中切换会自动触发表单项的 `change` 校验**，`Form` 级 `disabled` 会强制禁用；校验失败时 Web 端只把勾选框描边标红，UniApp 端描边与标签文字一起标红。UniApp 示例中自定义尺寸建议用 rpx（如 `ui.control` 传 `w-[48rpx] h-[48rpx]`）。

```vue
<template>
  <RebornForm :model="form" :rules="rules">
    <RebornFormItem prop="agreed">
      <RebornCheckbox v-model="form.agreed" label="我已阅读并同意用户协议" />
    </RebornFormItem>
  </RebornForm>
</template>
```
