import { computed, getCurrentInstance, inject, onMounted, onUnmounted, ref, watch } from 'vue'

export interface FormValidateError {
  field: string
  message: string
}

export interface UseFieldGroupProps {
  modelValue?: any
}

export function useFieldGroup() {
  const errors = ref<Record<string, string>>({})
  const fields = ref(new Set<string>([]))
  const fieldInstances = ref<any[]>([])

  const addField = (field: any) => {
    fieldInstances.value.push(field)
    if (field.prop) {
      fields.value.add(field.prop)
    }
  }

  const removeField = (field: any) => {
    // 调用方每次传的是新对象，按 uid + prop 找回注册时的那一条，不能用 indexOf 比对引用
    const index = fieldInstances.value.findIndex(item => item.uid === field.uid && item.prop === field.prop)
    if (index > -1) {
      fieldInstances.value.splice(index, 1)
    }
    // 同一路径可能已被另一个表单项接管：动态列表删掉中间项时，后面的项下标前移、先改用这个路径注册，
    // 被删项随后卸载再注销同名路径。还有实例在用时保留，否则接管的项会被漏掉、不再参与校验
    if (field.prop && !fieldInstances.value.some(item => item.prop === field.prop)) {
      fields.value.delete(field.prop)
    }
  }

  const errorLock = ref(false)

  function setError(prop: string, error: string) {
    if (errorLock.value) { return }
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

  async function getErrors(): Promise<FormValidateError[]> {
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
    errors,
    fields,
    fieldInstances,
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
  trigger?: 'blur' | 'change' | 'none' | Array<'blur' | 'change'>
  ui?: any
}

export function useFieldGroupItem(props: UseFieldGroupItemProps) {
  const form = inject<any>('rebornForm', undefined)
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
  const form = inject<any>('rebornForm', null)
  const formItem = inject<any>('rebornFormItem', null)

  // 使用方在控件上显式写了 size 时以控件为准（与 Web 端、Element Plus 一致）；
  // props.size 带着组件默认值，分不出是否显式传入，只能看原始 vnode 上有没有传
  const instance = getCurrentInstance()
  const size = computed(() => {
    if (instance?.vnode.props?.size != null) return props.size
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
