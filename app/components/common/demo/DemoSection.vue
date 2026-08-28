<template>
    <section :class="ui.root()">
        <!-- 卡片头：左标题区，右动作组（悬停浮出） -->
        <header :class="ui.header()">
            <div :class="ui.headerMain()">
                <h3 :class="ui.title()">
                    <slot name="title">{{ title }}</slot>
                </h3>
                <p v-if="description || $slots.description" :class="ui.description()">
                    <slot name="description">{{ description }}</slot>
                </p>
            </div>

            <DemoActions v-model:open="open" :code="source" :preview-path="previewPath" :label="title"
                :ask-subject="askSubject" />
        </header>

        <!-- 示例本体：常驻 -->
        <div :class="ui.body()">
            <slot />
        </div>

        <!-- 源码：在示例下方折叠展开（reborn-collapse 的 grid 0fr↔1fr 高度动画） -->
        <RebornCollapse v-if="source" v-model="open">
            <template #content>
                <DemoCode :class="ui.code()" :code="source" :label="codeLabel" />
            </template>
        </RebornCollapse>
    </section>
</template>

<script setup lang="ts">
/**
 * DemoSection —— 示例分组卡片
 *
 * 一个 demo 由若干 DemoSection 纵向排列而成，每个分组 = 一张独立卡片：
 * 卡片头（小标题 + 可选描述 + 动作组）+ 示例本体 + 折叠源码。
 *
 * 卡片本身就是示例区的表面层（DemoStage 的全宽画布已不再铺底），
 * 卡片内部不得再出现「圆角 + 填充 + 描边/投影」的盒子。
 *
 * 源码不需要手写：由 ComponentTabs 注入的 demo 源文件文本按 title 抽取
 * （见 utils/extractDemoSections），所以标题必须是字面量且同文件内唯一；
 * 抽不到源码时自动隐藏「展开代码 / 复制 / Playground」，演示照常。
 *
 * 完整规范见 ./demo.config.ts 顶部注释与文档页 /getting-started/demo-guidelines。
 */
import RebornCollapse from '~/components/reborn/ui/reborn-collapse/RebornCollapse.vue'
import { tv } from '~/lib/tv'
import { sectionConfig } from './demo.config'
import { demoContextKey } from './types'

interface Props {
    /** 小节标题（必填），同时作为从 demo 源文件中抽取本段代码的键 */
    title?: string
    /** 小节描述（可选），也可用 #description 插槽 */
    description?: string
    /** 兼容既有写法：分组已改为独立卡片，分隔靠卡片间距完成，此属性不再产生视觉差异 */
    divider?: boolean
    /** 手写源码，传了就覆盖自动抽取的结果（用于片段本身不自洽、需要单独示范的场景） */
    code?: string
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    description: '',
    divider: true,
    code: '',
})

/** 源码是否展开 */
const open = defineModel<boolean>('open', { default: false })

const b = tv(sectionConfig)
const ui = computed(() => b({ divider: props.divider }))

const ctx = inject(demoContextKey, undefined)

/** 优先用手写 code，其次按标题从 demo 源文件中抽取 */
const source = computed(() => props.code?.trim() || ctx?.sources.value[props.title]?.trim() || '')

/** 代码块头部标题：`<demo 文件名> · <分组标题>`，让读者知道这段出自哪里 */
const codeLabel = computed(() => (ctx?.demoFile ? `${ctx.demoFile} · ${props.title}` : props.title))

/** 独立预览路由（整份 demo 的预览页） */
const previewPath = computed(() => (ctx?.demoName ? `/preview/${ctx.demoName}` : ''))

/** 「询问 AI」提示词中用于定位的主体 */
const askSubject = computed(() =>
    ctx?.componentId ? `组件 \`${ctx.componentId}\` 的「${props.title}」` : `「${props.title}」`,
)
</script>
