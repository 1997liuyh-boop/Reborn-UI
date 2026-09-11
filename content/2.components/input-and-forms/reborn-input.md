---
title: input 输入框
description: 用于文本录入的双端输入框组件，支持圆角胶囊样式、多尺寸、清除与密码态。
category: 表单与输入
tags: [css, tailwind, input, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornInputDemo.vue" config="RebornInputConfig" componentId="reborn-input" :componentFiles='["RebornInput.vue", "reborn-input.config.ts"]' :uniappFiles='["RebornInput.vue", "reborn-input.config.ts"]'}
::

## 简介

Input 是 Web 与 UniApp 双端可用的基础输入框：`v-model` 绑定输入值，内置清除按钮、密码明文/密文切换、聚焦高亮配色与前后缀插槽。Web 端还可通过 `type="textarea"` 渲染多行文本，并支持 `v-model` 的 `.trim` / `.number` 修饰符；UniApp 端提供 `confirmType`、`adjustPosition`、`holdKeyboard` 等原生键盘控制能力。两端都能放入 `RebornForm` 表单参与校验。

适用场景：

- 表单中录入文本、密码等单行内容。
- 需要前后缀图标或按钮（`prefix` / `suffix` 插槽）的输入框。
- Web 端通过 `type="textarea"` 的多行输入（`rows` 默认 2）。
- UniApp 端需要 `confirmType`、`adjustPosition`、`holdKeyboard` 等键盘控制时。

不适用场景：

- 数字步进增减，改用 `reborn-input-number`。
- 验证码分格输入，改用 `reborn-input-otp`。
- 带历史记录、推荐词下拉的搜索，改用 `reborn-search-box`。

## 用法

### 基础用法

`v-model` 绑定输入值；`clearable` 开启后在有内容时显示清除按钮，点击清空并触发 `clear` 事件；`disabled` / `readonly` 控制禁用与只读。这段写法两端通用。

```vue
<script setup lang="ts">
import { ref } from "vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";

const keyword = ref("");
</script>

<template>
  <RebornInput
    v-model="keyword"
    placeholder="请输入关键词"
    clearable
  />
  <RebornInput
    model-value="只读内容"
    readonly
  />
  <RebornInput
    placeholder="禁用状态"
    disabled
  />
</template>
```

### 多行文本

两端都用 `type="textarea"` 切多行，但高度策略不同。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
行数由 `rows` 控制（旧属性 `as="textarea"` 仍兼容）；`autosize` 让高度随内容自适应，可传 `{ minRows, maxRows }` 限定范围；`resize` 控制是否允许用户拖拽缩放。

```vue
<template>
  <RebornInput v-model="remark" type="textarea" :rows="3" placeholder="备注" />
  <RebornInput v-model="remark" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" placeholder="高度自适应" />
  <RebornInput v-model="remark" type="textarea" resize="none" placeholder="禁止缩放" />
</template>
```
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
原生 `textarea` 没有 `rows`，`rows` 只作为参考行数用于估算固定高度；`autosize` 传布尔值映射为原生 `auto-height`，`{ minRows, maxRows }` 对象形式仅为与 Web 端同签名，**不会生效**；没有 `resize`（小程序不支持用户拖拽缩放）。

```vue
<template>
  <view class="p-[24rpx]">
    <RebornInput v-model="remark" type="textarea" :rows="3" placeholder="备注" />
    <RebornInput v-model="remark" type="textarea" autosize placeholder="高度自适应" />
  </view>
</template>
```
:::

::

### 尺寸、形态与外形

`size`（`sm` / `md` / `lg`）、`color`（7 档语义色）、`variant`（`outlined` / `filled` / `borderless` / `underlined`）、`shape`（`square` / `circle`）四个属性两端同名同义，**但 `size` 与 `variant` 的默认值不同**。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
默认 `size="md"`、`variant="outlined"`。字号 sm/md 14px、lg 16px；`square` 圆角按尺寸取令牌 4 / 6 / 8 **px**。

```vue
<template>
  <RebornInput v-model="value" size="lg" variant="outlined" color="primary" placeholder="描边形态 + 主题色聚焦" />
  <RebornInput v-model="value" variant="filled" shape="circle" placeholder="填充形态 + 胶囊外形" />
</template>
```
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
默认 `size="sm"`、`variant="filled"`。字号按 `rpx` 令牌递进（sm 26 / md 28 / lg 30）；`square` 圆角按尺寸取令牌 4 / 6 / 8 **rpx**。小程序不支持 `:focus-within`，聚焦高亮由组件内部 JS 聚焦态驱动，视觉行为与 Web 端一致。

```vue
<template>
  <view class="p-[24rpx]">
    <RebornInput v-model="value" size="lg" variant="outlined" color="primary" placeholder="描边形态 + 主题色聚焦" />
    <RebornInput v-model="value" variant="filled" shape="circle" placeholder="填充形态 + 胶囊外形" />
  </view>
</template>
```
:::

::

::warning
跨端复用同一份组件配置时，`size` 与 `variant` 请显式写出，不要依赖默认值——同一段 props 在两端会得到不同外观。
::

### 密码框、清除与前后缀

`show-password`（旧名 `password` 兼容）开启掩码显示并出现明文/密文切换按钮，`#password-icon` 作用域插槽（参数 `visible`）可自定义图标；`clearable` 显示清除按钮，`clear-icon` 可替换图标。前后缀有三层能力：`prefix-icon` / `suffix-icon` 快捷图标，`#prefix` / `#suffix` 插槽（作用域提供 `ui` 类名生成器），以及输入框外的 `#prepend` / `#append` 连体块；`separator` 控制清除按钮、密码开关与后缀之间的竖分割线。

插槽名与开关属性两端一致，唯一差异是图标属性的取值格式：**Web 端传 Iconify 图标名（`lucide:x-circle`），UniApp 端传 Iconify class（`i-lucide-x-circle`）**。

```vue
<template>
  <RebornInput v-model="pwd" show-password clearable placeholder="请输入密码" />

  <!-- Web：图标名 / UniApp：改传 prefix-icon="i-lucide-search" -->
  <RebornInput v-model="keyword" clearable prefix-icon="lucide:search" placeholder="搜索" />

  <RebornInput v-model="domain" variant="outlined" placeholder="域名前缀">
    <template #prepend>https://</template>
    <template #append>.com</template>
  </RebornInput>
</template>
```

### 字数统计与格式化

`show-word-limit` 配合 `maxlength` 显示字数统计（仅 `type` 为 text / textarea 时生效），`word-limit-position` 可选 `inside`（默认）/ `outside`；`formatter` / `parser` 配对使用可实现千分位等格式化展示（仅 `type="text"`）。这两组能力两端通用，差异集中在 `maxlength` 的默认值与 Web 端独有的 `count-graphemes`。

```vue
<template>
  <!-- Web 默认不限长；UniApp 默认 140，设为 -1 不限制 -->
  <RebornInput v-model="bio" :maxlength="20" show-word-limit placeholder="最多 20 字" />

  <RebornInput
    v-model="amount"
    :formatter="(v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
    :parser="(t) => t.replace(/,/g, '')"
    placeholder="千分位金额"
  />

  <!-- 仅 Web：自定义字素计数（emoji 按 1 个字算），设置后绕过原生 maxlength 约束 -->
  <RebornInput v-model="bio" :maxlength="20" show-word-limit :count-graphemes="countByGrapheme" />
</template>
```

### 键盘控制（UniApp）

UniApp 端透传原生 input 的键盘能力：`confirmType` 设定确认键文案并配合 `confirm` 事件提交；`adjustPosition` / `holdKeyboard` / `cursorSpacing`（单位 px）控制键盘弹起行为；`keyboardheightchange` 事件感知键盘高度变化。这些属性与事件在 Web 端不存在。

```vue
<template>
  <view class="p-[24rpx]">
    <RebornInput
      v-model="keyword"
      confirm-type="search"
      :cursor-spacing="10"
      :maxlength="50"
      hold-keyboard
      placeholder="回车搜索"
      @confirm="onSearch"
      @keyboardheightchange="(e) => console.log(e.detail.height)"
    />
  </view>
</template>
```

## API

::tip
两端属性尽量同名同义，但**默认值、可用属性与事件集合都有差异**。四个属性的默认值两端不同：`size`、`variant`、`maxlength`、`clearIcon`。完整差异见文末「两端差异对照」。
::

### Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
#### Web 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string \| number` | - | 输入框绑定值（`v-model`）。 |
| `defaultValue` | `string \| number` | - | 非受控模式下的初始值，未绑定 `modelValue` 时生效。 |
| `type` | `string` | `'text'` | 原生 input type（自由字符串）；传 `'textarea'` 渲染多行文本域。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸，影响高度、内边距与字号（sm/md 14px、lg 16px）；在表单组内被组尺寸覆盖。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 聚焦时描边 / 下划线 / 分割线的高亮颜色。 |
| `variant` | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` | 形态变体；`underlined` 强制压平圆角，此时 `shape` 不再生效。 |
| `shape` | `'circle' \| 'square'` | `'square'` | 外形：`square` 按尺寸取圆角令牌（4 / 6 / 8px），`circle` 为胶囊。 |
| `placeholder` | `string` | - | 占位文本。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `readonly` | `boolean` | `false` | 原生 readonly，是否只读。 |
| `maxlength` | `string \| number` | - | 原生 maxlength；设置 `countGraphemes` 后不再下发给原生属性。 |
| `minlength` | `string \| number` | - | 原生 minlength。 |
| `showWordLimit` | `boolean` | `false` | 是否显示字数统计，仅 `type` 为 text / textarea 时生效，需配合 `maxlength`。 |
| `wordLimitPosition` | `'inside' \| 'outside'` | `'inside'` | 字数统计位置：输入框内 / 输入框下方。 |
| `countGraphemes` | `(value: string) => number` | - | 自定义字素计数函数；设置后绕过原生 maxlength / minlength 约束，只做统计展示。 |
| `clearable` | `boolean` | `false` | 有内容且非禁用/只读时显示清除按钮，点击清空并重新聚焦。 |
| `clearIcon` | `string` | `'lucide:x-circle'` | 自定义清除图标名（Iconify 名称）。 |
| `formatter` | `(value: string \| number) => string` | - | 展示值格式化，仅 `type="text"` 生效；需与 `parser` 配对。 |
| `parser` | `(text: string) => string` | - | 从格式化文本中提取值，与 `formatter` 配对。 |
| `showPassword` | `boolean` | `false` | 是否显示明文/密文切换按钮（掩码显示内容）。 |
| `password` | `boolean` | `false` | 旧属性名，等价于 `showPassword`，保留以兼容既有用法。 |
| `prefixIcon` | `string` | - | 快捷前缀图标名（`#prefix` 插槽优先）。 |
| `suffixIcon` | `string` | - | 快捷后缀图标名（`#suffix` 插槽优先）。 |
| `rows` | `number` | `2` | textarea 行数，仅多行模式有效。 |
| `autosize` | `boolean \| { minRows?: number, maxRows?: number }` | `false` | textarea 高度自适应，可传对象限定行数范围。 |
| `resize` | `'none' \| 'both' \| 'horizontal' \| 'vertical'` | - | 控制 textarea 是否能被用户拖拽缩放（CSS resize）。 |
| `autocomplete` | `string` | `'off'` | 原生 autocomplete。 |
| `name` | `string` | - | 原生 name。 |
| `form` | `string` | - | 原生 form。 |
| `max` | `string \| number` | - | 原生 max。 |
| `min` | `string \| number` | - | 原生 min。 |
| `step` | `string \| number` | - | 原生 step。 |
| `autofocus` | `boolean` | `false` | 原生 autofocus，挂载后自动聚焦。 |
| `ariaLabel` | `string` | - | 等价于原生 aria-label。 |
| `label` | `string` | - | 旧属性名，等价于 `ariaLabel`，保留以兼容既有用法。 |
| `tabindex` | `string \| number` | - | 原生 tabindex。 |
| `inputmode` | `string` | - | 原生 inputmode。 |
| `id` | `string` | - | 原生 id。 |
| `validateEvent` | `boolean` | `true` | 输入 / 失焦时是否触发所在表单项的校验。 |
| `inputStyle` | `string \| Record<string, any>` | - | input / textarea 元素的内联 style。 |
| `separator` | `boolean` | `true` | 是否在清除按钮、密码开关与后缀之间显示竖分割线。 |
| `as` | `'input' \| 'textarea'` | `'input'` | 旧属性，等价于 `type="textarea"`，保留以兼容既有用法。 |
| `class` | `any` | - | 追加到输入框主体 wrapper 的自定义类名。 |
| `ui` | `InputUi` | `{}` | 按内部结构键覆盖类名，键位见「自定义样式（ui）」。 |

Web 端额外支持 `v-model` 修饰符：`.trim` 失焦后去除首尾空格、`.number` 转为数字（`v-model.trim.number="value"` 可叠加）。UniApp 端未接入修饰符。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
#### UniApp 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string \| number` | - | 输入框绑定值（`v-model`）。 |
| `defaultValue` | `string \| number` | - | 非受控模式下的初始值，未绑定 `modelValue` 时生效。 |
| `type` | `InputType` | `'text'` | 原生键盘类型：`text` / `number` / `idcard` / `digit` / `tel` / `safe-password` / `nickname` / `none` / `decimal` / `numeric` / `search` / `email` / `url`；另可传 `'textarea'` 渲染多行文本域。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | 尺寸，影响高度与字号（按 `rpx` 令牌递进）；在表单组内被组尺寸覆盖。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 聚焦时描边 / 下划线 / 分割线的高亮颜色。 |
| `variant` | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'filled'` | 形态变体；`underlined` 强制压平圆角，此时 `shape` 不再生效。 |
| `shape` | `'circle' \| 'square'` | `'square'` | 外形：`square` 按尺寸取圆角令牌（4 / 6 / 8rpx），`circle` 为胶囊。 |
| `placeholder` | `string` | - | 占位文本。 |
| `placeholderClass` | `string` | `''` | 占位文本的样式类，追加在内置 `text-gray-5` 之后。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `readonly` | `boolean` | `false` | 是否只读。 |
| `maxlength` | `number` | `140` | 最大输入字符数，设为 `-1` 不限制。 |
| `showWordLimit` | `boolean` | `false` | 是否显示字数统计，仅 `type` 为 text / textarea 时生效，需配合 `maxlength`。 |
| `wordLimitPosition` | `'inside' \| 'outside'` | `'inside'` | 字数统计位置：输入框内 / 输入框下方。 |
| `clearable` | `boolean` | `false` | 有内容且非禁用/只读时显示清除按钮，点击清空。 |
| `clearIcon` | `string` | `'i-lucide-x-circle'` | 自定义清除图标（Iconify class）。 |
| `formatter` | `(value: string \| number) => string` | - | 展示值格式化，仅 `type="text"` 生效；需与 `parser` 配对。 |
| `parser` | `(text: string) => string` | - | 从格式化文本中提取值，与 `formatter` 配对。 |
| `showPassword` | `boolean` | `false` | 是否显示明文/密文切换按钮（掩码显示内容）。 |
| `password` | `boolean` | `false` | 旧属性名，等价于 `showPassword`，保留以兼容既有用法。 |
| `prefixIcon` | `string` | - | 快捷前缀图标（Iconify class，`#prefix` 插槽优先）。 |
| `suffixIcon` | `string` | - | 快捷后缀图标（Iconify class，`#suffix` 插槽优先）。 |
| `rows` | `number` | `2` | textarea 模式的参考行数，用于估算固定高度（UniApp 无原生 rows）。 |
| `autosize` | `boolean \| { minRows?: number, maxRows?: number }` | `false` | textarea 高度自适应，映射原生 `auto-height`；`minRows` / `maxRows` 不生效，仅为与 Web 端同签名。 |
| `autofocus` | `boolean` | `false` | 挂载后自动聚焦并唤起键盘。 |
| `focus` | `boolean` | `false` | 预留的聚焦开关，**当前未接入内部逻辑**；聚焦请用 `autofocus` 或实例 `focus()`。 |
| `cursorSpacing` | `number` | `5` | 聚焦时输入框距键盘的距离，单位 px。 |
| `confirmType` | `string` | `'done'` | 键盘右下角确认按钮文案：`done` / `send` / `search` / `next` / `go`。 |
| `confirmHold` | `boolean` | `false` | 点击键盘确认按钮时是否保持键盘不收起。 |
| `adjustPosition` | `boolean` | `true` | 键盘弹起时是否自动上推页面。 |
| `holdKeyboard` | `boolean` | `false` | 聚焦时点击页面其他区域是否保持键盘不收起。 |
| `separator` | `boolean` | `true` | 是否在清除按钮、密码开关与后缀之间显示竖分割线。 |
| `customClass` | `any` | - | 追加到根节点的自定义类名（对应 Web 端 `class`，但落点是 `root` 而非 `wrapper`）。 |
| `ui` | `InputUI` | - | 按内部结构键覆盖类名，键位见「自定义样式（ui）」。 |

UniApp 端没有原生表单属性（`name` / `form` / `max` / `min` / `step` / `autocomplete` / `minlength` / `tabindex` / `inputmode` / `id`）、无障碍属性（`ariaLabel` / `label`）、`resize`、`countGraphemes`、`inputStyle`、`validateEvent` 与 `as`。
:::

::

### Emits

`update:modelValue`、`input`、`change`、`focus`、`blur`、`clear` 六个事件两端同名，但 `change` 的触发时机与其余事件集合都不同。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: string \| number)` | 输入值变化时触发（`v-model` 同步）。 |
| `input` | `(value: string \| number)` | 输入时触发，参数为当前值；**输入法合成期间不触发**。 |
| `change` | `(value: string \| number)` | **失焦或按下 Enter 且值相对聚焦时发生变化后**触发。 |
| `focus` | `(event: FocusEvent)` | 输入框获得焦点时触发。 |
| `blur` | `(event: FocusEvent)` | 输入框失去焦点时触发。 |
| `clear` | - | 点击清除按钮清空内容后触发。 |
| `keydown` | `(event: KeyboardEvent)` | 按下键时触发。 |
| `mouseenter` | `(event: MouseEvent)` | 鼠标进入输入框时触发。 |
| `mouseleave` | `(event: MouseEvent)` | 鼠标离开输入框时触发。 |
| `compositionstart` | `(event: CompositionEvent)` | 输入法合成开始时触发。 |
| `compositionupdate` | `(event: CompositionEvent)` | 输入法合成改变时触发。 |
| `compositionend` | `(event: CompositionEvent)` | 输入法合成完成时触发。 |

鼠标事件与输入法合成事件是 Web 端独有的，键盘相关回调是 UniApp 端独有的。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: string \| number)` | 输入值变化时触发（`v-model` 同步）。 |
| `input` | `(value: string)` | 输入时触发，参数为当前值。 |
| `change` | `(value: string)` | **与 `input` 同步触发**（不等失焦）；清空时也触发，参数为空字符串。 |
| `focus` | `(event: any)` | 输入框获得焦点时触发。 |
| `blur` | `(event: any)` | 输入框失去焦点时触发。 |
| `clear` | - | 点击清除按钮清空内容后触发。 |
| `confirm` | `(event: any)` | 点击键盘确认/完成按钮时触发。 |
| `keyboardheightchange` | `(event: any)` | 键盘高度变化时触发，`event.detail` 含 `height`（px）与 `duration`。 |

