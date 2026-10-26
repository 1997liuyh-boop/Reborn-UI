---
title: Form 表单
description: 用于组织表单项并基于 zod schema 校验数据的表单容器组件，双端可用。
category: 表单与输入
platform: both
tags: [vue, reborn-form, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornFormDemo.vue" config="RebornFormConfig" componentId="reborn-form" :componentFiles='["RebornForm.vue", "reborn-form.config.ts", "RebornFormItem.vue", "reborn-form-item.config.ts"]' :uniappFiles='["RebornForm.vue", "reborn-form.config.ts", "RebornFormItem.vue", "reborn-form-item.config.ts"]' dependencies="zod"}
::

## 简介

Form 是 Web 与 UniApp 均可用的表单容器，配合 RebornFormItem 组织字段、标签和错误信息。

`modelValue` 提供数据对象，`rules` 提供 zod schema，FormItem 的 `prop` 对应字段路径；`trigger` 控制校验时机。

表单还可统一设置标签位置、标签宽度、必填星号、尺寸与禁用态；`validate` / `resetFields` / `scrollToField` 等实例方法提供程序化控制，校验失败默认滚动到首个错误字段。

### 何时使用

- 多个字段需统一校验——用 `modelValue` 配合 `rules` 提供数据与 zod 规则。
- 需要按失焦或变更校验——用 `trigger` 指定触发时机。
- 长表单需要定位错误字段——保持 `scrollToError` 开启。

### 何时不使用

- 只有一个无需校验的文本输入——改用 `reborn-input`。
- 仅需展示已提交的数据——改用 `reborn-descriptions`。

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
  <RebornForm
    :model-value="form"
    :rules="rules"
    label-width="160rpx"
  >
    <RebornFormItem
      prop="username"
      label="用户名"
      required
    >
      <RebornInput
        v-model="form.username"
        placeholder="请输入用户名"
      />
    </RebornFormItem>
    <RebornFormItem
      prop="age"
      label="年龄"
      required
    >
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
  <RebornForm
    :model-value="form"
    :rules="rules"
    :trigger="['change', 'blur']"
  >
    <RebornFormItem
      prop="email"
      label="邮箱"
      trigger="blur"
    >
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

### 完整表单联动

Web 演示中的「活动报名设置」把输入框、数字输入框、单选、复选、开关、多行文本、提及、评分、下拉选择、滑块、日期、时间、颜色选择与进度条组合在同一张表单内。控件通过 `v-model` 共享数据，`rules` 与条件字段同步变化，进度条通过 `percent` 显示当前必填项的完成度。

| 联动 | 行为 | 典型用途 |
| --- | --- | --- |
| 活动类型、举办方式 → 人数 | 动态收紧 `max`，数字输入框与滑块同步更新 | 限额报名 |
| 举办方式 → 会议链接或活动场地 | 切换字段时清除不再适用的值及错误 | 条件表单 |
| 城市 → 场地选项 | 更换 `options`，清除失效的场地选择 | 级联选择 |
| 通知开关 → 邮箱 | 同步调整 `disabled`、必填星号与邮箱规则 | 按需收集信息 |
| 必填字段 → 进度条 | 复用校验规则，条件字段仅在启用时计入 | 填写完成度反馈 |
| 提及、评分、颜色 → 活动预览 | 实时回显协作者、期待程度与标识颜色 | 录入结果预览 |
| 提交、重置 → 结果回显 | `validate()` 通过后展示本地快照，`resetFields()` 恢复初始值 | 校验与恢复 |

```vue
<script setup lang="ts">
import { computed, reactive } from 'vue';
import { z } from 'zod';
const form = reactive({ notifications: false, email: '' });
const rules = computed(() => z.object({
  notifications: z.boolean(),
  email: form.notifications ? z.string().email('请填写有效邮箱') : z.string(),
}));
</script>
<template>
  <RebornForm :model-value="form" :rules="rules" trigger="change">
    <RebornFormItem prop="notifications" label="通知"><RebornSwitch v-model="form.notifications" /></RebornFormItem>
    <RebornFormItem prop="email" label="邮箱" :required="form.notifications"><RebornInput v-model="form.email" :disabled="!form.notifications" /></RebornFormItem>
  </RebornForm>
</template>
```

::tip
禁用字段不会自动退出校验，必须同步放宽对应规则。评分与时间选择器当前不自动触发字段校验，示例在 `change` 后等待 `nextTick()`，再调用 `validateField`；所有已注册字段仍参与提交时的全量校验。
::

## API
### Props

| 属性名                    | 类型                                                        | 默认值                            | 描述                                                                                          |
| ------------------------- | ----------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- |
| `modelValue` | `object`                                                    | `{}`                              | 表单数据对象，通常使用 `v-model` 或 `:model-value` 绑定。                                     |
| `rules` | `z.ZodObject`                                               | `undefined`                       | 表单验证规则，基于 `zod` schema（web 端还支持 `z.ZodEffects`），不是 Element 风格的规则数组。 |
| `labelPosition` | `"left" \| "right" \| "top"`                                | `"left"`                          | 标签位置。                                                                                    |
| `labelWidth` | `string \| number`                                          | Web `"140px"` / UniApp `"140rpx"` | 标签宽度。                                                                                    |
| `showMessage` | `boolean`                                                   | `true`                            | 是否显示校验错误文字。只在明确传 `false` 时隐藏，且只隐藏文字：校验照常进行、`validate` 照常返回错误，控件的错误描边仍会出现（与 Element Plus 一致），适合改用汇总提示或 toast 告知错误的紧凑表单。 |
| `inlineMessage` | `boolean`                                                   | `false`                           | 错误信息的摆放方式。`false` 时浮在控件下方、占用表单项的下间距；`true` 时排在控件右侧同一行，单行截断、悬停看全文，控件让出宽度。两种模式下错误本身都不占表单项高度。 |
| `disabled` | `boolean`                                                   | `false`                           | 是否禁用该表单内的所有组件。                                                                  |
| `scrollToError` | `boolean`                                                   | `true`                            | 校验失败时，是否自动滚动到第一个错误字段。                                                    |
| `size` | `"" \| "sm" \| "md" \| "lg"`                                | `"md"`                            | 表单内控件的默认尺寸；控件显式设置 `size` 时以控件为准（与 Element Plus 一致）。                                                                    |
| `trigger` | `"blur" \| "change" \| "none" \| Array<"blur" \| "change">` | `"none"`                          | 自动校验时机；`"none"` 表示仅手动调用 `validate` 时校验。                                     |
| `class` | `string`                                                    | `""`                              | **仅 Web**。追加到根 `form` 元素的自定义类名。                                                |
| `customClass` | `string`                                                    | `""`                              | **仅 UniApp**。追加到根节点的自定义类名。                                                     |
| `ui` | `object`                                                    | `{}`                              | 覆盖内部样式类，目前仅支持 `root`（根节点）。                                                 |

### Slots

| 名称      | 描述                                      |
| --------- | ----------------------------------------- |
| `default` | 表单内容，通常放置若干 `RebornFormItem`。 |
### Expose

| 名称               | 描述                                                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate`         | `(callback?: (valid: boolean, errors: FormValidateError[]) => void) => Promise<boolean>` <br> 校验整个表单。Promise 始终 resolve 是否通过（不 reject）；失败且 `scrollToError` 开启时自动滚动到第一个错误字段。 |
| `validateField`    | `(prop: string) => Promise<string \| null>` <br> 校验单个字段（支持 `contacts-0-name` 形式的嵌套路径），返回错误信息，通过时为 `null`。                                                                         |
| `resetFields`      | `() => void` <br> 将所有字段重置为初始值快照（挂载时自动记录）并清除全部校验结果。                                                                                                                              |
| `clearValidate`    | `(props?: string \| string[]) => void` <br> 清除校验错误提示；不传清除全部字段，传字段名或数组仅清除对应字段（不重置值）。                                                                                      |
| `scrollToField`    | `(prop: string) => void` <br> 平滑滚动指定字段所在的各层滚动容器（含页面），使该字段在可视区域内居中。                                                                                                          |
| `setInitialValues` | `(values: any) => void` <br> 重设 `resetFields` 使用的初始值快照（深拷贝存储）；异步回填数据后应调用一次。                                                                                                      |
| `fields`           | `ReadonlySet<string>` <br> 已注册字段名（`prop`）的集合，只读。                                                                                                                                                         |
| `getField`         | `(prop: string) => FormItem 实例 \| undefined` <br> **仅 UniApp**。按 `prop` 获取已注册的表单项实例。                                                                                                           |


### 自定义样式（ui）

| 名称   | 描述     |
| ------ | -------- |
| `root` | 根元素。 |

## Form Item

### Form Item Props

| 属性名                    | 类型                                                        | 默认值      | 描述                                                                         |
| ------------------------- | ----------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `prop` | `string`                                                    | `""`        | 表单域对应的数据字段名；使用 `validate` / `resetFields` 等方法时该属性必填。 |
| `label` | `string`                                                    | `""`        | 标签文本。                                                                   |
| `labelWidth` | `string \| number`                                          | `undefined` | 标签宽度，默认继承表单的 `labelWidth`。                                      |
| `labelPosition` | `"left" \| "right" \| "top"`                                | `undefined` | 标签位置，默认继承表单的 `labelPosition`。                                   |
| `required` | `boolean`                                                   | `false`     | 是否显示必填星号（仅展示用途，校验规则仍由 `rules` 决定）。                  |
| `requireAsteriskPosition` | `"left" \| "right"`                                         | `"right"`   | 必填星号的位置。                                                             |
| `trigger` | `"blur" \| "change" \| "none" \| Array<"blur" \| "change">` | `undefined` | 覆盖该字段的自动校验时机，优先级高于表单的 `trigger`。                       |
| `class` | `string`                                                    | `""`        | **仅 Web**。追加到表单项根节点的自定义类名。                                 |
| `customClass` | `string`                                                    | `""`        | **仅 UniApp**。追加到表单项根节点的自定义类名。                              |
| `ui` | `object`                                                    | `{}`        | 覆盖内部各区域样式类，见下方 Form Item UI。                                  |

### Form Item Slots

| 名称      | 描述                                          |
| --------- | --------------------------------------------- |
| `default` | 表单域的内容（输入控件等）。                  |
| `label` | 自定义标签区域，替代 `label` 文本与必填星号。 |

### Form Item Exposes

| 名称                    | 描述                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `prop` | 当前表单项绑定的字段名，只读；Form 定位字段靠表单项注册，不读取它。两端随 `prop` 实时更新。          |
| `getBoundingClientRect` | `(callback: (rect) => void) => void` <br> 以回调返回表单项根节点的位置与尺寸，校验失败滚动定位时使用。 |

### Form Item UI

| 名称      | 描述                   |
| --------- | ---------------------- |
| `root`    | 根元素。               |
| `label` | 标签文本。             |
| `wrapper` | 内容和错误的包裹容器；`inlineMessage` 为 `false` 时带 `relative`，为 `true` 时为横向 flex。 |
| `content` | 表单域内容容器。       |
| `error`   | 错误信息；`inlineMessage` 为 `false` 时为 `absolute top-full`，为 `true` 时为单行截断、最多占一半宽度。 |

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 类名入口 | class | customClass |
| 滚动定位 | 浏览器元素滚动 | UniApp 节点测量与页面滚动 |
| 尺寸继承 | 控件非空显式 size 优先，再继承表单 | 相同优先级；从原生属性缓存识别动态显式值 |

## 注意事项

- **根类名按平台传入**。web 与 uniapp 双端可用；额外类名 web 端用 `class`，uniapp 端用 `customClass`。
- **必填星号不等于校验规则**。校验规则基于 zod：`rules` 须传 `z.ZodObject`（而非 Element 风格的规则数组）；`required` 属性只控制星号展示，真正的必填校验写在 schema 里。
- **实例方法依赖字段注册**。表单项须使用配套的 `RebornFormItem` 且置于 `RebornForm` 内；使用 `validate` / `resetFields` / `scrollToField` 时表单项的 `prop` 必填。
- **默认不会自动校验**。`trigger` 默认 `"none"` 不自动校验，需设为 `"blur"` / `"change"`（或数组）或手动调用 `validate`。
- **标签宽度单位按平台区分**。双端默认值有差异：`labelWidth` web 为 `"140px"`、uniapp 为 `"140rpx"`。`size` 两端默认都是 `"md"`。
- **异步回填后需更新重置快照**。`resetFields` 恢复的是「挂载时记录的初始值快照」：异步请求回填数据后应调用 `setInitialValues` 更新快照，否则重置会回到空值。
- **`resetFields` 直接改写 `modelValue` 的字段**，与 Element Plus 的约定一致，所以传给 Form 的必须是父组件持有的 `reactive` 对象；传字面量对象或计算结果，重置后界面不会刷新。
- **快照保留值的类型**。快照与回填用保留类型的深拷贝：`Date` 仍是 `Date`，初值为 `undefined` 的字段也在快照里，填写后能被重置清空；`File`、`Map` 与类实例按引用保留，重置后与初值是同一个对象。回填的键以快照为准，挂载后才新增的键不会被重置。
- **`validate()` 只解析一次 schema**。整张表单解析一次后把结果分发给各字段，schema 里的异步 `refine` 一次提交只执行一次；`trigger` 为 `change` 时连续输入触发的多次校验只采纳最后一次的结果，先返回的旧结果会被丢弃。
- **嵌套字段使用连字符路径**。嵌套/动态列表字段的 `prop` 使用连字符路径（如 `contacts-0-name`）。
- **错误信息不推动下方内容**。默认模式下错误绝对定位在控件下方的间距里（2px + 14px 行高），出现、消失时其余表单项不移动；错误文字过长折行时会压到下一项上，建议控制在一行内。Web 端最后一项的间距被 `last:mb-0` 清零，该项的错误会伸出表单底部；UniApp 端每项都保留 `mb-4`，不受影响。
- **行内模式会挤窄控件**。`inlineMessage` 为 `true` 时错误占用控件右侧的宽度，勾选框组、单选组这类会换行的控件在窄屏上可能因此多出一行、整体变高；手机端或窄表单建议保持默认模式。
- **校验失败以返回值反馈**。`validate` 返回的 Promise 不会 reject，失败信息通过返回值 `false` 与 callback 的 `errors` 参数获取。
