---
title: useFieldGroup
description: 表单三层状态共享：useFieldGroup 管字段与错误，useFieldGroupItem 管表单项，useFormInject 让控件继承表单的尺寸、禁用与校验。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
    - label: UniApp
      color: success
---

# useFieldGroup

`useFieldGroup.ts` 导出三个配套函数，分别对应表单的三层：

- `useFieldGroup`：在 `RebornForm` 中调用，维护已注册的字段和各字段的校验错误。
- `useFieldGroupItem`：在 `RebornFormItem` 中调用，把表单项注册到表单，并算出标签位置、标签宽度、尺寸和当前错误。
- `useFormInject`：在输入类控件中调用，读取表单和表单项下发的尺寸、禁用态、错误态，并把 `blur` / `change` 交回表单项触发校验。

前两个由表单组件自己调用；业务开发里最常用到的是 `useFormInject`：自己写的表单控件调用它之后，放进 `RebornForm` 就能跟随表单的尺寸与禁用状态，并参与校验。

Web 端源码在 `app/composables/useFieldGroup.ts`，UniApp 端在 `packages/uniapp-project/src/composables/useFieldGroup.ts`，两端导出名与签名一致，行为差异见「两端差异」。

## API

### useFieldGroup

```ts
function useFieldGroup(): {
  errors: Readonly<Ref<Readonly<Record<string, string>>>>
  fields: Readonly<Ref<ReadonlySet<string>>>
  fieldInstances: Readonly<Ref<readonly FormFieldEntry[]>>
  addField: (field: FormFieldEntry) => void
  removeField: (field: Pick<FormFieldEntry, 'uid' | 'prop'>) => void
  setError: (prop: string, error: string) => void
  removeError: (prop: string) => void
  getError: (prop: string) => string
  getErrors: () => FormValidateError[]
  clearValidate: (fieldsToClear?: string | string[]) => void
}
```

| 成员 | 说明 |
| :--- | :--- |
| `errors` | 只读的错误映射表 `{ [字段名]: 错误信息 }`，每次修改都替换为新对象。 |
| `fields` | 只读的已注册字段名集合，`RebornForm` 校验整个表单时逐个校验其中的字段。 |
| `fieldInstances` | 只读的已注册表单项条目，按注册先后排列，不代表页面上的先后顺序。 |
| `addField` | 追加一个条目；带 `prop` 时同时把字段名加入 `fields`。 |
| `removeField` | 按 `uid` 与 `prop` 找回注册时的条目并移除；只有没有其他条目再使用同一 `prop` 时，才把字段名移出 `fields`。 |
| `setError` | 写入字段错误；`prop` 为空字符串时忽略。 |
| `removeError` | 删除字段错误；`prop` 为空字符串或该字段本无错误时不做任何事。 |
| `getError` | 读取字段错误，无错误时返回空字符串。 |
| `getErrors` | 把 `errors` 转成 `FormValidateError[]` 同步返回。 |
| `clearValidate` | 不传参数时清空全部错误；传字段名或字段名数组时只清这些字段。 |

三个状态都只能读，修改一律走动作函数：`RebornForm` 通过 `defineExpose` 暴露的 `fields` 就是这个只读集合，使用方不能再 `fields.clear()` 把注册表清空、让整个表单不再校验。

### FormValidateError

```ts
interface FormValidateError {
  field: string
  message: string
}
```

### 注入键与上下文类型

```ts
type FormTrigger = 'blur' | 'change' | 'none' | Array<'blur' | 'change'>

interface FormFieldEntry {
  uid?: number
  prop: string
  getBoundingClientRect?: (callback: (rect: DOMRect) => void) => void
  getElement?: () => Element | null // 仅 Web 端
}

interface FormContextProps {
  size?: string
  disabled?: boolean
  orientation?: string
  labelPosition?: string
  labelWidth?: string | number
  trigger?: FormTrigger
  showMessage?: boolean
  inlineMessage?: boolean
}

interface FormContext {
  props: FormContextProps
  addField: (field: FormFieldEntry) => void
  removeField: (field: Pick<FormFieldEntry, 'uid' | 'prop'>) => void
  getError: (prop: string) => string
  validateField: (prop: string) => Promise<string | null>
}

interface FormItemContext {
  isError: Readonly<ComputedRef<boolean>>
  validate: (trigger: 'blur' | 'change') => void
}

const FORM_KEY: InjectionKey<FormContext>
const FORM_ITEM_KEY: InjectionKey<FormItemContext>
```

