<script setup lang="ts">
import RebornRadio from "~/components/reborn/ui/reborn-radio/RebornRadio.vue";
import RebornRadioGroup from "~/components/reborn/ui/reborn-radio/RebornRadioGroup.vue";
import { radioColors, radioSizes } from "~/components/reborn/ui/reborn-radio/reborn-radio.config";

/** 
 * 1. 交互演练场状态对象
 * 所有可实时修改的属性统一放在 state 中
 */
const state = ref<Record<string, any>>({
    value: "apple",
    size: "md",
    color: "primary",
    variant: "circle",
    disabled: false,
    label: "苹果",
});

/**
 * 2. 交互控制面板配置
 * component 需加 as const 确保类型正确
 */
const controls = [
    {
        title: "基础配置",
        children: [
            {
                label: "选择变体",
                key: "variant",
                component: "select" as const,
                defaultValue: "circle",
                props: {
                    options: [
                        { label: "Check (Simple)", value: "simple" },
                        { label: "Circle (Variant 1)", value: "circle" },
                    ]
                },
            },
            {
                label: "尺寸规格",
                key: "size",
                component: "select" as const,
                defaultValue: "md",
                props: {
                    options: radioSizes.map(s => ({ label: s.toUpperCase(), value: s }))
                },
            },
            {
                label: "品牌色彩",
                key: "color",
                component: "select" as const,
                defaultValue: "primary",
                props: {
                    options: radioColors.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }))
                },
            },
            {
                label: "显示标签",
                key: "label",
                component: "input" as const,
                defaultValue: "苹果",
            },
            {
                label: "禁用状态",
                key: "disabled",
                component: "checkbox" as const,
                defaultValue: false,
            },
        ],
    },
];

// 其他示例状态
const selectedColor = ref("primary");
const selectedSize = ref("md");
const selectedTheme = ref("sun");
const selectedEmoji = ref("🤔");

const fruits = [
    { value: "apple", label: "苹果" },
    { value: "banana", label: "香蕉" },
    { value: "orange", label: "橘子" },
    { value: "grape", label: "葡萄" },
];

const emojis = [
    { value: "😀", label: "开心" },
    { value: "😍", label: "喜欢" },
    { value: "🤔", label: "思考" },
    { value: "🎉", label: "庆祝" },
];

const themes = [
    { value: "sun", label: "浅色", icon: "lucide:sun" },
    { value: "moon", label: "深色", icon: "lucide:moon" },
    { value: "monitor", label: "系统", icon: "lucide:monitor" },
];
</script>

