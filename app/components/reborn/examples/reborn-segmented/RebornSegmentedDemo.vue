<script setup lang="ts">
import type { SegmentedOption, SegmentedProps, SegmentedUI, SegmentedValue } from "~/components/reborn/ui/reborn-segmented";
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, ref, shallowRef } from 'vue';
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { segmentedDirections, segmentedSizes } from "~/components/reborn/ui/reborn-segmented/reborn-segmented.config";
import RebornSegmented from "~/components/reborn/ui/reborn-segmented/RebornSegmented.vue";

/** 各尺寸的选项高度（px），用于说明文字 */
const SIZE_PX: Record<string, number> = { sm: 20, md: 28, lg: 36 };

const sizeOptions = segmentedSizes.map(s => ({ label: `${s}（${SIZE_PX[s]}px）`, value: s }));
const directionOptions = segmentedDirections.map(d => ({ label: d === "horizontal" ? "横排 horizontal" : "竖排 vertical", value: d }));

/** 简写选项：字符串自身同时作为文案与值 */
const periods = ["日", "周", "月", "季度", "年"];

/** 带图标的对象选项 */
const viewOptions: SegmentedOption[] = [
  { label: "列表", value: "list", icon: "lucide:list" },
  { label: "看板", value: "board", icon: "lucide:kanban" },
  { label: "日历", value: "calendar", icon: "lucide:calendar" },
];

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态：除 icon 外与组件默认值一致 */
const defaultState: Record<string, any> = {
  size: "md",
  direction: "horizontal",
  block: false,
  disabled: false,
  icon: false,
};

