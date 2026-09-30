---
title: Radio 单选框
description: 用于在一组互斥选项中选择单项的单选框组件，支持圆点与按钮两种类型。
category: 表单与输入
platform: both
tags: [css, tailwind, radio, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornRadioDemo.vue" config="RebornRadioConfig" componentId="reborn-radio" :componentFiles='["RebornRadio.vue", "RebornRadioGroup.vue", "reborn-radio.config.ts"]' :uniappFiles='["RebornRadio.vue", "RebornRadioGroup.vue", "reborn-radio.config.ts"]'}
::

## 简介

Radio 是单选框组件：每个选项通过 `value` 声明自己的值，选中态由绑定值与 `value` 严格相等决定。推荐用 `RebornRadioGroup` 包裹，由 Group 的 `v-model` 统一管理选中值，并下发 `type` / `size` / `color` / `variant` / `disabled`；也支持通过 `options` 快捷渲染选项列表。

同一组件提供三种外观：`radio` 圆点、`button` 分段按钮、`pure-button` 实体按钮拼接（复用 `RebornButton`），切换外观只改 `type`，绑定值与事件不变。

::tip
**本组件两端 API 对齐。** Web 端与 UniApp 端的 Props、Emits（含参数）、插槽名与作用域参数、`ui` 键位、默认值均一致，下方 API 表格无需分端查看。唯一的调用差异是自定义类名的属性名（Web `class` / UniApp `custom-class`），另有若干平台实现差异集中在「两端差异对照」一节。
::

### 何时使用

- 表单中性别、支付方式等互斥选项的单选，选项数量少、需要一眼看全时用默认 `type="radio"`。
- 视图/模式切换等分段选择，用 `type="button"` 分段按钮，选项紧凑排成一条。
- 需要实体按钮观感的单选，用 `type="pure-button"`，每项复用 `RebornButton` 拼接渲染。
- 选项来自接口数据时用 `options` 直接渲染，省去手写 `v-for`。

### 何时不使用

- 可同时选中多项，改用 `reborn-checkbox`。
- 单个布尔开关的即时切换，改用 `reborn-switch`。
- 选项很多（如超过 5-7 个）时，平铺会挤占版面，改用 `reborn-select`。

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

### 类型与尺寸

`type="button"` 呈现分段按钮风格；`size` 支持 `sm` / `md` / `lg`。`radio` 类型下 `size` 决定圆点直径，`button` 与 `pure-button` 类型下取 `RebornButton` 同款高度令牌，具体数值两端不同，见下方「设计令牌」。

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

### 实体按钮拼接：pure-button

`type="pure-button"` 复用 `RebornButton` 渲染每个选项：首尾圆角、中间直角、相邻边框折叠拼接（`direction="vertical"` 时为首个顶部圆角、最后一个底部圆角，成员等宽拉伸）。未选中态为 `gray-4` 边框 + 次级灰阶文字，选中态外观随 `variant` × `color`（见下方「变体：outlined 与 filled」）。`button-props` 可统一透传按钮参数；其中的 `variant` / `color` 一旦传入，会同时覆盖选中与未选中两态，选中项就不再随组的 `variant` / `color` 变化，只想改边框线型等细节时不要带这两个键。`button-props` 的可用键取决于该端 `RebornButton` 的参数，下例的 `borderStyle` 只有 Web 端有，UniApp 端的 `RebornButton` 没有这个参数。

```vue
<template>
  <RebornRadioGroup
    v-model="align"
    type="pure-button"
    color="success"
    :button-props="{ borderStyle: 'dashed' }"
    :options="['左对齐', '居中', '右对齐']"
  />
</template>
```

::warning
`pure-button` 的首尾圆角与相邻边框折叠依赖组容器的结构性伪类（`:first-child` / `:last-child` / `:not(:first-child)`）。个别不支持结构性伪类的小程序端会降级为各自独立的按钮外观，拼接效果失效但功能不受影响。
::

### 变体：outlined 与 filled

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

### 语义色与单项覆盖

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

### 数据驱动：options 与 label 插槽

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

### 自定义渲染：radio 插槽

`radio` 插槽（作用域含 `checked` / `disabled`）完全接管单选框的渲染，可做成卡片式选择等任意外观。填了这个插槽后，内置的圆点、实体按钮和文案节点都不再渲染，`ui.icon` / `ui.dot` / `ui.label` 随之失效，只有 `ui.root` 仍作用于外层点击区。

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

以下 API **两端通用**，Web 端与 UniApp 端签名一致，无需分端查看。表格中标注了自定义类名属性名的两端写法差异。

### Radio Props

| 属性名                  | 类型                                                                                   | 默认值       | 描述                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------- |
| `modelValue`            | `string \| number \| boolean`                                                          | -            | 绑定值（`v-model`），与 `value` 严格相等时呈选中态。                             |
| `value`                 | `string \| number \| boolean`                                                          | `true`       | 选项的 value。                                                                   |
| `type`                  | `"radio" \| "button" \| "pure-button"`                                                 | `"radio"`    | 单选的类型；组内使用时以 Group 下发为准。                                        |
| `color`                 | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"`  | 语义色；不传时取 Group 下发值，组内可用于单项覆盖。                              |
| `variant`               | `"filled" \| "outlined"`                                                               | `"outlined"` | 样式变体，作用于选中态外观；不传时取 Group 下发值。                              |
| `disabled`              | `boolean`                                                                              | `false`      | 是否禁用。                                                                       |
| `buttonProps`           | `ButtonProps`                                                                          | -            | `pure-button` 类型下透传给 `RebornButton` 的参数，与 Group 下发值合并且自身优先；其中 `variant` / `color` 会同时覆盖选中与未选中两态。 |
| `class` / `customClass` | `any`                                                                                  | -            | 追加到根节点的自定义类名。**Web 端为 `class`，UniApp 端为 `custom-class`。**     |
| `ui`                    | `{ root?, icon?, dot?, label? }`                                                       | -            | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                     |

### Radio Emits

| 事件名              | 参数                                              | 描述                                                                                                                            |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: string \| number \| boolean)`            | 选中值变化时更新绑定值。                                                                                                        |
| `change`            | `(value: string \| number \| boolean, ev: Event)` | 值改变时触发（点击已选中项不会触发）。第二个参数为触发本次变化的点击事件，UniApp 端为 uni 合成事件对象（H5 下即原生 `Event`）。 |

### Radio Slots

| 插槽名    | 作用域参数              | 描述                         |
| --------- | ----------------------- | ---------------------------- |
| `radio`   | `{ checked, disabled }` | 自定义单选框，完全接管渲染。 |
| `default` | -                       | 选项文案内容。               |

### RadioGroup Props

| 属性名                  | 类型                                                                                   | 默认值         | 描述                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| `modelValue`            | `string \| number \| boolean`                                                          | -              | 绑定值（`v-model`）。                                                        |
| `defaultValue`          | `string \| number \| boolean`                                                          | `""`           | 默认值（非受控状态，未绑定 `v-model` 时生效）。                              |
| `type`                  | `"radio" \| "button" \| "pure-button"`                                                 | `"radio"`      | 单选框组的类型。                                                             |
| `color`                 | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"`    | 语义色，作用于选中态。                                                       |
| `variant`               | `"filled" \| "outlined"`                                                               | `"outlined"`   | 样式变体：filled 实底（语义色背景 + 白色前景）/ outlined 描边。              |
| `size`                  | `"sm" \| "md" \| "lg"`                                                                 | `"md"`         | 单选框组的尺寸；处于 Form / FormItem 内时以表单下发的尺寸为准。              |
| `options`               | `Array<string \| number \| RadioOption>`                                               | -              | 选项列表；传入后组件内部渲染，可省略默认插槽。                               |
| `direction`             | `"horizontal" \| "vertical"`                                                           | `"horizontal"` | 单选框组的方向。                                                             |
| `disabled`              | `boolean`                                                                              | `false`        | 是否禁用整组。                                                               |
| `buttonProps`           | `ButtonProps`                                                                          | -              | `pure-button` 类型下统一透传给每个 `RebornButton` 的参数。                   |
| `class` / `customClass` | `any`                                                                                  | -              | 追加到根节点的自定义类名。**Web 端为 `class`，UniApp 端为 `custom-class`。** |

