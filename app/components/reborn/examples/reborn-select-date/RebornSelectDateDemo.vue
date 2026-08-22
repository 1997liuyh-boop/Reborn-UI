<script setup lang="ts">
import { ref } from "vue";
import RebornSelectDate from "~/components/reborn/ui/reborn-select-date/RebornSelectDate.vue";
import { selectDateColors, selectDateSizes } from "~/components/reborn/ui/reborn-select-date/reborn-select-date.config";
import dayjs from "dayjs";

const size = ref<any>("md");
const color = ref<any>("primary");
const disabled = ref(false);

const dateValue = ref("");
const datetimeValue = ref("");
const monthValue = ref("");
const yearValue = ref("");
const weekValue = ref<string[]>([]);
const datesValue = ref<string[]>([]);
const rangeValue = ref<string[]>([]);
const dateTimeRangeValue = ref<string[]>([]);

const customFormatValue = ref("");

// 快捷选项示例
const shortcuts = [
    { text: '今天', value: new Date() },
    { text: '昨天', value: dayjs().subtract(1, 'day').toDate() },
    { text: '一周前', value: dayjs().subtract(1, 'week').toDate() }
];

const rangeShortcuts = [
    { text: '最近一周', value: () => [dayjs().subtract(1, 'week').toDate(), new Date()] },
    { text: '最近一月', value: () => [dayjs().subtract(1, 'month').toDate(), new Date()] },
    { text: '最近三月', value: () => [dayjs().subtract(3, 'month').toDate(), new Date()] }
];
</script>

