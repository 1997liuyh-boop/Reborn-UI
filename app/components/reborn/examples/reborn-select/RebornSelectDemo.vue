<script setup lang="ts">
import { reactive } from "vue";
import { z } from "zod";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import type { SelectOption } from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornForm from "~/components/reborn/ui/reborn-form/RebornForm.vue";
import RebornFormItem from "~/components/reborn/ui/reborn-form/RebornFormItem.vue";
import { selectColors, selectSizes, selectVariants } from "~/components/reborn/ui/reborn-select/reborn-select.config";

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

/** 超大数据源：一万条，用来对比虚拟滚动开与关的差别 */
const hugeOptions: SelectOption[] = Array.from({ length: 10000 }, (_, i) => ({
    label: `编号 ${String(i + 1).padStart(5, "0")} 号资产`,
    value: `asset-${i + 1}`,
}));

// --- Playground 状态 ---

const defaultState: Record<string, any> = {
    value: "city-30",
    size: "md",
    color: "primary",
    variant: "outlined",
    multiple: false,
    collapseTags: false,
    collapseTagsTooltip: false,
    maxCollapseTags: 1,
    clearable: true,
    allowSearch: false,
    loading: false,
    disabled: false,
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
            {
                label: "形态变体",
                key: "variant",
                component: "select" as const,
                defaultValue: "outlined",
                props: { options: selectVariants.map((v) => ({ label: v, value: v })) },
            },
            { label: "占位文字", key: "placeholder", component: "input" as const, defaultValue: "请选择站点" },
        ],
    },
    {
        title: "交互控制",
        children: [
            { label: "多选模式", key: "multiple", component: "checkbox" as const, defaultValue: false },
            { label: "折叠标签", key: "collapseTags", component: "checkbox" as const, defaultValue: false },
            { label: "折叠标签悬浮提示", key: "collapseTagsTooltip", component: "checkbox" as const, defaultValue: false },
            {
                label: "折叠前保留数量",
                key: "maxCollapseTags",
                component: "input-number" as const,
                defaultValue: 1,
                props: { min: 1, max: 5 },
            },
            { label: "可清空", key: "clearable", component: "checkbox" as const, defaultValue: true },
            { label: "允许搜索", key: "allowSearch", component: "checkbox" as const, defaultValue: false },
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
            { label: "显示箭头", key: "showArrow", component: "checkbox" as const, defaultValue: true },
            { label: "箭头旋转动画", key: "arrowAnimation", component: "checkbox" as const, defaultValue: true },
            { label: "加载中", key: "loading", component: "checkbox" as const, defaultValue: false },
            { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
        ],
    },
];

// --- 各展示区块的独立状态 ---

/** 本地搜索：默认的 label 包含匹配 */
const searchValue = ref("vue");
/** 自定义过滤：filter-option 传函数，关键词同时命中 label 与 desc */
const customFilterValue = ref<string[]>([]);

/**
 * 自定义匹配规则：关键词同时在展示文本与描述里查找。
 * 返回 true 表示保留该选项，签名与 Arco 的 filter-option 一致。
 */
function filterByLabelOrDesc(keyword: string, option: SelectOption) {
    const lower = keyword.toLowerCase();
    return (
        String(option.label).toLowerCase().includes(lower) ||
        String(option.desc ?? "").toLowerCase().includes(lower)
    );
}

/** 远程搜索：filter-option=false 关掉本地过滤，列表完全由请求结果决定 */
const remoteValue = ref(null);
/** 兜底推荐：面板一展开就先摆出这几条，避免开局是一片「暂无数据」 */
const remoteDefaultOptions = cityOptions.slice(0, 8);
const remoteOptions = ref<SelectOption[]>([...remoteDefaultOptions]);
const remoteLoading = ref(false);
let remoteTimer: ReturnType<typeof setTimeout> | null = null;

/** 收起时把列表还原成默认推荐，下次展开又是一份干净的初始内容 */
function onRemoteVisibleChange(visible: boolean) {
    if (visible) return;
    if (remoteTimer) clearTimeout(remoteTimer);
    remoteLoading.value = false;
    remoteOptions.value = [...remoteDefaultOptions];
}