### RadioGroup Emits

| 事件名              | 参数                                   | 描述                     |
| ------------------- | -------------------------------------- | ------------------------ |
| `update:modelValue` | `(value: string \| number \| boolean)` | 选中值变化时更新绑定值。 |
| `change`            | `(value: string \| number \| boolean)` | 值改变时触发。           |

### RadioGroup Slots

| 插槽名    | 作用域参数              | 描述                                                 |
| --------- | ----------------------- | ---------------------------------------------------- |
| `radio`   | `{ checked, disabled }` | 自定义单选框，透传给 `options` 渲染出的每个选项。    |
| `label`   | `{ data: RadioOption }` | 自定义选项文案，作用域参数为归一化后的选项对象。     |
| `default` | -                       | 手动书写的 `RebornRadio` 子项（未传 `options` 时）。 |

### RadioOption

| 参数名     | 类型               | 默认值  | 描述           |
| ---------- | ------------------ | ------- | -------------- |
| `label`    | `string`           | -       | 文案。         |
| `value`    | `string \| number` | -       | 选项的 value。 |
| `disabled` | `boolean`          | `false` | 是否禁用。     |

### 自定义样式（ui）

`ui` 只在 `RebornRadio` 上提供，**两端键位一致**，各键类名经 `cn` 合并到内置类之后，同类冲突时以传入值为准。`RebornRadioGroup` 没有 `ui` 参数：配置里的 `group` 样式槽只供组容器内部使用，要调整组容器（如间距）请用 `class`（UniApp 为 `custom-class`）。

