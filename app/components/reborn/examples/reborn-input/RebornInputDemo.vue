<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import {
  inputColors,
  inputResizes,
  inputShapes,
  inputSizes,
  inputVariants,
} from "~/components/reborn/ui/reborn-input/reborn-input.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  value: "",
  type: "text",
  placeholder: "请输入内容",
  size: "md",
  color: "primary",
  variant: "filled",
  shape: "square",
  prefixIcon: "",
  suffixIcon: "",
  clearable: true,
  showPassword: false,
  separator: true,
  disabled: false,
  readonly: false,
  showWordLimit: false,
  wordLimitPosition: "inside",
  maxlength: 20,
  rows: 2,
  autosize: false,
  resize: "",
};

/** 类型选项：textarea 渲染为多行文本域，其余原样下发给原生 type */
const typeOptions = [
  { label: "text 单行文本", value: "text" },
  { label: "textarea 多行文本", value: "textarea" },
  { label: "number 数字", value: "number" },
  { label: "password 密码", value: "password" },
];

/** 缩放选项，空串代表不传 resize */
const resizeOptions = [
  { label: "不传（默认）", value: "" },
  ...inputResizes.map((r) => ({ label: r, value: r })),
];

/** 当前是否为多行文本域 */
function isTextarea(s: Record<string, any>) {
  return s.type === "textarea";
}

/** 字数统计只在 text 与 textarea 下生效 */
function supportsWordLimit(s: Record<string, any>) {
  return s.type === "text" || s.type === "textarea";
}

const state = ref<Record<string, any>>({ ...defaultState });

/** 最近一次 change 事件的值 */
const lastChange = shallowRef<string | number | null>(null);

