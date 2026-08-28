<template>
    <div :class="ui">
        <MdcProse :key="markdown" :value="markdown" />
    </div>
</template>

<script setup lang="ts">
/**
 * DemoCode —— 示例源码面板
 *
 * 只渲染一个高亮代码块：文件名头部由代码块自身的围栏标注（```vue [文件名]）承担，
 * 折叠由外层 <RebornCollapse> 承担，超长再由这里的定高滚动兜住。
 */
import { tv } from '~/lib/tv'
import { codeConfig } from './demo.config'

interface Props {
    /** 原始源码 */
    code: string
    /** 代码块头部标题，通常是 `<demo 文件名> · <分组标题>` */
    label?: string
    /** 代码语言 */
    lang?: string
}

const props = withDefaults(defineProps<Props>(), {
    label: '',
    lang: 'vue',
})

const ui = tv(codeConfig)()

const markdown = computed(() =>
    props.code ? `\`\`\`${props.lang} [${props.label || 'example'}]\n${props.code}\n\`\`\`` : '',
)
</script>