同一次输入会依次派发 `update:modelValue`、`input`、`change`，三者参数相同——需要「值稳定后再处理」的逻辑请自己在 `blur` / `confirm` 里做。
:::

::

### Slots

**两端插槽名与作用域参数完全一致**，无需分端查看。

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `prefix` | `{ ui }` | 输入框前缀区域，仅非 textarea 有效。 |
| `suffix` | `{ ui }` | 输入框后缀区域，位于清除按钮与密码开关之后，仅非 textarea 有效。 |
| `prepend` | - | 输入框外的前置连体块（如协议前缀），仅非 textarea 有效。 |
| `append` | - | 输入框外的后置连体块（如域名后缀），仅非 textarea 有效。 |
| `password-icon` | `{ visible }` | 密码切换按钮的图标内容，仅 `show-password` 开启时生效。 |

作用域里的 `ui` 是样式函数集合，可用于让插槽内容复用输入框的内部类名，例如 `:class="ui.prefix()"`。

### Expose

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 名称 | 签名/类型 | 描述 |
| --- | --- | --- |
| `focus` | `() => void` | 使输入框获得焦点。 |
| `blur` | `() => void` | 使输入框失去焦点。 |
| `select` | `() => void` | 选中输入框中的全部文字。 |
| `clear` | `() => void` | 清空输入内容并触发 `update:modelValue` 与 `clear` 事件。 |
| `ref` / `inputRef` | `Ref<HTMLInputElement \| HTMLTextAreaElement \| null>` | 内部原生 input / textarea 元素引用（`inputRef` 为旧名，保留兼容）。 |
| `input` | `ComputedRef<HTMLInputElement \| null>` | 单行模式下的原生 input 元素（textarea 模式为 `null`）。 |
| `textarea` | `ComputedRef<HTMLTextAreaElement \| null>` | 多行模式下的原生 textarea 元素（单行模式为 `null`）。 |
| `resizeTextarea` | `() => void` | 重新计算 textarea 高度（`autosize` 时使用）。 |
| `textareaStyle` | `Ref<object>` | `autosize` 计算出的 textarea 内联样式。 |
| `isComposing` | `Ref<boolean>` | 是否处于输入法合成状态。 |
| `passwordVisible` | `Ref<boolean>` | 密码是否以明文展示。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 名称 | 签名/类型 | 描述 |
| --- | --- | --- |
| `focus` | `() => void` | 使输入框聚焦（H5 端会把光标移至内容末尾）。 |
| `clear` | `() => void` | 清空输入内容并触发 `clear` 事件。 |
| `isFocus` | `Ref<boolean>` | 当前是否处于聚焦态。 |
| `passwordVisible` | `Ref<boolean>` | 密码是否以明文展示。 |

