<script setup lang="ts">
import {
  datePickerPanelColors,
  datePickerPanelSizes,
  datePickerTypes,
  type DatePickerType,
} from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  value: "2024-04-03" as string | string[],
  type: "date" as DatePickerType,
  color: "primary",
  shape: "square",
  size: "md",
  disabled: false,
  border: true,
  shortcuts: true,
});

/** 多选与范围类型的绑定值是数组，切换类型时需要重置以免类型错位 */
watch(
  () => state.value.type,
  (newType: DatePickerType) => {
    const isMultiple = [
      "dates",
      "months",
      "years",
      "week",
      "daterange",
      "monthrange",
      "yearrange",
      "datetimerange",
    ].includes(newType);

    state.value.value = isMultiple ? [] : "";
  },
);

/** 不同类型对应的取值精度不同，格式需要随之切换 */
const valueFormat = computed(() => {
  const type = state.value.type as DatePickerType;

  if (["year", "years", "yearrange"].includes(type)) return "YYYY";
  if (["month", "months", "monthrange"].includes(type)) return "YYYY-MM";
  if (["datetime", "datetimerange"].includes(type)) return "YYYY-MM-DD HH:mm";

  return "YYYY-MM-DD";
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "面板类型",
    children: [
      {
        label: "选择模式",
        key: "type",
        component: "select" as const,
        defaultValue: "date",
        props: { options: datePickerTypes.map((t) => ({ label: t, value: t })) },
      },
      { label: "显示快捷选项", key: "shortcuts", component: "checkbox" as const, defaultValue: true },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
  {
    title: "视觉样式",
    children: [
      {
        label: "主题颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: datePickerPanelColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: datePickerPanelSizes.map((s) => ({ label: s.toUpperCase(), value: s })) },
      },
      {
        label: "日期格形状",
        key: "shape",
        component: "select" as const,
        defaultValue: "square",
        props: {
          options: [
            { label: "方形 square", value: "square" },
            { label: "圆形 circle", value: "circle" },
          ],
        },
      },
      { label: "面板边框", key: "border", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const panelCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="value"', `type="${s.type}"`];

  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.shape !== "square") props.push(`shape="${s.shape}"`);
  if (!s.border) props.push(':border="false"');
  if (s.disabled) props.push("disabled");
  if (s.shortcuts) props.push(':shortcuts="shortcuts"');
  props.push(`value-format="${valueFormat.value}"`);

  return `<RebornDatePickerPanel\n  ${props.join("\n  ")}\n/>`;
});

/** 快捷选项：value 可以是日期，也可以是返回日期的函数 */
const globalShortcuts = [
  { text: "今天", value: new Date() },
  {
    text: "一周前",
    value: () => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    },
  },
  {
    text: "下个月",
    value: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d;
    },
  },
];

// ─── 全部面板类型 ───────────────────────────────────────────────

const showcases = ref([
  { label: "日期", value: "date", model: "" as string | string[] },
  { label: "多选日期", value: "dates", model: [] as string | string[] },
  { label: "日期范围", value: "daterange", model: [] as string | string[] },
  { label: "日期时间", value: "datetime", model: "" as string | string[] },
  { label: "日期时间范围", value: "datetimerange", model: [] as string | string[] },
  { label: "周", value: "week", model: [] as string | string[] },
  { label: "月份", value: "month", model: "" as string | string[] },
  { label: "多选月份", value: "months", model: [] as string | string[] },
  { label: "月份范围", value: "monthrange", model: [] as string | string[] },
  { label: "年份", value: "year", model: "" as string | string[] },
  { label: "多选年份", value: "years", model: [] as string | string[] },
  { label: "年份范围", value: "yearrange", model: [] as string | string[] },
]);

/** 把绑定值格式化为可读文本 */
function formatDisplay(val: string | string[]) {
  if (Array.isArray(val)) return val.length ? `[${val.join(", ")}]` : "空数组";

  return val || "未选择";
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="panelCode"
      component-name="RebornDatePickerPanel"
      title="交互演练场"
      description="type 决定面板的选择粒度与绑定值形态：单选返回字符串，多选与范围返回数组；value-format 随类型自动切换。"
    >
      <div class="flex w-full flex-col items-center gap-4">
        <RebornDatePickerPanel
          v-model="state.value"
          :type="state.type"
          :color="state.color"
          :shape="state.shape"
          :size="state.size"
          :disabled="state.disabled"
          :border="state.border"
          :shortcuts="state.shortcuts ? globalShortcuts : []"
          :value-format="valueFormat"
        />

        <DemoNote tone="dimmed">
          当前绑定值：<code class="break-all">{{ formatDisplay(state.value) }}</code>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection
      title="全部面板类型"
      description="12 种模式共用同一套视图与配色，颜色、形状与尺寸跟随上方演练场的设置同步变化。"
    >
      <DemoBlock layout="stack">
        <div
          v-for="item in showcases"
          :key="item.value"
          class="flex w-full flex-col gap-3"
        >
          <span class="text-dimmed text-xs font-medium">
            {{ item.label }} · <code>{{ item.value }}</code>
          </span>

          <RebornDatePickerPanel
            v-model="item.model"
            :type="(item.value as DatePickerType)"
            :color="state.color"
            :shape="state.shape"
            :size="state.size"
          />

          <DemoNote tone="dimmed">
            绑定值：<code class="break-all">{{ formatDisplay(item.model) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
