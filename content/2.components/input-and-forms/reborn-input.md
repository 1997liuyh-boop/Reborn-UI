---
title: input 输入框
description: 用于文本录入的双端输入框组件，支持圆角胶囊样式、多尺寸、清除与密码态。
category: 表单与输入
platform: both
tags: [css, tailwind, input, uniapp]
badge: New
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

### 形状与尺寸

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

### 前后缀与前后置块

前后缀有三层能力：`prefix-icon` / `suffix-icon` 快捷图标，`#prefix` / `#suffix` 插槽（作用域提供 `ui` 类名生成器），以及输入框外的 `#prepend` / `#append` 连体块。三者都只在单行模式渲染，`type="textarea"` 时不出现。

插槽名两端一致，唯一差异是图标属性的取值格式：**Web 端传 Iconify 图标名（`lucide:search`），UniApp 端传 Iconify class（`i-lucide-search`）**。

```vue
<template>
  <!-- Web：图标名 / UniApp：改传 prefix-icon="i-lucide-search" -->
  <RebornInput v-model="keyword" prefix-icon="lucide:search" suffix-icon="lucide:calendar" placeholder="搜索日期" />

  <RebornInput v-model="domain" variant="outlined" placeholder="域名前缀">
    <template #prepend>
      <div class="px-[12px]">https://</div>
    </template>
    <template #append>
      <div class="px-[8px]">.com</div>
    </template>
  </RebornInput>
</template>
```

### 前后置块：搜索按钮与禁用配色

`#append` 常用来拼一个搜索按钮。Web 端连体块默认没有内边距（UniApp 端默认带 `px-3`），按钮外观通过 `ui.append` 覆盖底色、文字色与边框。`ui.append` 写的文字色会盖过禁用态自带的 `text-gray-5`，所以禁用时要单独给一套配色，否则禁用输入框旁边仍是一个高亮按钮。

```vue
<template>
  <RebornInput
    v-model="keyword"
    placeholder="请输入内容"
    :ui="{ append: 'bg-brand-6 text-white px-[12px] border border-brand-6' }"
  >
    <template #append>搜索</template>
  </RebornInput>

  <RebornInput
    v-model="keyword"
    disabled
    placeholder="请输入内容"
    :ui="{ append: 'bg-brand-3 text-gray-2 px-[12px] border border-brand-3' }"
  >
    <template #append>搜索</template>
  </RebornInput>
</template>
```

### 字数统计：show-word-limit

`show-word-limit` 配合 `maxlength` 显示字数统计（仅 `type` 为 text / textarea 时生效），`word-limit-position` 可选 `inside`（默认）/ `outside`；多行模式下 `inside` 的统计落在文本域右下角。两端通用，差异集中在 `maxlength` 的默认值与 Web 端独有的 `count-graphemes`。

```vue
<template>
  <!-- Web 默认不限长；UniApp 默认 140，设为 -1 不限制 -->
  <RebornInput v-model="bio" :maxlength="10" show-word-limit placeholder="最多 10 字" />
  <RebornInput v-model="bio" :maxlength="10" show-word-limit word-limit-position="outside" />

  <!-- 仅 Web：自定义字素计数（emoji 按 1 个字算），设置后绕过原生 maxlength 约束 -->
  <RebornInput v-model="bio" :maxlength="20" show-word-limit :count-graphemes="countByGrapheme" />
</template>
```

### 格式化与解析：formatter / parser

`formatter` 决定展示文本，`parser` 从格式化文本中还原绑定值，两者要配对使用：只给 `formatter` 时，带千分位的文本会原样写回 `v-model`。仅 `type="text"` 生效，两端通用。

```vue
<template>
  <RebornInput
    v-model="amount"
    :formatter="(v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
    :parser="(t) => t.replace(/,/g, '')"
    placeholder="千分位金额"
  />
</template>
```

### 密码框与清除

`show-password`（旧名 `password` 兼容）开启掩码显示并出现明文/密文切换按钮，`#password-icon` 作用域插槽（参数 `visible`）可自定义图标；`clearable` 在有内容且非禁用、非只读时显示清除按钮，`clear-icon` 可替换图标；`separator` 控制清除按钮、密码开关与后缀之间的竖分割线。两者都只在单行模式渲染。

```vue
<template>
  <RebornInput v-model="pwd" show-password clearable placeholder="请输入密码" />

  <RebornInput v-model="pwd" show-password placeholder="请输入密码">
    <template #password-icon="{ visible }">
      <Icon :name="visible ? 'lucide:unlock' : 'lucide:lock'" />
    </template>
  </RebornInput>

  <!-- Web：图标名 / UniApp：改传 clear-icon="i-lucide-trash-2" -->
  <RebornInput v-model="text" clearable clear-icon="lucide:trash-2" placeholder="可清空" />
</template>
```