<template>
    <div class="flex w-full flex-col gap-8 p-1">
        <!-- 控制面板 -->
        <div
            class="flex flex-wrap items-center gap-6 rounded-2xl border border-gray-1 bg-white/50 p-6 shadow-sm backdrop-blur-sm dark:border-gray-8 dark:bg-gray-900/50">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name="lucide:settings-2" class="size-5" />
                </div>
                <div>
                    <p class="text-caption font-bold uppercase tracking-wider text-gray-400">全局配置</p>
                    <div class="mt-1 flex items-center gap-4">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-medium text-gray-500">尺寸</span>
                            <USelect v-model="size" :items="[...selectDateSizes]" class="w-24" />
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-medium text-gray-500">颜色</span>
                            <USelect v-model="color" :items="[...selectDateColors]" class="w-28" />
                        </div>
                        <UCheckbox v-model="disabled" label="禁用组件" />
                    </div>
                </div>
            </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
            <!-- 基础选择 -->
            <section
                class="rounded-2xl border border-gray-1 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-8 dark:bg-gray-900">
                <div class="mb-6 flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                        <Icon name="lucide:calendar" class="size-5" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">基础日期</h3>
                </div>

                <div class="space-y-6">
                    <div class="space-y-2">
                        <label class="text-xs font-medium text-gray-400">Date picker</label>
                        <RebornSelectDate v-model="dateValue" type="date" :size="size" :color="color"
                            :disabled="disabled" placeholder="选择日期" />
                        <div
                            class="flex h-8 items-center rounded-lg bg-gray-50 px-3 text-sm text-gray-500 dark:bg-gray-800/50">
                            Value: <span class="ml-2 font-mono text-primary">{{ dateValue || `undefined` }}</span>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-xs font-medium text-gray-400">DateTime picker</label>
                        <RebornSelectDate v-model="datetimeValue" type="datetime" :size="size" :color="color"
                            :disabled="disabled" placeholder="选择日期时间" />
                        <div
                            class="flex h-8 items-center rounded-lg bg-gray-50 px-3 text-sm text-gray-500 dark:bg-gray-800/50">
                            Value: <span class="ml-2 font-mono text-primary">{{ datetimeValue || `undefined` }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 范围选择 -->
            <section
                class="rounded-2xl border border-gray-1 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-8 dark:bg-gray-900">
                <div class="mb-6 flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                        <Icon name="lucide:calendar-range" class="size-5" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">范围选择</h3>
                </div>

                <div class="space-y-6">
                    <div class="space-y-2">
                        <label class="text-xs font-medium text-gray-400">Date Range (Dual Panel)</label>
                        <RebornSelectDate v-model="rangeValue" type="daterange" rangeable :size="size" :color="color"
                            :disabled="disabled" :shortcuts="rangeShortcuts" placeholder="点击选择日期范围" />
                        <div
                            class="flex min-h-8 flex-wrap items-center rounded-lg bg-gray-50 px-3 py-1 text-sm text-gray-500 dark:bg-gray-800/50">
                            Value: <span class="ml-2 font-mono text-primary">{{ rangeValue.length ? rangeValue.join(` ~
                                `) : `empty` }}</span>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-xs font-medium text-gray-400">DateTime Range (Dual Panel)</label>
                        <RebornSelectDate v-model="dateTimeRangeValue" type="datetimerange" rangeable :size="size"
                            :color="color" :disabled="disabled" value-format="YYYY-MM-DD HH:mm:ss.SSS"
                            placeholder="选择开始与结束时间" />
                        <div
                            class="flex min-h-8 flex-wrap items-center rounded-lg bg-gray-50 px-3 py-1 text-sm text-gray-500 dark:bg-gray-800/50">
                            Value: <span class="ml-2 font-mono text-primary">{{ dateTimeRangeValue.length ?
                                dateTimeRangeValue.join(` ~ `) : `empty` }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 组合选择 (月中、年中) -->
            <section
                class="rounded-2xl border border-gray-1 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-8 dark:bg-gray-900">
                <div class="mb-6 flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                        <Icon name="lucide:layout-grid" class="size-5" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">特殊维度</h3>
                </div>

                <div class="grid gap-6">
                    <div class="space-y-2">
                        <label class="text-xs font-medium text-gray-400">Month view</label>
                        <RebornSelectDate v-model="monthValue" type="month" :size="size" :color="color"
                            :disabled="disabled" placeholder="仅月份" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-medium text-gray-400">Year view</label>
                        <RebornSelectDate v-model="yearValue" type="year" :size="size" :color="color"
                            :disabled="disabled" placeholder="仅年份" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-medium text-gray-400">Week selection</label>
                        <RebornSelectDate v-model="weekValue" type="week" rangeable :size="size" :color="color"
                            :disabled="disabled" placeholder="整周选择" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-medium text-gray-400">Multiple dates</label>
                        <RebornSelectDate v-model="datesValue" type="dates" :size="size" :color="color"
                            :disabled="disabled" placeholder="选择多天" />
                    </div>
                </div>
            </section>

            <!-- 高级自定义 -->
            <section
                class="rounded-2xl border border-gray-1 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-8 dark:bg-gray-900">
                <div class="mb-6 flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Icon name="lucide:palette" class="size-5" />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">高级定制</h3>
                </div>

                <div class="space-y-6">
                    <div class="space-y-2">
                        <label class="text-xs font-medium text-gray-400">Custom Format</label>
                        <RebornSelectDate v-model="customFormatValue" type="date" labelFormat="YYYY年MM月DD日"
                            valueFormat="YYYY/MM/DD" :size="size" :color="color" placeholder="格式化显示与存储" />
                        <p class="text-sm text-gray-400 italic">Display: YYYY年MM月DD日 | Value: {{
                            customFormatValue
                            || `-` }}</p>
                    </div>

                    <div class="space-y-2">
                        <label class="text-xs font-medium text-gray-400">Luxury Theme Overwrites</label>
                        <RebornSelectDate type="datetime" :size="size" color="info" :ui="{
                            trigger: 'border-2 border-info/30 rounded-2xl bg-info/5 hover:border-info/60 transition-all shadow-inner',
                            dropdown: 'rounded-ui-lg shadow-2xl shadow-info/20 border-info/10 bg-white/95 backdrop-blur-md dark:bg-gray-800/95'
                        }" placeholder="深度重写 UI 样式" />
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>
