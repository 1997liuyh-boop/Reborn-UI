<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type * as z from 'zod'
import type { formLabelPositions } from './reborn-form.config'
import type { FormValidateError } from '@/composables/useFieldGroup'
import { computed, onMounted, provide, ref, watch } from 'vue'
import { useFieldGroup } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-form.config'
import { getSystemInfo } from '@/lib/device'

export type { FormValidateError }

export interface FormRule {
  required?: boolean
  message?: string
  validator: (value: any) => boolean | string
  trigger?: string
}

export interface FromProps {
  customClass?: ClassValue
  modelValue: any
  rules?: z.ZodObject<{ [key: string]: any }, any>
  labelPosition?: typeof formLabelPositions[number] // 标签位置
  labelWidth?: string | number // 标签宽度
  hideRequiredAsterisk?: boolean // 是否隐藏必填符号
  requireAsteriskPosition?: 'left' | 'right' // 必填符号位置
  showMessage?: boolean // 是否显示错误信息
  inlineMessage?: boolean // 是否内联显示错误信息
  statusIcon?: boolean // 是否在输入框中显示校验结果反馈图标
  validateOnRuleChange?: boolean // 是否在规则改变时重新验证
  size?: '' | 'sm' | 'md' | 'lg' // 表单大小
  disabled?: boolean // 是否禁用
  scrollToError?: boolean // 是否滚动到错误信息
  trigger?: 'blur' | 'change' | 'none' | Array<'blur' | 'change'> // 触发验证
  /** 覆盖内部各区域样式类，目前仅支持 root（根节点） */
  ui?: Partial<{
    root: ClassValue
  }>
}

const props = withDefaults(defineProps<FromProps>(), {
  modelValue: () => ({}),
  labelPosition: 'left',
  labelWidth: '140rpx',
  hideRequiredAsterisk: false,
  requireAsteriskPosition: 'left',
  showMessage: true,
  inlineMessage: false,
  statusIcon: false,
  validateOnRuleChange: true,
  size: '',
  disabled: false,
  scrollToError: true,
  trigger: 'none',
})

const b = tv(theme)

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b()
  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
  }
})

// 使用 Composable获取状态管理能力
const {
  fields,
  fieldInstances,
  errors,
  addField,
  removeField,
  setError,
  removeError,
  getError,
  getErrors,
  clearValidate,
} = useFieldGroup()

const initialModel = ref<any>({})
const data = ref({} as any)// 滚动距离
const scrollTop = ref(0)

// 滚动到指定位置
function scrollTo(top: number) {
  // #ifdef H5
  window.scrollTo({ top, behavior: 'smooth' })
  // #endif

  // #ifdef MP
  uni.pageScrollTo({
    scrollTop: top,
    duration: 300,
  })
  // #endif

  // #ifdef APP
  uni.pageScrollTo({
    scrollTop: top,
    duration: 0,
  })
  // #endif
}

// 回到顶部
function scrollToTop() {
  scrollTo(0 + Math.random() / 1000)
}

function parseToObject<T>(val: T) {
  return JSON.parse(JSON.stringify(val || {}))
}

// 设置初始值
function setInitialValues(values: any) {
  initialModel.value = parseToObject(values)
}

// 验证单个字段
async function validateField(prop: string): Promise<string | null> {
  let error = null as string | null

  if (prop != '') {
    // Zod check
    const parts = prop.split('-')

    // Nested logic: contacts-0-name
    if (parts.length >= 3 && !isNaN(Number(parts[1]))) {
      const [key, indexStr, fieldName] = parts
      const index = Number(indexStr)

      if (fieldName && props.rules && props.rules.shape[key]) {
        const itemSchema = props.rules.shape[key].element
        const schema = itemSchema?.pick({ [fieldName]: true })

        const list = data.value[key]
        if (Array.isArray(list) && list[index]) {
          const result = await schema.safeParseAsync(list[index])
          if (!result.success) {
            const issue = result.error.issues.find((i: any) => i.path.length === 1 && i.path[0] === fieldName)
            if (issue) { error = issue.message }
          }
        }
      }
    }
    else {
      if (props.rules) {
        const schema = props.rules.pick({ [prop]: true })
        if (schema) {
          const result = await schema.safeParseAsync(data.value)
          if (!result.success) {
            const issue = result.error.issues.find((i: any) => i.path.length === 1 && i.path[0] === prop)
            if (issue) { error = issue.message }
          }
        }
      }
    }

    removeError(prop)
  }

  if (error != null) {
    setError(prop, error!)
  }

  return error
}

