<script setup lang="ts">
/**
 * DemoCode —— 示例源码面板
 *
 * 只渲染一个高亮代码块：代码名称由 DemoSection 底栏展示，这里不带文件名头部；
 * 折叠由外层 <RebornCollapse> 承担，高度随代码自然撑开。
 */
import { tv } from '~/lib/tv'
import { codeConfig } from './demo.config'

interface Props {
    /** 原始源码 */
    code: string
    /** 代码语言 */
    lang?: string
}

const props = withDefaults(defineProps<Props>(), {
    lang: 'vue',
})

const ui = tv(codeConfig)()

const markdown = computed(() =>
    props.code ? `\`\`\`${props.lang}\n${props.code}\n\`\`\`` : '',
)
</script>

<template>
  <div :class="ui">
    <MdcProse :key="markdown" :value="markdown" />
  </div>
</template>
