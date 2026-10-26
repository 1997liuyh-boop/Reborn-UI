<script setup lang="ts">
import type { z } from 'zod'
import type { formLabelPositions } from './reborn-form.config'
import type { FormValidateError } from '~/composables/useFieldGroup'
import { computed, onMounted, provide, readonly, toRaw } from 'vue'
import { FORM_KEY, useFieldGroup } from '~/composables/useFieldGroup'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme from './reborn-form.config'

/**
 * RebornForm Props 定义 (与 UniApp 版保持一致)
 */
export interface FormProps {
    modelValue: any
    rules?: z.ZodObject<any, any> | z.ZodEffects<any, any>
    labelPosition?: typeof formLabelPositions[number]
    labelWidth?: string | number
    showMessage?: boolean
    inlineMessage?: boolean
    size?: 'sm' | 'md' | 'lg' | ''
    disabled?: boolean
    scrollToError?: boolean
    trigger?: 'blur' | 'change' | 'none' | Array<'blur' | 'change'>
    class?: any // 追加到根 form 元素的自定义类名（uniapp 端对应 customClass）
    ui?: Partial<{
        root: string
    }>
}

const props = withDefaults(defineProps<FormProps>(), {
    modelValue: () => ({}),
    labelPosition: 'left',
    labelWidth: '140px',
    showMessage: true,
    inlineMessage: false,
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
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.class, uiOverrides.value.root) }),
    }
})

// 获取 Composable 状态管理能力
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

/**
 * resetFields 使用的初始值快照。只在重置时读取、不参与渲染，用普通变量即可，不需要响应式
 */
let initialModel: Record<string, any> = {}

/**
 * 保留类型的深拷贝，用于初始值快照与重置回填。
 * 不用 JSON 往返：那样 Date 会变成字符串，值为 undefined 的字段会直接消失，Map、Set、File 也会丢失。
 * 只递归数组与普通对象，File、Map、类实例等按引用保留
 */
function cloneDeep<T>(value: T): T {
    const raw = toRaw(value) as any
    if (raw instanceof Date) return new Date(raw.getTime()) as T
    if (Array.isArray(raw)) return raw.map(item => cloneDeep(item)) as T
    if (raw && typeof raw === 'object' && Object.getPrototypeOf(raw) === Object.prototype) {
        return Object.fromEntries(Object.entries(raw).map(([key, item]) => [key, cloneDeep(item)])) as T
    }
    return raw
}

/**
 * 字段名转成与 zod issue.path 可比较的路径，支持 'contacts.0.name' 与 'contacts-0-name' 两种写法
 */
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
    // 原名没有命中再按嵌套写法匹配（与 UniApp 端一致）
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

/** 清空或重置时作废在途校验，避免旧错误重新出现。 */
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

/**
 * 滚动到指定字段，使其在可视区域内垂直居中。
 * 用原生 scrollIntoView 而不是 window.scrollTo：表单常放在独立滚动的容器里（布局主区域、弹窗、抽屉），
 * 这时 window 根本不可滚动，只滚 window 会毫无反应；scrollIntoView 会逐级滚动元素的各层祖先滚动容器
 */
function scrollToField(prop: string) {
    const field = fieldInstances.value.find(f => f.prop === prop)
    field?.getElement?.()?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

/**
 * 在出错字段中按文档顺序取第一个。
 * fieldInstances 是注册先后：动态新增、v-if 后显示、切换 prop 的表单项都会排到末尾，
 * 直接取下标 0 可能定位到页面靠后的字段，所以按节点在文档中的位置重新比较
 */
function firstErrorField(): string | undefined {
    let first: { prop: string, el: Element } | undefined
    for (const f of fieldInstances.value) {
        if (errors.value[f.prop] === undefined) continue
        const el: Element | null | undefined = f.getElement?.()
        if (!el) continue
        if (!first || (el.compareDocumentPosition(first.el) & Node.DOCUMENT_POSITION_FOLLOWING)) {
            first = { prop: f.prop, el }
        }
    }
    return first?.prop
}

/**
 * 验证整个表单。
 * 整张表单只解析一次，再把 issues 分发给已注册的字段：逐字段调用 validateField 会把同一份 schema 解析 N 次，
 * schema 里有远程校验时一次提交会发出 N 个相同请求
 */
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
        const prop = firstErrorField()
        if (prop) scrollToField(prop)
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

/**
 * 重置表单。
 * 键集以快照为准：初值为 undefined 的字段也在快照里，用户填写后能被清回去。
 * 直接改写 modelValue 的字段（与 Element Plus 约定一致），所以 model 必须是父组件持有的 reactive 对象
 */
function resetFields() {
    if (!props.modelValue) return
    clearValidate()
    for (const key of Object.keys(initialModel)) {
        props.modelValue[key] = cloneDeep(initialModel[key])
    }
}

function setInitialValues(values: any) {
    initialModel = cloneDeep(values || {})
}

onMounted(() => {
    if (props.modelValue) {
        setInitialValues(props.modelValue)
    }
})

// 提供给子组件通过 inject 获取
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

defineExpose({
    /** `(callback?: (valid, errors) => void) => Promise<boolean>` 校验整个表单；Promise 始终 resolve 是否通过（不 reject），失败且 scrollToError 开启时自动滚动到第一个错误字段 */
    validate,
    /** `(prop: string) => Promise<string | null>` 校验单个字段，返回该字段的错误信息，通过时为 null */
    validateField,
    /** `(props?: string | string[]) => void` 清除校验错误提示；不传清除全部字段，传字段名或数组仅清除对应字段（不重置值） */
    clearValidate,
    /** `() => void` 将所有字段重置为初始值快照（挂载时自动记录）并清除全部校验结果 */
    resetFields,
    /** `(prop: string) => void` 平滑滚动指定字段所在的各层滚动容器（含页面），使该字段在可视区域内居中 */
    scrollToField,
    /** `(values: any) => void` 重设 resetFields 使用的初始值快照（深拷贝存储，挂载时已自动记录一次） */
    setInitialValues,
    /** 已注册字段名（prop）的 Set 集合，只读，用于检查字段注册情况 */
    fields,
})
</script>

<template>
    <form :class="ui.root()" @submit.prevent>
        <slot />
    </form>
</template>
