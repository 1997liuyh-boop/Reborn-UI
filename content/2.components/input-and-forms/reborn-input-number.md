---
title: 数字输入框
description: 用于在最小最大值范围内按步进增减数值的双端数字输入组件。
category: 表单与输入
tags: [css, tailwind, input-number, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornInputNumberDemo.vue" config="RebornInputNumberConfig" componentId="reborn-input-number" :componentFiles='["RebornInputNumber.vue", "reborn-input-number.config.ts"]' :uniappFiles='["RebornInputNumber.vue", "reborn-input-number.config.ts"]'}
::

## 简介

数字输入框在 `min` / `max` 范围内按 `step` 步进增减数值：默认左右为减/加按钮，中间为数字输入区，达到边界后对应按钮自动禁用。宽度默认撑满父容器（`w-full`），需要固定宽度时由外部传入 `class`。

支持 `v-model` 受控与 `defaultValue` 非受控两种用法；`precision` 控制小数位，`step-strictly` 限制只能取步进倍数，`model-event` 决定绑定值是失焦提交还是键入即时更新，`variant` 提供 outlined / filled / borderless / underlined 四种形态。web 与 uniapp 双端可用，uniapp 端还支持长按按钮连续增减。

适用场景：

- 购物车、库存等数量增减场景。
- 需要限定 `min` / `max` / `step`，或需要固定小数位的数值录入。
- 需要在输入框内附带货币符号、单位等前后缀（`prefix` / `suffix` 插槽）。
- 需要自定义加减按钮图标（web 端 `plus` / `minus` 插槽，uniapp 端 `decrease-icon` / `increase-icon` 插槽）。
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
  <RebornInputNumber v-model="count" :min="0" :max="20" :step="5" />
</template>
```

### 尺寸、颜色与形状

`size` 支持 `sm` / `md` / `lg` 三档，分别对应高度 24 / 32 / 40px、字号 12 / 14 / 16px 与图标 10 / 12 / 16px（取自 `app/assets/theme/typography.css` 的设计令牌）。`color` 影响聚焦环与按钮悬停色；`shape` 支持 `circle`（胶囊圆角）与 `square`（方角）。

```vue
<template>
  <RebornInputNumber v-model="count" size="lg" color="success" shape="square" />
</template>
```

### 数值精度

`precision` 指定保留的小数位数，展示时会定长补零。当 `precision` 小于 `step` 的小数位时，实际精度取 `step` 的小数位，否则步进结果会被截断。

```vue
<template>
  <!-- 展示 1.50，步进后仍保留两位 -->
  <RebornInputNumber v-model="amount" :precision="2" :step="1" />

  <!-- precision 传 0，但 step 有 1 位小数，实际精度按 1 位生效 -->
  <RebornInputNumber v-model="ratio" :precision="0" :step="0.1" />
</template>
```

### 只能输入步进倍数

`step-strictly` 为 `true` 时只接受 `step` 的倍数，键入的非倍数值会在提交（失焦 / 回车）时就近吸附到最近的倍数。

```vue
<template>
  <!-- 输入 13 会被吸附为 15 -->
  <RebornInputNumber v-model="count" :step="5" step-strictly :min="0" :max="100" />
</template>
```

### 绑定值的更新时机

默认在失焦或按下 Enter 时才写回绑定值。设置 `model-event="input"` 让组件在键入时即时更新。

注意：`input` 模式下键入的值允许临时超出 `min` / `max`，组件会在失焦时统一修正。

```vue
<template>
  <RebornInputNumber v-model="count" model-event="input" :min="0" :max="100" />
</template>
```

### 形态变体

`variant` 提供四种形态，各自负责背景与边框：

| 取值 | 外观 | 典型用途 |
| --- | --- | --- |
| `outlined` | 白底 + 四周描边（默认） | 常规表单 |
| `filled` | 灰底填充、无描边，聚焦时转为白底描边 | 灰色背景页面上的表单 |
| `borderless` | 无背景无描边 | 嵌入已有边框的单元格、卡片内 |
| `underlined` | 仅保留底部下划线 | 极简风格、行内编辑 |

`underlined` 会强制把圆角压平，此时 `shape` 不再生效，左右按钮之间的竖直分割线也会隐藏。

```vue
<template>
  <RebornInputNumber v-model="count" variant="filled" shape="square" />
  <RebornInputNumber v-model="count" variant="borderless" />
  <RebornInputNumber v-model="count" variant="underlined" align="left" />
</template>
```

### 键盘与滚轮

`keyboard` 默认为 `true`，输入框聚焦后按 ↑ / ↓ 即按 `step` 步进；设为 `false` 后方向键回归原生文本框行为（光标跳到文本首尾）。Enter 提交不受该开关影响。

`change-on-wheel` 默认为 `false`。开启后滚动鼠标滚轮可增减数值，向上滚为增、向下滚为减。为避免误吞页面滚动，它只在输入框已聚焦时才接管滚轮事件。

```vue
<template>
  <!-- 关闭方向键步进 -->
  <RebornInputNumber v-model="count" :keyboard="false" />

  <!-- 聚焦后可用滚轮增减 -->
  <RebornInputNumber v-model="count" change-on-wheel :min="0" :max="100" />
</template>
```

### 程序化聚焦

组件暴露 `focus()`，可通过 `cursor` 指定焦点落位：`start` 光标置于文本首，`end` 置于文本尾，`all` 全选文本。不传则沿用浏览器默认行为。`focus('all')` 与 `focus({ cursor: 'all' })` 两种写法等价。

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
  <RebornInputNumber ref="inputRef" v-model="count" />
  <button type="button" @click="selectAll">全选</button>
</template>
```

### 前缀与后缀

`prefix` 与 `suffix` 插槽在输入框内部添加固定内容，不参与数值解析，适合货币符号与单位。

```vue
<template>
  <RebornInputNumber v-model="price" :min="0" :step="10" align="right">
    <template #prefix>
      <span>￥</span>
    </template>
  </RebornInputNumber>

  <RebornInputNumber v-model="weight" :min="0" :step="0.5" :precision="1" align="right">
    <template #suffix>
      <span>kg</span>
    </template>
  </RebornInputNumber>
</template>
```

### 自定义加减按钮图标

两端插槽名不同。web 端为 `minus` / `plus`（旧名 `decrement` / `increment` 仍兼容），作用域提供 `iconClass`（当前尺寸下的图标类名）；uniapp 端为 `decrease-icon` / `increase-icon`。插槽替换的都是按钮内部的图标位内容，按钮容器与点击、禁用逻辑仍由组件维护。

```vue
<template>
  <!-- web 端 -->
  <RebornInputNumber v-model="count">
    <template #minus="{ iconClass }">
      <Icon name="lucide:heart-minus" :class="iconClass" />
    </template>
    <template #plus="{ iconClass }">
      <Icon name="lucide:heart-plus" :class="iconClass" />
    </template>
  </RebornInputNumber>
</template>
```

```vue
<template>
  <!-- uniapp 端 -->
  <RebornInputNumber v-model="count">
    <template #decrease-icon>
      <view class="i-lucide-arrow-left size-5" />
    </template>
    <template #increase-icon>
      <view class="i-lucide-arrow-right size-5" />
    </template>
  </RebornInputNumber>
</template>
```

### 按钮位置与隐藏按钮

默认加减按钮左右分列。`controls-position` 支持 `left` / `right`，改为在对应侧上下堆叠；堆叠时按钮默认隐藏，悬停或聚焦时从所在侧滑入显示，并与输入区之间以分割线隔开。`hide-button`（或 `:controls="false"`）隐藏按钮，只保留数字输入。

```vue
<template>
  <RebornInputNumber v-model="count" controls-position="right" align="left" />
  <RebornInputNumber v-model="count" controls-position="left" align="left" />
  <RebornInputNumber v-model="count" hide-button align="left" />
</template>
```

### 格式化与解析

`formatter` 负责把数值转成展示文本，`parser` 负责从展示文本中取回数值，两者必须配对使用。

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

`ui` 对象按键位覆盖内部节点类名，可调整高度、宽度、配色甚至隐藏分割线。

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

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `number \| null` | web `-`；uniapp `0` | 受控值，配合 `v-model` 使用。 |
| `defaultValue` | `number \| null` | web `-`；uniapp `0` | 非受控默认值。 |
| `min` | `number` | web `Number.MIN_SAFE_INTEGER`；uniapp `0` | 允许的最小值。 |
| `max` | `number` | web `Number.MAX_SAFE_INTEGER`；uniapp `200` | 允许的最大值。 |
| `step` | `number` | `1` | 步进值。 |
| `stepStrictly` | `boolean` | `false` | 仅 web。是否只能取 `step` 的倍数，提交时就近吸附。 |
| `precision` | `number` | `-` | 仅 web。数值精度（小数位数）；小于 `step` 的小数位时按 `step` 的小数位生效。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小，对应高度 24 / 32 / 40px。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 聚焦与按钮强调色。 |
| `shape` | `"circle" \| "square"` | `"circle"` | 外形轮廓：circle 为胶囊圆角，square 为方角；`variant="underlined"` 时不生效。 |
| `variant` | `"outlined" \| "filled" \| "borderless" \| "underlined"` | `"outlined"` | 仅 web。形态变体：白底描边 / 灰底填充 / 无边框 / 仅下划线。 |
| `keyboard` | `boolean` | `true` | 仅 web。是否启用 ↑ / ↓ 方向键步进。 |
| `changeOnWheel` | `boolean` | `false` | 仅 web。是否启用鼠标滚轮增减；仅在输入框已聚焦时生效。 |
| `align` | `"left" \| "center" \| "right"` | `"center"` | 仅 web。内部输入文本的对齐方式。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `controls` | `boolean` | `true` | 仅 web。是否使用增减控制按钮。 |
| `hideButton` | `boolean` | `false` | 仅 web。是否隐藏增减按钮，与 `:controls="false"` 等效。 |
| `controlsPosition` | `"left" \| "right"` | `-` | 通用。控制按钮位置；不传为左右分列，`left` / `right` 为对应侧上下堆叠。web 端堆叠按钮默认隐藏、悬停或聚焦时滑入显示；uniapp 端触屏无 hover，堆叠按钮常显。 |
| `modelEvent` | `"change" \| "input"` | `"change"` | 仅 web。绑定值更新时机：`change` 失焦 / 回车提交，`input` 键入即时更新。 |
| `valueOnClear` | `number \| null \| "min" \| "max"` | `-` | 仅 web。输入框被清空时回填的值。 |
| `disabledScientific` | `boolean` | `false` | 仅 web。禁用科学计数法输入，键入的 `e` / `E` 会被剔除。 |
| `formatter` | `(value: number \| string) => string` | `-` | 仅 web。指定展示值的格式，需与 `parser` 配对。 |
| `parser` | `(text: string) => string` | `-` | 仅 web。从格式化文本中提取数值，需与 `formatter` 配对。 |
| `validateEvent` | `boolean` | `true` | 仅 web。是否触发所在表单项的校验。 |
| `readonly` | `boolean` | web `false`；uniapp `true` | web 为原生 readonly 语义（只读，按钮也不可用）；**uniapp 与原生语义相反**，默认 `true` 表示允许键入。 |
| `placeholder` | `string` | web `-`；uniapp `""` | 输入框占位文本。 |
| `name` | `string` | `-` | 仅 web。等价于原生 input `name`。 |
| `id` | `string` | `-` | 仅 web。等价于原生 input `id`。 |
| `ariaLabel` | `string` | `-` | 仅 web。等价于原生 input `aria-label`。 |
| `inputmode` | `"none" \| "text" \| "decimal" \| "numeric" \| "tel" \| "search" \| "email" \| "url"` | `"decimal"` | 仅 web。等价于原生 input `inputmode`。 |
| `tabindex` | `string \| number` | `0` | 仅 web。输入框的 tabindex。 |
| `inputType` | `"number" \| "digit"` | `"number"` | 仅 uniapp。键盘类型：digit 为带小数点键盘，且数值自动保留两位小数。 |
| `class` | `any` | `-` | 仅 web。追加到根节点的自定义类名（宽度默认 `w-full`，需固定宽度时在此传入）。 |
| `customClass` | `any` | `-` | 仅 uniapp。追加到根节点的自定义类名。 |
| `ui` | `object` | `{}` | UI 定制对象，详见下表。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `number \| null` | 绑定值更新时触发，时机由 `modelEvent` 决定（uniapp 端为经 min/max 修正后的值）。 |
| `change` | web `(value, oldValue)`；uniapp `number` | 绑定值真正发生变化时触发。 |
| `focus` | `FocusEvent` | 输入框获得焦点时触发（uniapp 当前版本预留，未实际触发）。 |
| `blur` | `FocusEvent` | 输入框失焦并完成数值修正后触发。 |
| `input` | `Event` | 仅 uniapp。键入时透传原生 input 事件对象（此时数值尚未修正）。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `minus` | `{ iconClass }` | 仅 web。替换减按钮内的图标，`iconClass` 为当前尺寸的图标类名。 |
| `plus` | `{ iconClass }` | 仅 web。替换加按钮内的图标，`iconClass` 为当前尺寸的图标类名。 |
| `prefix` | `-` | 仅 web。输入框内的头部内容，不参与数值解析。 |
| `suffix` | `-` | 仅 web。输入框内的尾部内容，不参与数值解析。 |
| `decrement` | `{ iconClass }` | 仅 web，旧插槽名，等价于 `minus`，保留以兼容既有用法。 |
| `increment` | `{ iconClass }` | 仅 web，旧插槽名，等价于 `plus`，保留以兼容既有用法。 |
| `decrease-icon` | `-` | 仅 uniapp。替换减按钮内的图标，按钮与点击逻辑保留。 |
| `increase-icon` | `-` | 仅 uniapp。替换加按钮内的图标，按钮与点击逻辑保留。 |

### Exposes

| 名称 | 类型 | 描述 |
| --- | --- | --- |
| `focus` | `(options?: "start" \| "end" \| "all" \| { cursor?: "start" \| "end" \| "all" }) => void` | 仅 web。使输入框获得焦点；`cursor` 决定焦点落位：`start` 光标置首、`end` 置尾、`all` 全选文本，不传则沿用浏览器默认。 |
| `blur` | `() => void` | 仅 web。使输入框失去焦点。 |
| `inputRef` | `Ref<HTMLInputElement \| null>` | 仅 web。内部原生 input 元素的引用。 |

### 自定义样式（ui）

| 键名 | 说明 |
| --- | --- |
| `wrapper` | 最外层容器，控制背景、边框、圆角、宽度等。 |
| `button` | 左右分列布局下的加减按钮容器。 |
| `stack` | 通用。`controls-position="left" / "right"` 时堆叠按钮组的容器。 |
| `stackButton` | 通用。堆叠布局下的单个按钮。 |
| `input` | 中间输入框，控制文字样式。 |
| `divider` | 分割线。 |
| `prefix` | 仅 web。输入框内的前缀区。 |
| `suffix` | 仅 web。输入框内的后缀区。 |
| `icon` | 加减图标，控制大小（如 `size-5`）或颜色。 |

### 设计令牌

web 端尺寸取自 `app/assets/theme/typography.css`：

| 令牌 | sm | md | lg | 用途 |
| :--- | :--- | :--- | :--- | :--- |
| `--height-input-*` | `24px` | `32px` | `40px` | 输入框高度 |
| `--spacing-input-px-*` | `10px` | `12px` | `16px` | 水平内边距 |
| `--size-input-icon-*` | `10px` | `12px` | `16px` | 加减图标尺寸 |
| `--text-sm` / `--text-base` / `--text-lg` | `12px` | `14px` | `16px` | 输入文字字号 |

uniapp 端使用下列响应式变量（定义于 `packages/uniapp-project/src/styles/theme.css`）：

| 变量名 | 描述 | 移动端值 (默认) | 桌面端值 (min-width: 768px) |
| :--- | :--- | :--- | :--- |
| `--input-lg-height` | 大尺寸输入框高度 | `96px` | `48px` |
| `--input-md-height` | 中尺寸输入框高度 | `90px` | `45px` |
| `--input-sm-height` | 小尺寸输入框高度 | `80px` | `40px` |

## 注意事项

- 宽度默认 `w-full` 撑满父容器，组件自身不设固定宽度；需要固定宽度时通过 `class`（如 `w-40`）或 `ui.wrapper` 传入。
- `variant="underlined"` 会强制压平圆角并隐藏按钮间的竖直分割线，此时传 `shape` 不会有效果。
- `variant="borderless"` 平时没有描边，仅在表单校验失败时才补一圈红色描边，否则错误态无法被看见。
- `change-on-wheel` 只在输入框已聚焦时接管滚轮；未聚焦时滚轮照常滚动页面，不会出现「鼠标划过输入框导致数值乱跳」的问题。
- `keyboard="false"` 只关闭 ↑ / ↓ 步进，Enter 提交仍然生效（提交时机由 `model-event` 决定）。
- `focus()` 的 `cursor` 依赖 `setSelectionRange`，组件内部使用 `type="text"` 的原生输入框，因此三种落位方式都可用。
- web、uniapp 双端可用，但插槽名不同：web 端 `minus` / `plus`（旧名 `decrement` / `increment` 仍兼容），uniapp 端 `decrease-icon` / `increase-icon`。
- `precision` 与 `step` 冲突时以 `step` 的小数位优先：`precision` 小于 `step` 的小数位会被提升，否则步进结果会被截断。
- `model-event="input"` 下键入的值允许临时超出 `min` / `max`，失焦时才统一修正；若业务在 `watch` 中直接消费绑定值，需自行考虑这段越界窗口。
- `step-strictly` 采用「就近吸附」而非拒绝输入：键入 13、`step` 为 5 时提交后为 15。
- `formatter` 与 `parser` 必须配对使用，只传其一会导致展示文本无法被解析回数值。
- web 端 `readonly` 为原生语义（只读，按钮同时禁用）；uniapp 端 `readonly` 与原生语义相反，默认 `true` 表示允许直接键入，设为 `false` 后仅能通过按钮增减。
- uniapp 端 `min` 默认 0、`max` 默认 200；web 端默认取 `Number.MIN_SAFE_INTEGER` / `Number.MAX_SAFE_INTEGER`，即不限制。业务范围不同时必须显式传入。
- `inputType`（仅 uniapp）仅支持 `digit` / `number` 两种；digit 模式下数值自动保留两位小数。
- uniapp 端按住加减按钮可长按连续增减；`focus` 事件当前未实际触发（预留）。