### 多行文本：rows / autosize / resize

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
| `ui` | `InputUi` | `{}` | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

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
| `ui` | `InputUI` | - | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

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

`ui` 按键名把类名合并到对应节点（`cn` 合并，冲突时覆盖默认类名）。两端各有 14 个键，但与 config 的 `slots` 不是一一同名：`suffix` / `clear` / `password` 三个键没有同名 slot，而是共用 config 里的 `iconSection` 样式；`iconSection` 本身不能作为键传入。两端键位与默认类名都不同，分开列出。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 键名 | 对应节点 | 默认关键类名 | 渲染 / 失效条件 |
| --- | --- | --- | --- |
| `root` | 最外层容器 | `flex w-full min-w-0 flex-col gap-1` | 始终渲染；`outside` 位置的字数统计也在这一层。 |
| `group` | 输入组（prepend + 输入框 + append） | `flex w-full min-w-0 grow items-stretch`，尺寸档追加 `h-input-sm/md/lg` | 始终渲染；多行模式高度改为 `h-auto!`。 |
| `prepend` | 前置连体块 | `flex shrink-0 items-center bg-gray-2 text-gray-8 border border-gray-4 border-r-0` | 仅传了 `#prepend` 且单行时渲染；默认无内边距；禁用时追加 `cursor-not-allowed text-gray-5`。 |
| `append` | 后置连体块 | `flex shrink-0 items-center bg-gray-2 text-gray-8 border-gray-4 border-l-0` | 仅传了 `#append` 且单行时渲染；默认无内边距；禁用时追加 `cursor-not-allowed text-gray-5`。 |
| `wrapper` | 输入框主体容器 | `group/input relative inline-flex w-full min-w-0 items-center overflow-hidden text-gray-9`，另按尺寸加 `px-input-px-*`、按 `variant` 加背景与边框 | 始终渲染；`class` prop 也合并到这里；有前 / 后置块时对应一侧圆角被压平。 |
| `input` | 原生 input / textarea 元素 | `h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-gray-5`，聚焦光标色跟随 `color` | 始终渲染；多行模式改为 `h-auto resize-none`。 |
| `prefix` | 前缀容器 | `inline-flex shrink-0 items-center text-gray-6`，组件另加 `mr-1` | 仅有 `#prefix` 或 `prefixIcon` 且单行时渲染。 |
| `iconBox` | 尾部功能区（清除 / 密码 / 字数 / 后缀） | `inline-flex shrink-0 items-center gap-2` | 仅单行渲染，`type="textarea"` 时整块不存在。 |
| `icon` | 内置图标（`prefixIcon` / `suffixIcon` / 清除 / 默认密码图标） | 无基础类名，尺寸档追加 `text-sm` / `text-base` / `text-lg` | 只作用于组件自己渲染的 `Icon`；插槽里自定义的内容不受影响。 |
| `suffix` | 后缀容器 | 共用 `iconSection`：`flex cursor-pointer items-center justify-center text-gray-5 hover:opacity-80` | 仅有 `#suffix` 或 `suffixIcon` 且单行时渲染。 |
| `clear` | 清除按钮 | 共用 `iconSection`（同上） | `clearable` 且有值、非禁用、非只读、单行时渲染。 |
| `password` | 明文 / 密文切换按钮 | 共用 `iconSection`（同上） | 开启 `show-password`（或旧名 `password`）且单行时渲染。 |
| `separator` | 竖分割线 | `w-px shrink-0 bg-gray-4`，尺寸档追加 `h-input-sep-*`，聚焦时 `group-focus-within/input:bg-<color>` | `separator` 为 `true`，且清除按钮与密码开关 / 后缀相邻时渲染。 |
| `count` | 字数统计文本 | `pointer-events-none text-sm text-gray-5 tabular-nums` | `showWordLimit` 生效时渲染；多行 `inside` 追加 `absolute bottom-1 right-2`，`outside` 追加 `self-end`。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 键名 | 对应节点 | 默认关键类名 | 渲染 / 失效条件 |
| --- | --- | --- | --- |
| `root` | 最外层容器 | `flex w-full min-w-0 flex-col gap-1` | 始终渲染；`customClass` 也合并到这里。 |
| `group` | 输入组（prepend + 输入框 + append） | `flex w-full min-w-0 grow items-stretch`，尺寸档追加 `h-input-sm/md/lg` | 始终渲染。 |
| `prepend` | 前置连体块 | `flex shrink-0 items-center px-3 bg-gray-2 text-gray-6` | 仅传了 `#prepend` 且单行时渲染；与 Web 不同，默认带 `px-3`。 |
| `append` | 后置连体块 | `flex shrink-0 items-center px-3 bg-gray-2 text-gray-6` | 仅传了 `#append` 且单行时渲染；默认带 `px-3`。 |
| `wrapper` | 输入框主体容器 | `relative flex w-full min-w-0 items-center overflow-hidden text-gray-9 data-[disabled=true]:text-gray-5`，按 `variant` 加背景与边框 | 始终渲染。 |
| `input` | 包裹原生 input / textarea 的 `view`（**不是元素本体**） | `flex-1 min-w-0 h-full pl-3 text-gray-9`，有前缀时改为 `pl-9` | 始终渲染；多行模式组件追加 `h-auto pr-3 py-1`。 |
| `inputItem` | 原生 input 元素本体 | `h-full w-full` | 仅单行渲染；多行的原生 textarea 固定为 `w-full`，不接受覆盖。 |
| `prefix` | 前缀容器 | `absolute left-3 top-0 bottom-0 flex items-center justify-center text-gray-6` | 仅有 `#prefix` 或 `prefixIcon` 且单行时渲染；绝对定位，改宽度时要同步调整 `input` 的左内边距。 |
| `iconBox` | 尾部功能区 | `h-full flex-shrink-0 flex items-center gap-[16rpx] pr-3` | 仅单行渲染。 |
| `suffix` | 后缀容器 | 共用 `iconSection`：`flex cursor-pointer items-center justify-center text-gray-5 hover:opacity-80` | 仅有 `#suffix` 或 `suffixIcon` 时渲染。 |
| `clear` | 清除按钮 | 取自 `icon` 槽（无基础类名，尺寸档 `text-40`），组件另加 `right-0` | `clearable` 且有值、非禁用、非只读时渲染；与 Web 不同，默认不带 `cursor-pointer` / `text-gray-5`。 |
| `password` | 明文 / 密文切换按钮 | 共用 `iconSection`，组件另加 `h-full` | 开启 `show-password`（或旧名 `password`）时渲染。 |
| `separator` | 竖分割线 | `w-px bg-gray-4`，尺寸档追加 `h-[var(--text-size-32/36/40)]`，聚焦时颜色跟随 `color` | `separator` 为 `true`，且清除按钮与密码开关 / 后缀相邻时渲染。 |
| `count` | 字数统计文本 | `pointer-events-none text-22 text-gray-5` | `showWordLimit` 生效时渲染；`outside` 追加 `self-end`。 |

