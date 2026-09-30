<script setup lang="ts">
import { DemoBlock, DemoNote, DemoSection, Playground } from "#components";
import { ref } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import {
  timePanelVariants,
  timePickerColors,
  timePickerSizes,
} from "~/components/reborn/ui/reborn-time-picker/reborn-time-panel.config";
import RebornTimePanel from "~/components/reborn/ui/reborn-time-picker/RebornTimePanel.vue";
import RebornTimePicker from "~/components/reborn/ui/reborn-time-picker/RebornTimePicker.vue";

// 演练场各维度独立，可直接比较输入框与中心选中区域。
const state = ref<Record<string, any>>({
  value: "09:30:15",
  size: "md",
  color: "primary",
  variant: "outlined",
  panelVariant: "filled",
  allowInput: true,
  disabled: false,
  clearable: true,
  closeOn: "click",
  showFooter: true,
});
const variants = ["outlined", "filled", "borderless", "underlined"] as const;
const controls = [
  {
    title: "外观",
    children: [
      {
        label: "尺寸",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: timePickerSizes.map((value) => ({ label: value, value })) },
      },
      {
        label: "颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: timePickerColors.map((value) => ({ label: value, value })) },
      },
      {
        label: "输入框形态",
        key: "variant",
        component: "select" as const,
        defaultValue: "outlined",
        props: { options: variants.map((value) => ({ label: value, value })) },
      },
      {
        label: "中心形态",
        key: "panelVariant",
        component: "select" as const,
        defaultValue: "filled",
        props: { options: timePanelVariants.map((value) => ({ label: value, value })) },
      },
    ],
  },
  {
    title: "交互",
    children: [
      {
        label: "关闭时机", key: "closeOn", component: "select" as const, defaultValue: "click",
        props: { options: [{ label: "点击完成（click）", value: "click" }, { label: "按下即关闭（mousedown）", value: "mousedown" }] },
      },
      { label: "显示底部操作", key: "showFooter", component: "checkbox" as const, defaultValue: true },
      { label: "允许输入", key: "allowInput", component: "checkbox" as const, defaultValue: true },
      { label: "允许清空", key: "clearable", component: "checkbox" as const, defaultValue: true },
      { label: "禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];
const empty = ref("");
const selected = ref("12:30:45");
const inputMessage = ref("");
const formats = ref([
  { label: "时分秒", format: "HH:mm:ss", value: "09:30:15" },
  { label: "时", format: "HH", value: "09" },
  { label: "分", format: "mm", value: "30" },
  { label: "秒", format: "ss", value: "15" },
  { label: "时分", format: "HH:mm", value: "09:30" },
  { label: "分秒", format: "mm:ss", value: "30:15" },
]);
const filled = ref("12:30:45");
const outlined = ref("12:30:45");
const limitedValue = ref("12:30:15");
const rangeValue = ref(["09:00:00", "18:00:00"]);
const arrowValue = ref("14:20:00");
const preciseValue = ref("10:20:30.123");
const footerValue = ref("08:30:00");
const noFooterValue = ref("09:30:00");

/** 禁用凌晨与深夜，输入和滚动选择遵循同一规则。 */
function disabledHours() {
  return [0, 1, 2, 3, 4, 23];
}
/** 十二点只允许后半小时。 */
function disabledMinutes(hour: number) {
  return hour === 12 ? Array.from({ length: 30 }, (_, index) => index) : [];
}
function disabledSeconds() {
  return [0, 1, 2, 3, 4];
}
function onInvalid(value: string) {
  inputMessage.value = `未写入无效时间：${value}，请使用 HH:mm:ss。`;
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      component-name="RebornTimePicker"
      title="交互演练场"
      description="调节左侧参数，对比输入框与中心选中区域的样式、尺寸、颜色和禁用状态。"
    >
      <RebornTimePicker
        v-model="state.value"
        :size="state.size"
        :color="state.color"
        :variant="state.variant"
        :panel-variant="state.panelVariant"
        :allow-input="state.allowInput"
        :close-on="state.closeOn"
        :show-footer="state.showFooter"
        :clearable="state.clearable"
        :disabled="state.disabled"
        class="max-w-xs"
      />
    </Playground>

    <DemoSection title="基础与输入">
      <template #description>
        默认使用 <code>HH:mm:ss</code>，输入后按回车或失焦提交；非法时间不会写入绑定值。
      </template>
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div class="flex flex-col gap-3">
          <span class="text-gray-6 text-sm">默认空值</span>
          <RebornTimePicker
            v-model="empty"
            aria-label="默认空值时间"
            @invalid="onInvalid"
            @change="inputMessage = ''"
          />
          <DemoNote tone="dimmed">绑定值：{{ empty || "空" }}；打开面板不会自动填值。</DemoNote>
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-gray-6 text-sm">已选与可编辑</span>
          <RebornTimePicker
            v-model="selected"
            aria-label="已选时间"
            @invalid="onInvalid"
            @change="inputMessage = ''"
          />
          <DemoNote tone="dimmed">绑定值：{{ selected }}</DemoNote>
        </div>
      </DemoBlock>
      <DemoNote
        v-if="inputMessage"
        role="status"
      >
        {{ inputMessage }}
      </DemoNote>
    </DemoSection>

    <DemoSection title="时间精度">
      <template #description>
        <code>format</code> 决定显示的时间列与输入格式，不显示的单位按零处理。
      </template>
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div
          v-for="item in formats"
          :key="item.format"
          class="flex flex-col gap-3"
        >
          <span class="text-gray-6 text-sm">{{ item.label }} · {{ item.format }}</span>
          <RebornTimePicker
            v-model="item.value"
            :format="item.format"
            :aria-label="item.label"
          />
          <DemoNote tone="dimmed">{{ item.value }}</DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="触发器变体">
      <template #description>
        <code>variant</code> 沿用选择器的四种形态，与
        <code>panelVariant</code> 相互独立。
      </template>
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div
          v-for="variant in variants"
          :key="variant"
          class="flex flex-col gap-3"
        >
          <span class="text-gray-6 text-sm">{{ variant }}</span>
          <RebornTimePicker
            v-model="selected"
            :variant="variant"
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="中心聚焦变体">
      <template #description>
        <code>panelVariant</code> 可选填充或上下描边；下方用内联面板的
        <code>variant</code> 对比，选中项加粗。
      </template>
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div class="flex flex-col gap-3">
          <span class="text-gray-6 text-sm">filled · 语义色第 1 阶</span>
          <RebornTimePanel
            v-model="filled"
            variant="filled"
            class="border-gray-2 rounded-lg border"
          />
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-gray-6 text-sm">outlined · gray-6 上下细线（1px 独立缩放 50%）（悬停不遮挡）</span>
          <RebornTimePanel
            v-model="outlined"
            variant="outlined"
            class="border-gray-2 rounded-lg border"
          />
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        滚动区显示五个完整选项，上下各露出半项；滚动停止后吸附到中心，滚动条使用
        RebornScrollbar。
      </DemoNote>
    </DemoSection>

    <DemoSection title="尺寸与颜色">
      <template #description>
        <code>size</code> 控制触发器尺寸，<code>color</code> 同时控制触发器与填充中心色，时间项保持
        14px。
      </template>
      <DemoBlock
        layout="grid"
        align="start"
      >
        <RebornTimePicker
          v-for="size in timePickerSizes"
          :key="size"
          v-model="selected"
          :size="size"
          :aria-label="size"
        />
        <RebornTimePicker
          v-for="color in timePickerColors"
          :key="color"
          v-model="selected"
          :color="color"
          :aria-label="color"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="禁用与可选时间">
      <template #description>
        <code>disabled</code>
        禁止交互；<code>disabledHours</code>、<code>disabledMinutes</code>、<code>disabledSeconds</code>
        排除指定选项。
      </template>
      <DemoBlock
        layout="grid"
        align="start"
      >
        <RebornTimePicker
          v-model="limitedValue"
          :disabled-hours="disabledHours"
          :disabled-minutes="disabledMinutes"
          :disabled-seconds="disabledSeconds"
          aria-label="受限时间"
        />
        <RebornTimePicker
          model-value="08:00:00"
          disabled
          aria-label="禁用时间"
        />
        <RebornTimePicker
          disabled
          placeholder="禁用空值"
        />
        <RebornTimePicker
          model-value="08:00:00"
          :allow-input="false"
          aria-label="仅面板选择"
        />
      </DemoBlock>
      <DemoNote tone="dimmed">
        禁用 0–4 点和 23 点；12 点仅允许后半小时；每分钟前 5
        秒不可选。「此刻」会校正到可选时间。
      </DemoNote>
    </DemoSection>

    <DemoSection title="范围与步进">
      <template #description>
        保留 <code>isRange</code>、<code>arrowControl</code>
        和毫秒格式，范围模式通过面板选取而非文本输入。
      </template>
      <DemoBlock layout="stack">
        <RebornTimePicker
          v-model="rangeValue"
          is-range
          class="max-w-md"
        />
        <RebornTimePicker
          v-model="arrowValue"
          arrow-control
          class="max-w-xs"
        />
        <RebornTimePicker
          v-model="preciseValue"
          format="HH:mm:ss.SSS"
          class="max-w-xs"
        />
        <DemoNote tone="dimmed">
          范围：{{ rangeValue.join(" 至 ") }}；步进：{{ arrowValue }}；毫秒：{{
            preciseValue
          }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="关闭时机">
      <template #description>
        <code>closeOn</code> 与 <code>reborn-select</code> 一致：默认 <code>click</code>，也可选 <code>mousedown</code>。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <RebornTimePicker close-on="click" aria-label="点击完成后关闭" placeholder="click：外部点击后关闭" />
        <RebornTimePicker close-on="mousedown" aria-label="外部按下即关闭" placeholder="mousedown：外部按下即关闭" />
      </DemoBlock>
      <DemoNote tone="dimmed">
        mousedown 模式在外部按下任意鼠标键或页面滚动时关闭，内部时间列滚动不关闭；click 模式等待外部点击完成。
      </DemoNote>
    </DemoSection>

    <DemoSection title="自定义底部">
      <template #description>
        <code>showFooter</code> 控制整个底部区域是否显示；<code>footer</code> 提供 <code>confirm</code>、<code>clear</code> 和
        <code>now</code>，可完全替换默认等宽居中的「此刻 / 确定」操作，并自行编排布局。
      </template>
      <DemoBlock>
        <RebornTimePicker
          v-model="footerValue"
          class="max-w-xs"
        >
          <template #footer="{ clear, now, confirm }">
            <RebornButton
              size="sm"
              variant="text"
              @click="clear"
            >
              清空
            </RebornButton>
            <RebornButton
              size="sm"
              variant="text"
              @click="now"
            >
              此刻
            </RebornButton>
            <RebornButton
              size="sm"
              variant="filled"
              @click="confirm"
            >
              确定
            </RebornButton>
          </template>
        </RebornTimePicker>
      </DemoBlock>
      <DemoBlock>
        <RebornTimePicker
          v-model="noFooterValue"
          :show-footer="false"
          aria-label="隐藏底部操作"
          class="max-w-xs"
        />
      </DemoBlock>
      <DemoNote tone="dimmed">
        隐藏底部后，选取时间仍会更新绑定值；可点击外部或按 Escape 收起面板，不会自动触发 confirm。
      </DemoNote>
    </DemoSection>
  </div>
</template>
