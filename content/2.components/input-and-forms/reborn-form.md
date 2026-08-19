---
title: Form
description: Under Development
category: 表单与输入
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornFormDemo.vue" config="RebornFormConfig" componentId="reborn-form" :componentFiles='["RebornForm.vue", "reborn-form.config.ts", "RebornFormItem.vue", "reborn-form-item.config.ts"]' :uniappFiles='["RebornForm.vue", "reborn-form.config.ts", "RebornFormItem.vue", "reborn-form-item.config.ts"]' dependencies="zod"}

#api

## Form API

| 属性名     | 类型      | 默认值    | 描述                                                                 |
| ---------- | --------- | --------- | -------------------------------------------------------------------- |
| `modelValue` | `object` | `{}` | 表单数据对象，通常需要使用 `v-model` 双向绑定。 |
| `rules` | `object` | `undefined` | 表单验证规则，基于 `zod` schema。 |
| `labelPosition` | `string` | `left` | 标签位置。可选值：`left`, `right`, `top`。 |
| `labelWidth` | `string \| number` | `140rpx` | 标签宽度。 |
| `hideRequiredAsterisk` | `boolean` | `false` | 是否隐藏必填字段的红色星号。 |
| `requireAsteriskPosition` | `string` | `left` | 必填星号的位置。可选值：`left`, `right`。 |
| `showMessage` | `boolean` | `true` | 是否显示校验错误信息。 |
| `inlineMessage` | `boolean` | `false` | 是否以行内形式显示校验信息。 |
| `statusIcon` | `boolean` | `false` | 是否在输入框中显示校验结果反馈图标。 |
| `validateOnRuleChange` | `boolean` | `true` | 是否在 `rules` 属性改变后立即触发一次验证。 |
| `disabled` | `boolean` | `false` | 是否禁用该表单内的所有组件。 |
| `scrollToError` | `boolean` | `true` | 校验失败时，是否自动滚动到第一个错误字段。 |
| `size` | `string` | `""` | 用于控制该表单内组件的尺寸。可选值：`sm`, `md`, `lg`。 |
| `customClass` | `string` | `""` | 自定义更外层容器的样式。 |
| `ui` | `object` | `{}` | 覆盖各个 slots 的样式。 |

## Form Exposes

| 名称     | 描述    |
| -------- | ------- |
| `validate` | `(callback?: (valid: boolean, errors: FormValidateError[]) => void) => Promise<boolean>` <br> 对整个表单进行校验。 |
| `validateField` | `(prop: string) => Promise<string \| null>` <br> 对部分表单字段进行校验。 |
| `resetFields` | `() => void` <br> 对整个表单进行重置，将所有字段值重置为初始值并移除校验结果。 |
| `clearValidate` | `(props?: string \| string[]) => void` <br> 移除表单项的校验结果。 |
| `scrollToField` | `(prop: string) => void` <br> 滚动到指定字段位置。 |

## Form Slots

| 名称      | 描述   |
| --------- | ------ |
| `default` | 自定义内容，通常包含 `reborn-form-item`。 |

## Form UI

| 名称      | 描述   |
| --------- | ------ |
| `root`    | 根元素 |


## Form Item API

| 属性名     | 类型      | 默认值    | 描述                                                                 |
| ---------- | --------- | --------- | -------------------------------------------------------------------- |
| `prop`     | `string`  | `""`      | 表单域 model 字段，在使用 validate、resetFields 方法的情况下，该属性是必填的。 |
| `label`    | `string`  | `""`      | 标签文本。 |
| `labelWidth` | `string \| number` | `undefined` | 标签宽度，默认继承表单的 `labelWidth`。 |
| `labelPosition` | `string` | `undefined` | 标签位置，默认继承表单的 `labelPosition`。可选值：`left`, `right`, `top`。 |
| `required` | `boolean` | `false`   | 是否必填，如不设置，则会根据校验规则自动生成。 |
| `showRequireAsterisk` | `boolean` | `false` | 是否显示必填字段的红色星号。 |
| `requireAsteriskPosition` | `string` | `right` | 必填星号的位置。可选值：`left`, `right`。 |
| `customClass` | `string` | `""` | 自定义样式类。 |
| `ui`       | `object`  | `{}`      | 覆盖各个 slots 的样式。 |

## Form Item Slots

| 名称      | 描述   |
| --------- | ------ |
| `default` | 表单域的内容。 |
| `label`   | 标签文本的内容。 |

## Form UI

| 名称      | 描述   |
| --------- | ------ |
| `root`    | 根元素 |
| `wrapper` | 内容和错误的包裹容器 |
| `label`   | 标签文本 |
| `content` | 表单域内容容器 |
| `error`   | 错误信息 |

