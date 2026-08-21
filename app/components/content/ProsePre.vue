<template>
    <div class="group/prose-pre relative">
        <UProsePre v-bind="props">
            <slot />
        </UProsePre>
        <!-- 仅 vue/html 演示代码显示入口;定位在代码块右下角,避开右上角的复制按钮 -->
        <UButton v-if="runnable" icon="i-lucide-play" size="xs" variant="soft"
            class="absolute right-2.5 bottom-2.5 z-[1] opacity-0 transition-opacity group-hover/prose-pre:opacity-90 hover:opacity-100 focus-visible:opacity-100"
            @click="runInPlayground">
            在 Playground 运行
        </UButton>
    </div>
</template>

<script setup lang="ts">
/**
 * ProsePre 项目级覆盖 —— 文档代码块的「在 Playground 运行」入口
 *
 * 包装 @nuxt/ui 原版 ProsePre(保留复制按钮、文件名头部、Shiki 高亮),
 * 对 vue/html 演示代码追加运行按钮:点击把代码经 base64url 编码进
 * /playground#code= 哈希并新标签页打开,与 AI 助手代码块的入口共用同一格式。
 */
import UProsePre from "@nuxt/ui/runtime/components/prose/Pre.vue";

interface Props {
    /** 图标(透传原版) */
    icon?: string;
    /** 原始代码文本(MDC 注入) */
    code?: string;
    /** 代码语言(MDC 注入) */
    language?: string;
    /** 文件名头部 */
    filename?: string;
    /** 高亮行号 */
    highlights?: number[];
    /** 隐藏头部 */
    hideHeader?: boolean;
    /** 围栏 meta 信息 */
    meta?: string;
    /** 自定义类 */
    class?: unknown;
    /** 原版 ui 配置 */
    ui?: Record<string, unknown>;
}

const props = defineProps<Props>();

/** 仅对可直接运行的演示语言展示入口 */
const runnable = computed(
    () => !!props.code?.trim() && ["vue", "html"].includes(props.language ?? ""),
);

/** 新标签页打开 Playground 并载入当前代码 */
function runInPlayground() {
    if (!props.code) return;
    window.open(buildPlaygroundUrl(props.code.trim()), "_blank");
}
</script>
