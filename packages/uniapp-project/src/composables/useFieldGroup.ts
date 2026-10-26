import type { ComputedRef, InjectionKey } from 'vue'
import { computed, getCurrentInstance, inject, onMounted, onUnmounted, readonly, shallowRef, watch } from 'vue'
import { useRawProp } from './useRawProp'

export interface FormValidateError {
  field: string
  message: string
}

export interface UseFieldGroupProps {
  modelValue?: any
}

/** 校验触发时机 */
export type FormTrigger = 'blur' | 'change' | 'none' | ReadonlyArray<'blur' | 'change'>

/**
 * 表单项注册到表单的条目
 * 注销时调用方只传 `uid` 与 `prop`，其余字段可省略
 */
export interface FormFieldEntry {
  /** 表单项组件实例的 uid */
  uid?: number
  /** 字段路径 */
  prop: string
  /** 异步查询表单项根节点的位置尺寸 */
  getBoundingClientRect?: (callback: (res: any) => void) => void
}

/** 表单上下文里会被表单项、控件读取的表单 props */
export interface FormContextProps {
  size?: string
  disabled?: boolean
  orientation?: string
  labelPosition?: string
  labelWidth?: string | number
  trigger?: FormTrigger
  showMessage?: boolean
  inlineMessage?: boolean
}

/** RebornForm 向后代提供的上下文 */
export interface FormContext {
  props: FormContextProps
  addField: (field: FormFieldEntry) => void
  removeField: (field: Pick<FormFieldEntry, 'uid' | 'prop'>) => void
  getError: (prop: string) => string
  validateField: (prop: string) => Promise<string | null>
}

/** RebornFormItem 向内部控件提供的上下文 */
export interface FormItemContext {
  /** 当前字段是否处于校验错误状态 */
  isError: Readonly<ComputedRef<boolean>>
  /** 按触发时机校验当前字段 */
  validate: (trigger: 'blur' | 'change') => void
}

/** 表单上下文的注入键：提供方（RebornForm）与注入方共用，上下文结构改动时两边都有编译期检查（与 Web 端一致） */
export const FORM_KEY: InjectionKey<FormContext> = Symbol('reborn-form')
/** 表单项上下文的注入键：提供方（RebornFormItem）与注入方共用 */
export const FORM_ITEM_KEY: InjectionKey<FormItemContext> = Symbol('reborn-form-item')

/** 注入最近的表单上下文，不在表单内时为 null */
function injectFormContext(): FormContext | null {
  return inject(FORM_KEY, null)
}

/** 注入最近的表单项上下文，不在表单项内时为 null */
function injectFormItemContext(): FormItemContext | null {
  return inject(FORM_ITEM_KEY, null)
}

/**
 * 表单全局状态：字段注册 / 注销与校验错误管理
 * 状态只以只读形式返回，修改一律经由返回的动作函数
 */
export function useFieldGroup() {
  /** 校验错误映射表；每次修改都整体替换 */
  const errors = shallowRef<Record<string, string>>({})
  /** 已注册的字段名集合；每次修改都整体替换 */
  const fields = shallowRef<Set<string>>(new Set())
  /** 已注册的表单项条目，按注册先后排列；条目是不透明记录，每次修改都整体替换 */
  const fieldInstances = shallowRef<FormFieldEntry[]>([])

  const addField = (field: FormFieldEntry) => {
    fieldInstances.value = [...fieldInstances.value, field]
    if (field.prop && !fields.value.has(field.prop)) {
      fields.value = new Set(fields.value).add(field.prop)
    }
  }

  const removeField = (field: Pick<FormFieldEntry, 'uid' | 'prop'>) => {
    // 调用方每次传的是新对象，按 uid + prop 找回注册时的那一条，不能用 indexOf 比对引用
    const index = fieldInstances.value.findIndex(item => item.uid === field.uid && item.prop === field.prop)
    if (index > -1) {
      fieldInstances.value = fieldInstances.value.filter((_, i) => i !== index)
    }
    // 同一路径可能已被另一个表单项接管：动态列表删掉中间项时，后面的项下标前移、先改用这个路径注册，
    // 被删项随后卸载再注销同名路径。还有实例在用时保留，否则接管的项会被漏掉、不再参与校验
    if (field.prop && fields.value.has(field.prop) && !fieldInstances.value.some(item => item.prop === field.prop)) {
      const next = new Set(fields.value)
      next.delete(field.prop)
      fields.value = next
    }
  }

  function setError(prop: string, error: string) {
    if (prop !== '') {
      errors.value = { ...errors.value, [prop]: error }
    }
  }

  function removeError(prop: string) {
    if (prop !== '' && errors.value[prop] !== undefined) {
      const newErrors = { ...errors.value }
      delete newErrors[prop]
      errors.value = newErrors
    }
  }

  function getError(prop: string): string {
    if (prop !== '') { return errors.value[prop] ?? '' }
    return ''
  }

  /** 汇总当前所有校验错误 */
  function getErrors(): FormValidateError[] {
    return Object.entries(errors.value).map(([field, message]) => ({ field, message }))
  }

  function clearValidate(fieldsToClear?: string | string[]) {
    if (fieldsToClear) {
      const propsArray = Array.isArray(fieldsToClear) ? fieldsToClear : [fieldsToClear]
      propsArray.forEach(prop => removeError(prop))
    }
    else {
      errors.value = {}
    }
  }

  return {
    /** 只读：错误映射表 */
    errors: readonly(errors),
    /** 只读：已注册字段名集合 */
    fields: readonly(fields),
    /** 只读：已注册的表单项条目（RebornForm 校验失败时据此定位、滚动） */
    fieldInstances: readonly(fieldInstances),
    addField,
    removeField,
    setError,
    removeError,
    getError,
    getErrors,
    clearValidate,
  }
}

