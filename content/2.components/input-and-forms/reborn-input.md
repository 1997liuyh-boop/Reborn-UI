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

Input 是 Web 与 UniApp 双端可用的基础输入框：`v-model` 绑定输入值，内置清除按钮、密码明文/密文切换、聚焦高亮配色与前后缀插槽。Web 端还可通过 `as="textarea"` 渲染多行文本；UniApp 端提供 `confirmType`、`adjustPosition`、`holdKeyboard` 等原生键盘控制能力，并可放入 `RebornForm` 表单参与校验。

适用场景：

- 表单中录入文本、密码等单行内容。
- 需要前后缀图标或按钮（`leading` / `trailing` 插槽）的输入框。
- Web 端通过 `as="textarea"` 的多行输入（`rows` 默认 4）。
- UniApp 端需要 `confirmType`、`adjustPosition`、`holdKeyboard` 等键盘控制时。

不适用场景：

- 数字步进增减，改用 `reborn-input-number`。
- 验证码分格输入，改用 `reborn-input-otp`。
- 带历史记录、推荐词下拉的搜索，改用 `reborn-search-box`。

## 用法

### 基础用法

`v-model` 绑定输入值；`clearable` 开启后在有内容时显示清除按钮，点击清空并触发 `clear` 事件；`disabled` / `readonly` 控制禁用与只读。

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

Web 端通过 `type="textarea"` 渲染多行文本域（旧属性 `as="textarea"` 仍兼容），行数由 `rows` 控制；`autosize` 让高度随内容自适应（可传 `{ minRows, maxRows }`），`resize` 控制是否允许用户拖拽缩放：

```vue
<RebornInput v-model="remark" type="textarea" :rows="3" placeholder="备注" />
<RebornInput v-model="remark" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }" placeholder="高度自适应" />
```

### 尺寸、形态与外形

`size` 提供 `sm` / `md` / `lg` 三档高度与字号（sm/md 14px、lg 16px）。`variant` 提供四种形态：`outlined` 底色描边、`filled`（默认）灰底 `bg-gray-2` 且聚焦时转为 `bg-gray-1` + 主题色描边、`borderless` 无边框、`underlined` 仅下划线（圆角强制压平）。`shape` 控制外形：`square`（默认）按尺寸取圆角令牌（sm 4px / md 6px / lg 8px），`circle` 为胶囊；聚焦高亮颜色由 `color` 决定（默认 `primary`）。

```vue
<template>
  <RebornInput
    v-model="value"
    size="lg"
    variant="outlined"
    color="primary"
    placeholder="描边形态 + 主题色聚焦"
  />
  <RebornInput
    v-model="value"
    variant="filled"
    shape="circle"
    placeholder="填充形态 + 胶囊外形"
  />
</template>
```

### 密码框、清除与前后缀

`show-password`（旧名 `password` 兼容）开启掩码显示并出现明文/密文切换按钮，`#password-icon` 作用域插槽（参数 `visible`）可自定义图标；`clearable` 显示清除按钮，`clear-icon` 可替换图标。前后缀有三层能力：`prefix-icon` / `suffix-icon` 快捷图标，`#prefix` / `#suffix` 插槽（旧名 `#leading` / `#trailing` 兼容，作用域提供 `ui` 类名生成器），以及输入框外的 `#prepend` / `#append` 连体块；`separator` 控制清除按钮、密码开关与后缀之间的竖分割线。

```vue
<template>
  <RebornInput v-model="pwd" show-password clearable placeholder="请输入密码" />

  <RebornInput v-model="keyword" clearable prefix-icon="lucide:search" placeholder="搜索" />

  <RebornInput v-model="domain" variant="outlined" placeholder="域名前缀">
    <template #prepend>https://</template>
    <template #append>.com</template>
  </RebornInput>
</template>
```

### 字数统计与格式化

