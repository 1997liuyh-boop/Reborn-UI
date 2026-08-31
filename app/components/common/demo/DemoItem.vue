<template>
    <div :class="ui.root()">
        <p v-if="label || $slots.label" :class="ui.label()">
            <slot name="label">{{ label }}</slot>
        </p>

        <div :class="ui.body()">
            <slot />
        </div>

        <p v-if="note || $slots.note" :class="ui.note()">
            <slot name="note">{{ note }}</slot>
        </p>
    </div>
</template>

<script setup lang="ts">
/**
 * DemoItem —— 示例条目：取值标签 + 示例本体 + 可选脚注
 *
 * 一组同类示例（variant / shape / size 的横向对照）的最小单元，
 * 由 DemoBlock 负责「怎么排」，由它负责「每项长什么样」，
 * 从而让全站示例的标签字号、颜色、间距保持一致。
 *
 * 本身无背景、无描边，不构成新的背景层。
 *
 * 完整规范见 ./demo.config.ts 顶部注释与文档页 /getting-started/demo-guidelines。
 */
import { tv } from '~/lib/tv'
import { itemConfig } from './demo.config'

interface Props {
    /** 取值标签（如 outlined / circle / 货币前缀），也可用 #label 插槽承载富文本 */
    label?: string
    /** 脚注（如绑定值回显、边界条件提示），也可用 #note 插槽 */
    note?: string
    /** 标签是否用等宽字体：标签为字面量取值时更整齐 */
    mono?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    label: '',
    note: '',
    mono: false,
})

const b = tv(itemConfig)
const ui = computed(() => b({ mono: props.mono }))
</script>