| 导出 | 说明 |
| :--- | :--- |
| `FORM_KEY` | `RebornForm` 提供表单上下文用的注入键（`Symbol`），`useFieldGroupItem` 与 `useFormInject` 用它注入。 |
| `FORM_ITEM_KEY` | `RebornFormItem` 提供表单项上下文用的注入键（`Symbol`），`useFormInject` 用它注入。 |
| `FormContext` / `FormItemContext` | 两层上下文的结构，提供方与注入方共用，字段改名会在编译期报错。 |
| `FormFieldEntry` | 表单项注册到表单的条目。 |

自己封装表单容器、需要让库内控件继承尺寸与禁用状态时，用 `provide(FORM_KEY, { props, addField, removeField, getError, validateField })` 提供上下文。

### useFieldGroupItem

```ts
function useFieldGroupItem(props: UseFieldGroupItemProps): {
  form: any
  error: ComputedRef<string>
  labelPosition: ComputedRef<string>
  labelWidth: ComputedRef<string | number>
  size: ComputedRef<'sm' | 'md' | 'lg'>
  getBoundingClientRect: (callback: (res: DOMRect) => void) => void
  validate: (trigger: 'blur' | 'change') => void
}
```

```ts
interface UseFieldGroupItemProps {
  prop?: string
  label?: string
  labelPosition?: string
  labelWidth?: string | number
  trigger?: FormTrigger
  ui?: any
}
```

| 成员 | 说明 |
| :--- | :--- |
| `form` | 通过 `FORM_KEY` 注入的表单上下文，不在表单内时为 `undefined`。 |
| `error` | 当前 `prop` 的错误信息；没有表单或没有 `prop` 时为空字符串。 |
| `labelPosition` | 自身 `labelPosition` > 表单 `labelPosition` > `'left'`。 |
| `labelWidth` | 标签在顶部（`'top'`）时固定为 `'auto'`；否则自身 `labelWidth` > 表单 `labelWidth` > `'auto'`。 |
| `size` | 表单项自身样式用的尺寸：取表单的 `size`，只认 `'sm'` / `'md'` / `'lg'`，其他值（包括空字符串）以及不在表单内时都回退 `'sm'`。这个值不下发给内部控件。 |
| `getBoundingClientRect` | 读取表单项根节点的位置尺寸并交给回调。 |
| `validate` | 自身 `trigger` 优先，未设置时用表单的 `trigger`；值为 `'none'`、为空或与本次触发类型不匹配时跳过，命中时调用表单的 `validateField(prop)`。 |

挂载时，带 `prop` 的表单项向表单注册一个条目，卸载时注销；`prop` 变化时先注销旧路径再注册新路径。条目内容见「两端差异」。

### useFormInject

```ts
function useFormInject(props?: any): {
  form: FormContext | null
  size: ComputedRef<any>
  disabled: ComputedRef<any>
  orientation: ComputedRef<any>
  isError: ComputedRef<boolean>
  validate: (trigger: 'blur' | 'change') => void
}
```

| 成员 | 说明 |
| :--- | :--- |
| `form` | 通过 `FORM_KEY` 注入的表单上下文，不在表单内时为 `null`。 |
| `size` | 控件上显式写了 `size` 时用控件的值；否则取表单的 `size`，表单没有设置（含空字符串）时用控件自身 props 的 `size`。 |
| `disabled` | `form.props.disabled \|\| props.disabled`，表单禁用时整体禁用。 |
| `orientation` | `form.props.orientation \|\| props.orientation`；`RebornForm` 目前没有声明 `orientation`，实际取到的是控件自身的值。 |
| `isError` | 所在表单项当前是否有错误，不在表单项内时为 `false`。 |
| `validate` | 转交给所在表单项的 `validate`，不在表单项内时不做任何事。 |

## 使用示例

### 自定义控件接入 RebornForm

```vue
<script setup lang="ts">
import { useFormInject } from '~/composables/useFieldGroup'

interface Props {
  /** 尺寸；写了就以这里为准，不写时跟随所在表单 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否禁用；所在表单禁用时同样禁用 */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  disabled: false,
})

/** 输入值，双向绑定 */
const model = defineModel<string>({ default: '' })

const { size, disabled, isError, validate } = useFormInject(props)

function onInput(event: Event) {
  model.value = (event.target as HTMLInputElement).value
  // 交给所在表单项判断是否命中 change 触发
  validate('change')
}
</script>

<template>
  <input
    :value="model"
    :disabled="disabled === true"
    :data-size="size"
    :class="{ 'border-error': isError }"
    @input="onInput"
    @blur="validate('blur')"
  >
</template>
```

