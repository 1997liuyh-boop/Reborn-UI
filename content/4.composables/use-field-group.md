---
title: useFieldGroup
description: 为表单、表单项和内部输入组件提供统一的字段注册、错误管理和校验触发能力。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useFieldGroup

`app/composables/useFieldGroup.ts` 中导出了三组配套能力：

- `useFieldGroup`：管理表单级字段集合和错误状态
- `useFieldGroupItem`：管理单个表单项与表单实例之间的关联
- `useFormInject`：供内部输入类组件读取表单上下文

## useFieldGroup

### API

```ts
function useFieldGroup(): {
  errors: Ref<Record<string, string>>
  fields: Ref<Set<string>>
  fieldInstances: Ref<any[]>
  addField(field: any): void
  removeField(field: any): void
  setError(prop: string, error: string): void
  removeError(prop: string): void
  getError(prop: string): string
  getErrors(): Promise<FormValidateError[]>
  clearValidate(fieldsToClear?: string | string[]): void
}
```

### FormValidateError

```ts
interface FormValidateError {
  field: string
  message: string
}
```

### 说明

- `errors` 记录字段级错误信息
- `fields` 记录已经注册的字段名
- `fieldInstances` 保存字段实例，便于后续滚动定位等扩展
- `clearValidate()` 可清空全部错误，也可按字段定向清空

## useFieldGroupItem

### API

```ts
function useFieldGroupItem(props: UseFieldGroupItemProps): {
  form: any
  error: ComputedRef<string>
  labelPosition: ComputedRef<string>
  labelWidth: ComputedRef<string | number>
  size: ComputedRef<'sm' | 'md' | 'lg'>
  getBoundingClientRect(callback: (res: DOMRect) => void): void
  validate(trigger: 'blur' | 'change'): void
}
```

### UseFieldGroupItemProps

```ts
interface UseFieldGroupItemProps {
  prop?: string
  label?: string
  labelPosition?: string
  labelWidth?: string | number
  trigger?: 'blur' | 'change' | 'none' | Array<'blur' | 'change'>
  ui?: any
}
```

### 说明

- 通过注入的 `rebornForm` 获取表单上下文
- 会在挂载和卸载时自动注册、移除字段
- `validate()` 会根据当前字段和表单的 `trigger` 配置决定是否触发校验

## useFormInject

### API

```ts
function useFormInject(props?: any): {
  form: any
  size: ComputedRef<any>
  disabled: ComputedRef<any>
  orientation: ComputedRef<any>
  isError: ComputedRef<boolean>
  validate(trigger: 'blur' | 'change'): void
}
```

### 说明

- 供 `Input`、`Select` 等内部表单控件复用
- 自动读取表单项和表单级别的尺寸、禁用态、方向等上下文信息
- 可将 `blur`、`change` 等交互回流到表单项校验逻辑中
