---
title: InputNumber 数字输入框
description: 用于在最小最大值范围内按步进增减数值的双端数字输入组件。
category: 表单与输入
platform: both
tags: [css, tailwind, input-number, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornInputNumberDemo.vue" config="RebornInputNumberConfig" componentId="reborn-input-number" :componentFiles='["RebornInputNumber.vue", "reborn-input-number.config.ts"]' :uniappFiles='["RebornInputNumber.vue", "reborn-input-number.config.ts"]'}
::

## 简介

数字输入框在 `min` / `max` 范围内按 `step` 步进增减数值：默认左右为减/加按钮，中间为数字输入区，达到边界后对应按钮自动禁用。支持 `v-model` 受控与 `defaultValue` 非受控两种用法，`precision` 控制小数位，`variant` 提供 outlined / filled / borderless / underlined 四种形态。

两端的属性名、事件名、插槽名与 `ui` 键名已基本对齐，但**默认值、宽度策略与部分端能力并不一致**：Web 端额外提供 `step-strictly`、`model-event`、`formatter` / `parser`、`align` 等表单级能力，宽度默认 `w-full` 撑满父容器；UniApp 端宽度为内容宽度（`inline-flex`），并支持长按按钮连续增减，但没有文本对齐开关。

适用场景：

- 购物车、库存等数量增减场景。
- 需要限定 `min` / `max` / `step`，或需要固定小数位的数值录入。
- 需要在输入框内附带货币符号、单位等前后缀（`prefix` / `suffix` 插槽）。
- 需要自定义加减按钮图标（两端均为 `minus` / `plus` 插槽）。
- 需要嵌入到已有边框容器（`borderless`）或走极简下划线风格（`underlined`）。

不适用场景：

- 自由输入长数字或文本，改用 `reborn-input`。
- 在连续区间内拖动取值，改用 `reborn-slider`。

## 用法

### 基础用法

`v-model` 绑定当前值，`min` / `max` 限定范围，`step` 控制每次增减的幅度。

```vue
<script setup lang="ts">
import { ref } from "vue";

const count = ref(5);
</script>

<template>
  <RebornInputNumber
    v-model="count"
    :min="0"
    :max="20"
    :step="5"
  />
</template>
```

::warning
`min` / `max` 的默认值两端不同：Web 端为 `Number.MIN_SAFE_INTEGER` / `Number.MAX_SAFE_INTEGER`（等于不限制），UniApp 端为 `0` / `200`。同一段业务代码要跨端复用时，务必显式传入这两个值，否则 UniApp 端会在 200 处意外截断。
::

### 尺寸、颜色与形状

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
`size` 支持 `sm` / `md` / `lg` 三档，尺寸全部取自 `app/assets/theme/typography.css` 的设计令牌：高度 24 / 32 / 40px，水平内边距 10 / 12 / 16px，加减图标 10 / 12 / 16px；字号 sm 与 md 同为 14px、lg 为 16px。

`color` 影响聚焦环与按钮悬停色，`shape` 支持 `circle`（胶囊圆角）与 `square`（按尺寸取 `rounded-sm` / `rounded-md` / `rounded-lg`），**默认值为 `square`**。

```vue
<template>
  <RebornInputNumber
    v-model="count"
    size="lg"
    color="success"
    shape="square"
  />
</template>
```

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
`size` 同为 `sm` / `md` / `lg` 三档，但尺寸由字号令牌派生而非独立高度令牌：高度取 `--text-size-26 / 28 / 32` 的两倍，即 52 / 56 / 64rpx，字号对应 26 / 28 / 32rpx，加减图标为 `size-3.5` / `size-4` / `size-5`。

`shape` 的 `square` 统一映射为 `rounded-md`（不随尺寸变化），**默认值为 `circle`**。此外 UniApp 端的分割线会随 `color` 一起变色（聚焦时染成主题色），Web 端始终保持 `gray-3`。

```vue
<template>
  <RebornInputNumber
    v-model="count"
    size="lg"
    color="success"
    shape="square"
  />
</template>
```

:::

::

::warning
`shape` 的默认值两端相反（Web `square` / UniApp `circle`）。跨端复用同一份模板时请显式写出 `shape`，不要依赖默认值。
::

### 数值精度

`precision` 指定保留的小数位数，展示时会定长补零。当 `precision` 小于 `step` 的小数位时，实际精度取 `step` 的小数位，否则步进结果会被截断。

```vue
<template>
  <!-- 展示 1.50，步进后仍保留两位 -->
  <RebornInputNumber
    v-model="amount"
    :precision="2"
    :step="1"
  />

  <!-- precision 传 0，但 step 有 1 位小数，实际精度按 1 位生效 -->
  <RebornInputNumber
    v-model="ratio"
    :precision="0"
    :step="0.1"
  />
</template>
```

::tip
UniApp 端在不传 `precision` 时保留了一条旧行为：`input-type="digit"` 会自动按两位小数补零，`input-type="number"` 则不做定长补零。需要确定精度时显式传 `precision` 覆盖即可。
::

### 只能输入步进倍数（仅 Web）

`step-strictly` 为 `true` 时只接受 `step` 的倍数，键入的非倍数值会在提交（失焦 / 回车）时就近吸附到最近的倍数。UniApp 端没有该属性。

```vue
<template>
  <!-- 输入 13 会被吸附为 15 -->
  <RebornInputNumber
    v-model="count"
    :step="5"
    step-strictly
    :min="0"
    :max="100"
  />
</template>
```

### 绑定值的更新时机（仅 Web）

默认在失焦或按下 Enter 时才写回绑定值。设置 `model-event="input"` 让组件在键入时即时更新。

注意：`input` 模式下键入的值允许临时超出 `min` / `max`，组件会在失焦时统一修正。

UniApp 端没有 `model-event`：键入过程通过独立的 `input` 事件透传原生事件对象，`v-model` 始终在失焦与按钮增减时写回修正后的值。

```vue
<template>
  <RebornInputNumber
    v-model="count"
    model-event="input"
    :min="0"
    :max="100"
  />
</template>
```

### 形态变体

`variant` 两端均提供四种形态，各自负责背景与边框：

| 取值         | 外观                                 | 典型用途                     |
| ------------ | ------------------------------------ | ---------------------------- |
| `outlined`   | 底色 + 四周描边（默认）              | 常规表单                     |
| `filled`     | 灰底填充、无描边，聚焦时转为底色描边 | 灰色背景页面上的表单         |
| `borderless` | 无背景无描边                         | 嵌入已有边框的单元格、卡片内 |
| `underlined` | 仅保留底部下划线                     | 极简风格、行内编辑           |

`underlined` 会强制把圆角压平，此时 `shape` 不再生效，左右按钮之间的竖直分割线也会隐藏。`borderless` 平时没有描边，仅在校验失败时才补一圈描边色，否则错误态不可见。

```vue
<template>
  <RebornInputNumber
    v-model="count"
    variant="filled"
    shape="square"
  />
  <RebornInputNumber
    v-model="count"
    variant="borderless"
  />
  <RebornInputNumber
    v-model="count"
    variant="underlined"
  />
</template>
```

::tip
形态实现细节的端差异不影响用法，但会影响你覆盖样式时的写法：Web 端错误态描边用 `ring-red-5`、深浅色由 `base.css` 的 `.dark` 自动翻转灰阶；UniApp 端错误态用 `ring-error`，且 `theme.css` 没有 `.dark` 代码块，深色适配是逐条写死的 `dark:` 变体。
::

### 键盘与滚轮

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
`keyboard` 默认为 `true`，输入框聚焦后按 ↑ / ↓ 即按 `step` 步进；设为 `false` 后方向键回归原生文本框行为（光标跳到文本首尾）。Enter 提交不受该开关影响。

`change-on-wheel` 默认为 `false`。开启后滚动鼠标滚轮可增减数值，向上滚为增、向下滚为减。为避免误吞页面滚动，它只在输入框已聚焦时才接管滚轮事件。

```vue
<template>
  <!-- 关闭方向键步进 -->
  <RebornInputNumber
    v-model="count"
    :keyboard="false"
  />

  <!-- 聚焦后可用滚轮增减 -->
  <RebornInputNumber
    v-model="count"
    change-on-wheel
    :min="0"
    :max="100"
  />
</template>
```

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
两个属性同名同签名，但受端能力限制：

- `keyboard`**仅 H5 生效**。小程序与 App 的原生输入框不派发 `keydown` 事件，方向键步进在这些端不会发生。
- `change-on-wheel`**为空实现**。小程序与 App 没有鼠标滚轮事件，保留该属性只是为了与 Web 端保持同名同签名，传入不会报错也不会有效果。

```vue
<template>
  <!-- H5 下关闭方向键步进；小程序 / App 下该属性无实际影响 -->
  <RebornInputNumber
    v-model="count"
    :keyboard="false"
  />
</template>
```

:::

::

### 程序化聚焦

两端 `focus()` 的**签名完全一致**：可通过 `cursor` 指定焦点落位，`start` 光标置于文本首、`end` 置于文本尾、`all` 全选文本，不传则沿用平台默认；`focus('all')` 与 `focus({ cursor: 'all' })` 两种写法等价。

```vue
<script setup lang="ts">
import { ref } from "vue";

const count = ref(1234);
const inputRef = ref();

function selectAll() {
  inputRef.value?.focus({ cursor: "all" });
}
</script>

<template>
  <RebornInputNumber
    ref="inputRef"
    v-model="count"
  />
  <button
    type="button"
    @click="selectAll"
  >
    全选
  </button>
</template>
```

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
内部使用 `type="text"` 的原生输入框，落位通过命令式调用 `setSelectionRange` / `select()` 实现，三种 `cursor` 取值都精确可用。同时通过 `inputRef` 暴露原生 input 元素，可直接做更细的原生操作。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
UniApp 的 `<input>` 只能通过 `cursor` / `selection-start` / `selection-end` 属性**声明式**指定落位，无法命令式调用 `setSelectionRange`。组件内部因此先复位、再于下一帧置位，保证连续两次同参调用也能重新触发。不暴露 `inputRef`（UniApp 无原生 DOM 元素可取）。
:::

::

### 前缀与后缀

`prefix` 与 `suffix` 插槽在输入框内部添加固定内容，不参与数值解析，适合货币符号与单位。两端插槽名与行为一致。

```vue
<template>
  <RebornInputNumber
    v-model="price"
    :min="0"
    :step="10"
  >
    <template #prefix>
      <span>￥</span>
    </template>
  </RebornInputNumber>

  <RebornInputNumber
    v-model="weight"
    :min="0"
    :step="0.5"
    :precision="1"
  >
    <template #suffix>
      <span>kg</span>
    </template>
  </RebornInputNumber>
</template>
```

### 文本对齐（仅 Web）

`align` 支持 `left` / `center` / `right`，默认 `center`。UniApp 端输入区固定居中，没有该属性。

```vue
<template>
  <RebornInputNumber
    v-model="price"
    align="right"
  />
</template>
```

### 自定义加减按钮图标

**两端主插槽名一致**：`minus` / `plus`，作用域均提供 `iconClass`（当前尺寸下的图标类名）。插槽替换的只是按钮内部的图标位内容，按钮容器与点击、禁用逻辑仍由组件维护。各端另有一套保留兼容的旧插槽名，仅在未提供 `minus` / `plus` 时作为回退。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
旧插槽名为 `decrement` / `increment`。

```vue
<template>
  <RebornInputNumber v-model="count">
    <template #minus="{ iconClass }">
      <Icon
        name="lucide:heart-minus"
        :class="iconClass"
      />
    </template>
    <template #plus="{ iconClass }">
      <Icon
        name="lucide:heart-plus"
        :class="iconClass"
      />
    </template>
  </RebornInputNumber>
</template>
```

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
旧插槽名为 `decrease-icon` / `increase-icon`。图标通过 UnoCSS 的图标类名渲染，而非 Web 端的 `<Icon name>` 组件。

```vue
<template>
  <RebornInputNumber v-model="count">
    <template #minus="{ iconClass }">
      <view
        class="i-lucide-arrow-left"
        :class="iconClass"
      />
    </template>
    <template #plus="{ iconClass }">
      <view
        class="i-lucide-arrow-right"
        :class="iconClass"
      />
    </template>
  </RebornInputNumber>
</template>
```

:::

::

### 按钮位置与隐藏按钮

`controls-position` 两端同名：不传为左右分列，`left` / `right` 改为在对应侧上下堆叠，并与输入区之间以分割线隔开。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
堆叠按钮**默认隐藏**，悬停或聚焦时从所在侧滑入显示，同时输入框在对应侧让出同宽内边距，居中的文本不会被按钮盖住。

另有 `hide-button`（或 `:controls="false"`）可隐藏按钮，只保留数字输入。

```vue
<template>
  <RebornInputNumber
    v-model="count"
    controls-position="right"
    align="left"
  />
  <RebornInputNumber
    v-model="count"
    controls-position="left"
    align="left"
  />
  <RebornInputNumber
    v-model="count"
    hide-button
    align="left"
  />
</template>
```

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
触屏端没有 hover 态，堆叠按钮为**常显**，不做滑入动画，输入框也不需要让出内边距。

UniApp 端没有 `hide-button` / `controls`，无法隐藏加减按钮；只需要纯数字录入时请改用 `reborn-input`。按钮按下时有 `active:scale-[0.85]` 的缩放反馈（Web 端没有）。

```vue
<template>
  <RebornInputNumber
    v-model="count"
    controls-position="right"
  />
  <RebornInputNumber
    v-model="count"
    controls-position="left"
  />
</template>
```

:::

::

### 长按连续增减（仅 UniApp）

UniApp 端的加减按钮绑定了长按手势：按住不放会连续增减，松手（`touchend` / `touchcancel`）停止。这是触屏端的原生交互习惯，无需任何属性开启。Web 端不提供该行为，连续增减请依赖键盘方向键或滚轮。

### 格式化与解析（仅 Web）

`formatter` 负责把数值转成展示文本，`parser` 负责从展示文本中取回数值，两者必须配对使用。UniApp 端没有这两个属性。

```vue
<template>
  <RebornInputNumber
    v-model="amount"
    :formatter="(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
    :parser="(text) => text.replace(/\$\s?|(,*)/g, '')"
  />
</template>
```

### 深度定制（ui）

`ui` 对象按键位覆盖内部节点类名，可调整高度、宽度、配色甚至隐藏分割线。**两端 `ui` 键名完全一致**，同一份 `ui` 对象可跨端复用（仅具体类名需按各端的 Tailwind 版本与单位调整）。

```vue
<template>
  <RebornInputNumber
    v-model="count"
    :ui="{
      wrapper: 'h-12 w-full rounded-2xl ring-purple-300',
      button: 'text-purple-500 hover:bg-purple-50',
      input: 'font-bold text-purple-700',
      divider: 'hidden',
    }"
  />
</template>
```

## API

::tip
下列属性两端**同名但默认值不同**，跨端复用时建议显式传值：`min`（`Number.MIN_SAFE_INTEGER` / `0`）、`max`（`Number.MAX_SAFE_INTEGER` / `200`）、`shape`（`square` / `circle`）、`readonly`（`false` / `true`，且**语义相反**）、`modelValue` 与 `defaultValue`（`-` / `0`）。
::

### Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### Web 端全部属性

| 属性名               | 类型                                                                                   | 默认值                    | 描述                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`         | `number \| null`                                                                       | `-`                       | 受控值，配合 `v-model` 使用。                                                                                              |
| `defaultValue`       | `number \| null`                                                                       | `-`                       | 非受控默认值，未使用 `v-model` 时作为初始值。                                                                              |
| `min`                | `number`                                                                               | `Number.MIN_SAFE_INTEGER` | 允许的最小值，等于不限制下界。                                                                                             |
| `max`                | `number`                                                                               | `Number.MAX_SAFE_INTEGER` | 允许的最大值，等于不限制上界。                                                                                             |
| `step`               | `number`                                                                               | `1`                       | 每次增减的步进值。                                                                                                         |
| `stepStrictly`       | `boolean`                                                                              | `false`                   | 是否只能取 `step` 的倍数，提交时就近吸附到最近的倍数。                                                                     |
| `precision`          | `number`                                                                               | `-`                       | 数值精度（小数位数）；小于 `step` 的小数位时按 `step` 的小数位生效。                                                       |
| `size`               | `"sm" \| "md" \| "lg"`                                                                 | `"md"`                    | 尺寸档位，对应高度 24 / 32 / 40px。                                                                                        |
| `color`              | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"`               | 聚焦环与按钮悬停的强调色。                                                                                                 |
| `shape`              | `"circle" \| "square"`                                                                 | `"square"`                | 外形轮廓：circle 为胶囊圆角，square 按尺寸取 `rounded-sm` / `rounded-md` / `rounded-lg`；`variant="underlined"` 时不生效。 |
| `variant`            | `"outlined" \| "filled" \| "borderless" \| "underlined"`                               | `"outlined"`              | 形态变体：底色描边 / 灰底填充 / 无边框 / 仅下划线。                                                                        |
| `align`              | `"left" \| "center" \| "right"`                                                        | `"center"`                | 内部输入文本的对齐方式。                                                                                                   |
| `disabled`           | `boolean`                                                                              | `false`                   | 是否禁用（输入框与加减按钮同时禁用）。                                                                                     |
| `readonly`           | `boolean`                                                                              | `false`                   | 原生 readonly 语义：只读，加减按钮同时不可用。                                                                             |
| `controls`           | `boolean`                                                                              | `true`                    | 是否渲染增减控制按钮。                                                                                                     |
| `hideButton`         | `boolean`                                                                              | `false`                   | 是否隐藏增减按钮，与 `:controls="false"` 等效。                                                                            |
| `controlsPosition`   | `"left" \| "right"`                                                                    | `-`                       | 控制按钮位置；不传为左右分列，`left` / `right` 为对应侧上下堆叠（默认隐藏、悬停或聚焦时滑入）。                            |
| `modelEvent`         | `"change" \| "input"`                                                                  | `"change"`                | 绑定值更新时机：`change` 失焦 / 回车提交，`input` 键入即时更新。                                                           |
| `valueOnClear`       | `number \| null \| "min" \| "max"`                                                     | `-`                       | 输入框被清空时回填的值。                                                                                                   |
| `disabledScientific` | `boolean`                                                                              | `false`                   | 禁用科学计数法输入，键入的 `e` / `E` 会被剔除。                                                                            |
| `formatter`          | `(value: number \| string) => string`                                                  | `-`                       | 指定展示值的格式，需与 `parser` 配对。                                                                                     |
| `parser`             | `(text: string) => string`                                                             | `-`                       | 从格式化文本中提取数值，需与 `formatter` 配对。                                                                            |
| `keyboard`           | `boolean`                                                                              | `true`                    | 是否启用 ↑ / ↓ 方向键步进。                                                                                                |
| `changeOnWheel`      | `boolean`                                                                              | `false`                   | 是否启用鼠标滚轮增减；仅在输入框已聚焦时接管滚轮。                                                                         |
| `validateEvent`      | `boolean`                                                                              | `true`                    | 是否触发所在表单项（`RebornFormItem`）的校验。                                                                             |
| `placeholder`        | `string`                                                                               | `-`                       | 输入框占位文本。                                                                                                           |
| `name`               | `string`                                                                               | `-`                       | 等价于原生 input `name`。                                                                                                  |
| `id`                 | `string`                                                                               | `-`                       | 等价于原生 input `id`。                                                                                                    |
| `ariaLabel`          | `string`                                                                               | `-`                       | 等价于原生 input `aria-label`。                                                                                            |
| `inputmode`          | `"none" \| "text" \| "decimal" \| "numeric" \| "tel" \| "search" \| "email" \| "url"`  | `"decimal"`               | 等价于原生 input `inputmode`，决定移动端软键盘类型。                                                                       |
| `tabindex`           | `string \| number`                                                                     | `0`                       | 输入框的 tabindex。                                                                                                        |
| `class`              | `any`                                                                                  | `-`                       | 追加到根节点的自定义类名（宽度默认 `w-full`，需固定宽度时在此传入，如 `w-40`）。                                           |
| `ui`                 | `object`                                                                               | `-`                       | UI 定制对象，键名见「自定义样式（ui）」。                                                                                  |

UniApp 端没有的属性：`stepStrictly`、`align`、`controls`、`hideButton`、`modelEvent`、`valueOnClear`、`disabledScientific`、`formatter`、`parser`、`validateEvent`、`name`、`id`、`ariaLabel`、`inputmode`、`tabindex`、`class`（UniApp 用 `customClass`）。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

#### UniApp 端全部属性

| 属性名             | 类型                                                                                   | 默认值       | 描述                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `modelValue`       | `number`                                                                               | `0`          | 受控值，配合 `v-model` 使用。                                                                             |
| `defaultValue`     | `number`                                                                               | `0`          | 非受控默认值，未使用 `v-model` 时作为初始值。                                                             |
| `min`              | `number`                                                                               | `0`          | 允许的最小值。                                                                                            |
| `max`              | `number`                                                                               | `200`        | 允许的最大值。                                                                                            |
| `step`             | `number`                                                                               | `1`          | 每次增减的步进值。                                                                                        |
| `precision`        | `number`                                                                               | `-`          | 数值精度（小数位数）；不传时 `input-type="digit"` 保留两位小数，`number` 不做定长补零。                   |
| `size`             | `"sm" \| "md" \| "lg"`                                                                 | `"md"`       | 尺寸档位，高度取字号令牌两倍，对应 52 / 56 / 64rpx。                                                      |
| `color`            | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"`  | 聚焦环、按钮悬停与分割线的强调色。                                                                        |
| `shape`            | `"circle" \| "square"`                                                                 | `"circle"`   | 外形轮廓：circle 为胶囊圆角，square 为 `rounded-md`；`variant="underlined"` 时不生效。                    |
| `variant`          | `"outlined" \| "filled" \| "borderless" \| "underlined"`                               | `"outlined"` | 形态变体：白底描边 / 灰底填充 / 无边框 / 仅下划线。                                                       |
| `disabled`         | `boolean`                                                                              | `false`      | 是否禁用（输入框与加减按钮同时禁用）。                                                                    |
| `readonly`         | `boolean`                                                                              | `true`       | **与原生 readonly 语义相反**：默认 `true` 表示允许直接键入，设为 `false` 后输入框只读、仅能通过按钮增减。 |
| `controlsPosition` | `"left" \| "right"`                                                                    | `-`          | 控制按钮位置；不传为左右分列，`left` / `right` 为对应侧上下堆叠（触屏无 hover，堆叠按钮常显）。           |
| `inputType`        | `"number" \| "digit"`                                                                  | `"number"`   | 原生键盘类型：`digit` 为带小数点键盘，且不传 `precision` 时自动保留两位小数。                             |
| `keyboard`         | `boolean`                                                                              | `true`       | 是否启用 ↑ / ↓ 方向键步进。**端能力限制：仅 H5 生效**，小程序与 App 的原生输入框不派发 `keydown`。        |
| `changeOnWheel`    | `boolean`                                                                              | `false`      | 与 Web 端保持同名同签名的占位属性，**UniApp 侧为空实现**（无鼠标滚轮事件）。                              |
| `placeholder`      | `string`                                                                               | `""`         | 输入框占位文本。                                                                                          |
| `customClass`      | `any`                                                                                  | `-`          | 追加到根节点的自定义类名（对应 Web 端 `class`）。                                                         |
| `ui`               | `object`                                                                               | `{}`         | UI 定制对象，键名见「自定义样式（ui）」。                                                                 |

Web 端没有的属性：`inputType`、`customClass`（Web 用 `class`）。另有 `readonly` 虽两端同名，但 UniApp 侧语义与默认值都与 Web 相反。
:::

::

### Emits

`update:modelValue` / `change` / `focus` / `blur` 四个事件两端都有，但**参数形态不同**，且 UniApp 端额外提供一个原生 `input` 事件。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: number \| null)` | 绑定值更新时触发，时机由 `modelEvent` 决定。 |
| `change` | `(value: number \| null, oldValue: number \| null)` | 绑定值真正发生变化时触发，同时给出变化前的值。 |
| `focus` | `(event: FocusEvent)` | 输入框获得焦点时触发，透传原生事件对象。 |
| `blur` | `(event: FocusEvent)` | 输入框失焦并完成数值修正后触发。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: number)` | 绑定值更新时触发，值已经过 `min` / `max` 与精度修正。 |
| `change` | `(value: number)` | 绑定值发生变化时触发，**只有一个参数，不提供 `oldValue`**。 |
| `input` | `(event: Event)` | 键入过程中透传原生 input 事件对象，此时数值**尚未**做范围与精度修正。 |
| `focus` | `(event: Event)` | 输入框获得焦点时触发，透传 UniApp 的事件对象。 |
| `blur` | `(event: Event)` | 输入框失焦并完成数值修正后触发。 |
:::