放进表单后，校验时机由 `RebornFormItem` 或 `RebornForm` 的 `trigger` 决定：

```vue
<RebornForm v-model="form" :rules="rules" size="lg" trigger="blur">
  <RebornFormItem label="昵称" prop="nickname">
    <!-- 未写 size，跟随表单渲染为 lg -->
    <MyInput v-model="form.nickname" />
  </RebornFormItem>
  <RebornFormItem label="备注" prop="remark">
    <!-- 显式写了 size，以控件为准 -->
    <MyInput v-model="form.remark" size="sm" />
  </RebornFormItem>
</RebornForm>
```

## 两端差异

| 项 | Web | UniApp |
| :--- | :--- | :--- |
| `useFormInject` 的参数 | 可省略，默认 `{}` | 必须传入 |
| `getBoundingClientRect` | 同步读取根节点 `$el.getBoundingClientRect()` | 用 `uni.createSelectorQuery()` 异步查询组件内的 `.re-form-item` |
| 注册到表单的条目 | `{ uid, prop, getBoundingClientRect, getElement }` | `{ uid, prop, getBoundingClientRect }` |
| 表单默认 `labelWidth` | `'140px'` | `'140rpx'` |

Web 端多出的 `getElement` 返回表单项根节点：`RebornForm` 校验失败时用它按文档顺序找出第一个出错字段，再调用原生 `scrollIntoView` 滚到可视区中部。它只放进注册条目，不在 `useFieldGroupItem` 的返回值里。

## 使用说明

- **`useFieldGroupItem` 要传组件的响应式 props 本身**：函数内部在 `computed` 和 `watch` 里读取 `props.xxx`。如果传入解构或拷贝出来的普通对象，只能拿到初始值：之后修改 `label-position`、`label-width`、`trigger` 不生效，`prop` 变化也不会重新注册；动态增删表单项后，下标前移的项仍按旧路径注册，校验会落到错误的字段上。
- **注销按 `uid + prop` 匹配**：调用方注销时传的是新对象，按引用查找会找不到。同一路径可能已被另一个表单项接管（动态列表删掉中间项时，后面的项先改用这个路径注册，被删项随后才卸载），所以只要还有条目在用这个路径，就保留 `fields` 里的字段名，否则接管的项会被漏掉、不再参与校验。
- **`size` 以控件显式传入为准**：组件的 `props.size` 已经带上了默认值，分不出是否显式传入，所以判断依据是控件 vnode 上有没有写 `size`。vnode 本身不是响应式的，父级增删 `size` 属性时控件会随之更新，函数在更新前重新读一次，因此「写了与默认值相同的 `size` 再删掉」也会切回跟随表单。表单的 `size` 只是表单内控件的默认尺寸。
- **控件尺寸不经过表单项**：`RebornFormItem` 没有自己的 `size`，`useFieldGroupItem` 算出的 `size` 只是表单 `size` 加上 `'sm'` 兜底，只用于表单项自身样式。控件直接读表单，所以表单项单独使用（外面没有 `RebornForm`）或表单 `size` 为空字符串时，控件保持自己的默认尺寸，放在表单项里与直接放在表单里的控件尺寸一致。
- **注入键是 `Symbol`**：表单与表单项用 `FORM_KEY` / `FORM_ITEM_KEY` 提供上下文，不再使用字符串键 `'rebornForm'` / `'rebornFormItem'`，避免与使用方自己的同名 `provide` 冲突。自己按字符串 `inject('rebornForm')` 的代码要改为 `inject(FORM_KEY)`。
- **`disabled` 原样透传**：结果是 `form.props.disabled || props.disabled` 的原值，不做布尔化。控件的 `disabled` 如果允许传数组之类的非布尔值（例如按滑块分别禁用），整体禁用要用 `=== true` 判断，否则数组本身为真值，会被当成整体禁用。
- **默认不自动校验**：两端 `RebornForm` 的 `trigger` 默认都是 `'none'`，表单项也没写 `trigger` 时，控件调用 `validate('blur')` / `validate('change')` 都会被跳过，只有调用表单的 `validate()` 时才校验。
- **校验只在表单项里生效**：`useFormInject` 的 `validate` 和 `isError` 都来自所在的 `RebornFormItem`；控件直接放在 `RebornForm` 下而没有包在表单项里时，仍能继承表单的 `size` / `disabled`，但不会触发校验。
