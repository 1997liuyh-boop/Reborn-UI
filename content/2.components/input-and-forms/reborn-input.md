---
title: 基础输入框
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
  <RebornInput v-model="keyword" placeholder="请输入关键词" clearable />
  <RebornInput model-value="只读内容" readonly />
  <RebornInput placeholder="禁用状态" disabled />
</template>
```

Web 端还可通过 `as="textarea"` 渲染多行文本域，行数由 `rows` 控制：

```vue
<RebornInput v-model="remark" as="textarea" :rows="4" placeholder="备注" />
```

### 尺寸、颜色与外形

`size` 提供 `sm` / `md` / `lg` 三档高度与字号；聚焦时的边框高亮颜色由 `color` 决定（7 种主题色，需配合 `border` 开启）；`rounded` 控制圆角，`lg` 尺寸为全圆角胶囊。

```vue
<template>
  <RebornInput v-model="value" size="lg" color="primary" border placeholder="主题色聚焦高亮" />
  <RebornInput v-model="value" size="sm" color="error" border placeholder="小尺寸" />
</template>
```

### 密码框与前后缀插槽

`password` 开启掩码显示并出现明文/密文切换按钮；`leading` / `trailing` 插槽放置前后缀内容（作用域提供 `ui` 类名生成器）；`separator` 控制清除按钮、密码开关与后缀之间的竖分割线。

```vue
<template>
  <RebornInput v-model="pwd" password clearable placeholder="请输入密码" />

  <RebornInput v-model="keyword" clearable placeholder="搜索">
    <template #leading>
      <Icon name="lucide:search" class="size-4 text-gray-400" />
    </template>
    <template #trailing>
      <Icon name="lucide:calendar" class="size-4 text-gray-400" />
    </template>
  </RebornInput>
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