/** 模拟一次带防抖的远程请求：请求期间用 loading 接管下拉面板 */
function onRemoteSearch(keyword: string) {
    if (remoteTimer) clearTimeout(remoteTimer);

    const query = keyword.trim();
    if (!query) {
        // 关键词被清空：回到默认推荐，而不是留一个空面板
        remoteOptions.value = [...remoteDefaultOptions];
        remoteLoading.value = false;
        return;
    }

    remoteLoading.value = true;
    remoteTimer = setTimeout(() => {
        remoteOptions.value = cityOptions.filter((o) => o.label.includes(query)).slice(0, 20);
        remoteLoading.value = false;
    }, 600);
}

/** 虚拟滚动：一万条数据，DOM 里始终只有可视区的十几行 */
const virtualValue = ref("asset-6666");
const virtualSearchValue = ref<string[]>([]);

/** 加载态：静态展示触发器与下拉面板同时进入 loading */
const loadingValue = ref("vue");

/** 页头 / 页脚插槽 */
const headerFooterValue = ref<string[]>(["vue"]);

/** 滚动加载：初始只给 12 项，触底后由 dropdown-scroll 续接 */
const scrollLoadValue = ref(null);
const scrollLoadOptions = ref<SelectOption[]>(cityOptions.slice(0, 12));
const scrollLoadPending = ref(false);
/** 是否已经把数据源全部加载完 */
const scrollLoadDone = computed(() => scrollLoadOptions.value.length >= cityOptions.length);

/**
 * 下拉列表滚动到底部时续接下一页。
 * 这里不用 loading 属性：它会把整个列表替换成占位，滚动位置随之丢失，
 * 分页场景的加载提示更适合放在固定不动的页脚里。
 */
function onDropdownScroll(e: Event) {
    const el = e.target as HTMLElement;
    if (scrollLoadPending.value || scrollLoadDone.value) return;
    // 距底部还有 24px 就提前取数，避免用户看到空白等待
    if (el.scrollHeight - el.scrollTop - el.clientHeight > 24) return;

    scrollLoadPending.value = true;
    setTimeout(() => {
        scrollLoadOptions.value = cityOptions.slice(0, scrollLoadOptions.value.length + 12);
        scrollLoadPending.value = false;
    }, 500);
}

/** 浮层定位：分别放在滚动容器内与页面流中 */
const scrollBoxValue = ref("city-20");
const followValue = ref("city-45");
/** portal 关闭后的对照组：浮层留在触发器内，会被容器 overflow 裁掉 */
const clippedValue = ref("city-20");

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

function onChange(value: any) {
    console.log("[RebornSelect] 选中值变化：", value);
}
</script>

