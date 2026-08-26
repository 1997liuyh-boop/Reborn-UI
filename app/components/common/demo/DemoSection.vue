<template>
    <section :class="ui.root()">
        <!-- 标题区：小标题 + 可选描述；自身无背景，与相邻分组靠上边框分隔 -->
        <header :class="ui.header()">
            <h3 :class="ui.title()">
                <slot name="title">{{ title }}</slot>
            </h3>
            <p v-if="description || $slots.description" :class="ui.description()">
                <slot name="description">{{ description }}</slot>
            </p>
        </header>

        <div :class="ui.body()">
            <slot />
        </div>
    </section>
</template>

<script setup lang="ts">
/**
 * DemoSection —— 示例分组
 *
 * 一个 demo 由若干 DemoSection 纵向排列而成，每个分组 = 小标题 + 可选描述 + 示例本体。
 * 分组自身**不带任何背景 / 描边 / 投影**：它渲染在 DemoStage 画布内，
 * 而画布已经是示例区唯一的表面层。相邻分组之间由本组件自带的一条上边框分隔
 * （首个分组自动省略），无需父级配合 divide-y。
 *
 * 完整规范见 ./demo.config.ts 顶部注释与文档页 /getting-started/demo-guidelines。
 */
import { tv } from '~/lib/tv'
import { sectionConfig } from './demo.config'

interface Props {
    /** 小节标题（必填），也可用 #title 插槽承载富文本 */
    title?: string
    /** 小节描述（可选），也可用 #description 插槽 */
    description?: string
    /** 是否绘制与上一个分组之间的分隔线，默认 true；首个分组会自动省略 */
    divider?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    description: '',
    divider: true,
})

const b = tv(sectionConfig)
const ui = computed(() => b({ divider: props.divider }))
</script>