::

### Slots

**主插槽名与作用域参数两端完全一致**：`minus` / `plus`（均带 `{ iconClass }`）与 `prefix` / `suffix`。仅「保留兼容的旧插槽名」两端不同。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `minus` | `{ iconClass }` | 替换减按钮内的图标，`iconClass` 为当前尺寸的图标类名。 |
| `plus` | `{ iconClass }` | 替换加按钮内的图标，`iconClass` 为当前尺寸的图标类名。 |
| `prefix` | `-` | 输入框内的头部内容，不参与数值解析。 |
| `suffix` | `-` | 输入框内的尾部内容，不参与数值解析。 |
| `decrement` | `{ iconClass }` | 旧插槽名，等价于 `minus`，仅在未提供 `minus` 时回退使用。 |
| `increment` | `{ iconClass }` | 旧插槽名，等价于 `plus`，仅在未提供 `plus` 时回退使用。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `minus` | `{ iconClass }` | 替换减按钮内的图标，`iconClass` 为当前尺寸的图标类名。 |
| `plus` | `{ iconClass }` | 替换加按钮内的图标，`iconClass` 为当前尺寸的图标类名。 |
| `prefix` | `-` | 输入框内的头部内容，不参与数值解析。 |
| `suffix` | `-` | 输入框内的尾部内容，不参与数值解析。 |
| `decrease-icon` | `{ iconClass }` | 旧插槽名，等价于 `minus`，仅在未提供 `minus` 时回退使用。 |
| `increase-icon` | `{ iconClass }` | 旧插槽名，等价于 `plus`，仅在未提供 `plus` 时回退使用。 |
:::

