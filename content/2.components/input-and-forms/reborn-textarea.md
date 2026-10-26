---
title: 多行输入框
description: 用于多行文本输入的输入框组件，支持自动增高、字数统计与键盘行为配置。
category: 表单与输入
platform: both
tags: [css, tailwind, textarea, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornTextareaDemo.vue" config="RebornTextareaConfig" componentId="reborn-textarea" :componentFiles='["RebornTextarea.vue", "reborn-textarea.config.ts"]' :uniappFiles='["RebornTextarea.vue", "reborn-textarea.config.ts"]'}
::

## 简介

Textarea 是 Web 与 UniApp 均可用的多行文本输入组件，适合备注、描述和反馈内容。

`modelValue` 绑定文本，`maxlength` / `showWordLimit` 控制长度与统计，`autoHeight` 控制是否随内容增长。

`size` / `color` 控制视觉，`readonly` / `disabled` 控制输入；Web 用 `rows` 指定初始行数，UniApp 用 `height` 设定高度并提供键盘和光标相关配置。

### 何时使用

- 备注、描述等多行文本录入——用 `modelValue` 绑定内容。
- 输入长度需要可见反馈——用 `maxlength` 配合 `showWordLimit`。
- 希望内容增加时自动扩展——开启 `autoHeight`。

### 何时不使用

- 只需单行短文本——改用 `reborn-input`。
- 需要数值范围与步进控制——改用 `reborn-input-number`。

## 用法

### 基础用法

`v-model` 绑定输入值；`color` 控制聚焦时的边框高亮色，`size` 控制文字与统计区尺寸，`border` 可关闭边框。

```vue
<script setup lang="ts">
import { ref } from "vue";

const value = ref("");
</script>

<template>
  <RebornTextarea
    v-model="value"
    placeholder="请输入内容..."
    color="primary"
    size="md"
    :border="true"
  />
</template>
```

### 字数统计与 limit 插槽

`showWordLimit` 开启统计区（需配合 `maxlength` 才有意义，默认上限 100）。`limit` 插槽提供 `{ length, max }` 作用域，可完全自定义统计的展示：

```vue
<template>
  <RebornTextarea v-model="value" :maxlength="1000" show-word-limit>
    <template #limit="{ length, max }">
      <span class="absolute right-3 bottom-3 text-xs text-gray-500">
        已输入 {{ length }} / {{ max }}
      </span>
    </template>
  </RebornTextarea>
</template>
```

### 自动增高

`autoHeight` 开启后输入区高度随内容增长：Web 端默认高度由 `rows`（默认 4 行）决定；UniApp 端由 `height`（默认 `140`，单位 rpx）决定，开启 `autoHeight` 后 `height` 失效。

```vue
<template>
  <!-- Web：rows 控制初始行数 -->
  <RebornTextarea v-model="value" :rows="6" auto-height />
</template>
```

### UniApp 键盘行为

UniApp 端透传原生 textarea 的键盘配置：`confirmType` 设置键盘右下角按钮文字，`confirm` 事件响应确认按钮，`adjustPosition` 控制键盘弹起时是否上推页面；组件还暴露 `focus()` 方法用于主动唤起键盘。

```vue
<template>
  <RebornTextarea
    v-model="value"
    :height="200"
    confirm-type="send"
    :adjust-position="true"
    :cursor-spacing="10"
    @confirm="onSend"
  />
</template>
```

## API
### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string \| null` | `""` | 输入框绑定值，支持 `v-model`；重置为 `null` 或 `undefined` 时按空文本显示。 |
| `placeholder` | `string` | Web `""` / UniApp `"请输入"` | 占位文本。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `readonly` | `boolean` | `false` | 是否只读（只读时同样不可聚焦输入）。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小，影响文字与统计区字号。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 聚焦时边框高亮的主题色。 |
| `border` | `boolean` | `true` | 是否显示边框。 |
| `rows` | `number` | `4` | 默认行数，决定初始高度（仅 Web）。 |
| `height` | `number \| string` | `140` | 输入区高度，数字单位为 rpx；开启 `autoHeight` 后失效（仅 UniApp）。 |
| `autoHeight` | `boolean` | `false` | 是否随内容自动增高。 |
| `maxlength` | `number` | `100` | 最大输入长度。 |
| `showWordLimit` | `boolean` | Web `false` / UniApp `true` | 是否显示字数统计（需设置 `maxlength`）。 |
| `name` | `string` | `""` | 表单字段名称。 |
| `autofocus` | `boolean` | `false` | 是否自动聚焦。 |
| `placeholderClass` | `string` | `""` | 占位符样式类（仅 UniApp）。 |
| `placeholderStyle` | `string` | `""` | 占位符行内样式（仅 UniApp）。 |
| `confirmType` | `string` | `"done"` | 键盘右下角按钮的文字（仅 UniApp）。 |
| `confirmHold` | `boolean` | `false` | 点击键盘确认按钮时是否保持键盘不收起（仅 UniApp）。 |
| `cursor` | `number` | `0` | 聚焦时的光标位置（仅 UniApp）。 |
| `cursorSpacing` | `number` | `5` | 光标与键盘的距离（仅 UniApp）。 |
| `cursorColor` | `string` | `""` | 光标颜色（仅 UniApp）。 |
| `showConfirmBar` | `boolean` | `true` | 是否显示键盘上方带“完成”按钮那一栏（仅 UniApp）。 |
| `selectionStart` | `number` | `-1` | 选区/光标起始位置（仅 UniApp）。 |
| `selectionEnd` | `number` | `-1` | 选区/光标结束位置（仅 UniApp）。 |
| `adjustPosition` | `boolean` | `true` | 键盘弹起时是否自动上推页面（仅 UniApp）。 |
| `holdKeyboard` | `boolean` | `false` | 聚焦时点击页面是否保持键盘不收起（仅 UniApp）。 |
| `inputmode` | `"none" \| "text" \| "decimal" \| "numeric" \| "tel" \| "search" \| "email" \| "url"` | `"text"` | 输入数据类型提示，影响弹出的键盘形态（仅 UniApp）。 |
| `disableDefaultPadding` | `boolean` | `true` | 是否去掉 iOS 原生 textarea 的默认内边距（仅 UniApp）。 |
| `adjustKeyboardTo` | `string` | `"cursor"` | 键盘弹起时的对齐参照位置（仅 UniApp）。 |
| `fixed` | `boolean` | `false` | 处于 `position: fixed` 区域时需显式设为 `true`（仅 UniApp）。 |
| `customClass` | `string` | `""` | 追加到根节点的自定义类名。 |
| `ui` | `Record<string, any>` | `{}` | 内部结构样式覆盖，见下方「自定义样式（ui）」。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | 输入内容变化时触发，同步 `v-model` 绑定值。 |
| `input` | `(event)` | 每次输入时触发，参数为原生事件对象（仅 UniApp）。 |
| `change` | `(value: string)` | 输入内容变化时触发，参数为最新文本；UniApp 端仅在与上一次不同时触发。 |
| `focus` | `(event)` | 输入框获得焦点（键盘弹起）时触发。 |
| `blur` | `(event)` | 输入框失去焦点（键盘收起）时触发，并执行表单 blur 校验。 |
| `confirm` | `(event)` | 点击键盘右下角确认按钮时触发（仅 UniApp）。 |
| `linechange` | `(event)` | 输入行数变化时触发，`e.detail` 含 `height`、`lineCount` 等信息（仅 UniApp）。 |
| `keyboardheightchange` | `(event)` | 键盘高度变化时触发，`e.detail` 含 `height` 与 `duration`（仅 UniApp）。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `limit` | `{ length, max }` | 自定义字数统计区域，`length` 为当前长度、`max` 为 `maxlength`；仅在 `showWordLimit` 开启时渲染。 |

### Expose

| 名称 | 签名 | 描述 |
| --- | --- | --- |
| `isFocus` | `Readonly<Ref<boolean>>` | 当前样式聚焦态，只允许读取（仅 UniApp）。 |
| `focus` | `() => void` | 让输入框重新聚焦并唤起键盘（仅 UniApp）。 |

### 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的类名：

| 键名 | 说明 |
| --- | --- |
| `root` | 根节点样式（边框、背景、聚焦环）。 |
| `inner` | 内部 textarea 样式（文字、占位符颜色）。 |
| `text` | 默认字数统计文本样式。 |

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 初始高度 | rows，默认 4 行 | height，默认 140rpx |
| 默认字数统计 | 关闭 | 开启 |
| 键盘设置 | 浏览器输入行为 | confirmType / cursorSpacing 等原生配置 |

## 注意事项

- **父级重置为 `null` 或 `undefined` 会清空文本。** 两端以模型为唯一数据源，字数统计同步回到 0；请勿通过实例写入 `isFocus`。

- **键盘属性按平台生效**。Web 与 UniApp 双端可用；`confirmType`、`cursorSpacing`、`adjustPosition`、`holdKeyboard`、`showConfirmBar` 等键盘类属性对应 uniapp 原生 textarea 能力，主要在小程序 / App 端生效。
- **长内容需调整长度上限**。`maxlength` 默认仅 100，长内容需显式调大；`showWordLimit` 在 Web 端默认关闭、UniApp 端默认开启，且需设置 `maxlength` 才有意义。
- **高度配置按平台区分**。高度控制双端不同：Web 端由 `rows`（默认 4）决定；UniApp 端由 `height`（默认 140rpx）决定，开启 `autoHeight` 后 `height` 失效、以 48rpx 为最小高度自动增长。
- **只读状态不能聚焦**。`readonly` 为 `true` 时内部同时置为 `disabled`，输入框无法聚焦，外观与禁用态一致。
- **表单内会自动参与校验**。位于 `reborn-form` 中时自动接入字段校验：`change` 与 `blur` 时触发校验，错误态展示错误边框色。
