<template>
    <div :class="ui.root()">
        <!-- 工具条：视口切换 + 尺寸提示 + 全屏入口 -->
        <div :class="ui.toolbar()">
            <div :class="ui.toolbarGroup()">
                <UButton v-for="opt in viewportOptions" :key="opt.value" :icon="opt.icon" size="xs"
                    :color="viewport === opt.value ? 'primary' : 'neutral'"
                    :variant="viewport === opt.value ? 'soft' : 'ghost'" :aria-label="opt.label" :title="opt.label"
                    :class="opt.value === 'tablet' ? 'hidden sm:inline-flex' : ''" @click="viewport = opt.value" />
                <span :class="ui.sizeHint()">{{ sizeHint }}</span>
            </div>
            <UButton icon="tabler:arrows-maximize" size="xs" color="neutral" variant="ghost" label="全屏预览"
                :to="previewPath" target="_blank" />
        </div>

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
 * DemoStage —— 文档 Preview 区的统一展示舞台
 *
 * - 视口切换：375（手机）/ 768（平板）档用 iframe 加载 /preview/<demo>?embed=1，
 *   demo 内部的 md: / lg: 响应式断点在真实视口下生效（仅约束外层宽度无法触发媒体查询）；
 *   全宽档保持内联渲染，交互演练场（UDrawer 等）链路零回归。
 * - iframe 主题同步：同源可直接写入 contentDocument 的 class，切换主题即时生效。
 * - 高度：iframe 档画布 resize-y 原生拖拽可调（demo-stage.config 中约束 min/max）。
 */
import { tv } from '~/lib/tv'
import theme from './demo-stage.config'

/** 视口档位 */
type StageViewport = 'mobile' | 'tablet' | 'full'

interface Props {
    /** demo 组件名（PascalCase，不含 .vue，用于拼 /preview 路由） */
    demoName: string
}

const props = defineProps<Props>()

/** 当前视口档位（可由外部 v-model:viewport 控制） */
const viewport = defineModel<StageViewport>('viewport', { default: 'full' })

const b = tv(theme)
const ui = computed(() => b({ viewport: viewport.value }))

/** 视口切换选项（tablet 档在 <sm 视口下隐藏：屏幕本身不足 768） */
const viewportOptions: { value: StageViewport; label: string; icon: string }[] = [
    { value: 'full', label: '全宽预览', icon: 'tabler:device-desktop' },
    { value: 'tablet', label: '平板 768px', icon: 'tabler:device-ipad' },
    { value: 'mobile', label: '手机 375px', icon: 'tabler:device-mobile' },
]

/** 尺寸提示文字 */
const sizeHint = computed(() => {
    if (viewport.value === 'mobile') return '375px'
    if (viewport.value === 'tablet') return '768px'
    return '100%'
})

/** 全屏预览路由（UButton :to 走路由跳转，自动处理 baseURL） */
const previewPath = computed(() => `/preview/${props.demoName}`)

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