`show-word-limit` 配合 `maxlength` 显示字数统计（仅 `type` 为 text / textarea 时生效），`word-limit-position` 可选 `inside`（默认）/ `outside`；`count-graphemes` 自定义字素计数（设置后绕过原生 maxlength 约束）。`formatter` / `parser` 配对使用可实现千分位等格式化展示（仅 `type="text"`）：

```vue
<template>
  <RebornInput v-model="bio" :maxlength="20" show-word-limit placeholder="最多 20 字" />

  <RebornInput
    v-model="amount"
    :formatter="(v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
    :parser="(t) => t.replace(/,/g, '')"
    placeholder="千分位金额"
  />
</template>
```

### 键盘控制（UniApp）

UniApp 端透传原生 input 的键盘能力：`confirmType` 设定确认键文案并配合 `confirm` 事件提交；`adjustPosition` / `holdKeyboard` / `cursorSpacing`（单位 px）控制键盘弹起行为；`keyboardheightchange` 事件感知键盘高度变化。

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

### Props

| 属性名             | 类型                                                                                   | 默认值                   | 平台   | 描述                                                                |
| :----------------- | :------------------------------------------------------------------------------------- | :----------------------- | :----- | :------------------------------------------------------------------ |
| `modelValue`       | `string / number`                                                                      | `-`                      | 通用   | 输入框绑定值（v-model）。                                           |
| `defaultValue`     | `string / number`                                                                      | `-`                      | 通用   | 非受控模式下的初始值，未绑定 modelValue 时生效。                    |
| `placeholder`      | `string`                                                                               | `""`                     | 通用   | 占位文本。                                                          |
| `disabled`         | `boolean`                                                                              | `false`                  | 通用   | 是否禁用。                                                          |
| `readonly`         | `boolean`                                                                              | `false`                  | 通用   | 是否只读。                                                          |
| `type`             | `InputType`                                                                            | `'text'`                 | 通用   | 输入类型；UniApp 端支持 text/number/idcard/digit 等原生键盘类型。   |
| `size`             | `'sm' \| 'md' \| 'lg'`                                                                 | `'sm'`                   | 通用   | 尺寸，影响高度与字号（Web 端 sm/md 14px、lg 16px）。                |
| `color`            | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'`              | 通用   | 聚焦时描边 / 下划线 / 分割线的高亮颜色。                            |
| `variant`          | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'`                               | `'filled'`               | 通用   | 形态变体；filled 默认灰底，聚焦转亮底 + 描边。                      |
| `shape`            | `'circle' \| 'square'`                                                                 | `'square'`               | 通用   | 外形：square 圆角按尺寸取令牌（Web 4/6/8px、UniApp 4/6/8rpx），circle 为胶囊。 |
| `showPassword`     | `boolean`                                                                              | `false`                  | 通用   | 是否显示明文/密文切换按钮（旧名 `password` 两端仍兼容）。           |
| `password`         | `boolean`                                                                              | `false`                  | 通用   | 旧属性名，等价于 `showPassword`，保留以兼容既有用法。               |
| `clearable`        | `boolean`                                                                              | `false`                  | 通用   | 是否显示清除按钮：有内容且非禁用/只读时出现。                       |
| `clearIcon`        | `string`                                                                               | 见描述                   | 通用   | 自定义清除图标：Web 传图标名（默认 `'lucide:x-circle'`），UniApp 传 iconify class（默认 `'i-lucide-x-circle'`）。 |
| `prefixIcon`       | `string`                                                                               | `-`                      | 通用   | 自定义前缀图标（`#prefix` 插槽优先）；UniApp 端传 iconify class。   |
| `suffixIcon`       | `string`                                                                               | `-`                      | 通用   | 自定义后缀图标（`#suffix` 插槽优先）；UniApp 端传 iconify class。   |
| `showWordLimit`    | `boolean`                                                                              | `false`                  | 通用   | 是否显示字数统计，仅 `type` 为 text / textarea 时生效，需配合 `maxlength`。 |
| `wordLimitPosition` | `'inside' \| 'outside'`                                                               | `'inside'`               | 通用   | 字数统计位置：输入框内 / 输入框下方。                               |
| `countGraphemes`   | `(value: string) => number`                                                            | `-`                      | Web    | 自定义字素计数函数；设置后绕过原生 maxlength/minlength 约束。       |
| `formatter`        | `(value) => string`                                                                    | `-`                      | 通用   | 展示值格式化，仅 `type="text"` 生效；需与 `parser` 配对。           |
| `parser`           | `(text) => string`                                                                     | `-`                      | 通用   | 从格式化文本中提取值，与 `formatter` 配对。                         |
| `separator`        | `boolean`                                                                              | `true`                   | 通用   | 是否在清除按钮、密码开关与后缀之间显示竖分割线。                    |
| `autofocus`        | `boolean`                                                                              | `false`                  | 通用   | 挂载后自动聚焦。                                                    |
| `autosize`         | `boolean \| { minRows?, maxRows? }`                                                    | `false`                  | 通用   | textarea 高度自适应；UniApp 端映射原生 `auto-height`，minRows/maxRows 不生效。 |
| `resize`           | `'none' \| 'both' \| 'horizontal' \| 'vertical'`                                       | `-`                      | Web    | 控制 textarea 是否能被用户拖拽缩放。                                |
| `minlength`        | `string / number`                                                                      | `-`                      | Web    | 原生 minlength。                                                    |
| `autocomplete`     | `string`                                                                               | `'off'`                  | Web    | 原生 autocomplete。                                                 |
| `name` / `form`    | `string`                                                                               | `-`                      | Web    | 原生 name / form。                                                  |
| `max` / `min` / `step` | `string / number`                                                                  | `-`                      | Web    | 原生 max / min / step。                                             |
| `ariaLabel`        | `string`                                                                               | `-`                      | Web    | 等价于原生 aria-label（旧名 `label` 兼容）。                        |
| `tabindex`         | `string / number`                                                                      | `-`                      | Web    | 原生 tabindex。                                                     |
| `inputmode`        | `string`                                                                               | `-`                      | Web    | 原生 inputmode。                                                    |
| `id`               | `string`                                                                               | `-`                      | Web    | 原生 id。                                                           |
| `validateEvent`    | `boolean`                                                                              | `true`                   | Web    | 输入 / 失焦时是否触发所在表单项的校验。                             |
| `inputStyle`       | `string / object`                                                                      | `-`                      | Web    | input / textarea 元素的内联 style。                                 |
| `modelModifiers`   | `{ trim?, number? }`                                                                   | `-`                      | Web    | v-model 修饰符：trim 失焦去首尾空格、number 转数字。                |
| `ui`               | `InputUI`                                                                              | `{}`                     | 通用   | 按内部结构键覆盖类名，见下方「自定义样式（ui）」。                  |
| `as`               | `'input' \| 'textarea'`                                                                | `'input'`                | Web    | 旧属性，等价于 `type="textarea"`，保留以兼容既有用法。              |
| `rows`             | `number`                                                                               | `2`                      | 通用   | textarea 模式的行数（UniApp 无原生 rows，按行数估算固定高度）。     |
| `class`            | `any`                                                                                  | `-`                      | Web    | 追加到根节点 wrapper 的额外样式类。                                 |
| `customClass`      | `any`                                                                                  | `-`                      | UniApp | 追加到根节点 wrapper 的自定义类名。                                 |
| `focus`            | `boolean`                                                                              | `false`                  | UniApp | 预留的聚焦开关，当前未接入；聚焦请用 `autofocus` 或实例 `focus()`。 |
| `maxlength`        | `string / number`                                                                      | `-`（UniApp 为 `140`）   | 通用   | 最大输入字符数；Web 端配合 `showWordLimit` 展示统计。               |
| `cursorSpacing`    | `number`                                                                               | `5`                      | UniApp | 聚焦时输入框距键盘的距离，单位 px。                                 |
| `confirmHold`      | `boolean`                                                                              | `false`                  | UniApp | 点击键盘确认按钮时是否保持键盘不收起。                              |
| `confirmType`      | `string`                                                                               | `'done'`                 | UniApp | 键盘确认按钮文案：done/send/search/next/go。                        |
| `adjustPosition`   | `boolean`                                                                              | `true`                   | UniApp | 键盘弹起时是否自动上推页面。                                        |
| `holdKeyboard`     | `boolean`                                                                              | `false`                  | UniApp | 聚焦时点击页面其他区域是否保持键盘不收起。                          |
| `placeholderClass` | `string`                                                                               | `''`                     | UniApp | 占位文本的样式类，追加在内置 `text-gray-4` 之后。                   |

