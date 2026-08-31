<script setup lang="ts">
import {
  inputNumberAligns,
  inputNumberColors,
  inputNumberShapes,
  inputNumberSizes,
  inputNumberVariants,
} from "~/components/reborn/ui/reborn-input-number/reborn-input-number.config";
import RebornInputNumber from "~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  value: 10,
  size: "md",
  color: "primary",
  variant: "outlined",
  shape: "square",
  align: "center",
  min: 0,
  max: 100,
  step: 1,
  stepStrictly: false,
  controlsPosition: "",
  modelEvent: "change",
  keyboard: true,
  changeOnWheel: false,
  hideButton: false,
  disabled: false,
  readonly: false,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 最近一次 change 事件的参数，回调形如 (新值, 旧值) */
const lastChange = ref<{ value: number | null; oldValue: number | null } | null>(null);

function handleChange(value: number | null, oldValue: number | null) {
  lastChange.value = { value, oldValue };
}

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  lastChange.value = null;
}

/** 演练场控制面板配置 */
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
          options: inputNumberSizes.map((s) => ({ label: s.toUpperCase(), value: s })),
        },
      },
      {
        label: "配色方案",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          options: inputNumberColors.map((c) => ({ label: c, value: c })),
        },
      },
      {
        label: "形态变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "outlined",
        props: {
          options: inputNumberVariants.map((v) => ({ label: v, value: v })),
        },
      },
      {
        label: "形状轮廓",
        key: "shape",
        component: "select" as const,
        defaultValue: "square",
        props: {
          options: inputNumberShapes.map((s) => ({ label: s, value: s })),
        },
      },
      {
        label: "文本对齐",
        key: "align",
        component: "select" as const,
        defaultValue: "center",
        props: {
          options: inputNumberAligns.map((a) => ({ label: a, value: a })),
        },
      },
    ],
  },
  {
    title: "数值控制",
    children: [
      { label: "最小值", key: "min", component: "input-number" as const, defaultValue: 0, props: { align: "left", hideButton: true } },
      { label: "最大值", key: "max", component: "input-number" as const, defaultValue: 100, props: { align: "left", hideButton: true } },
      { label: "步长", key: "step", component: "input-number" as const, defaultValue: 1, props: { align: "left", hideButton: true } },
      { label: "仅允许步进倍数（stepStrictly）", key: "stepStrictly", component: "checkbox" as const, defaultValue: false },
      {
        label: "更新时机（modelEvent）",
        key: "modelEvent",
        component: "select" as const,
        defaultValue: "change",
        props: {
          options: [
            { label: "change（失焦 / 回车）", value: "change" },
            { label: "input（键入即时）", value: "input" },
          ],
        },
      },
      { label: "键盘增减（keyboard）", key: "keyboard", component: "checkbox" as const, defaultValue: true },
      {
        label: "滚轮增减（changeOnWheel）",
        key: "changeOnWheel",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
  {
    title: "按钮与状态",
    children: [
      {
        label: "按钮位置",
        key: "controlsPosition",
        component: "select" as const,
        defaultValue: "",
        // 空串表示未传该参数（保持左右分列），不写入传参明细
        codeSkipEmpty: true,
        props: {
          options: [
            { label: "左右分列（默认）", value: "" },
            { label: "左侧堆叠（left，悬停显示）", value: "left" },
            { label: "右侧堆叠（right，悬停显示）", value: "right" },
          ],
        },
      },
      { label: "隐藏按钮（hideButton）", key: "hideButton", component: "checkbox" as const, defaultValue: false },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
      { label: "只读（readonly）", key: "readonly", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 传参明细由 Playground 按 controls 自动生成；这里只补 controls 之外的事件监听 */
const codeExtras = ['@change="handleChange"'];

// ─── 场景演示状态 ───────────────────────────────────────────────

// 各 section 独立持有绑定值，避免调整一处示例牵连其他示例
const shapeValue = ref(5);
const variantValue = ref(12);
const layoutValue = ref(5);
const customValue = ref(8);
const themedValue = ref(8);

// 禁用与只读
const lockedValue = ref(42);

// 精度：step 为 0.1 时即便 precision 传 0，也会按 step 的小数位保留 1 位
const precisionValue = ref(1.5);
const stepPrecisionValue = ref(1);

// 前后缀
const priceValue = ref(199);
const weightValue = ref(2.5);

// 更新时机对比
const changeModeValue = ref(50);
const inputModeValue = ref(50);

// 步进倍数
const strictlyValue = ref(10);

// 键盘与滚轮
const keyboardOnValue = ref(30);
const keyboardOffValue = ref(30);
const wheelValue = ref(30);

// 格式化与解析：formatter 只影响展示文本，parser 在提交前把文本还原为数值
const formattedValue = ref(1234567);
const percentValue = ref(60);

/** 千分位格式化，如 1234567 → 1,234,567 */
function formatThousands(v: number | string) {
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 去掉千分位逗号，还原为可解析的数值文本 */
function parseThousands(text: string) {
  return text.replace(/,/g, "");
}

/** 百分比展示，如 60 → 60% */
function formatPercent(v: number | string) {
  return `${v}%`;
}

/** 去掉百分号，还原为可解析的数值文本 */
function parsePercent(text: string) {
  return text.replace(/%/g, "");
}

// focus(cursor) 演示
const cursorValue = ref(1234);
const cursorInputRef = ref<InstanceType<typeof RebornInputNumber> | null>(null);

/** 调用组件暴露的 focus()，按 cursor 决定焦点落位 */
function focusWithCursor(cursor: "start" | "end" | "all") {
  cursorInputRef.value?.focus({ cursor });
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code-extras="codeExtras"
      component-name="RebornInputNumber"
      title="交互演练场"
      description="调节尺寸、配色、数值边界与更新时机，实时预览步进器的增减行为。"
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
        <RebornInputNumber
          v-model="state.value"
          class="max-w-sm"
          :size="state.size"
          :color="state.color"
          :variant="state.variant"
          :shape="state.shape"
          :align="state.align"
          :min="state.min"
          :max="state.max"
          :step="state.step"
          :step-strictly="state.stepStrictly"
          :model-event="state.modelEvent"
          :keyboard="state.keyboard"
          :change-on-wheel="state.changeOnWheel"
          :controls-position="state.controlsPosition || undefined"
          :hide-button="state.hideButton"
          :disabled="state.disabled"
          :readonly="state.readonly"
          @change="handleChange"
        />

        <DemoNote tone="dimmed">
          绑定值：<code>{{ state.value ?? "null" }}</code>
          <template v-if="lastChange">
            · 最近 <code>change</code>：<code>{{ lastChange.oldValue ?? "null" }}</code> →
            <code>{{ lastChange.value ?? "null" }}</code>
          </template>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="外形 shape">
      <template #description>
        <code>shape</code> 控制外框圆角：circle 胶囊 / square 方角。
        注意 <code>variant="underlined"</code> 会强制压平圆角，此时 shape 不再生效。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem v-for="s in inputNumberShapes" :key="s" :label="s" mono>
          <RebornInputNumber v-model="shapeValue" :shape="s" color="secondary" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="形态 variant">
      <template #description>
        <code>variant</code> 提供 outlined / filled / borderless / underlined 四种形态。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem v-for="v in inputNumberVariants" :key="v" :label="v" mono>
          <!-- borderless 无边框形态搭配左侧堆叠按钮，悬停时体验滑入效果 -->
          <RebornInputNumber
            v-model="variantValue" :variant="v" shape="square" color="primary"
            :controls-position="v === 'borderless' ? 'left' : undefined"
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="禁用与只读">
      <template #description>
        <code>disabled</code> 整体灰显且不可交互；<code>readonly</code> 可聚焦、可选中复制文本，但键入与按钮增减均被拦截。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="disabled" mono>
          <RebornInputNumber v-model="lockedValue" disabled />
        </DemoItem>

        <DemoItem label="readonly" mono>
          <RebornInputNumber v-model="lockedValue" readonly />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="数值精度">
      <template #description>
        <code>precision</code> 指定保留的小数位数。当 precision 小于 step 的小数位时，精度取 step 的小数位，否则步进结果会被截断。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="precision = 2，step = 1" mono :note="`当前值：${precisionValue}`">
          <RebornInputNumber v-model="precisionValue" :precision="2" :step="1" />
        </DemoItem>

        <DemoItem
          label="precision = 0，step = 0.1 → 实际精度 1 位" mono
          :note="`当前值：${stepPrecisionValue}`"
        >
          <RebornInputNumber v-model="stepPrecisionValue" :precision="0" :step="0.1" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="前缀与后缀">
      <template #description>
        <code>#prefix</code> 与 <code>#suffix</code> 插槽在输入框内部添加固定内容，不参与数值解析。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="货币前缀">
          <RebornInputNumber v-model="priceValue" :min="0" :step="10" align="right">
            <template #prefix>
              <span class="text-sm">￥</span>
            </template>
          </RebornInputNumber>
        </DemoItem>

        <DemoItem label="单位后缀">
          <RebornInputNumber v-model="weightValue" :min="0" :step="0.5" :precision="1" align="right">
            <template #suffix>
              <span class="text-sm">kg</span>
            </template>
          </RebornInputNumber>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="格式化与解析">
      <template #description>
        <code>formatter</code> 决定输入框展示的文本，<code>parser</code> 负责在提交前把文本还原为数值，两者必须配对使用；
        按钮步进与键入提交都会经过这对转换。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="千分位分隔" :note="`绑定值：${formattedValue}`">
          <RebornInputNumber
            v-model="formattedValue" :min="0" :step="1000" align="right" :formatter="formatThousands"
            :parser="parseThousands"
          />
        </DemoItem>

        <DemoItem label="百分比展示" :note="`绑定值：${percentValue}`">
          <RebornInputNumber
            v-model="percentValue" :min="0" :max="100" :step="5" :formatter="formatPercent"
            :parser="parsePercent"
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义增减图标">
      <template #description>
        <code>#plus</code> 与 <code>#minus</code> 插槽替换增减按钮内的图标，作用域参数 <code>iconClass</code>
        是当前尺寸对应的图标类名。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="爱心图标">
          <RebornInputNumber v-model="customValue" color="error">
            <template #minus="{ iconClass }">
              <Icon name="lucide:heart-minus" :class="iconClass" />
            </template>
            <template #plus="{ iconClass }">
              <Icon name="lucide:heart-plus" :class="iconClass" />
            </template>
          </RebornInputNumber>
        </DemoItem>

        <DemoItem label="左右箭头">
          <RebornInputNumber v-model="customValue" shape="square" color="info">
            <template #minus="{ iconClass }">
              <Icon name="lucide:arrow-left" :class="iconClass" />
            </template>
            <template #plus="{ iconClass }">
              <Icon name="lucide:arrow-right" :class="iconClass" />
            </template>
          </RebornInputNumber>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="绑定值更新时机">
      <template #description>
        默认在失焦或按下 Enter 时更新绑定值；<code>model-event="input"</code> 改为键入时即时更新，
        此时允许临时超出 min / max，失焦时自动修正。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="change（默认，失焦 / 回车提交）" mono :note="`绑定值：${changeModeValue}`">
          <RebornInputNumber v-model="changeModeValue" :min="0" :max="100" />
        </DemoItem>

        <DemoItem label="input（键入即时，失焦修正）" mono :note="`绑定值：${inputModeValue}`">
          <RebornInputNumber v-model="inputModeValue" model-event="input" :min="0" :max="100" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="步进倍数与按钮布局">
      <template #description>
        <code>step-strictly</code> 只允许步进的倍数，键入非倍数值会在提交时就近吸附；
        <code>controls-position</code> 支持 left / right 上下堆叠，堆叠时按钮默认隐藏，悬停或聚焦时从所在侧滑入；
        <code>hide-button</code> 隐藏按钮只保留数字输入。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="step-strictly，step = 5（试着输入 13）" mono :note="`绑定值：${strictlyValue}`">
          <RebornInputNumber v-model="strictlyValue" :step="5" step-strictly :min="0" :max="100" />
        </DemoItem>

        <DemoItem label="hide-button（纯数字输入）" mono>
          <RebornInputNumber v-model="layoutValue" shape="square" hide-button align="left" />
        </DemoItem>

        <DemoItem label="controls-position=&quot;left&quot;（悬停显示）" mono>
          <RebornInputNumber v-model="layoutValue" shape="square" controls-position="left" align="left" />
        </DemoItem>

        <DemoItem label="controls-position=&quot;right&quot;（悬停显示）" mono>
          <RebornInputNumber v-model="layoutValue" shape="square" controls-position="right" align="left" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="键盘与滚轮">
      <template #description>
        <code>keyboard</code> 默认开启，聚焦后按 ↑ / ↓ 即按 step 步进；设为 false 后方向键回归原生文本框行为。
        <code>change-on-wheel</code> 开启鼠标滚轮增减，仅在输入框已聚焦时接管滚动，未聚焦时不影响页面滚动。
      </template>
      <DemoBlock layout="grid" align="start">
        <DemoItem label="keyboard 默认开启（聚焦后按 ↑ / ↓）" mono :note="`绑定值：${keyboardOnValue}`">
          <RebornInputNumber v-model="keyboardOnValue" shape="square" :min="0" :max="100" />
        </DemoItem>

        <DemoItem label=":keyboard=&quot;false&quot;（方向键不再步进）" mono :note="`绑定值：${keyboardOffValue}`">
          <RebornInputNumber v-model="keyboardOffValue" shape="square" :keyboard="false" :min="0" :max="100" />
        </DemoItem>

        <DemoItem label="change-on-wheel（先聚焦，再滚滚轮）" mono :note="`绑定值：${wheelValue}`">
          <RebornInputNumber v-model="wheelValue" shape="square" change-on-wheel :min="0" :max="100" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="程序化聚焦（focus cursor）">
      <template #description>
        组件通过 <code>defineExpose</code> 暴露 <code>focus()</code>，可传 cursor 决定焦点落位：start 光标置于文本首，
        end 置于文本尾，all 全选文本。两种调用形式等价：<code>focus('all')</code> 与
        <code>focus({ cursor: 'all' })</code>。
      </template>
      <DemoBlock layout="stack" align="start">
        <RebornInputNumber
          ref="cursorInputRef" v-model="cursorValue" shape="square" align="left" hide-button
          class="max-w-xs"
        />
        <div class="flex flex-wrap gap-3">
          <RebornButton variant="outline" size="sm" label="cursor: start" @click="focusWithCursor('start')" />
          <RebornButton variant="outline" size="sm" label="cursor: end" @click="focusWithCursor('end')" />
          <RebornButton variant="outline" size="sm" label="cursor: all" @click="focusWithCursor('all')" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="进阶自定义（ui）">
      <template #description>
        <code>ui</code> 可逐槽覆盖 wrapper / input / button / divider / prefix / suffix 的类名。
      </template>
      <DemoBlock layout="grid" align="start">
        <DemoItem label="甜美主题">
          <RebornInputNumber
            v-model="themedValue" :ui="{
              wrapper: 'bg-default ring-rose-200 focus-within:ring-rose-400 rounded-ui-md h-14 border-0',
              button: 'text-rose-400 hover:bg-rose-50 active:scale-95 transition-all',
              input: 'text-rose-600 font-black',
            }"
          >
            <template #minus="{ iconClass }">
              <Icon name="lucide:heart-minus" :class="iconClass" />
            </template>
            <template #plus="{ iconClass }">
              <Icon name="lucide:heart-plus" :class="iconClass" />
            </template>
          </RebornInputNumber>
        </DemoItem>

        <DemoItem label="科技霓虹 · 直角 + 等宽字体">
          <!-- 灰阶在明暗之间对偶翻转，恒深底必须写成 bg-gray-10 dark:bg-gray-1，否则暗色模式下会翻成浅底白字 -->
          <RebornInputNumber
            v-model="themedValue" :ui="{
              wrapper:
                'bg-gray-10 dark:bg-gray-1 ring-indigo-500/50 focus-within:ring-indigo-400 rounded-none h-12 border-0',
              input: 'text-white font-mono leading-none',
              button: 'text-indigo-400 hover:bg-indigo-500/20 transition-all',
              divider: 'bg-indigo-500/20',
            }"
          >
            <template #plus>
              <Icon name="lucide:arrow-right" class="size-4" />
            </template>
            <template #minus>
              <Icon name="lucide:arrow-left" class="size-4" />
            </template>
          </RebornInputNumber>
        </DemoItem>

        <DemoItem label="极简无界 · 仅保留下划线">
          <RebornInputNumber
            v-model="themedValue" class="font-bold" :ui="{
              wrapper:
                'bg-transparent ring-0 focus-within:ring-0 border-b-2 border-default rounded-none h-12 transition-all focus-within:border-inverted',
              button: 'text-dimmed hover:text-highlighted',
              input: 'font-black text-highlighted',
              divider: 'hidden',
            }"
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
