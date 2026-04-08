<script setup lang="ts">
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import { selectColors, selectSizes } from "~/components/reborn/ui/reborn-select/reborn-select.config";

// --- Playground 状态 ---
const state = ref<Record<string, any>>({
    value: 50,
    size: "md",
    color: "primary",
    multiple: false,
    clearable: true,
    disabled: false,
    placeholder: "请选择框架",
});

const options = [
    { label: "Vue.js", value: "vue" },
    { label: "React", value: "react" },
    { label: "Angular", value: "angular" },
    { label: "Svelte", value: "svelte" },
    { label: "Solid.js", value: "solid" },
];

const opstion1 = ref<any[]>([])

// --- 控制面板配置 ---
const controls: any = [
    {
        title: "基础属性",
        children: [
            {
                label: "尺寸规格",
                key: "size",
                component: "select" as const,
                defaultValue: "md",
                props: {
                    options: selectSizes.map((s) => ({ label: s, value: s })),
                },
            },
            {
                label: "配色方案",
                key: "color",
                component: "select" as const,
                defaultValue: "primary",
                props: {
                    options: selectColors.map((c) => ({
                        label: c,
                        value: c,
                    })),
                },
            },
        ],
    },
    {
        title: "交互控制",
        children: [
            { label: "占位文字", key: "placeholder", component: "input" as const, defaultValue: "请选择框架" },
            { label: "多选模式", key: "multiple", component: "checkbox" as const, defaultValue: false },
            { label: "可清空", key: "clearable", component: "checkbox" as const, defaultValue: true },
        ],
    },
    {
        title: "状态控制",
        children: [
            { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
        ],
    },
];

// --- 其他示例状态 ---
const coloredValue = ref("vue");
const multipleValue = ref(["vue", "react"]);

const sizeSections = [
    { label: "小尺寸 (sm)", size: "sm" as const },
    { label: "标准尺寸 (md)", size: "md" as const },
    { label: "大尺寸 (lg)", size: "lg" as const },
];

onMounted(() => {
    for (let i = 0; i < 100; i++) {
        opstion1.value.push({ label: `选项${i}`, value: i });
    }
})
</script>

<template>
    <div class="flex flex-col gap-16 pb-24">
        <!-- 第一部分：交互式游乐场 -->
        <Playground v-model="state" :controls="controls" component-name="RebornSelect" title="交互体验"
            description="通过左侧面板实时调节组件属性，在右侧查看视觉反馈">
            <RebornSelect v-model="state.value" :options="opstion1" :size="state.size" :color="state.color"
                :multiple="state.multiple" :clearable="state.clearable" :disabled="state.disabled"
                :placeholder="state.placeholder" class="min-w-64" />
        </Playground>

        <!-- 第二部分：组件变体 -->
        <section>
            <!-- 色彩预设 -->
            <div class="space-y-6">
                <div class="flex items-center gap-3">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">核心色彩</h3>
                    <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                    <div v-for="c in selectColors" :key="c"
                        class="flex items-center justify-between rounded-2xl border border-gray-50 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <span class="text-xs font-bold text-gray-400 uppercase tracking-tighter">{{ c }}</span>
                        <RebornSelect v-model="coloredValue" :color="c" :options="options" size="sm" class="w-40" />
                    </div>
                </div>
            </div>

            <!-- 尺寸对比 -->
            <div class="space-y-6 mt-12">
                <div class="flex items-center gap-3">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">尺寸规范</h3>
                    <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                </div>
                <div
                    class="flex h-[220px] items-center justify-center gap-8 rounded-2xl border border-gray-100 bg-gray-50/30 p-8 dark:border-gray-800 dark:bg-gray-900/30">
                    <div v-for="s in sizeSections" :key="s.size" class="flex flex-col items-center gap-4">
                        <RebornSelect v-model="coloredValue" :size="s.size" color="info" :options="options"
                            class="w-44" />
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{{ s.label
                            }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- 第三部分：高级特性 -->
        <section class="space-y-8">
            <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">进阶自定义</h3>
                <p class="text-sm text-gray-500">满足复杂的业务场景需求</p>
            </div>

            <div class="grid gap-8 md:grid-cols-2">
                <!-- 多选模式 -->
                <div class="rounded-3xl bg-gray-50/50 p-8 dark:bg-gray-900/50">
                    <h4 class="mb-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Multiple Selection</h4>
                    <p class="mb-6 text-xs text-gray-500">支持多项选择，并以 Tag 形式展示结果</p>
                    <RebornSelect v-model="multipleValue" :options="options" multiple placeholder="Select multiple..."
                        class="w-full" />
                </div>

                <!-- 自定义 UI -->
                <div
                    class="rounded-3xl bg-indigo-50/30 p-8 dark:bg-indigo-950/10 border-2 border-indigo-100 dark:border-indigo-900/50">
                    <h4 class="mb-4 text-sm font-bold text-indigo-400 uppercase tracking-widest">Custom Styling</h4>
                    <p class="mb-6 text-xs text-indigo-500/70">通过 triggerUi 和 ui 属性深度定制触发器和下拉列表</p>
                    <RebornSelect v-model="coloredValue" :options="options" :trigger-ui="{
                        trigger: 'border-dashed border-2 rounded-xl bg-white dark:bg-gray-800 border-indigo-200 dark:border-indigo-800 px-4 h-14',
                    }" :ui="{
                        dropdown: 'rounded-xl shadow-2xl shadow-indigo-500/10 border-indigo-100 dark:border-indigo-900 bg-white/90 dark:bg-gray-800/90 backdrop-blur'
                    }" class="w-full" />
                </div>
            </div>
        </section>
    </div>
</template>
