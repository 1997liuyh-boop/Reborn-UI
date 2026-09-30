<script setup lang="ts">
/**
 * DemoSection —— 示例分组卡片
 *
 * 一个 demo 由若干 DemoSection 纵向排列而成，每个分组自上而下：
 * 小标题 → 可选描述 → 示例卡片（示例本体 + 底栏：左侧代码名称、右侧动作组）→ 折叠源码（bg-gray-2）。
 *
 * 卡片描边不填充：只用 border-gray-3 勾一条细边圈出一组示例，底色一律由
 * 页面环境层提供。正因为卡片自己都不铺底，卡片内部更不得出现
 * 「圆角 + 填充 + 描边/投影」的盒子。
 *
 * 源码不需要手写：由 ComponentTabs 注入的 demo 源文件文本按 title 抽取
 * （见 utils/extractDemoSections），所以标题必须是字面量且同文件内唯一；
 * 展示的是补全后的完整 SFC——模板片段 + 它依赖的 <script setup>（见 utils/demoSectionSfc），
 * 抽不到源码时自动隐藏「展开代码 / 复制 / Playground」，演示照常。
 *
 * 完整规范见 ./demo.config.ts 顶部注释与文档页 /getting-started/demo-guidelines。
 */
import RebornCollapse from '~/components/reborn/ui/reborn-collapse/RebornCollapse.vue'
import { tv } from '~/lib/tv'
import { sectionConfig } from './demo.config'
import { DEMO_SCOPE_ATTR, demoContextKey, demoUsageContextKey } from './types'

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

/**
 * 文档「用法」里与本分组同名小节的补充信息（由 DocsPage 裁剪正文时生成）。
 * 独立预览页等没有文档上下文的场景拿不到，卡片只显示标题与显式描述。
 */
const usageMap = inject(demoUsageContextKey, undefined)
const usage = computed(() => usageMap?.value[props.title])

/** 描述：显式 description 优先，其次取文档小节首段 */
const descriptionSegments = computed(() => usage.value?.description.filter(seg => seg.value.trim()) ?? [])
const params = computed(() => usage.value?.params ?? [])

/** 模板片段：只用于判断这一段有没有抽到代码 */
const templateSource = computed(() => props.code?.trim() || ctx?.sources.value[props.title]?.trim() || '')

/**
 * 展示 / 复制 / 询问 AI / Playground 统一用的完整 SFC：
 * 模板片段 + 它依赖的 <script setup>（见 utils/demoSectionSfc）。
 * 手写 code 视为作者自洽的片段，直接沿用；补全失败时退回模板片段。
 */
const source = computed(() =>
    props.code?.trim() || ctx?.runnableSources?.value[props.title]?.trim() || templateSource.value,
)

/** 底栏左侧的示例代码名称：`<demo 文件名> · <分组标题>`，让读者知道这段出自哪里 */
const codeLabel = computed(() => (ctx?.demoFile ? `${ctx.demoFile} · ${props.title}` : props.title))

/** 独立预览路由（整份 demo 的预览页） */
const previewPath = computed(() => (ctx?.demoName ? `/preview/${ctx.demoName}` : ''))

/** 「询问 AI」提示词中用于定位的主体 */
const askSubject = computed(() =>
    ctx?.componentId ? `组件 \`${ctx.componentId}\` 的「${props.title}」` : `「${props.title}」`,
)

// ---- Theme slots ----
/**
 * 主题 slot 面板跟着示例走：每张卡片各自开关、各自作用域，
 * 高亮与计数只针对本示例渲染出来的节点，不会串到同页其它示例上。
 */
const themeGroups = computed(() => ctx?.themeGroups?.value ?? [])

/** 本示例的 Theme slots 面板是否展开 */
const themeOpen = ref(false)

/** 示例本体容器：面板以它为主作用域查找 slot 对应的真实节点 */
const bodyEl = ref<HTMLElement | null>(null)

/**
 * 给示例本体打上作用域标记（见 DEMO_SCOPE_ATTR）。
 * 面板据此把「本卡片内的节点」与「Teleport 到 body 的弹层节点」分开处理。
 */
const scopeAttrs = computed(() => ({ [DEMO_SCOPE_ATTR]: props.title || 'demo' }))
</script>

<template>
  <section :class="ui.root()">
    <!-- 卡片外：标题 → 描述 → 涉及参数；标题沿用文档小节锚点，目录链接落到这里 -->
    <header :class="ui.header()">
      <h3 :id="usage?.id || undefined" :class="ui.title()">
        <slot name="title">{{ title }}</slot>
      </h3>
      <p v-if="description || $slots.description" :class="ui.description()">
        <slot name="description">{{ description }}</slot>
      </p>
      <p v-else-if="descriptionSegments.length" :class="ui.description()">
        <template v-for="(seg, index) in descriptionSegments" :key="index">
          <code v-if="seg.type === 'code'" :class="ui.descCode()">{{ seg.value }}</code>
          <template v-else>{{ seg.value }}</template>
        </template>
      </p>
      <div v-if="params.length" :class="ui.params()">
        <span :class="ui.paramsLabel()">涉及参数</span>
        <code v-for="param in params" :key="param" :class="ui.param()">{{ param }}</code>
      </div>
    </header>

    <div :class="ui.card()">
      <!-- 示例本体：常驻；展开 Theme slots 后与面板分列左右（窄屏改为上下） -->
      <div :class="ui.bodyRow()">
        <div ref="bodyEl" v-bind="scopeAttrs" :class="ui.body()">
          <slot />
        </div>

        <div v-if="themeOpen && themeGroups.length" :class="ui.themePanel()">
          <ThemeSlotsPanel v-model:open="themeOpen" :groups="themeGroups" :scope="bodyEl" />
        </div>
      </div>

      <!-- 底栏：左侧示例代码名称（展开源码后显示），右侧动作组 -->
      <footer :class="ui.footer()">
        <span v-if="open && source" :class="ui.codeName()" :title="codeLabel">
          <UIcon name="i-vscode-icons-file-type-vue" :class="ui.codeIcon()" />
          <span class="truncate">{{ codeLabel }}</span>
        </span>

        <DemoActions
          v-model:open="open" v-model:theme-open="themeOpen" :code="source"
          :preview-path="previewPath" :label="title" :ask-subject="askSubject"
          :has-theme-slots="themeGroups.length > 0"
        />
      </footer>

      <!-- 源码：在底栏下方折叠展开（reborn-collapse 的 grid 0fr↔1fr 高度动画，高度由代码撑开） -->
      <RebornCollapse v-if="source" v-model="open">
        <template #content>
          <DemoCode :class="ui.code()" :code="source" />
        </template>
      </RebornCollapse>
    </div>
  </section>
</template>