| 键名    | 说明 |
| ------- | ---- |
| `root`  | 单个选项的根节点（点击区），默认 `reborn-radio inline-flex items-center transition-colors`，Web 端另有 `cursor-pointer select-none` 与供悬停联动的 `group/radio`。始终渲染，填了 `radio` 插槽也生效。 |
| `icon`  | 圆形图标外圈，默认 `relative box-border inline-flex shrink-0 rounded-full border border-solid`，直径随 `size`。仅 `type="radio"` 时可见（`button` 类型下被 `hidden` 隐藏）；`type="pure-button"` 或填了 `radio` 插槽时不渲染，此键失效。 |
| `dot`   | 外圈内的选中态实心圆点，默认 `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full`，直径随 `size`。渲染与失效条件同 `icon`。 |
| `label` | 选项文案容器，默认 `transition-colors` 加随 `size` 的字号令牌（UniApp 端另有 `leading-[1.5]`），`radio` 类型下文字为 `text-gray-8`。仅在默认插槽有内容时渲染；`type="pure-button"` 下文案交给 `RebornButton`，填了 `radio` 插槽时也不渲染，两种情况此键都失效。 |

```vue
<template>
  <RebornRadioGroup v-model="fruit">
    <RebornRadio
      value="apple"
      :ui="{ root: gap-3, icon: border-2, dot: scale-110, label: font-medium }"
    >
      苹果
    </RebornRadio>
  </RebornRadioGroup>
</template>
```

### 设计令牌

