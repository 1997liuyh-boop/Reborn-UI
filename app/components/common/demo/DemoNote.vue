<template>
    <p :class="ui">
        <slot>{{ text }}</slot>
    </p>
</template>

<script setup lang="ts">
/**
 * DemoNote —— 示例中的说明性文字
 *
 * 纯文本、无盒子、无背景，取代各处手写的 text-sm text-gray-500 之类的硬编码颜色。
 * 需要更弱的层级（单位、边界条件备注）时传 tone="dimmed"。
 *
 * 完整规范见 ./demo.config.ts 顶部注释与文档页 /getting-started/demo-guidelines。
 */
import { tv } from '~/lib/tv'
import { noteConfig } from './demo.config'

interface Props {
    /** 说明文字，也可直接用默认插槽承载富文本 */
    text?: string
    /** 文字明度：muted 常规说明（默认）/ dimmed 更弱 */
    tone?: 'muted' | 'dimmed'
}

const props = withDefaults(defineProps<Props>(), {
    text: '',
    tone: 'muted',
})

const b = tv(noteConfig)
const ui = computed(() => b({ tone: props.tone }))
</script>
