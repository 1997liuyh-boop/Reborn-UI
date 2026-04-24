import { computed, getCurrentInstance, inject, onMounted, onUnmounted, ref, watch } from 'vue'

/**
 * 表单校验错误结构
 */
export interface FormValidateError {
  /** 出错的字段标识（对应 FormItem 的 `prop`） */
  field: string
  /** 校验失败的提示信息 */
  message: string
}

/**
 * 表单全局状态管理组合式函数。
 *
 * 在 `RebornForm` 组件中调用，通过 `provide` 向所有子级 FormItem 和
 * 表单控件（Input、Select 等）共享表单状态。
 *
 * 核心职责：
 * - **字段注册/注销**：维护表单内所有 FormItem 的实例列表和字段名集合
 * - **校验错误管理**：集中存储、查询、清除各字段的校验错误信息
 * - **错误锁定**：在特定场景下（如提交中）阻止新的错误写入
 *
 * @example
 * ```ts
 * // RebornForm.vue 中
 * const fieldGroup = useFieldGroup()
 * provide('rebornForm', { ...fieldGroup, props, validateField })
 * ```
 */
export function useFieldGroup() {
  /** 校验错误映射表：`{ [字段名]: 错误信息 }` */
  const errors = ref<Record<string, string>>({})
  /** 已注册的字段名集合（用于快速判断字段是否存在） */
  const fields = ref(new Set<string>([]))
  /** 已注册的 FormItem 实例列表（包含 uid、prop、getBoundingClientRect 等） */
  const fieldInstances = ref<any[]>([])

  /**
   * 注册一个表单字段实例。
   * 由 FormItem 在 `onMounted` 时调用。
   */
  const addField = (field: any) => {
    fieldInstances.value.push(field)
    if (field.prop) {
      fields.value.add(field.prop)
    }
  }

  /**
   * 注销一个表单字段实例。
   * 由 FormItem 在 `onUnmounted` 或 `prop` 变更时调用。
   */
  const removeField = (field: any) => {
    const index = fieldInstances.value.indexOf(field)
    if (index > -1) {
      fieldInstances.value.splice(index, 1)
    }
    if (field.prop) {
      fields.value.delete(field.prop)
    }
  }

  /** 错误锁定标志：为 `true` 时 `setError` 操作将被忽略 */
  const errorLock = ref(false)

  /**
   * 为指定字段设置校验错误。
   * 当 `errorLock` 为 `true` 时调用无效。
   *
   * @param prop - 字段标识
   * @param error - 错误提示文本
   */
  function setError(prop: string, error: string) {
    if (errorLock.value) { return }
    if (prop !== '') {
      errors.value = { ...errors.value, [prop]: error }
    }
  }

  /**
   * 移除指定字段的校验错误。
   *
   * @param prop - 字段标识
   */
  function removeError(prop: string) {
    if (prop !== '' && errors.value[prop] !== undefined) {
      const newErrors = { ...errors.value }
      delete newErrors[prop]
      errors.value = newErrors
    }
  }

  /**
   * 获取指定字段的当前校验错误信息。
   *
   * @param prop - 字段标识
   * @returns 错误文本，无错误时返回空字符串
   */
  function getError(prop: string): string {
    if (prop !== '') { return errors.value[prop] ?? '' }
    return ''
  }

  /**
   * 获取当前所有校验错误，返回结构化数组。
   * 通常在表单提交前调用，用于汇总校验结果。
   */
  async function getErrors(): Promise<FormValidateError[]> {
    return Object.entries(errors.value).map(([field, message]) => ({ field, message }))
  }

  /**
   * 清除校验错误。
   *
   * @param fieldsToClear - 要清除的字段名（单个或数组），不传则清除全部
   *
   * @example
   * ```ts
   * clearValidate()              // 清除所有错误
   * clearValidate('username')    // 仅清除 username 字段
   * clearValidate(['email', 'phone']) // 清除多个字段
   * ```
   */
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

/**
 * `useFieldGroupItem` 的 props 类型定义
 */
export interface UseFieldGroupItemProps {
  /** 字段标识，对应表单数据模型的键名 */
  prop?: string
  /** 标签文本 */
  label?: string
  /** 标签位置：`'left'` | `'top'` | `'right'` */
  labelPosition?: string
  /** 标签宽度（像素或 CSS 值），`labelPosition` 为 `'top'` 时自动设为 `'auto'` */
  labelWidth?: string | number
  /**
   * 校验触发时机
   * - `'blur'`：失焦时校验
   * - `'change'`：值变化时校验
   * - `'none'`：不自动校验
   * - `Array`：多种时机组合
   */
  trigger?: 'blur' | 'change' | 'none' | Array<'blur' | 'change'>
  /** UI 样式覆盖 */
  ui?: any
}

/**
 * 表单项（FormItem）状态管理组合式函数。
 *
 * 在 `RebornFormItem` 组件中调用，负责：
 * - 从父级 `RebornForm`（通过 `inject`）获取共享状态
 * - 自动注册/注销当前字段到表单
 * - 继承并回退表单级配置（labelPosition、labelWidth、size）
 * - 提供当前字段的校验错误和手动触发校验的能力
 *
 * @param props - FormItem 的组件 props
 *
 * @example
 * ```ts
 * // RebornFormItem.vue 中
 * const { form, error, labelPosition, labelWidth, size, validate } = useFieldGroupItem(props)
 * ```
 */
export function useFieldGroupItem(props: UseFieldGroupItemProps) {
  /** 注入父级 RebornForm 提供的表单上下文 */
  const form = inject<any>('rebornForm', undefined)
  /** 当前组件实例，用于获取 uid 和 DOM 引用 */
  const instance = getCurrentInstance()

  /**
   * 当前字段的校验错误信息（响应式）。
   * 从表单全局 errors 中按 `prop` 取值，无错误时为空字符串。
   */
  const error = computed(() => {
    if (!form || !props.prop) { return '' }
    return form.getError ? form.getError(props.prop) : ''
  })

  /**
   * 计算后的标签位置：优先使用自身 prop，回退到表单级配置，最终默认 `'left'`。
   */
  const labelPosition = computed(() => {
    return props.labelPosition || form?.props?.labelPosition || 'left'
  })

  /**
   * 计算后的标签宽度：`labelPosition` 为 `'top'` 时强制返回 `'auto'`，
   * 否则优先使用自身 prop，回退到表单级配置。
   */
  const labelWidth = computed(() => {
    if (labelPosition.value === 'top') { return 'auto' }
    return props.labelWidth || form?.props?.labelWidth || 'auto'
  })

  /**
   * 计算后的组件尺寸：继承表单级 `size`，默认 `'sm'`。
   */
  const size = computed(() => {
    const s = form?.props?.size
    if (s && ['sm', 'md', 'lg'].includes(s)) {
      return s as 'sm' | 'md' | 'lg'
    }
    return 'sm'
  })

  /**
   * 获取当前 FormItem DOM 元素的位置和尺寸信息。
   * 用于表单校验失败时自动滚动到对应字段。
   */
  const getBoundingClientRect = (callback: (res: DOMRect) => void) => {
    if (instance?.proxy?.$el) {
      const rect = instance.proxy.$el.getBoundingClientRect()
      callback(rect)
    }
  }

  /**
   * 根据触发时机决定是否执行校验。
   *
   * 优先级：FormItem 自身 `trigger` > Form 全局 `trigger`。
   * 当 trigger 为 `'none'` 或不匹配当前事件时跳过校验。
   *
   * @param trigger - 当前触发事件类型（`'blur'` 或 `'change'`）
   */
  const validate = (trigger: 'blur' | 'change') => {
    if (!form || !props.prop) { return }

    // 确定有效的触发时机配置
    let currentTrigger = props.trigger
    if (currentTrigger === undefined) {
      currentTrigger = form.props?.trigger
    }

    if (!currentTrigger || currentTrigger === 'none') { return }

    // 判断当前事件是否命中配置的触发时机
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

  // ─── 生命周期：字段注册与注销 ───

  /**
   * 监听 `prop` 变化：旧字段注销、新字段注册。
   * 支持动态切换字段绑定。
   */
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

  /** 组件挂载时向表单注册当前字段 */
  onMounted(() => {
    if (form && props.prop) {
      form.addField({ uid: instance?.uid, prop: props.prop, getBoundingClientRect })
    }
  })

  /** 组件卸载时从表单注销当前字段 */
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

/**
 * 表单内部控件注入工具函数。
 *
 * 供底层表单控件（如 `RebornInput`、`RebornSelect` 等）使用，
 * 通过 `inject` 获取最近的 `RebornForm` 和 `RebornFormItem` 上下文，
 * 自动继承表单级的 `size`、`disabled`、`orientation` 等配置。
 *
 * @param props - 控件自身的 props（用作回退值）
 *
 * @example
 * ```ts
 * // RebornInput.vue 中
 * const { size, disabled, isError, validate } = useFormInject(props)
 *
 * // 在 blur 事件中触发校验
 * const onBlur = () => validate('blur')
 * ```
 */
export function useFormInject(props: any = {}) {
  /** 注入的 RebornForm 上下文 */
  const form = inject<any>('rebornForm', null)
  /** 注入的 RebornFormItem 上下文 */
  const formItem = inject<any>('rebornFormItem', null)

  /**
   * 组件尺寸：FormItem > Form > 自身 props，三级回退。
   */
  const size = computed(() => {
    return formItem?.size?.value || form?.props?.size || props.size
  })

  /**
   * 是否禁用：Form 级禁用优先于控件自身。
   */
  const disabled = computed(() => {
    return form?.props?.disabled || props.disabled
  })

  /**
   * 布局方向：继承 Form 级配置。
   */
  const orientation = computed(() => {
    return form?.props?.orientation || props.orientation
  })

  /**
   * 当前字段是否处于校验错误状态。
   * 用于控件显示红色边框等错误样式。
   */
  const isError = computed(() => {
    return formItem?.isError?.value || false
  })

  /**
   * 触发当前字段的校验。
   * 委托给父级 FormItem 的 validate 方法。
   *
   * @param trigger - 触发类型（`'blur'` 或 `'change'`）
   */
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