<template>
    <div class="space-y-16 pb-20">
        <!-- 标题头 -->
        <header class="space-y-2">
            <h1 class="text-3xl font-bold tracking-tight">单选框 Radio</h1>
            <p class="text-lg text-muted-foreground">
                用于在多个互斥选项中选择其中之一。支持自定义图标、颜色分支及极致的交互状态。
            </p>
        </header>

        <!-- 交互演练场 -->
        <Playground v-model="state" :controls="controls" component-name="RebornRadio">
            <RebornRadio v-model="state.value" value="apple" :label="state.label" :size="state.size"
                :color="state.color" :variant="state.variant" :disabled="state.disabled" />
        </Playground>

        <!-- 更多演示 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- 选项框架变体 (Circle Variant) -->
            <section
                class="rounded-3xl border border-gray-2/60 dark:border-gray-8/50 p-8 space-y-6 bg-white/50 dark:bg-gray-9/20 shadow-sm transition-all hover:shadow-md">
                <div class="space-y-1">
                    <h3 class="text-lg font-semibold text-gray-8 dark:text-gray-2">选项框架 (Circle Style)</h3>
                    <p class="text-sm text-gray-500">经典圆点风格，未选中时为空心圆，选中后为带实心圆点的彩色圆环。</p>
                </div>
                <div class="flex flex-wrap gap-x-6 gap-y-4 pt-2">
                    <RebornRadio v-for="fruit in fruits" :key="fruit.value" v-model="state.value" :value="fruit.value"
                        :label="fruit.label" variant="circle" color="primary" />
                </div>
            </section>

            <!-- 品牌色彩矩阵 -->
            <section
                class="rounded-3xl border border-gray-2/60 dark:border-gray-8/50 p-8 space-y-6 bg-white/50 dark:bg-gray-9/20 shadow-sm transition-all hover:shadow-md">
                <div class="space-y-1">
                    <h3 class="text-lg font-semibold text-gray-8 dark:text-gray-2">品牌色彩 (Colors)</h3>
                    <p class="text-sm text-gray-500">内置多套预设色彩体系，适配各类业务场景。</p>
                </div>
                <div class="flex flex-wrap gap-x-6 gap-y-4 pt-2">
                    <RebornRadio v-for="c in radioColors" :key="c" v-model="selectedColor" :value="c" :label="c"
                        :color="c" />
                </div>
            </section>

            <!-- 尺寸规格 -->
            <section
                class="rounded-3xl border border-gray-2/60 dark:border-gray-8/50 p-8 space-y-6 bg-white/50 dark:bg-gray-9/20 shadow-sm transition-all hover:shadow-md">
                <div class="space-y-1">
                    <h3 class="text-lg font-semibold text-gray-8 dark:text-gray-2">尺寸规格 (Sizes)</h3>
                    <p class="text-sm text-gray-500">从精致的辅助项到核心操作，尺寸任君选择。</p>
                </div>
                <div class="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
                    <RebornRadio v-for="s in radioSizes" :key="s" v-model="selectedSize" :value="s"
                        :label="s.toUpperCase()" :size="s" />
                </div>
            </section>

            <!-- 自定义图标 -->
            <section
                class="rounded-3xl border border-gray-2/60 dark:border-gray-8/50 p-8 space-y-6 bg-white/50 dark:bg-gray-9/20 shadow-sm transition-all hover:shadow-md">
                <div class="space-y-1">
                    <h3 class="text-lg font-semibold text-gray-8 dark:text-gray-2">自定义图标 (Custom Icons)</h3>
                    <p class="text-sm text-gray-500">通过 activeIcon/inactiveIcon 属性定制选中后的视觉表现。</p>
                </div>
                <div class="flex flex-wrap gap-x-6 gap-y-4 pt-2">
                    <RebornRadio v-for="t in themes" :key="t.value" v-model="selectedTheme" :value="t.value"
                        :label="t.label" :active-icon="t.icon" :inactive-icon="t.icon" color="secondary" />
                </div>
            </section>

            <!-- 插槽深度定制 -->
            <section
                class="rounded-3xl border border-gray-2/60 dark:border-gray-8/50 p-8 space-y-6 bg-white/50 dark:bg-gray-9/20 shadow-sm transition-all hover:shadow-md">
                <div class="space-y-1">
                    <h3 class="text-lg font-semibold text-gray-8 dark:text-gray-2">插槽深度定制 (Slots)</h3>
                    <p class="text-sm text-gray-500">利用插槽渲染 Emoji 或复杂图形，创造沉浸式交互。</p>
                </div>
                <div class="flex flex-wrap gap-x-8 gap-y-4 pt-2">
                    <RebornRadioGroup v-model="selectedEmoji">
                        <RebornRadio v-for="e in emojis" :key="e.value" :value="e.value" :label="e.label" size="lg"
                            color="warning">
                            <template #active-icon>
                                <span class="text-xl drop-shadow-sm">{{ e.value }}</span>
                            </template>
                            <template #inactive-icon>
                                <span class="text-lg opacity-30 grayscale saturate-0">{{ e.value }}</span>
                            </template>
                        </RebornRadio>
                    </RebornRadioGroup>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
/* 可以在这里添加一些针对 Demo 特有的精美微动效 */
section {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

section:hover {
    transform: translateY(-2px);
}
</style>
