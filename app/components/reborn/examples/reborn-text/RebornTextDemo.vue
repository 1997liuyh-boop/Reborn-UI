<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { textColors } from "~/components/reborn/ui/reborn-text/reborn-text.config";

/** 文本类型：组件源码里 type 是字符串，取值以其 switch 分支为准 */
const typeOptions = [
  { label: "default（原样输出）", value: "default" },
  { label: "phone（手机号）", value: "phone" },
  { label: "name（姓名）", value: "name" },
  { label: "amount（金额）", value: "amount" },
  { label: "card（银行卡）", value: "card" },
  { label: "email（邮箱）", value: "email" },
];
/** 各类型的示例值，切换类型时一并替换 */
const SAMPLE_VALUES: Record<string, string> = {
  default: "Reborn UI 文本组件：格式化、脱敏与多行省略，超出容器宽度时按设定位置截断",
  phone: "13812345678",
  name: "张三丰",
  amount: "12345.6",
  card: "6222021234567890",
  email: "hello@example.com",
};
const currencyPositionOptions = [
  { label: "before（数字前）", value: "before" },
  { label: "after（数字后）", value: "after" },
];
const ellipsisPositionOptions = [
  { label: "end（保留开头）", value: "end" },
  { label: "start（保留结尾）", value: "start" },
  { label: "middle（保留首尾）", value: "middle" },
];

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态；color 同时作用于下方的格式化与省略示例 */
const defaultState: Record<string, any> = {
  color: "primary",
  size: 0,
  type: "default",
  value: SAMPLE_VALUES.default,
  mask: false,
  maskChar: "*",
  maskStart: 3,
  maskEnd: 4,
  currency: "",
  currencyPosition: "before",
  precision: 2,
  thousandsIcon: "",
  ellipsis: false,
  lines: 1,
  ellipsisPosition: "end",
  tooltip: false,
};

const state = shallowRef<Record<string, any>>({ ...defaultState });

/** 切换类型时把示例值换成该类型的样例，避免手机号规则套在姓名上 */
const playgroundState = computed({
  get: () => state.value,
  set: (next: Record<string, any>) => {
    state.value = next.type === state.value.type ? next : { ...next, value: SAMPLE_VALUES[next.type] ?? next.value };
  },
});

/** 脱敏只对手机号、姓名、银行卡、邮箱生效 */
const isMaskable = (s: Record<string, any>) => ["phone", "name", "card", "email"].includes(s.type);

/** 演练场控制面板配置 */
const controls = [
  {
    title: "基础属性",
    children: [
      {
        label: "颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: textColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "字号（px，0 为继承父级）",
        key: "size",
        component: "input-number" as const,
        defaultValue: 0,
        props: { min: 0, max: 48 },
      },
      {
        label: "文本类型",
        key: "type",
        component: "select" as const,
        defaultValue: "default",
        props: { options: typeOptions },
      },
      { label: "显示的值", key: "value", component: "input" as const, defaultValue: SAMPLE_VALUES.default },
    ],
  },
  {
    title: "格式化与脱敏",
    children: [
      {
        label: "开启脱敏",
        key: "mask",
        component: "checkbox" as const,
        defaultValue: false,
        hide: (_: unknown, s: Record<string, any>) => !isMaskable(s),
      },
      {
        label: "脱敏替换字符",
        key: "maskChar",
        component: "input" as const,
        defaultValue: "*",
        hide: (_: unknown, s: Record<string, any>) => !isMaskable(s) || !s.mask,
      },
      {
        // 起止位置只用于银行卡
        label: "保留前几位（银行卡）",
        key: "maskStart",
        component: "input-number" as const,
        defaultValue: 3,
        props: { min: 0, max: 4 },
        hide: (_: unknown, s: Record<string, any>) => s.type !== "card" || !s.mask,
      },
      {
        label: "保留后几位（银行卡）",
        key: "maskEnd",
        component: "input-number" as const,
        defaultValue: 4,
        props: { min: 0, max: 4 },
        hide: (_: unknown, s: Record<string, any>) => s.type !== "card" || !s.mask,
      },
      {
        label: "货币符号（留空不显示）",
        key: "currency",
        component: "input" as const,
        defaultValue: "",
        props: { placeholder: "如 ¥" },
        hide: (_: unknown, s: Record<string, any>) => s.type !== "amount",
      },
      {
        label: "货币符号位置",
        key: "currencyPosition",
        component: "select" as const,
        defaultValue: "before",
        props: { options: currencyPositionOptions },
        hide: (_: unknown, s: Record<string, any>) => s.type !== "amount" || !s.currency,
      },
      {
        label: "小数位数",
        key: "precision",
        component: "input-number" as const,
        defaultValue: 2,
        props: { min: 0, max: 6 },
        hide: (_: unknown, s: Record<string, any>) => s.type !== "amount",
      },
      {
        label: "千分位分隔符（留空不分隔）",
        key: "thousandsIcon",
        component: "input" as const,
        defaultValue: "",
        props: { placeholder: "如 ," },
        hide: (_: unknown, s: Record<string, any>) => s.type !== "amount",
      },
    ],
  },
  {
    title: "省略",
    children: [
      { label: "超出省略", key: "ellipsis", component: "checkbox" as const, defaultValue: false },
      {
        label: "最大行数",
        key: "lines",
        component: "input-number" as const,
        defaultValue: 1,
        props: { min: 1, max: 5 },
        hide: (_: unknown, s: Record<string, any>) => !s.ellipsis,
      },
      {
        label: "省略位置",
        key: "ellipsisPosition",
        component: "select" as const,
        defaultValue: "end",
        props: { options: ellipsisPositionOptions },
        hide: (_: unknown, s: Record<string, any>) => !s.ellipsis,
      },
      {
        label: "截断时悬停显示全文",
        key: "tooltip",
        component: "checkbox" as const,
        defaultValue: false,
        hide: (_: unknown, s: Record<string, any>) => !s.ellipsis,
      },
    ],
  },
];

