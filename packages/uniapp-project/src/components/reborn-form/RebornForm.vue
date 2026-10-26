<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type * as z from 'zod'
import type { formLabelPositions } from './reborn-form.config'
import type { FormValidateError } from '@/composables/useFieldGroup'
import { computed, onMounted, provide, readonly, toRaw } from 'vue'
import { FORM_KEY, useFieldGroup } from '@/composables/useFieldGroup'
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
  showMessage?: boolean // 是否显示错误信息
  inlineMessage?: boolean // 是否内联显示错误信息
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
  showMessage: true,
  inlineMessage: true,
  size: 'md',
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
  clearValidate: clearFieldErrors,
} = useFieldGroup()

let initialModel: Record<string, any> = {}

// 递归复制快照，保留 undefined、Date 与外部实例。
function cloneDeep<T>(value: T): T {
  const raw = toRaw(value) as any
  if (raw instanceof Date) return new Date(raw.getTime()) as T
  if (Array.isArray(raw)) return raw.map(item => cloneDeep(item)) as T
  if (raw && typeof raw === 'object' && Object.getPrototypeOf(raw) === Object.prototype) {
    return Object.fromEntries(Object.entries(raw).map(([key, item]) => [key, cloneDeep(item)])) as T
  }
  return raw
}

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

// 设置初始值，每次重置再次复制，快照不会被后续输入污染。
function setInitialValues(values: any) { initialModel = cloneDeep(values || {}) }

/** 把嵌套写法（contacts-0-name、a.b、a[0]）转成 zod issue 路径的点分形式 */
function toIssuePath(prop: string): string {
    return prop.split(/[.[\]\s-]+/).filter(Boolean).join('.')
}

/**
 * 对整张表单跑一次 schema 解析，返回全部 issues；没有规则时返回 null。
 * 解析异常与业务错误分开返回，未完成校验时不能允许提交。
 */
async function parseIssues(): Promise<{ issues: any[], failure?: string } | null> {
    if (!props.rules) return null
    try {
        // modelValue 是父组件持有的 reactive 对象，直接解析即可，不需要再镜像一份
        const result = await (props.rules as any).safeParseAsync(props.modelValue)
        return { issues: result.success ? [] : result.error.issues }
    }
    catch (e) {
        console.error('[RebornForm] Validation error:', e)
        return { issues: [], failure: '校验未完成，请重试' }
    }
}

/**
 * 把解析结果写入单个字段：先清旧错误，再写入命中该路径的第一条 issue
 */
function applyFieldIssues(prop: string, issues: any[], failure?: string): string | null {
    // 先按原名精确匹配：顶层键本身可以含连字符（如 user-name），只按嵌套规则转换会变成 user.name 永远对不上，校验被静默绕过；
    // 原名没有命中再按嵌套写法匹配
    const nested = toIssuePath(prop)
    const issue = issues.find((i: any) => i.path.join('.') === prop)
        ?? issues.find((i: any) => i.path.join('.') === nested)
    removeError(prop)
    const message = failure ?? issue?.message
    if (!message) return null
    setError(prop, message)
    return message
}

/**
 * 按字段递增的校验令牌：trigger 为 change 时快速输入会连发多次异步解析，返回顺序不保证，
 * 只有令牌仍是最新的那次结果才写入，旧结果直接丢弃
 */
const validateTokens = new Map<string, number>()
/** 每个字段最近一次单字段校验的 Promise，过期的调用改为等待它的结果 */
const latestFieldRuns = new Map<string, Promise<string | null>>()

function issueToken(prop: string): number {
    const token = (validateTokens.get(prop) ?? 0) + 1
    validateTokens.set(prop, token)
    return token
}

// 清空或重置后，仍在解析的旧结果不能重新写入错误。
function clearValidate(props?: string | string[]) {
    const targets = props === undefined ? [...validateTokens.keys()] : (Array.isArray(props) ? props : [props])
    targets.forEach(prop => { issueToken(prop); latestFieldRuns.delete(prop) })
    clearFieldErrors(props)
}

/**
 * 验证单个字段
 */
function validateField(prop: string): Promise<string | null> {
    if (prop === '' || !props.rules) return Promise.resolve(null)
    return runFieldValidation(prop, parseIssues())
}

/** 整表与单字段共用同一份代际协议，旧请求等待接管它的最新请求。 */
function runFieldValidation(prop: string, parsing: ReturnType<typeof parseIssues>): Promise<string | null> {
    const token = issueToken(prop)
    const run: Promise<string | null> = parsing.then((parsed): string | null | Promise<string | null> => {
        if (validateTokens.get(prop) !== token) {
            // 期间又发起了新的单字段校验：等那次的结果；新令牌来自整表 validate 或那次已完成时，直接读当前错误
            const latest = latestFieldRuns.get(prop)
            return latest && latest !== run ? latest : (getError(prop) || null)
        }
        if (latestFieldRuns.get(prop) === run) latestFieldRuns.delete(prop)
        return parsed ? applyFieldIssues(prop, parsed.issues, parsed.failure) : (getError(prop) || null)
    })
    latestFieldRuns.set(prop, run)
    return run
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
async function validate(callback?: (valid: boolean, errors: FormValidateError[]) => void): Promise<boolean> {
    const fieldProps = Array.from(fields.value).filter(prop => prop !== '')
    // schema 仍只解析一次，每个字段都登记为可被后续校验接管的请求。
    const parsing = parseIssues()
    const runs = fieldProps.map(prop => runFieldValidation(prop, parsing))
    const parsed = await parsing
    await Promise.all(runs)
    let currentErrors: FormValidateError[]
    do {
        await Promise.all(fieldProps.map(prop => latestFieldRuns.get(prop)))
        currentErrors = await getErrors()
    } while (fieldProps.some(prop => latestFieldRuns.has(prop)))

    if (currentErrors.length > 0 && props.scrollToError) {
        const first = fieldInstances.value.find(field => errors.value[field.prop] !== undefined)
        if (first) scrollToField(first.prop)
    }

    const isValid = currentErrors.length === 0 && !(fieldProps.length === 0 && parsed?.failure)
    if (callback) {
        // 使用方回调抛错不能让 validate 的 Promise 变成 reject，文档约定它始终 resolve
        try {
            callback(isValid, currentErrors)
        }
        catch (e) {
            console.error('[RebornForm] validate callback error:', e)
        }
    }
    return isValid
}

// 重置表单
function resetFields() {
  if (!props.modelValue) { return }
  clearValidate()
  const initData = initialModel

  Object.keys(initData).forEach((key) => {
    if (key in initData) {
      props.modelValue[key] = cloneDeep(initData[key])
    }
  })
}

onMounted(() => {
  if (props.modelValue) {
    setInitialValues(props.modelValue)
  }
})

// 提供 Context 给子组件 (包括 Props)
provide(FORM_KEY, {
  props: readonly({
    get size() { return props.size },
    get disabled() { return props.disabled },
    get labelPosition() { return props.labelPosition },
    get labelWidth() { return props.labelWidth },
    get trigger() { return props.trigger },
    get showMessage() { return props.showMessage },
    get inlineMessage() { return props.inlineMessage },
  }),
  addField,
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
