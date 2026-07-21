<template>
    <div class="bg-default text-default min-h-screen">
        <!-- 极简顶栏：embed 模式（iframe 内嵌）下隐藏，保留纯画布 -->
        <header v-if="!embed"
            class="border-default bg-default/80 sticky top-0 z-50 flex items-center justify-between gap-4 border-b px-4 py-2 backdrop-blur">
            <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" size="sm" @click="goBack">
                返回文档
            </UButton>
            <span class="text-muted truncate font-mono text-xs">{{ componentName }}</span>
            <UColorModeButton />
        </header>

        <main :class="embed ? '' : 'p-4 sm:p-6 lg:p-8'">
            <ClientOnly>
                <component :is="componentName" />
                <template #fallback>
                    <!-- SSR 占位：客户端挂载前显示加载态 -->
                    <div class="text-muted flex min-h-[50vh] items-center justify-center gap-2 text-sm">
                        <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
                        正在加载预览…
                    </div>
                </template>
            </ClientOnly>
        </main>
    </div>
</template>

<script setup lang="ts">
/**
 * 组件独立预览页 —— /preview/<组件名>
 *
 * 全视口渲染 examples / configs 下的任意 demo 组件，脱离文档栏宽查看：
 * - definePageMeta 的 header/footer 开关由 docus 层 app.vue 原生支持，无头无尾；
 * - 组件名必须命中 resolvePreviewComponent 的白名单，否则 404；
 * - ?embed=1 时隐藏顶栏与内边距（供文档页 DemoStage 的 iframe 视口模拟加载）；
 * - 主题跟随全局 colorMode（UApp 状态保留，切换即时生效）。
 */
definePageMeta({
    layout: false,
    header: false,
    footer: false,
})

const route = useRoute()

/** 路由参数中的组件名（PascalCase，与全局注册名一致） */
const componentName = String(route.params.component || '')

// 白名单校验：非法名称直接 404，防止任意组件名注入
if (!isValidPreviewComponent(componentName)) {
    throw createError({
        statusCode: 404,
        statusMessage: `Preview component not found: ${componentName}`,
        fatal: true,
    })
}

/** iframe 内嵌模式：无顶栏、无内边距的纯画布 */
const embed = computed(() => route.query.embed === '1')

// 预览页不参与搜索引擎收录
useSeoMeta({
    title: `${componentName} · Preview`,
    robots: 'noindex',
})

/** 返回文档：有浏览历史则后退，否则回组件总览页 */
function goBack() {
    if (window.history.length > 1) {
        window.history.back()
    } else {
        navigateTo('/components')
    }
}
</script>