::

### Exposes

`focus` 与 `blur` 两端**同名同签名**，唯一区别是 Web 端额外暴露原生元素引用。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 名称 | 类型 | 描述 |
| --- | --- | --- |
| `focus` | `(options?: "start" \| "end" \| "all" \| { cursor?: "start" \| "end" \| "all" }) => void` | 使输入框获得焦点；`cursor` 决定落位：`start` 置首、`end` 置尾、`all` 全选，不传则沿用浏览器默认。 |
| `blur` | `() => void` | 使输入框失去焦点。 |
| `inputRef` | `Ref<HTMLInputElement \| null>` | 内部原生 input 元素的引用。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 名称 | 类型 | 描述 |
| --- | --- | --- |
| `focus` | `(options?: "start" \| "end" \| "all" \| { cursor?: "start" \| "end" \| "all" }) => void` | 使输入框获得焦点；落位通过 `cursor` / `selection-start` / `selection-end` 属性声明式实现。 |
| `blur` | `() => void` | 使输入框失去焦点。 |

UniApp 无原生 DOM 元素可取，因此不提供 `inputRef`。
:::

::

### 自定义样式（ui）

**两端 `ui` 键名完全一致**，共 9 个键，无需分端查看。

| 键名          | 说明                                                      |
| ------------- | --------------------------------------------------------- |
| `wrapper`     | 最外层容器，控制背景、边框、圆角、宽度等。                |
| `button`      | 左右分列布局下的加减按钮容器。                            |
| `stack`       | `controls-position="left" / "right"` 时堆叠按钮组的容器。 |
| `stackButton` | 堆叠布局下的单个按钮。                                    |
| `input`       | 中间输入框，控制文字样式。                                |
| `divider`     | 按钮与输入区之间的竖直分割线。                            |
| `prefix`      | 输入框内的前缀区（`prefix` 插槽的容器）。                 |
| `suffix`      | 输入框内的后缀区（`suffix` 插槽的容器）。                 |
| `icon`        | 加减图标，控制大小（如 `size-5`）或颜色。                 |