UniApp 端只暴露这四项：没有原生元素引用（小程序无 DOM），也没有 `blur` / `select` / `resizeTextarea`。
:::

::

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端结构相近但不完全一致：Web 端多一个 `icon`，UniApp 端多一个 `inputItem`。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 键名 | 说明 |
| --- | --- |
| `root` | 最外层容器，纵向容纳「输入组 + 外置字数统计」。 |
| `group` | 输入组容器（prepend + 输入框 + append）。 |
| `prepend` | 前置连体块。 |
| `append` | 后置连体块。 |
| `wrapper` | 输入框主体容器；`class` prop 也并到该节点。 |
| `input` | 原生 input / textarea 元素本体。 |
| `prefix` | 前缀插槽容器。 |
| `iconBox` | 右侧图标区容器（清除 / 密码 / 字数 / 后缀）。 |
| `icon` | 清除与密码图标的尺寸类。 |
| `suffix` | 后缀插槽容器。 |
| `clear` | 清除按钮。 |
| `password` | 密码明文/密文切换按钮。 |
| `separator` | 竖分割线。 |
| `count` | 字数统计文本。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 键名 | 说明 |
| --- | --- |
| `root` | 最外层容器，纵向容纳「输入组 + 外置字数统计」；`customClass` 也并到该节点。 |
| `group` | 输入组容器（prepend + 输入框 + append）。 |
| `prepend` | 前置连体块。 |
| `append` | 后置连体块。 |
| `wrapper` | 输入框主体容器。 |
| `input` | 包裹原生 input 的容器（**不是元素本体**）。 |
| `inputItem` | 原生 input 元素本体。 |
| `prefix` | 前缀插槽容器（绝对定位在左侧）。 |
| `iconBox` | 右侧图标区容器（清除 / 密码 / 字数 / 后缀）。 |
| `suffix` | 后缀插槽容器。 |
| `clear` | 清除按钮。 |
| `password` | 密码明文/密文切换按钮。 |
| `separator` | 竖分割线。 |
| `count` | 字数统计文本。 |
:::