API 通用，但尺寸取值两端不同：Web 端为 px，UniApp 端为 rpx。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 项目 | sm | md | lg | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| 圆点外圈直径 | `12px` | `14px` | `16px` | `radio` 类型的图标外圈 |
| 选中圆点直径 | `6px` | `7px` | `8px` | `radio` 类型的中心实心圆点 |
| 标签字号 | `12px` | `14px` | `16px` | 选项文案 |
| 按钮高度 | `24px` | `32px` | `40px` | `button` / `pure-button` 类型，取 `--height-button-*` |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 项目 | sm | md | lg | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| 圆点外圈直径 | `24rpx` | `28rpx` | `32rpx` | `radio` 类型的图标外圈 |
| 选中圆点直径 | `12rpx` | `14rpx` | `16rpx` | `radio` 类型的中心实心圆点 |
| 标签字号 | `24rpx` | `26rpx` | `28rpx` | 选项文案，取 `--text-size-24 / 26 / 28` |
| 按钮高度 | `56rpx` | `64rpx` | `76rpx` | `button` / `pure-button` 类型，取 `--button-sm/md/lg-height` |
:::

::

## 两端差异对照

API 层面两端一致，以下为平台实现层面的差异：

| 维度                     | Web                                                             | UniApp                                                  |
| ------------------------ | --------------------------------------------------------------- | ------------------------------------------------------- |
| 自定义类名属性           | `class`                                                         | `custom-class`                                          |
| 渲染节点                 | `div` / `span`                                                  | `view` / `text`                                         |
| 事件绑定                 | `@click`                                                        | `@tap`                                                  |
| `change` 第二参数        | 原生 `Event`                                                    | uni 合成事件对象（H5 下即原生 `Event`）                 |
| 无障碍属性               | 带 `role="radio"` / `role="radiogroup"` / `aria-checked`        | 不声明（小程序无对应语义）                              |
| 悬停预示                 | 未选中项有 `group-hover` / `hover` 语义色预示                   | 触屏端无 hover 态，不声明                               |
| `pure-button` 未选中文字 | `gray-9`                                                        | `gray-8`（UniApp 灰阶止于 gray-8）                      |
| `pure-button` 禁用态     | 需 `bg-gray-2!` 提权压住 `RebornButton` 遗留的 `dark:bg-gray-8` | 直接复用 `RebornButton` 自带禁用灰阶，无需提权          |
| `radio` 插槽作用域透传   | `v-bind="scope"` 对象展开                                       | 逐项展开（小程序编译器不支持插槽上的对象展开 `v-bind`） |
| 尺寸单位                 | px                                                              | rpx                                                     |

## 注意事项

- **选中态是严格相等判断。** 绑定值与 `value` 类型不一致（如字符串 `"1"` 与数字 `1`）会导致无法选中；点击已选中项不会再次触发事件（单选框不能取消选中）。
- **组内使用时不要再给单个 Radio 绑 `v-model`。** 绑定值由 Group 的 `v-model` 统一管理，`type` / `size` / `disabled` 也由 Group 下发；单项只需在需要覆盖时传自身的 `color` / `variant`。
- **`options` 与默认插槽二选一**：传了 `options` 时默认插槽不渲染。
- **`buttonProps` 里不要随手带 `variant` / `color`。** `pure-button` 的按钮颜色与变体按「`buttonProps` 优先，其次组的 `variant` × `color`」取值，选中与未选中两态共用这条规则；传了这两个键，选中项就固定成传入的外观，不再随组的 `variant` / `color` 切换。首尾圆角由组容器按 `size` 取 `RebornButton` 同款圆角令牌恢复。
- **组内的 `type` 以 Group 为准。** 单个 `RebornRadio` 在组内写的 `type` 会被 Group 下发值覆盖（Group 默认 `radio`），`size` 也只取 Group 的值；只有 `color` / `variant` 是自身优先。
- **`pure-button` 的拼接效果依赖结构性伪类**，在不支持 `:first-child` / `:last-child` 的小程序端会降级为独立按钮外观。
- **非受控用法下 `default-value` 只在初始化时生效**，后续变更请通过 `change` 事件读取最新值，或改用 `v-model` 受控。
