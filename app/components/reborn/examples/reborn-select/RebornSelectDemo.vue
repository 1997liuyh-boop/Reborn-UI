<script setup lang="ts">
import { reactive } from "vue";
import { z } from "zod";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import type { SelectOption } from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornForm from "~/components/reborn/ui/reborn-form/RebornForm.vue";
import RebornFormItem from "~/components/reborn/ui/reborn-form/RebornFormItem.vue";
import { selectColors, selectSizes } from "~/components/reborn/ui/reborn-select/reborn-select.config";

// --- 数据源 ---

/** 主数据源：含禁用项，用于演示选项级别的禁用态 */
const frameworkOptions: SelectOption[] = [
    { label: "Vue.js", value: "vue", icon: "logos:vue", desc: "渐进式框架" },
    { label: "React", value: "react", icon: "logos:react", desc: "UI 构建库" },
    { label: "Svelte", value: "svelte", icon: "logos:svelte-icon", desc: "编译时框架" },
    { label: "Solid.js", value: "solid", icon: "logos:solidjs-icon", desc: "细粒度响应式" },
    { label: "Angular（暂不可选）", value: "angular", icon: "logos:angular-icon", desc: "全功能框架", disabled: true },
];

/** 长列表数据源：用于演示展开时自动定位已选项、以及滚动时的浮层跟随 */
const cityOptions: SelectOption[] = Array.from({ length: 60 }, (_, i) => ({
    label: `城市站点 ${String(i + 1).padStart(2, "0")}`,
    value: `city-${i + 1}`,
}));

// --- Playground 状态 ---

const defaultState: Record<string, any> = {
    value: "city-30",
    size: "md",
    color: "primary",
    multiple: false,
    clearable: true,
    disabled: false,
    bordered: true,
    showArrow: true,
    arrowAnimation: true,
    closeOn: "click",
    portal: true,
    placeholder: "请选择站点",
};

const state = ref<Record<string, any>>({ ...defaultState });

function resetState() {
    state.value = { ...defaultState };
}

// 单选与多选的 modelValue 语义不同（标量 vs 数组），切换时若不收敛类型，
// 会出现「已选中却显示占位符」这类脏状态。
watch(
    () => state.value.multiple,
    (isMultiple) => {
        const current = state.value.value;
        state.value.value = isMultiple
            ? (current === null || current === undefined || current === "" ? [] : [current])
            : (Array.isArray(current) ? (current[0] ?? null) : current);
    },
);