<template>
    <div class="flex w-full flex-col">
        <!-- 1. 交互演练场：Playground 自带标题栏，不再额外套 DemoSection -->
        <Playground v-model="state" :controls="controls" component-name="RebornSelect" title="交互体验"
            description="调节左侧参数实时查看反馈；数据源为 60 个站点，展开时会自动定位到已选项">
            <template #tag>
                <RebornButton variant="soft" size="sm" @click="resetState">
                    <template #leading>
                        <Icon name="lucide:rotate-ccw" size="12" />
                    </template>
                    重置配置
                </RebornButton>
            </template>

            <RebornSelect v-model="state.value" :options="cityOptions" :size="state.size" :color="state.color"
                :variant="state.variant" :multiple="state.multiple" :collapse-tags="state.collapseTags"
                :collapse-tags-tooltip="state.collapseTagsTooltip" :max-collapse-tags="state.maxCollapseTags"
                :clearable="state.clearable" :allow-search="state.allowSearch" :loading="state.loading"
                :disabled="state.disabled" :show-arrow="state.showArrow" :arrow-animation="state.arrowAnimation"
                :close-on="state.closeOn" :portal="state.portal" :placeholder="state.placeholder" class="min-w-64"
                @change="onChange" />
        </Playground>

        <!-- 2. 选项搜索 -->
        <DemoSection title="选项搜索"
            description="allow-search 让触发器在展开后变成输入框；filter-option 决定匹配规则：默认按 label 包含匹配，传函数可自定义，传 false 则关闭本地过滤、把列表交给远程数据源。">
            <DemoBlock layout="grid" :columns="3" align="start">
                <DemoItem label="allow-search" note="默认按选项 label 做不区分大小写的包含匹配，无结果时展示「无匹配结果」">
                    <RebornSelect v-model="searchValue" :options="frameworkOptions" allow-search placeholder="输入关键词筛选"
                        class="w-full" />
                </DemoItem>

                <DemoItem label="filter-option 自定义" note="传入函数后关键词同时命中 label 与 desc：输入「编译」也能找到 Svelte" mono>
                    <RebornSelect v-model="customFilterValue" :options="frameworkOptions" multiple allow-search
                        :filter-option="filterByLabelOrDesc" color="success" placeholder="按名称或描述搜索" class="w-full" />
                </DemoItem>

                <DemoItem label="远程搜索" note="filter-option=false 关闭本地过滤，search 事件里发请求；展开先给默认推荐，请求期间用 loading 接管面板" mono>
                    <RebornSelect v-model="remoteValue" :options="remoteOptions" allow-search :filter-option="false"
                        :loading="remoteLoading" color="info" placeholder="输入数字搜索站点" class="w-full"
                        @search="onRemoteSearch" @visible-change="onRemoteVisibleChange" />
                </DemoItem>
            </DemoBlock>
        </DemoSection>

        <!-- 3. 加载状态 -->
        <DemoSection title="加载状态" description="loading 同时作用于两处：触发器箭头替换为转圈图标，下拉面板改为加载中占位。">
            <DemoBlock layout="grid" :columns="2" align="start">
                <DemoItem label="loading" note="加载期间清空按钮自动让位，避免与转圈图标争抢同一格；展开可见面板占位">
                    <RebornSelect v-model="loadingValue" :options="frameworkOptions" loading class="w-full" />
                </DemoItem>

                <DemoItem label="对照组" note="非加载态：箭头正常显示，悬停时清空按钮盖上来">
                    <RebornSelect v-model="loadingValue" :options="frameworkOptions" class="w-full" />
                </DemoItem>
            </DemoBlock>
        </DemoSection>

        <!-- 4. 页头与页脚 -->
        <DemoSection title="页头与页脚"
            description="header 与 footer 位于滚动列表之外，列表滚动时二者固定不动，适合放统计信息、批量操作或「新建」入口。">
            <DemoBlock layout="grid" :columns="2" align="start">
                <DemoItem label="header + footer" note="页头展示已选统计，页脚放置操作入口；点击页脚不会收起面板">
                    <RebornSelect v-model="headerFooterValue" :options="frameworkOptions" multiple placeholder="可多选框架"
                        class="w-full">
                        <template #header>
                            已选 {{ headerFooterValue.length }} / {{ frameworkOptions.length }} 项
                        </template>
                        <template #footer>
                            <div class="flex items-center justify-between">
                                <span>找不到想要的？</span>
                                <span class="text-primary cursor-pointer">新建选项</span>
                            </div>
                        </template>
                    </RebornSelect>
                </DemoItem>

                <DemoItem label="仅 header" note="两个插槽相互独立，可只用其中一个">
                    <RebornSelect v-model="loadingValue" :options="frameworkOptions" color="info" class="w-full">
                        <template #header>请选择你最熟悉的框架</template>
                    </RebornSelect>
                </DemoItem>
            </DemoBlock>
        </DemoSection>

        <!-- 5. 滚动加载 -->
        <DemoSection title="滚动加载"
            description="dropdown-scroll 原样透出下拉列表的原生滚动事件，据此判断触底即可实现分页续接。">
            <DemoItem label="dropdown-scroll" note="初始只有 12 项，滚动到底部自动追加下一页；加载提示放在固定不动的页脚里，滚动位置不会丢失">
                <RebornSelect v-model="scrollLoadValue" :options="scrollLoadOptions" color="warning" placeholder="向下滚动加载更多"
                    class="w-full max-w-md" @dropdown-scroll="onDropdownScroll">
                    <template #footer>
                        <div class="flex items-center justify-center gap-2">
                            <Icon v-if="scrollLoadPending" name="lucide:loader-2" class="size-3.5 animate-spin" />
                            <span>
                                {{ scrollLoadDone
                                    ? `已加载全部 ${scrollLoadOptions.length} 项`
                                    : scrollLoadPending
                                        ? "加载中..."
                                        : `已加载 ${scrollLoadOptions.length} / ${cityOptions.length} 项` }}
                            </span>
                        </div>
                    </template>
                </RebornSelect>
            </DemoItem>
        </DemoSection>

        <!-- 6. 虚拟滚动 -->
        <DemoSection title="虚拟滚动"
            description="virtual 开启后只渲染可视区内的选项，DOM 数量与数据量脱钩；代价是每项高度必须恒定，由 virtual-item-height 声明（默认 33px = 29px 行高 + 4px 行距）。">
            <DemoBlock layout="grid" :columns="2" align="start">
                <DemoItem label="virtual" note="一万条选项，展开仍是瞬时的；已选项照旧被定位到可视区中央，键盘上下键也能正常翻越">
                    <RebornSelect v-model="virtualValue" :options="hugeOptions" virtual placeholder="一万条资产编号"
                        class="w-full" />
                </DemoItem>

                <DemoItem label="virtual + allow-search + multiple" note="搜索会重排列表，此时虚拟窗口自动回到顶部；多选标签与虚拟列表互不干扰">
                    <RebornSelect v-model="virtualSearchValue" :options="hugeOptions" virtual multiple allow-search
                        color="success" placeholder="输入编号搜索" class="w-full" />
                </DemoItem>
            </DemoBlock>
        </DemoSection>

        <!-- 7. 浮层定位 -->
        <DemoSection title="浮层定位" description="浮层传送至 body，始终锚定触发器。">
            <DemoBlock layout="grid" :columns="2" align="start">
                <DemoItem label="滚动容器内" note="展开后滚动下方区域：浮层实时跟随触发器，且不会被容器的 overflow-hidden 裁掉">
                    <!-- 滚动容器本身就是被演示的对象，属规范里唯一允许的那层浅填充 -->
                    <div class="bg-elevated rounded-ui-sm h-56 w-full overflow-y-auto p-4">
                        <DemoNote tone="dimmed" class="pb-4 text-xs">向下滚动一段距离后再展开选择器 ↓</DemoNote>
                        <div class="h-24" />
                        <RebornSelect v-model="scrollBoxValue" :options="cityOptions" color="info" class="w-full" />
                        <div class="h-72" />
                        <DemoNote tone="dimmed" class="text-xs">容器底部</DemoNote>
                    </div>
                </DemoItem>

                <DemoItem label="对照组：:portal=&quot;false&quot;" note="浮层留在触发器内，被容器 overflow 截断；需要浮层随父容器一起滚动、一起裁剪时才关掉 portal">
                    <div class="bg-elevated rounded-ui-sm h-56 w-full overflow-y-auto p-4">
                        <DemoNote tone="dimmed" class="pb-4 text-xs">展开后与左侧对比 ↓</DemoNote>
                        <div class="h-24" />
                        <RebornSelect v-model="clippedValue" :options="cityOptions" color="error" :portal="false"
                            class="w-full" />
                        <div class="h-72" />
                        <DemoNote tone="dimmed" class="text-xs">容器底部</DemoNote>
                    </div>
                </DemoItem>
            </DemoBlock>

            <div class="border-default mt-6 border-t pt-6">
                <DemoItem label="自动翻转与定位" note="下方空间不足时自动向上展开；60 项长列表在展开瞬间即滚动到已选项，无需手动查找">
                    <RebornSelect v-model="followValue" :options="cityOptions" color="warning" class="w-full max-w-md" />
                </DemoItem>
                <ul class="text-muted grid gap-2 pt-2 text-xs sm:grid-cols-3">
                    <li class="flex gap-2">
                        <span class="text-dimmed font-black">01</span>
                        展开方向在展开瞬间锁定，滚动中不会翻转，浮层始终贴住触发器
                    </li>
                    <li class="flex gap-2">
                        <span class="text-dimmed font-black">02</span>
                        浮层最小宽度对齐触发器，内容更宽时向右扩展并留出视口边距
                    </li>
                    <li class="flex gap-2">
                        <span class="text-dimmed font-black">03</span>
                        支持 <code>↑ ↓</code> 移动高亮、<code>Enter</code> 选中、<code>Esc</code> 收起
                    </li>
                </ul>
            </div>
        </DemoSection>

        <!-- 8. 插槽定制 -->
        <DemoSection title="插槽定制" description="接管选项与触发器的渲染。">
            <DemoBlock layout="grid" :columns="2" align="start">
                <DemoItem label="option 插槽" note="在选项内渲染图标与副标题，作用域提供 option 与 active" mono>
                    <RebornSelect v-model="slotOptionValue" :options="frameworkOptions" :ui="{ option: 'h-auto py-2.5' }"
                        class="w-full">
                        <template #option="{ option, active }">
                            <div class="flex w-full items-center gap-3">
                                <Icon :name="option.icon" class="size-5 shrink-0" />
                                <div class="flex min-w-0 flex-1 flex-col">
                                    <span class="truncate text-sm font-medium">{{ option.label }}</span>
                                    <span class="text-dimmed truncate text-xs">{{ option.desc }}</span>
                                </div>
                                <Icon v-if="active" name="lucide:check" class="text-primary size-4 shrink-0" />
                            </div>
                        </template>
                    </RebornSelect>
                </DemoItem>

                <DemoItem label="cover 插槽" note="完全接管触发器内容，自带箭头与状态样式由业务决定" mono>
                    <RebornSelect v-model="coverValue" :options="frameworkOptions"
                        :trigger-ui="{ trigger: 'h-auto p-0 border-none bg-transparent' }" class="w-full">
                        <template #cover="{ displayText, placeholder, isOpen }">
                            <div
                                class="rounded-ui-base flex w-full cursor-pointer items-center gap-3 bg-linear-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-white transition-all active:scale-[0.98]">
                                <Icon name="lucide:sparkles" class="size-4 shrink-0" />
                                <span class="flex-1 truncate text-sm font-semibold">
                                    {{ displayText || placeholder }}
                                </span>
                                <Icon name="lucide:chevron-down"
                                    :class="['size-4 shrink-0 transition-transform duration-200', isOpen && 'rotate-180']" />
                            </div>
                        </template>
                    </RebornSelect>
                </DemoItem>
            </DemoBlock>
        </DemoSection>

        <!-- 9. 表单集成 -->
        <DemoSection title="表单集成" description="尺寸、禁用与校验态由 RebornForm 下发。">
            <DemoBlock layout="stack" class="gap-6">
                <DemoNote class="text-xs">
                    选择器不需要自己接错误状态：<code>size</code>、<code>disabled</code>、<code>error</code>
                    都从表单上下文注入。选中触发 change 校验，收起面板触发 blur 校验
                </DemoNote>

                <RebornForm ref="formRef" :model-value="formModel" :rules="formRules" label-width="100px"
                    label-position="left" size="md" :trigger="['change', 'blur']" class="w-full max-w-lg">
                    <RebornFormItem prop="framework" label="主框架" required>
                        <RebornSelect v-model="formModel.framework" :options="frameworkOptions" placeholder="请选择主框架" />
                    </RebornFormItem>

                    <RebornFormItem prop="stack" label="技术栈" required>
                        <RebornSelect v-model="formModel.stack" :options="frameworkOptions" multiple
                            placeholder="至少选择 2 项" />
                    </RebornFormItem>
                </RebornForm>

                <div class="flex gap-3">
                    <RebornButton color="primary" @click="submitForm">校验并提交</RebornButton>
                    <RebornButton color="neutral" variant="outline" @click="resetForm">重置</RebornButton>
                </div>
            </DemoBlock>
        </DemoSection>

        <!-- 10. 深度样式定制 -->
        <DemoSection title="深度样式定制" description="triggerUi 覆盖触发器各槽位，ui 覆盖下拉列表各槽位，二者都会与内置类做 twMerge 合并。">
            <RebornSelect v-model="customUiValue" :options="frameworkOptions" :trigger-ui="{
                trigger: 'border-dashed border-2 rounded-ui-base border-indigo-200 dark:border-indigo-800 px-4 h-14',
            }" :ui="{
                dropdown: 'rounded-ui-base border-indigo-100 dark:border-indigo-900',
                optionHighlight: 'bg-indigo-50 dark:bg-indigo-900/40',
            }" class="w-full max-w-md" />
        </DemoSection>
    </div>
</template>