UniApp 端 config 里的 `icon` slot 没有同名 `ui` 键，`prefixIcon` / `suffixIcon` 直接以图标 class 渲染，不经过 `ui`。
:::

::

```vue
<template>
  <RebornInput
    v-model="value"
    :ui="{
      wrapper: 'shadow-sm',
      append: 'bg-brand-6 text-white px-[12px]',
      clear: 'text-gray-7',
      count: 'text-primary',
    }"
  >
    <template #append>搜索</template>
  </RebornInput>
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
| `prepend` / `append` 默认内边距 | 无，需在插槽内容或 `ui` 里自己给 | `px-3` |
| `ui.clear` 默认样式 | 共用 `iconSection`（手型光标、`text-gray-5`） | 取自 `icon` 槽，无基础类名 |
| Expose | 含原生元素引用、`blur` / `select` / `resizeTextarea` 等 11 项 | 仅 `focus` / `clear` / `isFocus` / `passwordVisible` |

## 键盘控制（仅 UniApp）

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

## 注意事项

- **`maxlength` 是最容易踩的默认值差异**：UniApp 端默认 140，超长内容必须显式调大或设为 `-1`；Web 端默认不限长。设置 Web 端的 `countGraphemes` 后会绕过原生约束，只做统计展示。
- **两端均已用 `variant` / `shape` 取代旧的 `rounded` / `border` 属性**：`filled` 近似旧默认外观（灰底、聚焦亮底描边）。注意它在 UniApp 端是默认值，在 Web 端不是。
- **UniApp 端 `focus` prop 当前未接入内部逻辑**，需要程序聚焦时请用 `autofocus` 或通过 ref 调用 `focus()`。
- **事件时序差异**：UniApp 端同一次输入依次触发 `update:modelValue`、`input`、`change`（参数相同）；Web 端 `input` 随键入触发（输入法合成期间静默），`change` 仅在失焦或 Enter 且值变化时触发。跨端共用的「值确认」逻辑请挂在 `blur` 上。
- **放入 FieldGroup / 表单中时**，尺寸与禁用态会被表单注入的 size / disabled 覆盖，并在值变化与失焦时自动触发表单校验（Web 端可用 `validateEvent` 关闭，UniApp 端无此开关）。