### Emits

| 事件名                 | 回调参数                   | 平台   | 描述                                                        |
| :--------------------- | :------------------------- | :----- | :---------------------------------------------------------- |
| `update:modelValue`    | `(value: string / number)` | 通用   | 输入值变化时触发（v-model 同步）。                          |
| `input`                | `(value: string / number)` | 通用   | 输入时触发，参数为当前值；Web 端输入法合成期间不触发。      |
| `change`               | `(value: string / number)` | 通用   | Web 端在失焦或按 Enter 且值发生变化时触发；UniApp 端与 input 同步。 |
| `focus`                | `(event)`                  | 通用   | 输入框获得焦点时触发。                                      |
| `blur`                 | `(event)`                  | 通用   | 输入框失去焦点时触发。                                      |
| `clear`                |                            | 通用   | 点击清除按钮清空内容后触发。                                |
| `keydown`              | `(event: KeyboardEvent)`   | Web    | 按下键时触发。                                              |
| `mouseenter` / `mouseleave` | `(event: MouseEvent)` | Web    | 鼠标进入 / 离开输入框时触发。                               |
| `compositionstart` / `compositionupdate` / `compositionend` | `(event)` | Web | 输入法合成开始 / 改变 / 完成时触发。          |
| `confirm`              | `(event)`                  | UniApp | 点击键盘确认/完成按钮时触发。                               |
| `keyboardheightchange` | `(event)`                  | UniApp | 键盘高度变化时触发，`e.detail` 含 height（px）与 duration。 |