### 设计令牌

两端的尺寸都走设计令牌，但**令牌体系不同**：Web 端有独立的输入框高度 / 内边距 / 图标令牌（px），UniApp 端直接从字号令牌派生高度（rpx）。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
定义于 `app/assets/theme/typography.css`：

| 令牌                        | sm     | md     | lg     | 用途                                         |
| :-------------------------- | :----- | :----- | :----- | :------------------------------------------- |
| `--height-input-*`          | `24px` | `32px` | `40px` | 输入框高度（分列按钮宽度取同值，保证正方形） |
| `--spacing-input-px-*`      | `10px` | `12px` | `16px` | 输入区水平内边距                             |
| `--size-input-icon-*`       | `10px` | `12px` | `16px` | 加减图标尺寸                                 |
| `--text-base` / `--text-lg` | `14px` | `14px` | `16px` | 输入文字字号（sm 与 md 同为 14px）           |

另有一个组件内部变量 `--stack-w`：由 `size` 变体写入，值等于当前档位的 `--height-input-*`，用于确定堆叠按钮组的宽度以及输入框滑入时让出的内边距。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
定义于 `packages/uniapp-project/src/styles/theme.css`：

| 令牌                       | sm         | md       | lg       | 用途                                     |
| :------------------------- | :--------- | :------- | :------- | :--------------------------------------- |
| `--text-size-26 / 28 / 32` | `26rpx`    | `28rpx`  | `32rpx`  | 输入文字字号                             |
| 高度（派生值）             | `52rpx`    | `56rpx`  | `64rpx`  | 由 `calc(字号 * 2)` 得出，无独立高度令牌 |
| 输入区宽度（派生值）       | `65rpx`    | `70rpx`  | `160rpx` | 由 `calc(字号 * 2.5)`（lg 为 `* 5`）得出 |
| 图标类名                   | `size-3.5` | `size-4` | `size-5` | 加减图标尺寸，直接写类名而非令牌         |

