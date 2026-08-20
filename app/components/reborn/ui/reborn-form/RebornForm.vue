<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue'
import { z } from 'zod'
import { useFieldGroup, type FormValidateError } from '~/composables/useFieldGroup'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme, { formLabelPositions } from './reborn-form.config'

/**
 * RebornForm Props 定义 (与 UniApp 版保持一致)
 */
export interface FormProps {
    modelValue: any
    rules?: z.ZodObject<any, any> | z.ZodEffects<any, any>
    labelPosition?: typeof formLabelPositions[number]
    labelWidth?: string | number
    hideRequiredAsterisk?: boolean
    requireAsteriskPosition?: 'left' | 'right'
    showMessage?: boolean
    inlineMessage?: boolean
    statusIcon?: boolean
    validateOnRuleChange?: boolean
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
    hideRequiredAsterisk: false,
    requireAsteriskPosition: 'right',
    showMessage: true,
    inlineMessage: false,
    statusIcon: false,
    validateOnRuleChange: true,
    size: 'sm',
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
    clearValidate,
} = useFieldGroup()

const initialModel = ref<any>({})
const data = ref({} as any)

/**
 * 辅助函数：根据路径获取对象值
 */
function getDeepValue(obj: any, path: string) {
    return path.split(/[.[\]]+/).filter(Boolean).reduce((prev, curr) => prev && prev[curr], obj)
}

/**
 * 验证单个字段
 */
async function validateField(prop: string): Promise<string | null> {
    let error = null as string | null

    if (prop !== '' && props.rules) {
        try {
            // 尝试获取对应的 Zod schema
            // 支持嵌套路径，例如 'contacts.0.name' 或 'contacts-0-name'
            const pathParts = prop.split(/[.[\]\s-]+/).filter(Boolean).map(p => isNaN(Number(p)) ? p : Number(p))

            // 基础校验：使用 safeParseAsync 校验整个对象，然后过滤出对应路径的错误
            const result = await (props.rules as any).safeParseAsync(data.value)

            if (!result.success) {
                const issue = result.error.issues.find((i: any) => {
                    return i.path.join('.') === pathParts.join('.')
                })
                if (issue) error = issue.message
            }
        } catch (e) {
            console.error('[RebornForm] Validation error:', e)
        }

        removeError(prop)
    }

    if (error !== null) {
        setError(prop, error!)
    }

    return error
}

/**
 * 滚动到指定字段
 */
function scrollToField(prop: string) {
    const field = fieldInstances.value.find(f => f.prop === prop)
    if (field && field.getBoundingClientRect) {
        field.getBoundingClientRect((res: DOMRect) => {
            if (res) {
                const top = window.scrollY + res.top - (window.innerHeight / 2)
                window.scrollTo({ top, behavior: 'smooth' })
            }
        })
    }
}

/**
 * 验证整个表单
 */
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
        if (callback) callback(isValid, currentErrors)
        resolve(isValid)
    })
}

/**
 * 重置表单
 */
function resetFields() {
    if (!props.modelValue) return
    clearValidate()
    const initData = initialModel.value

    Object.keys(props.modelValue).forEach((key) => {
        if (key in initData) {
            props.modelValue[key] = JSON.parse(JSON.stringify(initData[key]))
        }
    })
}

function setInitialValues(values: any) {
    initialModel.value = JSON.parse(JSON.stringify(values || {}))
}

// 监听数据变化同步到内部
watch(() => props.modelValue, (val) => {
    data.value = val
}, { immediate: true, deep: true })

onMounted(() => {
    if (props.modelValue) {
        setInitialValues(props.modelValue)
    }
})

// 提供给子组件通过 inject 获取
provide('rebornForm', {
    props,
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
    /** `(prop: string) => void` 平滑滚动页面，使指定字段进入视口居中位置 */
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
