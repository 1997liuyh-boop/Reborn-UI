<script setup lang="ts">
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { sliderColors, sliderSizes } from "~/components/reborn/ui/reborn-slider/reborn-slider.config";
import RebornSlider from "~/components/reborn/ui/reborn-slider/RebornSlider.vue";

const colorOptions = sliderColors.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }));
const sizeOptions = sliderSizes.map(s => ({ label: s.toUpperCase(), value: s as typeof sliderSizes[number] }));

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  size: "md",
  color: "primary",
  step: 1,
  reverse: false,
  disabled: false,
  showValue: true,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 演练场滑块绑定值 */
const playValue = ref(40);

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  playValue.value = 40;
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      { label: "尺寸规格", key: "size", component: "select" as const, defaultValue: "md", props: { options: sizeOptions } },
      { label: "配色方案", key: "color", component: "select" as const, defaultValue: "primary", props: { options: colorOptions } },
      { label: "步长", key: "step", component: "input-number" as const, defaultValue: 1, props: { min: 1, max: 25 } },
    ],
  },
  {
    title: "状态",
    children: [
      { label: "反向", key: "reverse", component: "checkbox" as const, defaultValue: false },
      { label: "禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
      { label: "显示数值", key: "showValue", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 演练场右上角展示的传参明细：完整列出当前所有参数（含默认值） */
const sliderCode = computed(() => {
  const s = state.value;
  const props: string[] = [
    `v-model="value"`,
    `size="${s.size}"`,
    `color="${s.color}"`,
    `:step="${s.step}"`,
    `:reverse="${s.reverse}"`,
    `:disabled="${s.disabled}"`,
    `:show-value="${s.showValue}"`,
  ];
  return `<RebornSlider\n  ${props.join("\n  ")}\n/>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 步长演示 */
const stepValue = ref(40);
/** 间断点演示 */
const stopsValue = ref(30);
const stopsRange = ref([20, 70]);
/** 范围选择演示 */
const rangeValues = ref([20, 80]);
/** 两侧图标演示：属性形式 */
const iconValue = ref(50);
/** 两侧图标演示：插槽形式的音量与亮度 */
const volumeValue = ref(30);
const brightnessValue = ref(70);
/** 自定义提示演示 */
const percentValue = ref(35);
const tempValue = ref(26);
/** Tooltip 显隐控制演示 */
const tipDefaultValue = ref(30);
const tipOpenValue = ref(60);
const tipHiddenValue = ref(80);
/** 事件演示 */
const eventValue = ref(50);
/** change 触发次数（拖拽过程实时累加） */
const changeCount = ref(0);
/** 最近一次 change 载荷 */
const lastChange = ref("—");
/** 最近一次 changeComplete 载荷 */
const lastComplete = ref("—");
/** 垂直模式演示 */
const verticalValue = ref(30);
const verticalRange = ref([20, 60]);
/** 刻度标记演示：50°C 单独给了红色样式 */
const sliderMarks = {
  0: { style: { color: "#FF3D53" }, label: "0 分" },
  8: "8 分",
  37: "37 分",
  50: { style: { color: "#2ec7ff" }, label: "50 分" },
  100: { style: { color: "#81e22c" }, label: "100 分" },
};
/** 常规步长 + 刻度展示 */
const marksFreeValue = ref(30);
/** step="mark"：取值只能落在刻度上 */
const markSnapValue = ref(37);
/** 范围整体拖拽演示 */
const dragRange = ref([30, 60]);
/** 禁用指定滑块演示：下标 0（值较小的一端）被禁用 */
const partialDisabledRange = ref([30, 70]);
/** 可编辑节点演示：节点数量随增删变化 */
const editableNodes = ref([20, 50, 80]);
/** 自定义渲染演示 */
const thumbValue = ref(40);

/** 温度格式化：给数值补上单位 */
function formatTemp(value: number) {
  return `${value}°C`;
}

/** 百分比格式化 */
function formatPercent(value: number) {
  return `${value}%`;
}

/** change：值每次变化实时触发 */
function onSliderChange(value: number | number[]) {
  changeCount.value++;
  lastChange.value = JSON.stringify(value);
}

/** changeComplete：松开指针或按键时触发一次 */
function onSliderComplete(value: number | number[]) {
  lastComplete.value = JSON.stringify(value);
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="sliderCode" component-name="RebornSlider" title="交互演练场"
      description="调节左侧参数，实时查看滑块表现；方向键 ←/→（↑/↓）可在聚焦滑块后步进取值。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-6">
        <RebornSlider
          v-model="playValue" class="w-full max-w-sm" :size="state.size" :color="state.color"
          :step="state.step" :reverse="state.reverse" :disabled="state.disabled" :show-value="state.showValue"
        />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          value: {{ playValue }} · Props: { size: '{{ state.size }}', color: '{{ state.color }}', step:
          {{ state.step }}, reverse: {{ state.reverse }} }
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        <code>v-model</code> 绑定当前值，<code>min</code> / <code>max</code> 限定区间；<code>step=10</code> 时拖动与方向键步进都按 10 对齐，<code>show-value</code> 在末尾显示当前值。
      </template>
      <DemoBlock layout="stack">
        <RebornSlider v-model="stepValue" class="w-full max-w-sm" :step="10" show-value />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="语义色：color">
      <template #description>
        <code>color</code> 决定进度条与滑块外圆的颜色，间断点与刻度点边框取同色板的浅色阶。
      </template>
      <DemoBlock layout="stack">
        <RebornSlider v-for="c in sliderColors" :key="c" class="w-full max-w-sm" :model-value="50" :color="c" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="间断点：show-stops">
      <template #description>
        设置 <code>show-stops</code> 后按步长在轨道上显示间断点（仅数字步长生效）。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <RebornSlider v-model="stopsValue" class="w-full max-w-sm" :step="10" show-stops show-value />
        <RebornSlider
          v-model:values="stopsRange" class="w-full max-w-sm" range :step="10" show-stops
          color="success" show-value
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="范围选择：range 与 v-model:values">
      <template #description>
        <code>v-model:values</code> 绑定数组并开启 <code>range</code> 即为区间滑块；默认最右侧滑块为激活态（大一号），点击可切换激活对象。
      </template>
      <DemoBlock layout="stack">
        <RebornSlider v-model:values="rangeValues" class="w-full max-w-sm" range show-value />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="刻度标记：marks 与 step 吸附">
      <template #description>
        <code>marks</code> 的 key 必须是 <code>[min, max]</code> 内的数字，对象形式可为单个标记设置
        <code>style</code>；设置 <code>step="mark"</code> 后取值只能落在刻度上；点击刻度文字可直接跳转。
      </template>
      <DemoBlock layout="stack" class="gap-10">
        <RebornSlider v-model="marksFreeValue" class="w-full max-w-sm" :marks="sliderMarks" show-value />
        <RebornSlider
          v-model="markSnapValue" class="w-full max-w-sm" step="mark" :marks="sliderMarks" color="error"
          show-value :max="60"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="气泡格式化：tooltip.formatter">
      <template #description>
        <code>tooltip.formatter</code> 接收当前值并返回展示内容，拖拽时在气泡里生效。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <RebornSlider v-model="percentValue" class="w-full max-w-sm" :tooltip="{ formatter: formatPercent }" />
        <RebornSlider
          v-model="tempValue" class="w-full max-w-sm" color="error" :min="16" :max="32"
          :tooltip="{ formatter: formatTemp }"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="气泡显隐：tooltip.open">
      <template #description>
        缺省仅拖拽时显示气泡；<code>tooltip.open=true</code> 常显、<code>false</code> 强制隐藏（<code>formatter: null</code>
        效果等同隐藏）。
      </template>
      <DemoBlock layout="stack" class="gap-8 pt-8">
        <RebornSlider v-model="tipDefaultValue" class="w-full max-w-sm" />
        <RebornSlider v-model="tipOpenValue" class="w-full max-w-sm" :tooltip="{ open: true }" />
        <RebornSlider v-model="tipHiddenValue" class="w-full max-w-sm" :tooltip="{ open: false }" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="两侧图标：prefix-icon 与 prefix / suffix 插槽">
      <template #description>
        <code>prefix-icon</code> / <code>suffix-icon</code> 传图标名放在滑轨两端；<code>#prefix</code> / <code>#suffix</code>
        插槽可完全接管两端内容，此时同名属性不再渲染。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <RebornSlider
          v-model="iconValue" class="w-full max-w-sm" prefix-icon="lucide:volume" suffix-icon="lucide:volume-2"
        />
        <RebornSlider v-model="volumeValue" class="w-full max-w-sm" color="warning">
          <template #prefix>
            <Icon
              name="lucide:volume-x" class="shrink-0 mr-2 text-gray-6"
              :class="{ 'text-red-6': volumeValue === 0 }"
            />
          </template>
          <template #suffix>
            <Icon
              name="lucide:volume-2" class="shrink-0 ml-2 text-gray-6"
              :class="{ 'text-red-6': volumeValue > 50 }"
            />
          </template>
        </RebornSlider>
        <RebornSlider v-model="brightnessValue" class="w-full max-w-sm" color="warning">
          <template #prefix>
            <Icon name="lucide:sun-dim" class="mr-2 shrink-0 text-gray-6" />
          </template>
          <template #suffix>
            <div class="ml-2 shrink-0 text-sm text-gray-6 w-9 text-right">{{ brightnessValue }}%</div>
          </template>
        </RebornSlider>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="垂直与反向：vertical、height 与 reverse">
      <template #description>
        <code>vertical</code> 开启垂直方向，滑轨长度由 <code>height</code> 给出；正向从下往上递增，<code>reverse</code> 后从上往下。
      </template>
      <DemoBlock layout="stack">
        <div class="flex items-start gap-12">
          <RebornSlider v-model="verticalValue" vertical height="200px" />
          <RebornSlider v-model:values="verticalRange" vertical height="200px" range color="success" />
          <RebornSlider v-model="verticalValue" vertical height="200px" reverse color="info" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="选区整体拖拽：draggable-track">
      <template #description>
        <code>draggable-track</code> 后按住两滑块之间的选区拖动，整段区间平移且间距保持不变。
      </template>
      <DemoBlock layout="stack">
        <RebornSlider v-model:values="dragRange" class="w-full max-w-sm" range draggable-track show-value />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="可编辑节点：editable">
      <template #description>
        <code>range</code> 配合 <code>editable</code> 后节点数量可变：点按轨道空白处添加节点，拖动节点垂直离开滑轨超过 40px 后松手删除；聚焦节点后按 Delete / Backspace 也可删除，至少保留一个。
      </template>
      <DemoBlock layout="stack">
        <RebornSlider v-model:values="editableNodes" class="w-full max-w-sm" range editable />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          values: {{ editableNodes }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="禁用指定滑块：disabled 数组">
      <template #description>
        <code>disabled</code> 传数组可按下标（排序后位置）单独禁用滑块：本例左端被禁用，不可拖动且作为边界——拖动右端滑块无法越过它。
      </template>
      <DemoBlock layout="stack">
        <RebornSlider
          v-model:values="partialDisabledRange" class="w-full max-w-sm" range :disabled="[true, false]"
          show-value
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="事件时序：change 与 changeComplete">
      <template #description>
        值每次变化实时触发 <code>change</code>；松开指针或松开按键时触发一次 <code>changeComplete</code>，适合在此时提交数据。
      </template>
      <DemoBlock layout="stack">
        <RebornSlider
          v-model="eventValue" class="w-full max-w-sm" @change="onSliderChange"
          @change-complete="onSliderComplete"
        />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          change × {{ changeCount }} · 最近 change: {{ lastChange }} · changeComplete: {{ lastComplete }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义渲染：thumb 与 value 插槽">
      <template #description>
        <code>thumb</code> 插槽替换单值模式的滑块本体，作用域 <code>value.style</code> 是已折算两端内边距的定位样式，自定义节点需自带 translate 居中；<code>value</code> 插槽替换末尾数值显示。
      </template>
      <DemoBlock layout="stack">
        <RebornSlider v-model="thumbValue" class="w-full max-w-sm">
          <template #thumb="{ value }">
            <div
              :style="{ ...value.style, width: '30px', height: '20px' }"
              class="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warning text-center text-xs leading-[20px] text-white"
            >
              {{ value.value }}
            </div>
          </template>
          <template #value="{ value }">
            <span class="text-primary ml-2 w-10 shrink-0 text-sm">{{ value }}%</span>
          </template>
        </RebornSlider>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