### Slots

| 插槽名          | 作用域参数    | 描述                                                                        |
| :-------------- | :------------ | :-------------------------------------------------------------------------- |
| `prefix`        | `{ ui }`      | 输入框前缀区域（新名，优先级高于 `leading`），仅非 textarea 有效。           |
| `suffix`        | `{ ui }`      | 输入框后缀区域（新名，优先级高于 `trailing`），仅非 textarea 有效。          |
| `prepend`       | -             | 输入框外的前置连体块（如协议前缀），仅非 textarea 有效。                     |
| `append`        | -             | 输入框外的后置连体块（如域名后缀），仅非 textarea 有效。                     |
| `password-icon` | `{ visible }` | 密码切换按钮的图标内容，仅 `show-password` 开启时生效。                      |
| `leading`       | `{ ui }`      | `prefix` 的旧名，保留以兼容既有用法。                                        |
| `trailing`      | `{ ui }`      | `suffix` 的旧名，位于清除按钮与密码开关之后，保留以兼容既有用法。            |

### Expose

| 名称              | 签名/类型      | 平台   | 描述                                                 |
| :---------------- | :------------- | :----- | :--------------------------------------------------- |
| `focus`           | `() => void`   | 通用   | 使输入框获得焦点（UniApp H5 端将光标移至内容末尾）。 |
| `clear`           | `() => void`   | 通用   | 清空输入内容并触发 `clear` 事件。                    |
| `blur`            | `() => void`   | Web    | 使输入框失去焦点。                                   |
| `select`          | `() => void`   | Web    | 选中输入框中的全部文字。                             |
| `ref` / `inputRef` | `Ref`         | Web    | 内部原生 input/textarea 元素引用（`inputRef` 为旧名）。 |
| `input`           | `Ref`          | Web    | 单行模式下的原生 input 元素（textarea 模式为 null）。 |
| `textarea`        | `Ref`          | Web    | 多行模式下的原生 textarea 元素。                     |
| `resizeTextarea`  | `() => void`   | Web    | 重新计算 textarea 高度（autosize 时）。              |
| `textareaStyle`   | `Ref<object>`  | Web    | autosize 计算出的 textarea 内联样式。                |
| `isComposing`     | `Ref<boolean>` | Web    | 是否处于输入法合成状态。                             |
| `passwordVisible` | `Ref<boolean>` | 通用   | 密码是否以明文展示。                                 |
| `isFocus`         | `Ref<boolean>` | UniApp | 当前是否处于聚焦态。                                 |

