<script setup lang="ts">
/**
 * DemoActions —— 示例卡片的动作组
 *
 * 每张分组卡片（DemoSection）卡片头右侧的五个基础动作：
 *   收起/展开 · 复制代码 · 预览 · Playground · 询问 AI
 *
 * 「收起/展开」只负责翻 v-model:open，真正的折叠动画由调用方用
 * <RebornCollapse> 承载——动作组不关心源码面板长什么样。
 * 没有源码（如标题为动态绑定、抽取不到）时，只保留「预览」。
 */
import { useClipboard } from '@vueuse/core'
import { tv } from '~/lib/tv'
import { actionsConfig } from './demo.config'

interface Props {
    /** 本示例的原始源码；为空时隐藏代码相关动作 */
    code?: string
    /** 可独立运行的完整 SFC（补全 script 依赖与 template 包裹）；缺省时 Playground 退回 code */
    playgroundCode?: string
    /** 代码语言，用于 Playground 与提示词围栏 */
    lang?: string
    /** 独立预览路由；为空时隐藏「预览」 */
    previewPath?: string
    /** 复制成功提示里用的示例名 */
    label?: string
    /** 「询问 AI」提示词中用于定位的主体，如：组件 `reborn-button` 的「尺寸与图标」 */
    askSubject?: string
}

const props = withDefaults(defineProps<Props>(), {
    code: '',
    playgroundCode: '',
    lang: 'vue',
    previewPath: '',
    label: '示例',
    askSubject: '',
})

/** 源码是否展开（由调用方持有折叠面板） */
const open = defineModel<boolean>('open', { default: false })

const hasCode = computed(() => !!props.code.trim())

const b = tv(actionsConfig)
const ui = computed(() => b({ open: open.value }))

// 源码还没加载出来时不该停在展开态（否则是一块空白）
watch(hasCode, (value) => {
    if (!value) open.value = false
})

// ---- 复制代码 ----
const { copy, copied } = useClipboard({ copiedDuring: 2000 })
const toast = useToast()

async function copyCode() {
    if (!hasCode.value) return
    await copy(props.code)
    toast.add({
        title: '已复制',
        description: `「${props.label}」示例代码已复制到剪贴板。`,
        color: 'success',
    })
}

// ---- Playground ----
/** 把可运行源码编码进 /playground#code= 并新标签页打开（与文档代码块的入口同一格式） */
function openPlayground() {
    if (!hasCode.value) return
    window.open(buildPlaygroundUrl((props.playgroundCode || props.code).trim()), '_blank')
}

// ---- 询问 AI ----
const { isEnabled: isAssistantEnabled, open: openAssistant } = useAssistant()

const canAsk = computed(() => isAssistantEnabled.value && hasCode.value)

/** 提示词中携带的源码上限：超长片段截断，避免撑爆单轮上下文 */
const ASK_CODE_LIMIT = 2000

function askAi() {
    if (!hasCode.value) return

    const raw = props.code.trim()
    const snippet = raw.length > ASK_CODE_LIMIT
        ? `${raw.slice(0, ASK_CODE_LIMIT)}\n<!-- …（源码过长已截断） -->`
        : raw

    openAssistant(
        `请讲解 Reborn UI ${props.askSubject || props.label} 这段示例：它做了什么、涉及的关键 props / 事件是什么、使用时要注意什么？\n\n`
        + `\`\`\`${props.lang}\n${snippet}\n\`\`\``,
    )
}
</script>

<template>
  <div :class="ui.root()">
    <UTooltip v-if="hasCode" :text="open ? '收起代码' : '展开代码'">
      <UButton
        icon="tabler:chevron-down" size="xs" :color="open ? 'primary' : 'neutral'"
        :variant="open ? 'soft' : 'ghost'" :aria-label="open ? '收起代码' : '展开代码'"
        :ui="{ leadingIcon: ui.chevron() }" @click="open = !open"
      />
    </UTooltip>

    <UTooltip v-if="hasCode" :text="copied ? '已复制' : '复制代码'">
      <UButton
        :icon="copied ? 'tabler:check' : 'tabler:copy'" size="xs" :color="copied ? 'success' : 'neutral'"
        variant="ghost" aria-label="复制代码" @click="copyCode"
      />
    </UTooltip>

    <UTooltip v-if="previewPath" text="预览（新标签页）">
      <UButton
        icon="tabler:eye" size="xs" color="neutral" variant="ghost" aria-label="预览" :to="previewPath"
        target="_blank"
      />
    </UTooltip>

    <UTooltip v-if="hasCode" text="在 Playground 运行">
      <UButton
        icon="tabler:player-play" size="xs" color="neutral" variant="ghost" aria-label="Playground"
        @click="openPlayground"
      />
    </UTooltip>

    <UTooltip v-if="canAsk" text="询问 AI">
      <UButton
        icon="tabler:sparkles" size="xs" color="neutral" variant="ghost" aria-label="询问 AI"
        @click="askAi"
      />
    </UTooltip>
  </div>
</template>