::warning
`theme.css` 里的 `--input-sm/md/lg-height`（80 / 90 / 96rpx）属于 `reborn-input`，**本组件并不使用**。覆盖数字输入框高度请改 `ui.wrapper` 或 `--text-size-*`。
::
:::

::

## 两端差异对照

| 维度                          | Web                                                                 | UniApp                                       |
| ----------------------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| 默认宽度                      | `w-full` 撑满父容器，固定宽度靠 `class` 传入                        | `inline-flex` 内容宽度，输入区宽度由字号派生 |
| `min` / `max` 默认值          | `Number.MIN_SAFE_INTEGER` / `Number.MAX_SAFE_INTEGER`               | `0` / `200`                                  |
| `modelValue` / `defaultValue` | `number \| null`，无默认值                                          | `number`，默认 `0`                           |
| `shape` 默认值                | `square`                                                            | `circle`                                     |
| `square` 圆角                 | 按尺寸取 `rounded-sm / xs / sm`                                     | 统一 `rounded-md`                            |
| `readonly`                    | 原生语义，默认 `false`                                              | **语义相反**，默认 `true` 表示可键入         |
| 文本对齐                      | `align` 支持 left / center / right                                  | 固定居中，无 `align`                         |
| 隐藏按钮                      | `hide-button` / `:controls="false"`                                 | 不支持                                       |
| 堆叠按钮显隐                  | 默认隐藏，悬停 / 聚焦时滑入并让出内边距                             | 常显，无滑入动画                             |
| 按钮按压反馈                  | 无                                                                  | `active:scale-[0.85]` 缩放                   |
| 长按连续增减                  | 不支持                                                              | 支持（`touchstart` 长按，松手停止）          |
| 方向键步进                    | 全平台可用                                                          | 仅 H5 可用                                   |
| 滚轮增减                      | `change-on-wheel` 可用                                              | 属性存在但为空实现                           |
| 步进倍数吸附                  | `step-strictly`                                                     | 不支持                                       |
| 提交时机                      | `model-event` 可选 change / input                                   | 固定失焦提交，键入过程走 `input` 事件        |
| 格式化                        | `formatter` / `parser`                                              | 不支持                                       |
| 表单校验                      | `validate-event` 可关闭                                             | 失焦后无条件触发校验                         |
| `change` 参数                 | `(value, oldValue)`                                                 | `(value)`                                    |
| 原生 `input` 事件             | 不对外派发                                                          | 派发（未修正的原始值）                       |
| `focus` 实现                  | 命令式 `setSelectionRange`                                          | 声明式 `cursor` / `selection-*` 属性         |
| `inputRef`                    | 暴露原生 input 元素                                                 | 不提供                                       |
| 旧插槽名                      | `decrement` / `increment`                                           | `decrease-icon` / `increase-icon`            |
| 图标写法                      | `<Icon name="lucide:*">`                                            | `<view class="i-lucide-*">`                  |
| 尺寸令牌                      | `--height-input-*` 等独立 px 令牌                                   | 由 `--text-size-*` 派生 rpx                  |
| 错误态描边                    | `ring-red-5`                                                        | `ring-error`                                 |
| 分割线                        | 固定 `gray-3`，不随 `color` 变化                                    | 聚焦时染成 `color` 主题色                    |
| 深色模式                      | `base.css` 的 `.dark` 自动翻转灰阶                                  | 无 `.dark` 块，逐条写死 `dark:` 变体         |
| Tailwind 版本                 | v4（`border-b-1` 可用；圆角走 `base.css` 覆盖后的原生 `rounded-*`） | v3（须写 `border-b`）                        |