### 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的 Tailwind/Uno 类名：

| 键名        | 平台   | 说明                                           |
| :---------- | :----- | :--------------------------------------------- |
| `root`      | 通用   | 最外层容器（纵向容纳输入组与外置字数统计）；UniApp 端 `customClass` 也并到该节点。 |
| `group`     | 通用   | 输入组容器（prepend + 输入框 + append）。      |
| `prepend`   | 通用   | 前置连体块。                                   |
| `append`    | 通用   | 后置连体块。                                   |
| `wrapper`   | 通用   | 输入框主体容器。                               |
| `input`     | 通用   | 输入区域（UniApp 端为包裹原生 input 的容器）。 |
| `inputItem` | UniApp | 原生 input 元素本体。                          |
| `leading`   | 通用   | 前缀插槽容器。                                 |
| `trailing`  | 通用   | 后缀插槽容器。                                 |
| `iconBox`   | 通用   | 右侧图标区容器（清除/密码/字数/后缀）。        |
| `icon`      | Web    | 清除与密码图标的尺寸类。                       |
| `clear`     | 通用   | 清除按钮。                                     |
| `password`  | 通用   | 密码明文/密文切换按钮。                        |
| `separator` | 通用   | 竖分割线。                                     |
| `count`     | 通用   | 字数统计文本。                                 |

### CSS 变量

| 变量名              | 描述             | 移动端值 (默认) | 桌面端值 (min-width: 768px) |
| :------------------ | :--------------- | :-------------- | :-------------------------- |
| `--input-lg-height` | 大尺寸输入框高度 | `96px`          | `48px`                      |
| `--input-md-height` | 中尺寸输入框高度 | `90px`          | `45px`                      |
| `--input-sm-height` | 小尺寸输入框高度 | `80px`          | `40px`                      |

## 注意事项

- `maxlength`：UniApp 端默认 140，超长内容需显式调大或设为 `-1` 不限制；Web 端默认不限长，配合 `showWordLimit` 显示统计，设置 `countGraphemes` 后绕过原生约束只做统计。
- 两端均已用 `variant` / `shape` 取代旧的 `rounded` / `border` 属性：`filled`（默认）近似旧默认外观（灰底、聚焦亮底描边）。UniApp 端小程序不支持 `:focus-within`，聚焦高亮由组件内部 JS 聚焦态驱动，行为一致。
- UniApp 端 `focus` prop 当前未接入内部逻辑，需要程序聚焦时请用 `autofocus` 或通过 ref 调用 `focus()`。
- `cursorSpacing`（px）、`confirmHold`、`adjustPosition`、`holdKeyboard` 与 `confirm` / `keyboardheightchange` 事件为 UniApp 原生键盘能力，Web 端无效。
- 事件差异：UniApp 端同一次输入依次触发 `update:modelValue`、`input`、`change`（参数相同）；Web 端 `input` 随键入触发（输入法合成期间静默），`change` 仅在失焦或 Enter 且值变化时触发。
- 放入 FieldGroup / 表单中时，尺寸与禁用态会被表单注入的 size/disabled 覆盖，并在值变化与失焦时自动触发表单校验（`validateEvent` 可关闭）。