| 属性名             | 类型                                                                                   | 默认值                  | 平台   | 描述                                                                 |
| :----------------- | :------------------------------------------------------------------------------------- | :---------------------- | :----- | :------------------------------------------------------------------- |
| `modelValue`       | `string / number`                                                                      | `-`                     | 通用   | 输入框绑定值（v-model）。                                            |
| `defaultValue`     | `string / number`                                                                      | `-`                     | 通用   | 非受控模式下的初始值，未绑定 modelValue 时生效。                     |
| `placeholder`      | `string`                                                                               | `""`                    | 通用   | 占位文本。                                                           |
| `disabled`         | `boolean`                                                                              | `false`                 | 通用   | 是否禁用。                                                           |
| `readonly`         | `boolean`                                                                              | `false`                 | 通用   | 是否只读。                                                           |
| `type`             | `InputType`                                                                            | `'text'`                | 通用   | 输入类型；UniApp 端支持 text/number/idcard/digit 等原生键盘类型。    |
| `size`             | `'sm' \| 'md' \| 'lg'`                                                                 | `'sm'`                  | 通用   | 尺寸，影响高度与字号。                                               |
| `color`            | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'neutral'`             | 通用   | 聚焦时边框与分割线的高亮颜色，需配合 `border` 开启。                 |
| `rounded`          | `boolean`                                                                              | `true`                  | 通用   | 是否圆角：sm/md 为小圆角，lg 为全圆角胶囊。                          |
| `border`           | `boolean`                                                                              | `false`（Web 为 `true`）| 通用   | 是否显示边框；开启后聚焦时边框颜色跟随 `color`。                     |
| `password`         | `boolean`                                                                              | `false`                 | 通用   | 是否密码框：掩码显示并提供明文/密文切换按钮。                        |
| `clearable`        | `boolean`                                                                              | `false`                 | 通用   | 是否显示清除按钮：有内容且非禁用/只读时出现。                        |
| `separator`        | `boolean`                                                                              | `true`                  | 通用   | 是否在清除按钮、密码开关与 trailing 插槽之间显示竖分割线。           |
| `autofocus`        | `boolean`                                                                              | `false`                 | 通用   | 挂载后自动聚焦（UniApp 端唤起键盘；Web 端为初始聚焦样式）。          |
| `ui`               | `InputUI`                                                                              | `{}`                    | 通用   | 按内部结构键覆盖类名，见下方「自定义样式（ui）」。                   |
| `as`               | `'input' \| 'textarea'`                                                                | `'input'`               | Web    | 渲染为单行 input 还是多行 textarea。                                 |
| `rows`             | `number`                                                                               | `4`                     | Web    | `as="textarea"` 时的行数。                                           |
| `class`            | `any`                                                                                  | `-`                     | Web    | 追加到根节点 wrapper 的额外样式类。                                  |
| `customClass`      | `any`                                                                                  | `-`                     | UniApp | 追加到根节点 wrapper 的自定义类名。                                  |
| `focus`            | `boolean`                                                                              | `false`                 | UniApp | 预留的聚焦开关，当前未接入；聚焦请用 `autofocus` 或实例 `focus()`。  |
| `maxlength`        | `number`                                                                               | `140`                   | UniApp | 最大输入字符数，设为 `-1` 不限制。                                   |
| `cursorSpacing`    | `number`                                                                               | `5`                     | UniApp | 聚焦时输入框距键盘的距离，单位 px。                                  |
| `confirmHold`      | `boolean`                                                                              | `false`                 | UniApp | 点击键盘确认按钮时是否保持键盘不收起。                               |
| `confirmType`      | `string`                                                                               | `'done'`                | UniApp | 键盘确认按钮文案：done/send/search/next/go。                         |
| `adjustPosition`   | `boolean`                                                                              | `true`                  | UniApp | 键盘弹起时是否自动上推页面。                                         |
| `holdKeyboard`     | `boolean`                                                                              | `false`                 | UniApp | 聚焦时点击页面其他区域是否保持键盘不收起。                           |
| `placeholderClass` | `string`                                                                               | `''`                    | UniApp | 占位文本的样式类，追加在内置 `text-gray-4` 之后。                    |

### Emits

| 事件名                 | 回调参数                  | 平台   | 描述                                                         |
| :--------------------- | :------------------------ | :----- | :----------------------------------------------------------- |
| `update:modelValue`    | `(value: string / number)`| 通用   | 输入值变化时触发（v-model 同步）。                           |
| `input`                | `(value: string / number)`| UniApp | 输入时触发，参数为当前输入值。                               |
| `change`               | `(value: string / number)`| UniApp | 输入值变化时触发，与 input 同步；清空时参数为空字符串。      |
| `focus`                | `(event)`                 | 通用   | 输入框获得焦点时触发。                                       |
| `blur`                 | `(event)`                 | 通用   | 输入框失去焦点时触发。                                       |
| `confirm`              | `(event)`                 | UniApp | 点击键盘确认/完成按钮时触发。                                |
| `clear`                |                           | 通用   | 点击清除按钮清空内容后触发。                                 |
| `keyboardheightchange` | `(event)`                 | UniApp | 键盘高度变化时触发，`e.detail` 含 height（px）与 duration。  |

### Slots

| 插槽名     | 作用域参数 | 描述                                                             |
| :--------- | :--------- | :--------------------------------------------------------------- |
| `leading`  | `{ ui }`   | 输入框前缀区域，常放搜索图标等；作用域提供 ui 类名生成器。       |
| `trailing` | `{ ui }`   | 输入框后缀区域，位于清除按钮与密码开关之后；作用域提供 ui 类名生成器。 |

### Expose

| 名称       | 签名/类型      | 平台   | 描述                                                  |
| :--------- | :------------- | :----- | :---------------------------------------------------- |
| `focus`    | `() => void`   | 通用   | 使输入框获得焦点（UniApp H5 端将光标移至内容末尾）。  |
| `clear`    | `() => void`   | 通用   | 清空输入内容并触发 `clear` 事件。                     |
| `blur`     | `() => void`   | Web    | 使输入框失去焦点。                                    |
| `inputRef` | `Ref`          | Web    | 内部原生 input/textarea 元素引用。                    |
| `isFocus`  | `Ref<boolean>` | UniApp | 当前是否处于聚焦态。                                  |

### 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的 Tailwind/Uno 类名：

| 键名        | 平台   | 说明                                         |
| :---------- | :----- | :------------------------------------------- |
| `wrapper`   | 通用   | 根容器。                                     |
| `input`     | 通用   | 输入区域（UniApp 端为包裹原生 input 的容器）。 |
| `inputItem` | UniApp | 原生 input 元素本体。                        |
| `leading`   | 通用   | 前缀插槽容器。                               |
| `trailing`  | 通用   | 后缀插槽容器。                               |
| `iconBox`   | 通用   | 右侧图标区容器（清除/密码/后缀）。           |
| `icon`      | Web    | 清除与密码图标的尺寸类。                     |
| `clear`     | 通用   | 清除按钮。                                   |
| `password`  | 通用   | 密码明文/密文切换按钮。                      |
| `separator` | 通用   | 竖分割线。                                   |

### CSS 变量

| 变量名              | 描述             | 移动端值 (默认) | 桌面端值 (min-width: 768px) |
| :------------------ | :--------------- | :-------------- | :-------------------------- |
| `--input-lg-height` | 大尺寸输入框高度 | `96px`          | `48px`                      |
| `--input-md-height` | 中尺寸输入框高度 | `90px`          | `45px`                      |
| `--input-sm-height` | 小尺寸输入框高度 | `80px`          | `40px`                      |

## 注意事项

- `maxlength` 仅 UniApp 端存在，默认 140，超长内容需显式调大或设为 `-1` 不限制；Web 端不限长。
- `color` 的聚焦高亮依赖 `border` 开启：UniApp 端 `border` 默认 `false`，需显式开启才能看到聚焦配色（Web 端默认 `true`）。
- UniApp 端 `focus` prop 当前未接入内部逻辑，需要程序聚焦时请用 `autofocus` 或通过 ref 调用 `focus()`。
- Web 端 `rounded` 传 `false` 目前不生效（内部恒为圆角样式）；UniApp 端 `false` 时回退为基础圆角而非直角。
- `cursorSpacing`（px）、`confirmHold`、`adjustPosition`、`holdKeyboard` 与 `confirm` / `keyboardheightchange` 事件为 UniApp 原生键盘能力，Web 端无效；`as` / `rows` 与 expose 的 `blur` / `inputRef` 仅 Web 端可用。
- UniApp 端同一次输入会依次触发 `update:modelValue`、`input`、`change` 三个事件（参数相同）；Web 端只触发 `update:modelValue`。
- 放入 FieldGroup / 表单中时，尺寸与禁用态会被表单注入的 size/disabled 覆盖，并在值变化与失焦时自动触发表单校验。
