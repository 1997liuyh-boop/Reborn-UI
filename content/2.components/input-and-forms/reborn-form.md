---
title: Form
description: 用于组织表单项并基于 zod schema 校验数据的表单容器组件，双端可用。
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
::

## 简介

Form 是双端可用的表单容器，由 `RebornForm` 与 `RebornFormItem` 配套使用：Form 持有数据对象（`modelValue`）与校验规则（`rules`，一个 zod 的 `z.ZodObject`），FormItem 通过 `prop` 字段名接入校验、渲染标签与错误信息。支持统一控制标签位置/宽度、必填星号、尺寸与禁用态，并暴露 `validate` / `resetFields` / `scrollToField` 等实例方法做程序化控制；校验失败时默认自动滚动到第一个错误字段。

适用场景：

- 多字段数据录入并需要统一校验（`rules` 传入 zod schema）。
- 需要 `validate` / `validateField` / `resetFields` / `clearValidate` 等程序化表单控制。
- 长表单校验失败需自动滚动到错误项（`scrollToError` 默认开启）。

不适用场景：

- 单个独立输入控件无需校验时，直接用 `reborn-input`、`reborn-select` 等控件即可。
- 只读的键值信息展示，web 端改用 `reborn-descriptions`。

## 用法

### 基础用法

`rules` 是与数据结构对应的 `z.ZodObject`；每个 `RebornFormItem` 必须设置 `prop`（对应 schema 的键）才能参与校验与重置。

```vue
<script setup lang="ts">
import { reactive } from "vue";
import * as z from "zod";

const form = reactive({ username: "", age: undefined });
const rules = z.object({
  username: z.string().min(3, "用户名至少3个字符"),
  age: z.number({ message: "请输入年龄" }).min(18, "须年满 18 岁"),
});
</script>

<template>
  <RebornForm :model-value="form" :rules="rules" label-width="160rpx">
    <RebornFormItem prop="username" label="用户名" required>
      <RebornInput v-model="form.username" placeholder="请输入用户名" />
    </RebornFormItem>
    <RebornFormItem prop="age" label="年龄" required>
      <RebornInputNumber v-model="form.age" />
    </RebornFormItem>
  </RebornForm>
</template>
```

### 校验时机（trigger）

`trigger` 默认 `"none"`：输入过程不自动校验，只在手动调用 `validate` 时统一校验。设为 `"blur"` / `"change"` 或数组可开启实时校验；FormItem 上的同名属性可覆盖单个字段的时机。

```vue
<template>
  <!-- 输入时与失焦时都实时校验 -->
  <RebornForm :model-value="form" :rules="rules" :trigger="['change', 'blur']">
    <RebornFormItem prop="email" label="邮箱" trigger="blur">
      <RebornInput v-model="form.email" />
    </RebornFormItem>
  </RebornForm>
</template>
```

### 程序化控制（ref 实例方法）

通过 `ref` 调用暴露的实例方法：`validate` 返回 `Promise<boolean>`（不会 reject），`resetFields` 恢复挂载时的初始值快照，`scrollToField` 滚动定位到指定字段。

```vue
<script setup lang="ts">
const formRef = ref();

async function submit() {
  const valid = await formRef.value.validate((ok, errors) => {
    if (!ok) console.log("校验失败:", errors);
  });
  if (valid) {
    // 提交数据
  }
}

function reset() {
  formRef.value?.resetFields();
}
</script>
```

嵌套列表字段使用连字符路径作为 `prop`（如 `contacts-0-name`），配合 `rules` 中对应的 `z.array(z.object({ ... }))` 即可校验动态列表项。

## API

### Form Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `object` | `{}` | 表单数据对象，通常使用 `v-model` 或 `:model-value` 绑定。 |
| `rules` | `z.ZodObject` | `undefined` | 表单验证规则，基于 `zod` schema（web 端还支持 `z.ZodEffects`），不是 Element 风格的规则数组。 |
| `labelPosition` | `"left" \| "right" \| "top"` | `"left"` | 标签位置。 |
| `labelWidth` | `string \| number` | Web `"140px"` / UniApp `"140rpx"` | 标签宽度。 |
| `hideRequiredAsterisk` | `boolean` | `false` | 是否隐藏必填字段的红色星号。 |
| `requireAsteriskPosition` | `"left" \| "right"` | Web `"right"` / UniApp `"left"` | 必填星号的位置。 |
| `showMessage` | `boolean` | `true` | 是否显示校验错误信息。 |
| `inlineMessage` | `boolean` | `false` | 是否以行内形式显示校验信息。 |
| `statusIcon` | `boolean` | `false` | 是否在输入框中显示校验结果反馈图标。 |
| `validateOnRuleChange` | `boolean` | `true` | 是否在 `rules` 属性改变后立即触发一次验证。 |
| `disabled` | `boolean` | `false` | 是否禁用该表单内的所有组件。 |
| `scrollToError` | `boolean` | `true` | 校验失败时，是否自动滚动到第一个错误字段。 |
| `size` | `"" \| "sm" \| "md" \| "lg"` | Web `"sm"` / UniApp `""` | 统一控制表单内组件的尺寸。 |
| `trigger` | `"blur" \| "change" \| "none" \| Array<"blur" \| "change">` | `"none"` | 自动校验时机；`"none"` 表示仅手动调用 `validate` 时校验。 |
| `class` | `string` | `""` | **仅 Web**。追加到根 `form` 元素的自定义类名。 |
| `customClass` | `string` | `""` | **仅 UniApp**。追加到根节点的自定义类名。 |
| `ui` | `object` | `{}` | 覆盖内部样式类，目前仅支持 `root`（根节点）。 |