::

```vue
<template>
  <RebornInput
    v-model="value"
    :ui="{ wrapper: 'shadow-sm', count: 'text-primary' }"
  />
</template>
```

### CSS 变量

两端各自维护一套独立的尺寸令牌，互不影响。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
定义在 `app/assets/theme/typography.css`，固定 px：

| 变量名 | 对应 `size` | 值 |
| --- | --- | --- |
| `--height-input-sm` | `sm` | `24px` |
| `--height-input-md` | `md` | `32px` |
| `--height-input-lg` | `lg` | `40px` |
| `--spacing-input-px-sm` | `sm` | `10px` |
| `--spacing-input-px-md` | `md` | `12px` |
| `--spacing-input-px-lg` | `lg` | `16px` |
| `--spacing-input-sep-sm` | `sm` | `12px` |
| `--spacing-input-sep-md` | `md` | `14px` |
| `--spacing-input-sep-lg` | `lg` | `16px` |
| `--size-input-icon-sm` | `sm` | `10px` |
| `--size-input-icon-md` | `md` | `12px` |
| `--size-input-icon-lg` | `lg` | `16px` |

Web 端把高度、水平内边距、分割线高度、图标尺寸都拆成了独立令牌。
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
定义在 `packages/uniapp-project/src/styles/theme.css`，`rpx` 随屏宽缩放：

