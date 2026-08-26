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
    <div class="flex w-full flex-col">
        <!-- 全局配置：一行控件，不铺底色 -->
        <DemoSection title="全局配置" description="下方所有示例共享这组尺寸 / 颜色 / 禁用参数。">
            <DemoBlock class="gap-6">
                <div class="flex items-center gap-2">
                    <span class="text-muted text-xs font-medium">尺寸</span>
                    <USelect v-model="size" :items="[...selectDateSizes]" class="w-24" />
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-muted text-xs font-medium">颜色</span>
                    <USelect v-model="color" :items="[...selectDateColors]" class="w-28" />
                </div>
                <UCheckbox v-model="disabled" label="禁用组件" />
            </DemoBlock>
        </DemoSection>

        <DemoSection title="基础日期" description="date 选日期，datetime 额外带时间列。">
            <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
                <div class="flex flex-col gap-2">
                    <span class="text-dimmed text-xs font-medium">Date picker</span>
                    <RebornSelectDate v-model="dateValue" type="date" :size="size" :color="color" :disabled="disabled"
                        placeholder="选择日期" />
                    <DemoNote tone="dimmed" class="font-mono text-xs">Value: {{ dateValue || 'undefined' }}</DemoNote>
                </div>
                <div class="flex flex-col gap-2">
                    <span class="text-dimmed text-xs font-medium">DateTime picker</span>
                    <RebornSelectDate v-model="datetimeValue" type="datetime" :size="size" :color="color"
                        :disabled="disabled" placeholder="选择日期时间" />
                    <DemoNote tone="dimmed" class="font-mono text-xs">Value: {{ datetimeValue || 'undefined' }}
                    </DemoNote>
                </div>
            </DemoBlock>
        </DemoSection>

        <DemoSection title="范围选择" description="rangeable 开启双面板，配合 shortcuts 可一键套用常用区间。">
            <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
                <div class="flex flex-col gap-2">
                    <span class="text-dimmed text-xs font-medium">Date Range（双面板）</span>
                    <RebornSelectDate v-model="rangeValue" type="daterange" rangeable :size="size" :color="color"
                        :disabled="disabled" :shortcuts="rangeShortcuts" placeholder="点击选择日期范围" />
                    <DemoNote tone="dimmed" class="font-mono text-xs">
                        Value: {{ rangeValue.length ? rangeValue.join(' ~ ') : 'empty' }}
                    </DemoNote>
                </div>
                <div class="flex flex-col gap-2">
                    <span class="text-dimmed text-xs font-medium">DateTime Range（双面板）</span>
                    <RebornSelectDate v-model="dateTimeRangeValue" type="datetimerange" rangeable :size="size"
                        :color="color" :disabled="disabled" value-format="YYYY-MM-DD HH:mm:ss.SSS"
                        placeholder="选择开始与结束时间" />
                    <DemoNote tone="dimmed" class="font-mono text-xs">
                        Value: {{ dateTimeRangeValue.length ? dateTimeRangeValue.join(' ~ ') : 'empty' }}
                    </DemoNote>
                </div>
            </DemoBlock>
        </DemoSection>

        <DemoSection title="特殊维度" description="按月 / 年 / 整周 / 多天四种粒度取值。">
            <DemoBlock layout="grid" align="start" class="lg:grid-cols-4">
                <div class="flex flex-col gap-2">
                    <span class="text-dimmed text-xs font-medium">Month view</span>
                    <RebornSelectDate v-model="monthValue" type="month" :size="size" :color="color"
                        :disabled="disabled" placeholder="仅月份" />
                </div>
                <div class="flex flex-col gap-2">
                    <span class="text-dimmed text-xs font-medium">Year view</span>
                    <RebornSelectDate v-model="yearValue" type="year" :size="size" :color="color" :disabled="disabled"
                        placeholder="仅年份" />
                </div>
                <div class="flex flex-col gap-2">
                    <span class="text-dimmed text-xs font-medium">Week selection</span>
                    <RebornSelectDate v-model="weekValue" type="week" rangeable :size="size" :color="color"
                        :disabled="disabled" placeholder="整周选择" />
                </div>
                <div class="flex flex-col gap-2">
                    <span class="text-dimmed text-xs font-medium">Multiple dates</span>
                    <RebornSelectDate v-model="datesValue" type="dates" :size="size" :color="color"
                        :disabled="disabled" placeholder="选择多天" />
                </div>
            </DemoBlock>
        </DemoSection>

        <DemoSection title="高级定制" description="labelFormat 决定展示、valueFormat 决定存储；ui 可深度重写触发器与浮层。">
            <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
                <div class="flex flex-col gap-2">
                    <span class="text-dimmed text-xs font-medium">Custom Format</span>
                    <RebornSelectDate v-model="customFormatValue" type="date" label-format="YYYY年MM月DD日"
                        value-format="YYYY/MM/DD" :size="size" :color="color" placeholder="格式化显示与存储" />
                    <DemoNote tone="dimmed" class="font-mono text-xs">
                        Display: YYYY年MM月DD日 | Value: {{ customFormatValue || '-' }}
                    </DemoNote>
                </div>
                <div class="flex flex-col gap-2">
                    <span class="text-dimmed text-xs font-medium">UI 深度重写</span>
                    <RebornSelectDate type="datetime" :size="size" color="info" :ui="{
                        trigger: 'border-2 border-info/30 rounded-ui-base bg-info/5 hover:border-info/60 transition-all',
                        dropdown: 'rounded-ui-base border-info/20'
                    }" placeholder="深度重写 UI 样式" />
                </div>
            </DemoBlock>
        </DemoSection>
    </div>
</template>