/** 演练场右上角展示的传参明细：只列当前类型下生效的参数 */
const textCode = computed(() => {
  const s = state.value;
  const attrs: string[] = [`color="${s.color}"`, `type="${s.type}"`, `value="${s.value}"`];
  if (s.size) attrs.push(`:size="${s.size}"`);
  if (isMaskable(s)) {
    attrs.push(`:mask="${s.mask}"`);
    if (s.mask) attrs.push(`mask-char="${s.maskChar}"`);
    if (s.mask && s.type === "card") attrs.push(`:mask-start="${s.maskStart}"`, `:mask-end="${s.maskEnd}"`);
  }
  if (s.type === "amount") {
    attrs.push(`:precision="${s.precision}"`);
    if (s.currency) attrs.push(`currency="${s.currency}"`, `currency-position="${s.currencyPosition}"`);
    if (s.thousandsIcon) attrs.push(`thousands-icon="${s.thousandsIcon}"`);
  }
  attrs.push(`:ellipsis="${s.ellipsis}"`);
  if (s.ellipsis) {
    attrs.push(`:lines="${s.lines}"`, `ellipsis-position="${s.ellipsisPosition}"`, `:tooltip="${s.tooltip}"`);
  }
  return `<RebornText\n  ${attrs.join("\n  ")}\n/>`;
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="playgroundState" :controls="controls" :code="textCode" component-name="RebornText" title="交互演练场"
      description="调节类型、脱敏与省略参数，实时查看文本表现；语义色同时作用于下方的格式化与省略示例。"
    >
      <!-- 固定 240px 宽，省略与多行才看得出效果；货币符号只在金额类型下传入 -->
      <div class="w-60">
        <RebornText
          :color="state.color" :size="state.size" :type="state.type" :value="state.value" :mask="state.mask"
          :mask-char="state.maskChar" :mask-start="state.maskStart" :mask-end="state.maskEnd"
          :currency="state.type === 'amount' ? state.currency : ''" :currency-position="state.currencyPosition"
          :precision="state.precision" :thousands-icon="state.thousandsIcon" :ellipsis="state.ellipsis"
          :lines="state.lines" :ellipsis-position="state.ellipsisPosition" :tooltip="state.tooltip"
        />
      </div>
    </Playground>

    <DemoSection title="语义色">
      <template #description>
        <code>color</code> 与全站语义色板对齐；不传时继承父级文字颜色，便于嵌进已有排版。
      </template>
      <DemoBlock>
        <RebornText v-for="c in textColors" :key="c" :color="c">
          {{ c }}
        </RebornText>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="格式化与脱敏">
      <template #description>
        <code>type</code> 决定按哪种规则格式化，<code>mask</code> 为 <code>true</code> 时手机号、姓名、银行卡、邮箱才会脱敏；金额只做数字格式化，与
        <code>mask</code> 无关。
      </template>
      <DemoBlock layout="grid" class="lg:grid-cols-2">
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">手机号脱敏</span>
          <RebornText :color="state.color" type="phone" value="13812345678" mask />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">姓名脱敏</span>
          <RebornText :color="state.color" type="name" value="张三丰" mask />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">金额</span>
          <RebornText :color="state.color" type="amount" :value="12345.6" />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">银行卡脱敏</span>
          <RebornText :color="state.color" type="card" value="6222021234567890" mask />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">邮箱脱敏</span>
          <RebornText :color="state.color" type="email" value="hello@example.com" mask />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="金额：货币符号、千分位与精度">
      <template #description>
        Web 端 <code>currency</code> 默认为空、<code>thousandsIcon</code> 默认不加分隔符，需要显式传入；<code>currencyPosition</code>
        控制符号在数字前后，<code>precision</code> 控制小数位。
      </template>
      <DemoBlock layout="grid" class="lg:grid-cols-2">
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">默认：无货币符号、无千分位</span>
          <RebornText type="amount" :value="12345.6" />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">currency="¥" + thousandsIcon=","</span>
          <RebornText type="amount" :value="12345.6" currency="¥" thousands-icon="," />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">符号后置 + precision=0</span>
          <RebornText type="amount" :value="12345.6" currency="元" currency-position="after" :precision="0"
            thousands-icon="," />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">ui.currency 单独缩小符号</span>
          <RebornText type="amount" :value="12345.6" currency="¥" thousands-icon=","
            :ui="{ base: 'font-semibold text-error', currency: 'mr-0.5 text-xs' }" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="多行省略与气泡提示">
      <template #description>
        <code>ellipsis</code> 开启省略，<code>lines</code> 指定最大行数；再开 <code>tooltip</code> 后仅在内容确实被截断时才弹出气泡，短文本不受影响。
      </template>
      <DemoBlock layout="stack">
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">单行省略 + Tooltip</span>
          <RebornText :color="state.color" ellipsis tooltip class="max-w-[100px]">
            这是一段很长的单行文本内容，超出会显示省略号和气泡
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">单行未省略（无 Tooltip）</span>
          <RebornText :color="state.color" ellipsis tooltip class="max-w-[200px]">
            短文本
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">多行省略 + Tooltip</span>
          <RebornText :color="state.color" ellipsis :lines="2" tooltip class="max-w-xs">
            这是一段很长的文本内容，用于测试多行文本省略且显示 Tooltip 功能。当内容超出指定行数时，会显示省略号并显示 Tooltip。这是一段延伸内容，确保一定会超出两行显示。
          </RebornText>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="省略位置">
      <template #description>
        <code>ellipsis-position</code> 决定省略号出现在哪一端：<code>end</code> 保留开头，<code>start</code>
        保留结尾，适合只关心末级目录的路径；<code>middle</code>
        保留首尾，长文件名截断后扩展名仍可见。<code>start</code> 与 <code>middle</code> 按容器宽度逐字测量截断，容器变化时自动重算。
      </template>
      <DemoBlock layout="stack" class="max-w-[360px]">
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">end（默认）：保留开头</span>
          <RebornText ellipsis tooltip>
            /workspace/reborn-ui/packages/components/date-picker/RebornDatePickerPanel.vue
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">start：保留结尾</span>
          <RebornText ellipsis ellipsis-position="start" tooltip>
            /workspace/reborn-ui/packages/components/date-picker/RebornDatePickerPanel.vue
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">middle：保留首尾</span>
          <RebornText ellipsis ellipsis-position="middle" tooltip>
            2026年第三季度经营数据汇总与各区域销售明细（终版）.xlsx
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">middle + lines=2：多行同样适用</span>
          <RebornText ellipsis ellipsis-position="middle" :lines="2" tooltip>
            这是一段很长的文本内容，用于演示多行中间省略。超出两行时从中间截断，开头与结尾都保留，悬停可在气泡里查看全文。这是一段延伸内容，确保一定会超出两行显示。
          </RebornText>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