// 滚动到字段
function scrollToField(prop: string) {
  const field = fieldInstances.value.find(f => f.prop === prop)
  if (field && field.getBoundingClientRect) {
    field.getBoundingClientRect((res: any) => {
      if (res) {
        const { windowHeight } = getSystemInfo()
        uni.createSelectorQuery().selectViewport().scrollOffset((scrollRes: any) => {
          const currentScrollTop = scrollRes ? scrollRes.scrollTop : 0
          const target = currentScrollTop + res.top - windowHeight / 2 + (res.height || 0) / 2
          scrollTo(Math.max(target, 0))
        }).exec()
      }
    })
  }
}

// 验证整个表单
function validate(callback?: (valid: boolean, errors: FormValidateError[]) => void): Promise<boolean> {
  return new Promise(async (resolve) => {
    const promises = Array.from(fields.value).map(prop => validateField(prop))
    await Promise.all(promises)

    const currentErrors = await getErrors()

    if (currentErrors.length > 0 && props.scrollToError) {
      const errorInstances = fieldInstances.value.filter(f => errors.value[f.prop] !== undefined)
      if (errorInstances.length > 0) {
        scrollToField(errorInstances[0].prop)
      }
    }

    const isValid = currentErrors.length === 0
    if (callback) { callback(isValid, currentErrors) }
    resolve(isValid)
  })
}

// 重置表单
function resetFields() {
  if (!props.modelValue) { return }
  clearValidate()
  const initData = initialModel.value

  Object.keys(props.modelValue).forEach((key) => {
    if (key in initData) {
      props.modelValue[key] = initData[key]
    }
  })
}

// 监听数据变化
watch(() => props.modelValue, (val) => {
  data.value = val
}, { immediate: true, deep: true })

onMounted(() => {
  if (props.modelValue) {
    setInitialValues(props.modelValue)
  }
})

// 提供 Context 给子组件 (包括 Props)
provide('rebornForm', {
  props,
  addField: (f: any) => {
    addField(f)
  },
  removeField,
  getError,
  validateField,
})

function getField(prop: string) {
  return fieldInstances.value.find(f => f.prop === prop)
}

defineExpose({
  /** `(callback?: (valid, errors) => void) => Promise<boolean>` 校验整个表单；Promise 始终 resolve 是否通过（不 reject），失败且 scrollToError 开启时自动滚动到第一个错误字段 */
  validate,
  /** `(prop: string) => Promise<string | null>` 校验单个字段（支持 `contacts-0-name` 形式的嵌套路径），返回错误信息，通过时为 null */
  validateField,
  /** `(props?: string | string[]) => void` 清除校验错误提示；不传清除全部字段，传字段名或数组仅清除对应字段（不重置值） */
  clearValidate,
  /** `() => void` 将所有字段重置为初始值快照（挂载时自动记录）并清除全部校验结果 */
  resetFields,
  /** `(prop: string) => void` 滚动页面使指定字段进入视口居中位置（H5 平滑滚动，小程序/APP 使用 pageScrollTo） */
  scrollToField,
  /** 已注册字段名（prop）的 Set 集合，只读，用于检查字段注册情况 */
  fields,
  /** `(prop: string) => 实例 | undefined` 按 prop 获取已注册的 FormItem 字段实例 */
  getField,
  /** `(values: any) => void` 重设 resetFields 使用的初始值快照（深拷贝存储，挂载时已自动记录一次） */
  setInitialValues,
})
</script>

<template>
  <view :class="ui.root({ class: props.customClass })">
    <slot />
  </view>
</template>