function handleChange(value: string | number) {
  lastChange.value = value;
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
        label: "输入类型（type）",
        key: "type",
        component: "select" as const,
        defaultValue: "text",
        props: { options: typeOptions },
      },
      { label: "占位文本", key: "placeholder", component: "input" as const, defaultValue: "", codeSkipEmpty: true },
    ],
  },
  {
    title: "外观",
    children: [
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: inputSizes.map((s) => ({ label: s.toUpperCase(), value: s })) },
      },
      {
        label: "配色方案",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: inputColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "形态变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "outlined",
        props: { options: inputVariants.map((v) => ({ label: v, value: v })) },
      },
      {
        label: "形状轮廓",
        key: "shape",
        component: "select" as const,
        defaultValue: "square",
        props: { options: inputShapes.map((s) => ({ label: s, value: s })) },
      },
      {
        label: "前缀图标（仅单行）",
        key: "prefixIcon",
        component: "input" as const,
        defaultValue: "",
        codeSkipEmpty: true,
        props: { placeholder: "如 lucide:search" },
        hide: (_: string, s: Record<string, any>) => isTextarea(s),
      },
      {
        label: "后缀图标（仅单行）",
        key: "suffixIcon",
        component: "input" as const,
        defaultValue: "",
        codeSkipEmpty: true,
        props: { placeholder: "如 lucide:calendar" },
        hide: (_: string, s: Record<string, any>) => isTextarea(s),
      },
      {
        label: "最大长度",
        key: "maxlength",
        component: "input-number" as const,
        defaultValue: 20,
        props: { align: 'left', hideButton: true },
      },
    ],
  },
  {
    title: "多行文本域",
    children: [
      {
        label: "行数（rows）",
        key: "rows",
        component: "slider" as const,
        defaultValue: 2,
        props: { min: 1, max: 10, step: 1 },
        hide: (_: number, s: Record<string, any>) => !isTextarea(s),
      },
      {
        label: "高度自适应（autosize）",
        key: "autosize",
        component: "checkbox" as const,
        defaultValue: false,
        hide: (_: boolean, s: Record<string, any>) => !isTextarea(s),
      },
      {
        label: "手动缩放（resize）",
        key: "resize",
        component: "select" as const,
        defaultValue: "",
        codeSkipEmpty: true,
        props: { options: resizeOptions },
        hide: (_: string, s: Record<string, any>) => !isTextarea(s),
      },
    ],
  },
  {
    title: "行为",
    children: [
      {
        label: "可清空（仅单行）",
        key: "clearable",
        component: "checkbox" as const,
        defaultValue: false,
        hide: (_: boolean, s: Record<string, any>) => isTextarea(s),
      },
      {
        label: "密码切换（仅单行）",
        key: "showPassword",
        component: "checkbox" as const,
        defaultValue: false,
        hide: (_: boolean, s: Record<string, any>) => isTextarea(s),
      },
      {
        label: "竖分割线（清除、密码开关与后缀之间）",
        key: "separator",
        component: "checkbox" as const,
        defaultValue: true,
        hide: (_: boolean, s: Record<string, any>) => isTextarea(s),
      },
      {
        label: "字数统计（需设最大长度）",
        key: "showWordLimit",
        component: "checkbox" as const,
        defaultValue: false,
        hide: (_: boolean, s: Record<string, any>) => !supportsWordLimit(s),
      },
      {
        label: "字数统计位置",
        key: "wordLimitPosition",
        component: "select" as const,
        defaultValue: "inside",
        props: {
          options: [
            { label: "inside 输入框内", value: "inside" },
            { label: "outside 输入框下方", value: "outside" },
          ],
        },
        hide: (_: string, s: Record<string, any>) => !supportsWordLimit(s) || !s.showWordLimit,
      },
    ],
  },
  {
    title: "状态",
    children: [
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
      { label: "只读", key: "readonly", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 传参明细由 Playground 按 controls 自动生成；这里只补 controls 之外的事件监听 */
const codeExtras = ['@change="handleChange"'];

// ─── 场景演示状态 ───────────────────────────────────────────────

// 各 section 独立持有绑定值，避免调整一处示例牵连其他示例
const variantValue = shallowRef("Reborn UI");
const basicValue = shallowRef("");
const iconValue = shallowRef("");
const groupValue = shallowRef("");
const limitValue = shallowRef("字数统计");
const limitOutsideValue = shallowRef("");
const limitAreaValue = shallowRef("");
const passwordValue = shallowRef("reborn-ui-2026");
const clearValue = shallowRef("点右侧图标清空");
const textareaValue = shallowRef("");
const resizeValue = shallowRef("");
const adornmentValue = shallowRef("Reborn UI");
const autosizeValue = shallowRef("高度随内容自动增长，最多 6 行。");

// 格式化与解析：千分位展示，绑定值保持纯数字文本
const formattedValue = shallowRef("1234567");

/** 千分位格式化，如 1234567 → 1,234,567 */
function formatThousands(value: string | number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 去掉千分位逗号，还原为纯数字文本 */
function parseThousands(text: string) {
  return text.replace(/,/g, "");
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code-extras="codeExtras" component-name="RebornInput"
      title="交互演练场" description="调节尺寸、配色、形态与行为开关，实时预览输入框表现；filled 形态聚焦时背景转为 bg-gray-1 并出现主题色描边。"
    >
      <template #tag>
        <RebornButton size="md" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-4">
        <RebornInput
          v-model="state.value"
          class="max-w-sm"
          :type="state.type"
          :placeholder="state.placeholder"
          :size="state.size"
          :color="state.color"
          :variant="state.variant"
          :shape="state.shape"
          :prefix-icon="state.prefixIcon"
          :suffix-icon="state.suffixIcon"
          :clearable="state.clearable"
          :show-password="state.showPassword"
          :separator="state.separator"
          :show-word-limit="state.showWordLimit"
          :word-limit-position="state.wordLimitPosition"
          :maxlength="state.maxlength"
          :rows="state.rows"
          :autosize="state.autosize"
          :resize="state.resize || undefined"
          :disabled="state.disabled"
          :readonly="state.readonly"
          @change="handleChange"
        />

        <DemoNote tone="dimmed">
          绑定值：<code>{{ state.value === "" ? "（空）" : state.value }}</code>
          <template v-if="lastChange !== null">
            · 最近 <code>change</code>：<code>{{ lastChange === "" ? "（空）" : lastChange }}</code>
          </template>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        <code>v-model</code> 绑定输入值；<code>clearable</code> 在有内容时显示清除按钮；<code>readonly</code>
        只读仍可选中复制，<code>disabled</code> 禁用后不可聚焦。
      </template>
      <DemoBlock layout="grid" align="start">
        <DemoItem label="clearable" mono>
          <RebornInput
            v-model="basicValue"
            clearable
            placeholder="请输入关键词"
          />
        </DemoItem>
        <DemoItem label="readonly" mono>
          <RebornInput
            model-value="只读内容"
            readonly
          />
        </DemoItem>
        <DemoItem label="disabled" mono>
          <RebornInput
            placeholder="禁用状态"
            disabled
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="形状与尺寸">
      <template #description>
        <code>shape</code> 控制外形轮廓：square 按尺寸取圆角令牌（sm 4px / md 6px / lg 8px），circle 为胶囊；
        <code>size</code> 同时决定高度、字号与内边距。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem v-for="s in inputSizes" :key="s" :label="`square · ${s}`" mono>
          <RebornInput v-model="variantValue" variant="outlined" shape="square" :size="s" placeholder="请输入" />
        </DemoItem>
        <DemoItem label="circle · 胶囊" mono>
          <RebornInput v-model="variantValue" variant="outlined" shape="circle" placeholder="请输入" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="前后缀与前后置块">
      <template #description>
        <code>prefix-icon</code> / <code>suffix-icon</code> 与 <code>#prefix</code> / <code>#suffix</code>
        插槽在输入框内部添加内容；<code>#prepend</code> / <code>#append</code> 插槽在输入框外部拼出连体块，仅单行模式有效。
      </template>
      <DemoBlock layout="grid" align="start">
        <DemoItem label="#prefix / #suffix" mono>
          <RebornInput v-model="iconValue" placeholder="搜索日期">
            <template #prefix>
              prefix
            </template>
            <template #suffix>
              suffix
            </template>
          </RebornInput>
        </DemoItem>

        <DemoItem label="prefix-icon / suffix-icon" mono>
          <RebornInput
            v-model="iconValue" prefix-icon="lucide:search" suffix-icon="lucide:calendar"
            placeholder="搜索日期"
          />
        </DemoItem>

        <DemoItem label="#prepend / #append（连体块）" mono>
          <RebornInput v-model="groupValue" variant="outlined" placeholder="域名前缀">
            <template #prepend>
              <div class="px-3">
                https://
              </div>
            </template>
            <template #append>
              <div class="px-2">
                .com
              </div>
            </template>
          </RebornInput>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="前后置块：搜索按钮与禁用配色">
      <template #description>
        <code>#append</code> 放按钮文字或图标，<code>#prepend</code> 放协议前缀；连体块默认不带内边距，需要在插槽内容或
        <code>ui.append</code> 里自己给。<code>ui.append</code> 里写的文字色会盖过禁用态自带的 <code>text-gray-5</code>，
        所以禁用时要单独给一套配色（右列）。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem mono>
          <RebornInput
            v-model="adornmentValue" placeholder="请输入内容" :ui="{
              append: 'bg-brand-6 text-white px-3 border border-brand-6'
            }"
          >
            <template #append>
              搜索
            </template>
          </RebornInput>
        </DemoItem>
        <DemoItem mono>
          <RebornInput
            v-model="adornmentValue" disabled placeholder="请输入内容" :ui="{
              append: 'bg-brand-3 text-gray-2 px-3 border border-brand-3'
            }"
          >
            <template #append>
              搜索
            </template>
          </RebornInput>
        </DemoItem>
        <DemoItem mono>
          <RebornInput
            v-model="adornmentValue" placeholder="请输入内容" :ui="{
              append: 'bg-white text-gray-10 px-2'
            }"
          >
            <template #prepend>
              <div class="px-3">
                https://
              </div>
            </template>
            <template #append>
              <Icon name="lucide:search" />
            </template>
          </RebornInput>
        </DemoItem>
        <DemoItem mono>
          <RebornInput
            v-model="adornmentValue" disabled placeholder="请输入内容" :ui="{
              append: 'bg-gray-2 text-gray-5 px-2'
            }"
          >
            <template #prepend>
              <div class="px-3 text-gray-5">
                https://
              </div>
            </template>
            <template #append>
              <Icon name="lucide:search" />
            </template>
          </RebornInput>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="字数统计：show-word-limit">
      <template #description>
        <code>show-word-limit</code> 配合 <code>maxlength</code> 显示字数统计，仅 type 为 text / textarea 时生效；
        <code>word-limit-position</code> 可选 inside（默认）/ outside。
      </template>
      <DemoBlock layout="grid" align="start">
        <DemoItem label="inside（默认）" mono>
          <RebornInput v-model="limitValue" :maxlength="10" show-word-limit placeholder="最多 10 字" />
        </DemoItem>

        <DemoItem label="outside" mono>
          <RebornInput
            v-model="limitOutsideValue" :maxlength="10" show-word-limit word-limit-position="outside"
            placeholder="统计显示在下方"
          />
        </DemoItem>

        <DemoItem label="textarea（统计落在右下角）" mono>
          <RebornInput
            v-model="limitAreaValue" type="textarea" :rows="3" :maxlength="50" show-word-limit
            placeholder="多行文本统计"
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="格式化与解析：formatter / parser">
      <template #description>
        <code>formatter</code> 决定展示文本，<code>parser</code> 从格式化文本中还原绑定值，两者配对使用，仅
        <code>type="text"</code> 时生效。
      </template>
      <DemoBlock layout="stack" align="start">
        <DemoItem label="千分位分隔" mono :note="`绑定值：${formattedValue}`" class="w-full max-w-sm">
          <RebornInput
            v-model="formattedValue" :formatter="formatThousands" :parser="parseThousands"
            placeholder="输入数字"
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="密码框与清除">
      <template #description>
        <code>show-password</code> 显示明文 / 密文切换按钮，<code>#password-icon</code> 作用域插槽（参数
        <code>visible</code>）可自定义图标；<code>clearable</code> 显示清除按钮，<code>clear-icon</code> 可换图标。
      </template>
      <DemoBlock layout="grid" align="start">
        <DemoItem label="show-password" mono>
          <RebornInput v-model="passwordValue" show-password placeholder="请输入密码" />
        </DemoItem>

        <DemoItem label="自定义 #password-icon" mono>
          <RebornInput v-model="passwordValue" show-password placeholder="请输入密码">
            <template #password-icon="{ visible }">
              <Icon :name="visible ? 'lucide:unlock' : 'lucide:lock'" />
            </template>
          </RebornInput>
        </DemoItem>

        <DemoItem label="clearable + clear-icon" mono>
          <RebornInput v-model="clearValue" clearable clear-icon="lucide:trash-2" placeholder="可清空" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="多行文本：rows / autosize / resize">
      <template #description>
        <code>type="textarea"</code> 渲染为多行输入，<code>rows</code> 控制初始行数；<code>autosize</code>
        让高度随内容自适应，可传 <code>{ minRows, maxRows }</code> 限定范围；<code>resize</code> 控制是否允许用户拖拽缩放。
      </template>
      <DemoBlock layout="grid" align="start">
        <DemoItem label="rows = 3（固定行数）" mono>
          <RebornInput v-model="textareaValue" type="textarea" :rows="3" variant="outlined" placeholder="请输入多行内容..." />
        </DemoItem>

        <DemoItem label="autosize = { minRows: 2, maxRows: 6 }" mono>
          <RebornInput
            v-model="autosizeValue" type="textarea" :autosize="{ minRows: 2, maxRows: 6 }"
            placeholder="高度自适应..."
          />
        </DemoItem>

        <DemoItem label="resize=&quot;vertical&quot;（允许纵向拖拽）" mono>
          <RebornInput
            v-model="resizeValue" type="textarea" :rows="3" resize="vertical" maxlength="100"
            show-word-limit placeholder="右下角可拖拽"
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
