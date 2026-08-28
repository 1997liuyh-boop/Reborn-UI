<template>
    <div :class="ui.root()">
        <!-- 画布：full 内联渲染；mobile / tablet 用 iframe 获得真实断点 -->
        <div :class="ui.canvas()">
            <slot v-if="viewport === 'full'" />
            <div v-else :class="ui.frame()">
                <iframe ref="frameRef" :src="embedSrc" :class="ui.iframe()" :title="`${demoName} 预览`"
                    @load="syncTheme" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * DemoStage —— 文档 Preview 区的统一展示容器
 *
 * - 画布不自带表面层：示例分组已各自成卡（见 components/common/demo/DemoSection.vue），
 *   画布再铺一层底就成了「卡中卡」的三层背景，这里只是个透明容器。
 * - 不再有工具条：收起/展开、复制代码、预览、Playground、询问 AI 五个动作都在
 *   每张分组卡片自己的卡片头上（DemoActions），整份 demo 的源码由顶层 Code 标签页承担。
 * - 视口档位仍保留 v-model:viewport 供外部驱动：375 / 768 档用 iframe 加载
 *   /preview/<demo>?embed=1，demo 内部的 md: / lg: 断点在真实视口下才会生效；
 *   全宽档保持内联渲染，交互演练场（UDrawer 等）链路零回归。
 * - iframe 主题同步：同源可直接写入 contentDocument 的 class，切换主题即时生效。
 */
import { tv } from '~/lib/tv'
import theme from './demo-stage.config'
import type { StageViewport } from './types'

interface Props {
    /** demo 组件名（PascalCase，不含 .vue，用于拼 /preview 路由） */
    demoName: string
}

const props = defineProps<Props>()

/** 当前视口档位（可由外部 v-model:viewport 驱动，组件自身不再提供切换 UI） */
const viewport = defineModel<StageViewport>('viewport', { default: 'full' })

const b = tv(theme)
const ui = computed(() => b({ viewport: viewport.value }))

/** iframe 内嵌地址（原生 src 需手动拼 baseURL） */
const { app } = useRuntimeConfig()
const embedSrc = computed(() => {
    const base = (app.baseURL || '/').replace(/\/$/, '')
    return `${base}/preview/${props.demoName}?embed=1`
})

// ---- iframe 主题同步 ----
const colorMode = useColorMode()
const frameRef = ref<HTMLIFrameElement>()

/** 将当前主题写入 iframe 文档（同源可直接操作；load 时与主题切换时各同步一次） */
function syncTheme() {
    const doc = frameRef.value?.contentDocument
    if (!doc) return
    doc.documentElement.classList.toggle('dark', colorMode.value === 'dark')
}

watch(() => colorMode.value, () => syncTheme())
</script>