const state = ref<Record<string, any>>({ ...defaultState });
const playgroundValue = shallowRef<SegmentedValue>("周");
/** 演练场最近一次 change 事件的回显 */
const lastChange = shallowRef("尚未切换");

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  playgroundValue.value = "周";
  lastChange.value = "尚未切换";
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      { label: "尺寸", key: "size", component: "select" as const, defaultValue: "md", props: { options: sizeOptions } },
      { label: "排列方向", key: "direction", component: "select" as const, defaultValue: "horizontal", props: { options: directionOptions } },
      { label: "带图标", key: "icon", component: "checkbox" as const, defaultValue: false },
    ],
  },
  {
    title: "状态",
    children: [
      { label: "撑满宽度", key: "block", component: "checkbox" as const, defaultValue: false },
      { label: "禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场选项：开启图标时给每一项配一个图标 */
const PERIOD_ICONS = ["lucide:sun", "lucide:calendar-days", "lucide:calendar", "lucide:calendar-range", "lucide:calendar-check"];
const playgroundOptions = computed(() =>
  state.value.icon ? periods.map((p, i) => ({ label: p, value: p, icon: PERIOD_ICONS[i] })) : periods,
);

/** 演练场右上角展示的等价代码：完整列出当前全部参数 */
const segmentedCode = computed(() => {
  const s = state.value;
  return [
    "<RebornSegmented",
    "  v-model=\"value\"",
    "  :options=\"options\"",
    `  size="${s.size}"`,
    `  direction="${s.direction}"`,
    `  :block="${s.block}"`,
    `  :disabled="${s.disabled}"`,
    "  @change=\"onChange\"",
    "/>",
  ].join("\n");
});

// ─── 场景演示状态 ─────────────────────────────────────────────────

const basicValue = shallowRef<SegmentedValue>("周");
const sizeValue = shallowRef<SegmentedValue>("list");
const iconValue = shallowRef<SegmentedValue>("board");
const disabledValue = shallowRef<SegmentedValue>("周");
const blockValue = shallowRef<SegmentedValue>("周");
const verticalValue = shallowRef<SegmentedValue>("list");
const slotValue = shallowRef<SegmentedValue>("pro");
const mappedValue = shallowRef<SegmentedValue>(2);
const boolValue = shallowRef<SegmentedValue>(true);
const filledValue = shallowRef<SegmentedValue>("board");
/** 定制配色：选中块用主题色，选中项文字转白 */
const primaryFilledUi: SegmentedUI = { slider: 'bg-primary', item: 'data-[checked=true]:text-white' };
const pillValue = shallowRef<SegmentedValue>("周");
/** 胶囊描边：root / slider / item 一起改成全圆角，外框只留描边 */
const pillOutlineUi: SegmentedUI = { root: 'rounded-full border border-gray-3 bg-transparent', slider: 'rounded-full bg-brand-1', item: 'rounded-full data-[checked=true]:text-primary' };
/** 每个星期对应一种语义色，完整工具类保证 Tailwind 能静态识别。 */
const weekdayOptions = [
  { value: "primary", label: "星期一", backgroundClass: "bg-primary", foregroundClass: "data-[checked=true]:text-white data-[checked=true]:hover:text-white" },
  { value: "secondary", label: "星期二", backgroundClass: "bg-secondary", foregroundClass: "data-[checked=true]:text-slate-950 data-[checked=true]:hover:text-slate-950" },
  { value: "success", label: "星期三", backgroundClass: "bg-success", foregroundClass: "data-[checked=true]:text-slate-950 data-[checked=true]:hover:text-slate-950" },
  { value: "info", label: "星期四", backgroundClass: "bg-info", foregroundClass: "data-[checked=true]:text-slate-950 data-[checked=true]:hover:text-slate-950" },
  { value: "warning", label: "星期五", backgroundClass: "bg-warning", foregroundClass: "data-[checked=true]:text-slate-950 data-[checked=true]:hover:text-slate-950" },
  { value: "error", label: "星期六", backgroundClass: "bg-error", foregroundClass: "data-[checked=true]:text-slate-950 data-[checked=true]:hover:text-slate-950" },
  { value: "neutral", label: "星期日", backgroundClass: "bg-neutral", foregroundClass: "data-[checked=true]:text-gray-10 data-[checked=true]:hover:text-gray-10" },
];
/** 绑定语义色值，初始选中星期一。 */
const weekdayValue = shallowRef<SegmentedValue>("primary");
/** 当前星期决定滑块背景和选中文字颜色。 */
const selectedWeekday = computed(() => weekdayOptions.find(option => option.value === weekdayValue.value) ?? weekdayOptions[0]!);
/** 外框保持橙色胶囊，选中项在悬停时仍保留对应的文字颜色。 */
const weekdayUi = computed(() => ({
  root: "rounded-full bg-orange-9",
  slider: `rounded-full ${selectedWeekday.value.backgroundClass}`,
  item: `rounded-full text-gray-1 hover:text-gray-1 ${selectedWeekday.value.foregroundClass}`,
}));

/** 部分选项禁用 */
const partlyDisabled: SegmentedOption[] = [
  { label: "日", value: "日" },
  { label: "周", value: "周" },
  { label: "月", value: "月", disabled: true },
  { label: "年", value: "年" },
];

/** 自定义插槽用的套餐数据 */
const plans: SegmentedOption[] = [
  { value: "free", label: "免费版", price: "¥0" },
  { value: "pro", label: "专业版", price: "¥99" },
  { value: "team", label: "团队版", price: "¥299" },
];
/** 插槽内是名称加价格两行，选项改为随内容撑高 */
const twoLineItemUi: SegmentedUI = { item: 'h-auto py-2' };

/** 字段名不是 value / label 的后端数据 */
const levels = [
  { id: 1, name: "低" },
  { id: 2, name: "中" },
  { id: 3, name: "高" },
  { id: 4, name: "紧急", locked: true },
];
/** 把后端的 id / name / locked 依次当作 value / label / disabled */
const levelFieldNames: SegmentedProps['fieldNames'] = { value: 'id', label: 'name', disabled: 'locked' };

/** 布尔取值：value 直接用 true / false */
const switchOptions: SegmentedOption[] = [{ label: '开启', value: true }, { label: '关闭', value: false }];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="segmentedCode" component-name="RebornSegmented"
      title="交互演练场" description="调节上方参数，点击选项或用方向键切换，查看选中块的滑动与各尺寸的比例。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-4">
        <RebornSegmented
          v-model="playgroundValue" :options="playgroundOptions" :size="state.size" :direction="state.direction"
          :block="state.block" :disabled="state.disabled" aria-label="统计周期"
          @change="(value) => (lastChange = `change：${value}`)"
        />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          {{ lastChange }}；v-model：{{ playgroundValue }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        <code>options</code> 传字符串数组时，每一项同时作为文案与值；<code>v-model</code> 绑定选中值，切换后派发 <code>change</code>。
      </template>
      <DemoBlock layout="stack">
        <RebornSegmented v-model="basicValue" :options="periods" aria-label="统计周期" />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          v-model：{{ basicValue }}
        </DemoNote>
      </DemoBlock>
      <DemoNote tone="dimmed">
        选项是隐藏的原生 radio：Tab 聚焦到选中项后，方向键在同组内移动并选中，禁用项会被跳过。
      </DemoNote>
    </DemoSection>

    <DemoSection title="尺寸">
      <template #description>
        <code>size</code> 三档，选项高度 20 / 28 / 36px；容器内边距与圆角跟着收放，选中块的圆角始终与容器边缘同心。
      </template>
      <DemoBlock layout="stack" class="gap-4">
        <div v-for="size in segmentedSizes" :key="size" class="flex items-center gap-4">
          <span class="w-28 shrink-0 font-mono text-xs text-gray-6">size="{{ size }}"</span>
          <RebornSegmented v-model="sizeValue" :options="viewOptions" :size="size" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="图标">
      <template #description>
        对象选项的 <code>icon</code> 字段接受 Iconify 图标名，显示在文字前面，间隔 4px；图标随字号缩放。
      </template>
      <DemoBlock layout="stack">
        <RebornSegmented v-model="iconValue" :options="viewOptions" size="lg" aria-label="视图" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="禁用">
      <template #description>
        <code>disabled</code> 禁用整组；单个选项用对象里的 <code>disabled</code> 字段禁用，点击无效、键盘导航跳过它。
      </template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornSegmented v-model="disabledValue" :options="partlyDisabled" />
        <RebornSegmented v-model="disabledValue" :options="partlyDisabled" disabled />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="撑满宽度">
      <template #description>
        <code>block</code> 让组件撑满父元素宽度，各选项等分；文案过长时截断。
      </template>
      <DemoBlock layout="stack">
        <RebornSegmented v-model="blockValue" :options="periods" block />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="竖向排列">
      <template #description>
        <code>direction="vertical"</code> 竖排，选中块沿纵向滑动；宽度取最宽的选项，配合 <code>block</code> 撑满容器宽度。
      </template>
      <DemoBlock layout="row" align="start" class="gap-8">
        <RebornSegmented v-model="verticalValue" :options="viewOptions" direction="vertical" />
        <div class="w-48">
          <RebornSegmented v-model="verticalValue" :options="viewOptions" direction="vertical" block size="lg" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义选项">
      <template #description>
        默认插槽替换每一项的内容，作用域里有 <code>item</code>（原始选项数据）、<code>checked</code>、<code>disabled</code>；插槽内容同样垫在选中块上面。
      </template>
      <DemoBlock layout="stack">
        <RebornSegmented v-model="slotValue" :options="plans" size="lg" :ui="twoLineItemUi">
          <template #default="{ item, checked }">
            <span class="flex flex-col items-center leading-tight">
              <span>{{ typeof item === 'object' ? item.label : item }}</span>
              <span class="text-sm" :class="checked ? 'text-primary' : 'text-gray-5'">{{ typeof item === 'object' ? item.price : '' }}</span>
            </span>
          </template>
        </RebornSegmented>
      </DemoBlock>
      <DemoNote tone="dimmed">
        两行内容超过了 36px，这里用 ui.item 把选项高度改成 h-auto；选中块按选项实际尺寸落位，不需要另外调整。
      </DemoNote>
    </DemoSection>

    <DemoSection title="字段映射与值类型">
      <template #description>
        后端字段不叫 <code>value</code> / <code>label</code> / <code>disabled</code> 时用 <code>field-names</code> 映射；值可以是字符串、数字或布尔，按全等比较。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <div class="flex flex-col items-start gap-2">
          <RebornSegmented
            v-model="mappedValue" :options="levels" :field-names="levelFieldNames"
          />
          <span class="font-mono text-xs text-gray-6">v-model：{{ mappedValue }}（{{ typeof mappedValue }}）</span>
        </div>
        <div class="flex flex-col items-start gap-2">
          <RebornSegmented
            v-model="boolValue" :options="switchOptions"
          />
          <span class="font-mono text-xs text-gray-6">v-model：{{ boolValue }}（{{ typeof boolValue }}）</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="定制配色">
      <template #description>
        <code>ui</code> 按结构键追加类名：<code>slider</code> 改选中块，<code>item</code> 改选项；只改选中项时用 <code>data-[checked=true]:</code> 前缀，禁用项用 <code>data-[disabled=true]:</code>。
      </template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex flex-col items-start gap-2">
          <RebornSegmented
            v-model="filledValue" :options="viewOptions"
            :ui="primaryFilledUi"
          />
          <span class="font-mono text-xs text-gray-6">:ui="{ slider: 'bg-primary', item: 'data-[checked=true]:text-white' }"</span>
        </div>
        <div class="flex flex-col items-start gap-2">
          <RebornSegmented
            v-model="pillValue" :options="periods"
            :ui="pillOutlineUi"
          />
          <span class="font-mono text-xs text-gray-6">胶囊描边：root / slider / item 一起改圆角</span>
        </div>
        <div class="flex w-full min-w-0 flex-col gap-2">
          <div class="overflow-x-auto pb-1">
            <RebornSegmented
              v-model="weekdayValue" :options="weekdayOptions" :ui="weekdayUi"
              class="min-w-max" aria-label="星期与语义色选择"
            />
          </div>
          <DemoNote tone="dimmed" class="font-mono text-xs">
            外框：rounded-full bg-orange-9；当前：{{ selectedWeekday.label }} → {{ selectedWeekday.value }}；选中背景：{{ selectedWeekday.backgroundClass }}
          </DemoNote>
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        选中块的位置与尺寸写在行内样式里，ui.slider 里改 left / width 不会生效；颜色、圆角、阴影都可以改。
      </DemoNote>
    </DemoSection>
  </div>
</template>