const controls: any = [
    {
        title: "基础属性",
        children: [
            {
                label: "尺寸规格",
                key: "size",
                component: "select" as const,
                defaultValue: "md",
                props: { options: selectSizes.map((s) => ({ label: s, value: s })) },
            },
            {
                label: "配色方案",
                key: "color",
                component: "select" as const,
                defaultValue: "primary",
                props: { options: selectColors.map((c) => ({ label: c, value: c })) },
            },
            { label: "占位文字", key: "placeholder", component: "input" as const, defaultValue: "请选择站点" },
        ],
    },
    {
        title: "交互控制",
        children: [
            { label: "多选模式", key: "multiple", component: "checkbox" as const, defaultValue: false },
            { label: "可清空", key: "clearable", component: "checkbox" as const, defaultValue: true },
            {
                label: "关闭时机",
                key: "closeOn",
                component: "select" as const,
                defaultValue: "click",
                props: {
                    options: [
                        { label: "click（外部完成点击）", value: "click" },
                        { label: "mousedown（外部按下即收）", value: "mousedown" },
                    ],
                },
            },
            { label: "浮层传送到 body", key: "portal", component: "checkbox" as const, defaultValue: true },
        ],
    },
    {
        title: "外观状态",
        children: [
            { label: "显示边框", key: "bordered", component: "checkbox" as const, defaultValue: true },
            { label: "显示箭头", key: "showArrow", component: "checkbox" as const, defaultValue: true },
            { label: "箭头旋转动画", key: "arrowAnimation", component: "checkbox" as const, defaultValue: true },
            { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
        ],
    },
];

// --- 各展示区块的独立状态 ---

const coloredValue = ref("vue");
const sizeValue = ref("vue");

/** 多选：初始给两项，验证展开时不会因为点击选项而收起 */
const multipleValue = ref<string[]>(["vue", "react"]);
const multipleSelected = computed(() =>
    frameworkOptions.filter((o) => multipleValue.value.includes(o.value)),
);
function removeSelected(value: string) {
    multipleValue.value = multipleValue.value.filter((v) => v !== value);
}

/** 浮层定位：分别放在滚动容器内与页面流中 */
const scrollBoxValue = ref("city-20");
const followValue = ref("city-45");
/** portal 关闭后的对照组：浮层留在触发器内，会被容器 overflow 裁掉 */
const clippedValue = ref("city-20");

/** 关闭时机 */
const closeOnClickValue = ref("vue");
const closeOnMousedownValue = ref("vue");

/** 选项状态 */
const disabledItemValue = ref("vue");
const emptyValue = ref(null);
const plainValue = ref("vue");

/** 插槽定制 */
const slotOptionValue = ref("react");
const coverValue = ref("svelte");

/** 深度样式定制 */
const customUiValue = ref("solid");

// --- 表单集成 ---

/**
 * 表单场景：size / disabled 由 RebornForm 下发，校验失败时触发器自动进入错误态，
 * 收起面板（blur）与选中（change）都会触发校验。
 */
const formModel = reactive({ framework: null as string | null, stack: [] as string[] });
const formRef = ref<any>(null);

const formRules = z.object({
    framework: z.string({ message: "请选择主框架" }).min(1, "请选择主框架"),
    stack: z.array(z.string()).min(2, "技术栈至少选择 2 项"),
});

async function submitForm() {
    const valid = await formRef.value?.validate();
    console.log("[RebornSelect] 表单校验结果：", valid, formModel);
}

function resetForm() {
    formRef.value?.resetFields();
}

const sizeSections = [
    { label: "小尺寸 (sm)", size: "sm" as const },
    { label: "标准尺寸 (md)", size: "md" as const },
    { label: "大尺寸 (lg)", size: "lg" as const },
];

function onChange(value: any) {
    console.log("[RebornSelect] 选中值变化：", value);
}
</script>

<template>
    <div class="flex w-full flex-col gap-12 pt-4 pb-24">
        <!-- 1. 交互演练场 -->
        <Playground v-model="state" :controls="controls" component-name="RebornSelect" title="交互体验"
            description="通过左侧面板实时调节组件属性，在右侧查看视觉反馈。数据源为 60 个站点，展开时会自动定位到已选项">
            <template #tag>
                <button
                    class="flex cursor-pointer items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-widest text-primary uppercase transition-all hover:bg-primary/20 active:scale-95"
                    @click="resetState">
                    <Icon name="lucide:rotate-ccw" size="12" />
                    重置配置
                </button>
            </template>

            <RebornSelect v-model="state.value" :options="cityOptions" :size="state.size" :color="state.color"
                :multiple="state.multiple" :clearable="state.clearable" :disabled="state.disabled"
                :bordered="state.bordered" :show-arrow="state.showArrow" :arrow-animation="state.arrowAnimation"
                :close-on="state.closeOn" :portal="state.portal" :placeholder="state.placeholder" class="min-w-64"
                @change="onChange" />
        </Playground>

        <!-- 2. 核心色彩 -->
        <section class="space-y-6">
            <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">核心色彩</h3>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
                <div v-for="c in selectColors" :key="c"
                    class="flex items-center justify-between rounded-2xl border border-gray-100/80 bg-white/60 p-4 backdrop-blur-2xl transition-all hover:border-gray-200 hover:shadow-sm dark:border-white/5 dark:bg-slate-900/40">
                    <span class="text-xs font-bold tracking-tighter text-gray-400 uppercase">{{ c }}</span>
                    <RebornSelect v-model="coloredValue" :color="c" :options="frameworkOptions" size="sm"
                        class="w-40" />
                </div>
            </div>
        </section>

        <!-- 3. 尺寸规范 -->
        <section class="space-y-6">
            <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">尺寸规范</h3>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div
                class="flex flex-col items-center justify-center gap-8 rounded-2xl border border-gray-100 bg-gray-50/30 p-8 sm:flex-row dark:border-gray-800 dark:bg-gray-900/30">
                <div v-for="s in sizeSections" :key="s.size" class="flex flex-col items-center gap-4">
                    <RebornSelect v-model="sizeValue" :size="s.size" color="info" :options="frameworkOptions"
                        class="w-44" />
                    <span class="text-sm font-black tracking-widest text-gray-400 uppercase">{{ s.label }}</span>
                </div>
            </div>
        </section>

        <!-- 4. 多选模式 -->
        <section class="space-y-6">
            <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">多选模式</h3>
                <p class="text-sm text-gray-500">面板保持展开，可连续勾选多项</p>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>

            <div class="grid gap-6 md:grid-cols-2">
                <div
                    class="space-y-4 rounded-3xl border border-gray-100/80 bg-white/60 p-8 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
                    <h4 class="text-sm font-bold tracking-widest text-gray-400 uppercase">连续勾选</h4>
                    <p class="text-xs text-gray-500">
                        <code class="text-violet-500">multiple</code>
                        模式下点击选项只切换勾选状态，只有点击面板外部才会收起；已选项右侧带对勾标记
                    </p>
                    <RebornSelect v-model="multipleValue" :options="frameworkOptions" multiple color="success"
                        placeholder="可多选框架" class="w-full" @change="onChange" />
                </div>

                <div
                    class="space-y-4 rounded-3xl border border-gray-100/80 bg-white/60 p-8 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
                    <h4 class="text-sm font-bold tracking-widest text-gray-400 uppercase">选中结果</h4>
                    <p class="text-xs text-gray-500">与上方选择器共享同一份 modelValue，可单独移除某一项</p>
                    <div class="flex min-h-10 flex-wrap items-center gap-2">
                        <span v-for="item in multipleSelected" :key="item.value"
                            class="group flex items-center gap-1.5 rounded-full bg-success/10 py-1.5 pr-2 pl-3 text-xs font-medium text-success transition-all hover:bg-success/20">
                            {{ item.label }}
                            <button class="cursor-pointer opacity-60 transition-all hover:opacity-100 active:scale-90"
                                @click="removeSelected(item.value)">
                                <Icon name="lucide:x" size="12" />
                            </button>
                        </span>
                        <span v-if="multipleSelected.length === 0" class="text-xs text-gray-400">尚未选择任何项</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- 5. 浮层定位 -->
        <section class="space-y-6">
            <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">浮层定位</h3>
                <p class="text-sm text-gray-500">浮层传送至 body，始终锚定触发器</p>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>

            <div class="grid gap-6 md:grid-cols-2">
                <div
                    class="space-y-4 rounded-3xl border border-gray-100/80 bg-white/60 p-8 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
                    <h4 class="text-sm font-bold tracking-widest text-gray-400 uppercase">滚动容器内</h4>
                    <p class="text-xs text-gray-500">
                        展开后滚动灰色区域：浮层实时跟随触发器，且不会被容器的
                        <code class="text-violet-500">overflow-hidden</code> 裁掉
                    </p>
                    <div
                        class="h-56 overflow-y-auto rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                        <p class="pb-4 text-xs text-gray-400">向下滚动一段距离后再展开选择器 ↓</p>
                        <div class="h-24" />
                        <RebornSelect v-model="scrollBoxValue" :options="cityOptions" color="info" class="w-full" />
                        <div class="h-72" />
                        <p class="text-xs text-gray-400">容器底部</p>
                    </div>
                </div>

                <div
                    class="space-y-4 rounded-3xl border border-gray-100/80 bg-white/60 p-8 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
                    <h4 class="text-sm font-bold tracking-widest text-gray-400 uppercase">
                        对照组：<code class="text-violet-500">:portal="false"</code>
                    </h4>
                    <p class="text-xs text-gray-500">
                        浮层留在触发器内，只能在容器内绘制，因此被 overflow 截断。
                        需要浮层随父容器一起滚动、一起裁剪时才关掉 portal
                    </p>
                    <div
                        class="h-56 overflow-y-auto rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                        <p class="pb-4 text-xs text-gray-400">展开后与左侧对比 ↓</p>
                        <div class="h-24" />
                        <RebornSelect v-model="clippedValue" :options="cityOptions" color="error" :portal="false"
                            class="w-full" />
                        <div class="h-72" />
                        <p class="text-xs text-gray-400">容器底部</p>
                    </div>
                </div>

                <div
                    class="space-y-4 rounded-3xl border border-gray-100/80 bg-white/60 p-8 backdrop-blur-2xl md:col-span-2 dark:border-white/5 dark:bg-slate-900/40">
                    <h4 class="text-sm font-bold tracking-widest text-gray-400 uppercase">自动翻转与定位</h4>
                    <p class="text-xs text-gray-500">
                        下方空间不足时自动向上展开；60 项长列表在展开瞬间即滚动到已选项，无需手动查找
                    </p>
                    <RebornSelect v-model="followValue" :options="cityOptions" color="warning" class="w-full max-w-md" />
                    <ul class="grid gap-2 pt-2 text-xs text-gray-500 sm:grid-cols-3">
                        <li class="flex gap-2">
                            <span class="font-black text-gray-300 dark:text-gray-600">01</span>
                            展开方向在展开瞬间锁定，滚动中不会翻转，浮层始终贴住触发器
                        </li>
                        <li class="flex gap-2">
                            <span class="font-black text-gray-300 dark:text-gray-600">02</span>
                            浮层最小宽度对齐触发器，内容更宽时向右扩展并留出视口边距
                        </li>
                        <li class="flex gap-2">
                            <span class="font-black text-gray-300 dark:text-gray-600">03</span>
                            支持 <code class="text-violet-500">↑ ↓</code> 移动高亮、
                            <code class="text-violet-500">Enter</code> 选中、
                            <code class="text-violet-500">Esc</code> 收起
                        </li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- 6. 选项与外观状态 -->
        <section class="space-y-6">
            <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">状态矩阵</h3>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>

            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div
                    class="space-y-3 rounded-2xl border border-gray-100/80 bg-white/60 p-6 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
                    <h4 class="text-xs font-bold tracking-widest text-gray-400 uppercase">禁用单项</h4>
                    <p class="text-xs text-gray-500">选项自带 <code class="text-violet-500">disabled</code></p>
                    <RebornSelect v-model="disabledItemValue" :options="frameworkOptions" class="w-full" />
                </div>

                <div
                    class="space-y-3 rounded-2xl border border-gray-100/80 bg-white/60 p-6 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
                    <h4 class="text-xs font-bold tracking-widest text-gray-400 uppercase">空数据</h4>
                    <p class="text-xs text-gray-500">无选项时展示兜底文案</p>
                    <RebornSelect v-model="emptyValue" :options="[]" placeholder="暂无可选项" class="w-full" />
                </div>

                <div
                    class="space-y-3 rounded-2xl border border-gray-100/80 bg-white/60 p-6 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
                    <h4 class="text-xs font-bold tracking-widest text-gray-400 uppercase">无边框</h4>
                    <p class="text-xs text-gray-500">嵌入工具栏等紧凑场景</p>
                    <RebornSelect v-model="plainValue" :options="frameworkOptions" :bordered="false" :clearable="false"
                        class="w-full" />
                </div>

                <div
                    class="space-y-3 rounded-2xl border border-gray-100/80 bg-white/60 p-6 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
                    <h4 class="text-xs font-bold tracking-widest text-gray-400 uppercase">整体禁用</h4>
                    <p class="text-xs text-gray-500">不可展开、不可清空</p>
                    <RebornSelect v-model="plainValue" :options="frameworkOptions" disabled class="w-full" />
                </div>
            </div>
        </section>

        <!-- 7. 关闭时机 -->
        <section class="space-y-6">
            <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">关闭时机</h3>
                <p class="text-sm text-gray-500">closeOn</p>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div
                class="grid gap-6 rounded-3xl border border-gray-100/80 bg-white/60 p-8 backdrop-blur-2xl sm:grid-cols-2 dark:border-white/5 dark:bg-slate-900/40">
                <div class="flex flex-col gap-2">
                    <span class="text-sm font-black tracking-widest text-gray-400 uppercase">closeOn: click</span>
                    <p class="pb-1 text-xs text-gray-500">在外部完成一次完整点击后才收起</p>
                    <RebornSelect v-model="closeOnClickValue" :options="frameworkOptions" close-on="click"
                        class="w-full" />
                </div>
                <div class="flex flex-col gap-2" data-demo="close-on-mousedown">
                    <span class="text-sm font-black tracking-widest text-gray-400 uppercase">closeOn:
                        mousedown</span>
                    <p class="pb-1 text-xs text-gray-500">在外部按下鼠标（含右键）立即收起</p>
                    <RebornSelect v-model="closeOnMousedownValue" :options="frameworkOptions" close-on="mousedown"
                        class="w-full" />
                </div>
            </div>
        </section>

        <!-- 8. 插槽定制 -->
        <section class="space-y-6">
            <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">插槽定制</h3>
                <p class="text-sm text-gray-500">接管选项与触发器的渲染</p>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>

            <div class="grid gap-6 md:grid-cols-2">
                <div
                    class="space-y-4 rounded-3xl border border-gray-100/80 bg-white/60 p-8 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
                    <h4 class="text-sm font-bold tracking-widest text-gray-400 uppercase">option 插槽</h4>
                    <p class="text-xs text-gray-500">在选项内渲染图标与副标题，作用域提供 option 与 active</p>
                    <RebornSelect v-model="slotOptionValue" :options="frameworkOptions" :ui="{ option: 'h-auto py-2.5' }"
                        class="w-full">
                        <template #option="{ option, active }">
                            <div class="flex w-full items-center gap-3">
                                <Icon :name="option.icon" class="size-5 shrink-0" />
                                <div class="flex min-w-0 flex-1 flex-col">
                                    <span class="truncate text-sm font-medium">{{ option.label }}</span>
                                    <span class="truncate text-xs text-gray-400">{{ option.desc }}</span>
                                </div>
                                <Icon v-if="active" name="lucide:check" class="size-4 shrink-0 text-primary" />
                            </div>
                        </template>
                    </RebornSelect>
                </div>

                <div
                    class="space-y-4 rounded-3xl border border-gray-100/80 bg-white/60 p-8 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
                    <h4 class="text-sm font-bold tracking-widest text-gray-400 uppercase">cover 插槽</h4>
                    <p class="text-xs text-gray-500">完全接管触发器内容，自带箭头与状态样式由业务决定</p>
                    <RebornSelect v-model="coverValue" :options="frameworkOptions"
                        :trigger-ui="{ trigger: 'h-auto p-0 border-none bg-transparent' }" class="w-full">
                        <template #cover="{ displayText, placeholder, isOpen }">
                            <div
                                class="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-linear-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 active:scale-[0.98]">
                                <Icon name="lucide:sparkles" class="size-4 shrink-0" />
                                <span class="flex-1 truncate text-sm font-semibold">
                                    {{ displayText || placeholder }}
                                </span>
                                <Icon name="lucide:chevron-down"
                                    :class="['size-4 shrink-0 transition-transform duration-200', isOpen && 'rotate-180']" />
                            </div>
                        </template>
                    </RebornSelect>
                </div>
            </div>
        </section>

        <!-- 9. 表单集成 -->
        <section class="space-y-6">
            <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">表单集成</h3>
                <p class="text-sm text-gray-500">尺寸、禁用与校验态由 RebornForm 下发</p>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>

            <div
                class="space-y-6 rounded-3xl border border-gray-100/80 bg-white/60 p-8 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
                <p class="text-xs text-gray-500">
                    选择器不需要自己接错误状态：<code class="text-violet-500">size</code>、
                    <code class="text-violet-500">disabled</code>、<code class="text-violet-500">error</code>
                    都从表单上下文注入。选中触发 change 校验，收起面板触发 blur 校验
                </p>

                <RebornForm ref="formRef" :model-value="formModel" :rules="formRules" label-width="100px"
                    label-position="left" size="md" :trigger="['change', 'blur']">
                    <RebornFormItem prop="framework" label="主框架" required>
                        <RebornSelect v-model="formModel.framework" :options="frameworkOptions" placeholder="请选择主框架" />
                    </RebornFormItem>

                    <RebornFormItem prop="stack" label="技术栈" required>
                        <RebornSelect v-model="formModel.stack" :options="frameworkOptions" multiple
                            placeholder="至少选择 2 项" />
                    </RebornFormItem>
                </RebornForm>

                <div class="flex gap-3">
                    <button
                        class="cursor-pointer rounded-full bg-primary px-5 py-2 text-xs font-bold tracking-widest text-white uppercase transition-all hover:opacity-90 active:scale-95"
                        @click="submitForm">
                        校验并提交
                    </button>
                    <button
                        class="cursor-pointer rounded-full bg-gray-100 px-5 py-2 text-xs font-bold tracking-widest text-gray-500 uppercase transition-all hover:bg-gray-200 active:scale-95 dark:bg-gray-800 dark:hover:bg-gray-700"
                        @click="resetForm">
                        重置
                    </button>
                </div>
            </div>
        </section>

        <!-- 10. 深度样式定制 -->
        <section class="space-y-6">
            <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">深度样式定制</h3>
                <p class="text-sm text-gray-500">triggerUi / ui</p>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div
                class="rounded-3xl border-2 border-indigo-100 bg-indigo-50/30 p-8 dark:border-indigo-900/50 dark:bg-indigo-950/10">
                <h4 class="mb-2 text-sm font-bold tracking-widest text-indigo-400 uppercase">Custom Styling</h4>
                <p class="mb-6 text-xs text-indigo-500/70">
                    triggerUi 覆盖触发器各槽位，ui 覆盖下拉列表各槽位，二者都会与内置类做 twMerge 合并
                </p>
                <RebornSelect v-model="customUiValue" :options="frameworkOptions" :trigger-ui="{
                    trigger: 'border-dashed border-2 rounded-xl bg-white dark:bg-gray-800 border-indigo-200 dark:border-indigo-800 px-4 h-14',
                }" :ui="{
                    dropdown: 'rounded-xl shadow-2xl shadow-indigo-500/10 border-indigo-100 dark:border-indigo-900 bg-white/90 dark:bg-gray-800/90 backdrop-blur',
                    optionHighlight: 'bg-indigo-50 dark:bg-indigo-900/40',
                }" class="w-full max-w-md" />
            </div>
        </section>
    </div>
</template>