export interface UseFieldGroupItemProps {
  prop?: string
  label?: string
  labelPosition?: string
  labelWidth?: string | number
  trigger?: FormTrigger
  ui?: any
}

export function useFieldGroupItem(props: UseFieldGroupItemProps) {
  /** 注入父级 RebornForm 提供的表单上下文，不在表单内时为 undefined */
  const form = injectFormContext() ?? undefined
  const instance = getCurrentInstance()

  const error = computed(() => {
    if (!form || !props.prop) { return '' }
    return form.getError ? form.getError(props.prop) : ''
  })

  const labelPosition = computed(() => {
    return props.labelPosition || form?.props?.labelPosition || 'left'
  })

  const labelWidth = computed(() => {
    if (labelPosition.value === 'top') { return 'auto' }
    return props.labelWidth || form?.props?.labelWidth || 'auto'
  })

  /** 表单项自身的尺寸：继承表单级 size，默认 'sm'；只用于表单项自己的样式，不下发给内部控件 */
  const size = computed(() => {
    const s = form?.props?.size
    if (s && ['sm', 'md', 'lg'].includes(s)) {
      return s as 'sm' | 'md' | 'lg'
    }
    return 'sm'
  })

  const getBoundingClientRect = (callback: (res: any) => void) => {
    uni.createSelectorQuery()
      .in(instance?.proxy)
      .select('.re-form-item')
      .boundingClientRect(callback)
      .exec()
  }

  const validate = (trigger: 'blur' | 'change') => {
    if (!form || !props.prop) { return }

    let currentTrigger = props.trigger
    if (currentTrigger === undefined) {
      currentTrigger = form.props?.trigger
    }

    if (!currentTrigger || currentTrigger === 'none') { return }

    let shouldValidate = false
    if (Array.isArray(currentTrigger)) {
      shouldValidate = currentTrigger.includes(trigger)
    }
    else {
      shouldValidate = currentTrigger === trigger
    }

    if (shouldValidate && form.validateField) {
      form.validateField(props.prop)
    }
  }

  watch(() => props.prop, (newProp, oldProp) => {
    if (form) {
      if (oldProp) {
        form.removeField({ uid: instance?.uid, prop: oldProp })
      }
      if (newProp) {
        form.addField({ uid: instance?.uid, prop: newProp, getBoundingClientRect })
      }
    }
  })

  onMounted(() => {
    if (form && props.prop) {
      form.addField({ uid: instance?.uid, prop: props.prop, getBoundingClientRect })
    }
  })

  onUnmounted(() => {
    if (form && props.prop) {
      form.removeField({ uid: instance?.uid, prop: props.prop })
    }
  })

  return {
    form,
    error,
    labelPosition,
    labelWidth,
    size,
    getBoundingClientRect,
    validate,
  }
}

export function useFormInject(props: any) {
  const form = injectFormContext()
  const formItem = injectFormItemContext()

  // 非空原始 size 才代表显式尺寸；MP 与布尔模型共用原生属性刷新协议。
  const { value: explicitSize } = useRawProp('size')

  const size = computed(() => {
    if (explicitSize.value != null) return props.size
    return form?.props?.size || props.size
  })

  const disabled = computed(() => {
    return form?.props?.disabled || props.disabled
  })

  const orientation = computed(() => {
    return form?.props?.orientation || props.orientation
  })

  const isError = computed(() => {
    return formItem?.isError?.value || false
  })

  const validate = (trigger: 'blur' | 'change') => {
    if (formItem?.validate) {
      formItem.validate(trigger)
    }
  }

  return {
    form,
    size,
    disabled,
    orientation,
    isError,
    validate,
  }
}