## 注意事项

- **宽度策略两端不同。** Web 端默认 `w-full` 撑满父容器，需要固定宽度时通过 `class`（如 `w-40`）或 `ui.wrapper` 传入；UniApp 端为内容宽度，输入区宽度由字号派生，需要更宽时改 `ui.input`。
- **`min` / `max` 必须显式传入。** 两端默认值差异极大（不限制 vs `0`–`200`），依赖默认值的代码跨端后会在 200 处静默截断。
- **`readonly` 在 UniApp 端语义相反。** Web 端 `readonly` 为原生语义（只读且按钮禁用）；UniApp 端默认 `true` 表示**允许**键入，设为 `false` 才变成只读、仅能按按钮增减。这条最容易踩，跨端代码里建议避免使用该属性。
- **`shape` 默认值相反。** Web `square`、UniApp `circle`，跨端模板请显式书写。
- **`variant="underlined"` 会压平圆角并隐藏分割线**，此时传 `shape` 不会有任何效果。
- **`variant="borderless"` 平时没有描边**，仅在校验失败时才补一圈描边色，否则错误态完全不可见。
- **`precision` 与 `step` 冲突时以 `step` 的小数位优先**：`precision` 小于 `step` 的小数位会被提升，否则步进结果会被截断。UniApp 端不传 `precision` 且 `input-type="digit"` 时按两位小数补零。
- **`change-on-wheel` 只在输入框已聚焦时接管滚轮**（Web），未聚焦时滚轮照常滚动页面，不会出现「鼠标划过输入框导致数值乱跳」；UniApp 端该属性为空实现。
- **`keyboard="false"` 只关闭 ↑ / ↓ 步进**，Enter 提交仍然生效（Web 端提交时机由 `model-event` 决定）；UniApp 端方向键步进本身仅在 H5 生效。
- **`model-event="input"` 下键入的值允许临时超出 `min` / `max`**，失焦时才统一修正；业务若在 `watch` 中直接消费绑定值，需自行处理这段越界窗口。
- **`step-strictly` 采用「就近吸附」而非拒绝输入**：键入 13、`step` 为 5 时提交后为 15。
- **`formatter` 与 `parser` 必须配对使用**，只传其一会导致展示文本无法被解析回数值。
- **插槽优先用两端一致的 `minus` / `plus`。** 旧名（Web `decrement` / `increment`、UniApp `decrease-icon` / `increase-icon`）仅作回退保留，新代码不要再使用，否则跨端时需要写两套模板。