| 变量名 | 对应 `size` | 值 |
| --- | --- | --- |
| `--input-sm-height` | `sm` | `80rpx` |
| `--input-md-height` | `md` | `90rpx` |
| `--input-lg-height` | `lg` | `96rpx` |

UniApp 端只抽出高度令牌，水平内边距与图标尺寸直接写在配置的 `size` 变体里。主题变量挂载在 `:root, body, page` 上（避免 `:root` 在微信小程序下报错），覆盖时请对齐同一选择器。
:::

::

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 自定义类名 | `class`（落在 `wrapper`） | `customClass`（落在 `root`） |
| `size` 默认值 | `'md'` | `'sm'` |
| `variant` 默认值 | `'outlined'` | `'filled'` |
| `maxlength` | `string \| number`，默认不限长 | `number`，默认 `140`，`-1` 不限制 |
| `clearIcon` 取值 | Iconify 名称 `'lucide:x-circle'` | Iconify class `'i-lucide-x-circle'` |
| 圆角令牌单位 | 4 / 6 / 8 **px** | 4 / 6 / 8 **rpx** |
| 字号 | sm/md 14px、lg 16px | 26 / 28 / 30 **rpx** 递进 |
| `type` 取值 | 自由字符串（原生 type） | 受约束的原生键盘类型联合 + `'textarea'` |
| 多行高度 | `rows` + `autosize`（支持 `{ minRows, maxRows }`）+ `resize` | `rows` 仅估算高度，`autosize` 映射 `auto-height`，无 `resize` |
| 聚焦高亮 | CSS `:focus-within` | 组件内 JS 聚焦态驱动（小程序不支持 `:focus-within`） |
| `change` 时机 | 失焦或 Enter 且值变化 | 与 `input` 同步 |
| 输入法合成 | `compositionstart` / `update` / `end`，合成期间不同步 `v-model` | 不支持 |
| 鼠标事件 | `mouseenter` / `mouseleave` | 不支持 |
| 键盘控制 | 不支持 | `confirmType` / `confirmHold` / `adjustPosition` / `holdKeyboard` / `cursorSpacing` + `confirm` / `keyboardheightchange` |
| `v-model` 修饰符 | `.trim` / `.number` | 不支持 |
| 原生表单属性 | `name` / `form` / `max` / `min` / `step` / `autocomplete` / `minlength` / `id` / `tabindex` / `inputmode` | 全部不支持 |
| 字数统计 | 可用 `countGraphemes` 自定义计数 | 仅按原生长度统计 |
| 表单校验开关 | `validateEvent` | 无开关，始终参与 |
| `ui` 独有键位 | `icon` | `inputItem` |
| Expose | 含原生元素引用、`blur` / `select` / `resizeTextarea` 等 11 项 | 仅 `focus` / `clear` / `isFocus` / `passwordVisible` |

