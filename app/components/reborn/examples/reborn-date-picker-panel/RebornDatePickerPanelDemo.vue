<script setup lang="ts">
import { ref, watch } from "vue";
import RebornDatePickerPanel from "../../ui/reborn-date-picker-panel/RebornDatePickerPanel.vue";
import Playground from "~/components/common/play-ground/Playground.vue";
import { datePickerPanelColors, datePickerPanelSizes, type DatePickerType } from "../../ui/reborn-date-picker-panel/reborn-date-picker-panel.config";

// --- Playground State ---
const state = ref({
    value: "2024-04-03" as string | string[],
    type: "date" as DatePickerType,
    color: "primary" as (typeof datePickerPanelColors)[number],
    shape: "square" as "square" | "circle",
    size: "md" as (typeof datePickerPanelSizes)[number],
    disabled: false,
    border: true,
    shortcuts: true,
    valueFormat: "YYYY-MM-DD"
});

// Reset value when type changes to prevent type mismatch (string vs array)
watch(() => state.value.type, (newType) => {
    if (["dates", "months", "years"].includes(newType)) {
        state.value.value = [];
    } else if (["daterange", "monthrange", "yearrange", "datetimerange", "week"].includes(newType)) {
        state.value.value = [];
    } else {
        state.value.value = '';
    }
});

const controls = [
    {
        title: "视觉样式",
        children: [
            {
                label: "主题颜色",
                key: "color",
                component: "select" as const,
                defaultValue: "primary",
                props: { options: datePickerPanelColors.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })) }
            },
            {
                label: "尺寸规格",
                key: "size",
                component: "select" as const,
                defaultValue: "md",
                props: { options: datePickerPanelSizes.map(s => ({ label: s.toUpperCase(), value: s })) }
            },
            {
                label: "形状",
                key: "shape",
                component: "select" as const,
                defaultValue: "square",
                props: { options: [{ label: "方形 (Square)", value: "square" }, { label: "圆形 (Circle)", value: "circle" }] }
            },
            {
                label: "边框",
                key: "border",
                component: "checkbox" as const,
                defaultValue: true,
            },
        ]
    },
    {
        title: "交互配置",
        children: [
            {
                label: "显示快捷选项",
                key: "shortcuts",
                component: "checkbox" as const,
                defaultValue: true,
            },
            {
                label: "禁用状态",
                key: "disabled",
                component: "checkbox" as const,
                defaultValue: false,
            },
        ]
    }
];

// --- Showcase Data ---
const dateValue = ref("2024-04-03");
const datesValue = ref(["2024-04-03", "2024-04-05", "2024-04-10"]);
const rangeValue = ref(["2024-04-01", "2024-04-15"]);
const weekValue = ref(["2024-03-31", "2024-04-06"]);
const monthRangeValue = ref(["2024-01", "2024-04"]);
const yearRangeValue = ref(["2020", "2024"]);
const datetimeValue = ref("2024-04-03 12:00");

const globalShortcuts = [
    { text: '今天', value: new Date() },
    {
        text: '一周前', value: () => {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            return d;
        }
    },
    {
        text: '下个月', value: () => {
            const d = new Date();
            d.setMonth(d.getMonth() + 1);
            return d;
        }
    }
];

const showcases = ref([
    { label: "日期 (Date)", value: "date", model: '' },
    { label: "多选日期 (Dates)", value: "dates", model: [] },
    { label: "日期范围 (Date Range)", value: "daterange", model: [] },
    { label: "日期时间 (DateTime)", value: "datetime", model: '' },
    { label: "日期时间范围 (DateTime Range)", value: "datetimerange", model: [] },
    { label: "周 (Week)", value: "week", model: [] },
    { label: "月份 (Month)", value: "month", model: '' },
    { label: "多选月份 (Months)", value: "months", model: [] },
    { label: "月份范围 (Month Range)", value: "monthrange", model: [] },
    { label: "年份 (Year)", value: "year", model: '' },
    { label: "多选年份 (Years)", value: "years", model: [] },
    { label: "年份范围 (Year Range)", value: "yearrange", model: [] },
]);

function formatDisplay(val: any) {
    if (Array.isArray(val)) return `[${val.join(', ')}]`;
    return val || '无 (None)';
}
</script>

<template>
    <div class="space-y-16 pb-32">
        <!-- Playground -->
        <Playground v-model="state" :controls="controls" component-name="RebornDatePickerPanel"
            title="交互演练场 (Playground)" description="实时调节 12 种模式、颜色、形状及尺寸，感受最直观的视觉反馈。">
            <div class="w-full flex-col items-center justify-center space-y-8">
                <div class="w-full flex justify-center">
                    <RebornDatePickerPanel v-model="state.value" :type="state.type" :color="state.color"
                        :shape="state.shape" :size="state.size" :disabled="state.disabled" :border="state.border"
                        :shortcuts="state.shortcuts ? globalShortcuts : []" :value-format="state.valueFormat" />
                </div>

                <div
                    class="mx-auto max-w-[400px] px-6 py-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
                    <div class="flex items-center gap-2 mb-2">
                        <span
                            class="w-2.5 h-2.5 rounded-full min-w-2.5 bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--color-primary),0.5)]" />
                        <span class="text-caption-sm font-bold text-gray-400 uppercase tracking-widest">当前绑定值 (Model
                            Value)</span>
                    </div>
                    <div class="font-mono text-sm text-primary font-semibold break-all">
                        {{ formatDisplay(state.value) }}
                    </div>
                </div>
            </div>
        </Playground>

        <!-- Category Showcases -->
        <div class="space-y-12">

            <div class="grid grid-cols-1 gap-8">
                <div v-for="item in showcases" :key="item.label" class="group flex flex-col space-y-4">
                    <div class="flex items-center justify-between px-2">
                        <div class="flex flex-col border-l-2 border-primary/20 pl-3">
                            <span class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ item.label }}</span>
                            <span
                                class="text-caption-sm font-mono text-gray-400 uppercase tracking-tighter opacity-60">{{
                                    item.value }}</span>
                        </div>
                        <div
                            class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-caption-sm font-bold text-gray-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300">
                            面板预览</div>
                    </div>

                    <div
                        class="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                        <RebornDatePickerPanel v-model="item.model" :type="(item.value as DatePickerType)"
                            :color="state.color" :shape="state.shape" :size="state.size" :border="false" />
                    </div>

                    <div
                        class="mx-1 px-4 py-3 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-transparent group-hover:border-primary/20 transition-all duration-300">
                        <div class="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">数据状态</div>
                        <div class="text-caption-md font-mono text-gray-600 dark:text-gray-400 break-all truncate">
                            {{ formatDisplay(item.model) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>