### Form Exposes

| 名称 | 描述 |
| --- | --- |
| `validate` | `(callback?: (valid: boolean, errors: FormValidateError[]) => void) => Promise<boolean>` <br> 校验整个表单。Promise 始终 resolve 是否通过（不 reject）；失败且 `scrollToError` 开启时自动滚动到第一个错误字段。 |
| `validateField` | `(prop: string) => Promise<string \| null>` <br> 校验单个字段（支持 `contacts-0-name` 形式的嵌套路径），返回错误信息，通过时为 `null`。 |
| `resetFields` | `() => void` <br> 将所有字段重置为初始值快照（挂载时自动记录）并清除全部校验结果。 |
| `clearValidate` | `(props?: string \| string[]) => void` <br> 清除校验错误提示；不传清除全部字段，传字段名或数组仅清除对应字段（不重置值）。 |
| `scrollToField` | `(prop: string) => void` <br> 滚动页面使指定字段进入视口居中位置。 |
| `setInitialValues` | `(values: any) => void` <br> 重设 `resetFields` 使用的初始值快照（深拷贝存储）；异步回填数据后应调用一次。 |
| `fields` | `Set<string>` <br> 已注册字段名（`prop`）的集合，只读。 |
| `getField` | `(prop: string) => FormItem 实例 \| undefined` <br> **仅 UniApp**。按 `prop` 获取已注册的表单项实例。 |

### Form Slots

| 名称 | 描述 |
| --- | --- |
| `default` | 表单内容，通常放置若干 `RebornFormItem`。 |

### Form UI

| 名称 | 描述 |
| --- | --- |
| `root` | 根元素。 |

## Form Item

### Form Item Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `prop` | `string` | `""` | 表单域对应的数据字段名；使用 `validate` / `resetFields` 等方法时该属性必填。 |
| `label` | `string` | `""` | 标签文本。 |
| `labelWidth` | `string \| number` | `undefined` | 标签宽度，默认继承表单的 `labelWidth`。 |
| `labelPosition` | `"left" \| "right" \| "top"` | `undefined` | 标签位置，默认继承表单的 `labelPosition`。 |
| `required` | `boolean` | `false` | 是否显示必填星号（仅展示用途，校验规则仍由 `rules` 决定）。 |
| `requireAsteriskPosition` | `"left" \| "right"` | `"right"` | 必填星号的位置。 |
| `trigger` | `"blur" \| "change" \| "none" \| Array<"blur" \| "change">` | `undefined` | 覆盖该字段的自动校验时机，优先级高于表单的 `trigger`。 |
| `class` | `string` | `""` | **仅 Web**。追加到表单项根节点的自定义类名。 |
| `customClass` | `string` | `""` | **仅 UniApp**。追加到表单项根节点的自定义类名。 |
| `ui` | `object` | `{}` | 覆盖内部各区域样式类，见下方 Form Item UI。 |

### Form Item Slots

| 名称 | 描述 |
| --- | --- |
| `default` | 表单域的内容（输入控件等）。 |
| `label` | 自定义标签区域，替代 `label` 文本与必填星号。 |

### Form Item Exposes

| 名称 | 描述 |
| --- | --- |
| `prop` | 当前表单项绑定的字段名，供父级 Form 定位字段实例。 |
| `getBoundingClientRect` | `(callback: (rect) => void) => void` <br> 以回调返回表单项根节点的位置与尺寸，校验失败滚动定位时使用。 |

### Form Item UI

| 名称 | 描述 |
| --- | --- |
| `root` | 根元素。 |
| `label` | 标签文本。 |
| `wrapper` | 内容和错误的包裹容器。 |
| `content` | 表单域内容容器。 |
| `error` | 错误信息。 |

## 注意事项

- web 与 uniapp 双端可用；额外类名 web 端用 `class`，uniapp 端用 `customClass`。
- 校验规则基于 zod：`rules` 须传 `z.ZodObject`（而非 Element 风格的规则数组）；`required` 属性只控制星号展示，真正的必填校验写在 schema 里。
- 表单项须使用配套的 `RebornFormItem` 且置于 `RebornForm` 内；使用 `validate` / `resetFields` / `scrollToField` 时表单项的 `prop` 必填。
- `trigger` 默认 `"none"` 不自动校验，需设为 `"blur"` / `"change"`（或数组）或手动调用 `validate`。
- 双端默认值有差异：`labelWidth` web 为 `"140px"`、uniapp 为 `"140rpx"`；`requireAsteriskPosition` web 为 `"right"`、uniapp 为 `"left"`；`size` web 为 `"sm"`、uniapp 为 `""`。
- `resetFields` 恢复的是「挂载时记录的初始值快照」：异步请求回填数据后应调用 `setInitialValues` 更新快照，否则重置会回到空值。
- 嵌套/动态列表字段的 `prop` 使用连字符路径（如 `contacts-0-name`）。
- `validate` 返回的 Promise 不会 reject，失败信息通过返回值 `false` 与 callback 的 `errors` 参数获取。