## 注意事项

- **`maxlength` 是最容易踩的默认值差异**：UniApp 端默认 140，超长内容必须显式调大或设为 `-1`；Web 端默认不限长。设置 Web 端的 `countGraphemes` 后会绕过原生约束，只做统计展示。
- **两端均已用 `variant` / `shape` 取代旧的 `rounded` / `border` 属性**：`filled` 近似旧默认外观（灰底、聚焦亮底描边）。注意它在 UniApp 端是默认值，在 Web 端不是。
- **UniApp 端 `focus` prop 当前未接入内部逻辑**，需要程序聚焦时请用 `autofocus` 或通过 ref 调用 `focus()`。
- **事件时序差异**：UniApp 端同一次输入依次触发 `update:modelValue`、`input`、`change`（参数相同）；Web 端 `input` 随键入触发（输入法合成期间静默），`change` 仅在失焦或 Enter 且值变化时触发。跨端共用的「值确认」逻辑请挂在 `blur` 上。
- **放入 FieldGroup / 表单中时**，尺寸与禁用态会被表单注入的 size / disabled 覆盖，并在值变化与失焦时自动触发表单校验（Web 端可用 `validateEvent` 关闭，UniApp 端无此开关）。
- **UniApp 端 `type` 的类型联合暂未收录 `'textarea'`**，但实现已支持该取值；TS 报错时可先按 `type="textarea" as any` 处理，或直接使用多行场景的封装。
