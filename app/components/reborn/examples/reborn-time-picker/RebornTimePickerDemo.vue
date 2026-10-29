<script setup lang="ts">
import type { PlaygroundControlGroup } from "~/components/common/play-ground/Playground.vue";
import { DemoBlock, DemoNote, DemoSection, Playground } from "#components";
import { computed, ref, shallowRef } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import {
  timePanelInteractions,
  timePanelVariants,
  timePickerColors,
  timePickerSizes,
} from "~/components/reborn/ui/reborn-time-picker/reborn-time-panel.config";
import RebornTimePanel from "~/components/reborn/ui/reborn-time-picker/RebornTimePanel.vue";
import RebornTimePicker from "~/components/reborn/ui/reborn-time-picker/RebornTimePicker.vue";

// ─── 交互演练场 ─────
const defaultState: Record<string, any> = {
  value: "09:30:15",
  size: "md",
  color: "primary",
  variant: "outlined",
  panelVariant: "filled",
  interaction: "click",
  arrowControl: false,
  allowInput: true,
  disabled: false,
  clearable: true,
  closeOn: "mousedown",
  showFooter: true,
};
// 时间选择会直接回写嵌套字段，保留深层响应以同步预览和代码明细。
const state = ref({ ...defaultState });
const lastEvent = shallowRef("");

/** 恢复初始配置和时间，同时清空交互反馈。 */
function resetState() {
  state.value = { ...defaultState };
  lastEvent.value = "";
}
/** 复制代码包含当前时间及全部演练参数。 */
const timePickerCode = computed(() => `<script setup lang="ts">
import { shallowRef } from 'vue';
import RebornTimePicker from '~/components/reborn/ui/reborn-time-picker/RebornTimePicker.vue';
const value = shallowRef(${JSON.stringify(state.value.value)});
<\/script>

<template>
  <RebornTimePicker
    v-model="value"
    interaction="${state.value.interaction}"
    size="${state.value.size}"
    color="${state.value.color}"
    variant="${state.value.variant}"
    :arrow-control="${state.value.arrowControl}"${state.value.interaction === "scroll" ? `\n    panel-variant="${state.value.panelVariant}"` : ""}
    :allow-input="${state.value.allowInput}"
    close-on="${state.value.closeOn}"
    :show-footer="${state.value.showFooter}"
    :clearable="${state.value.clearable}"
    :disabled="${state.value.disabled}"
  />
</template>`);
const variants = ["outlined", "filled", "borderless", "underlined"] as const;
const controls: PlaygroundControlGroup[] = [
  {
    title: "选取行为",
    children: [
      {
        label: "选取方式",
        key: "interaction",
        component: "select",
        defaultValue: "click",
        props: {
          options: timePanelInteractions.map(value => ({
            label: value === "scroll" ? "滚动居中（默认）" : "点击置顶",
            value,
          })),
        },
      },
      {
        label: "显示上下切换按钮",
        key: "arrowControl",
        component: "checkbox",
        defaultValue: false,
      },
      {
        label: "滚动中心形态",
        key: "panelVariant",
        component: "select",
        defaultValue: "filled",
        hide: (value, values) => values.interaction !== "scroll",
        props: { options: timePanelVariants.map(value => ({ label: value, value })) },
      },
      {
        label: "关闭时机",
        key: "closeOn",
        component: "select",
        defaultValue: "mousedown",
        props: {
          options: [
            { label: "点击完成（click）", value: "click" },
            { label: "按下即关闭（mousedown）", value: "mousedown" },
          ],
        },
      },
    ],
  },
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
    ],
  },
  {
    title: "输入与状态",
    children: [
      { label: "显示底部操作", key: "showFooter", component: "checkbox" as const, defaultValue: true },
      { label: "允许输入", key: "allowInput", component: "checkbox" as const, defaultValue: true },
      { label: "允许清空", key: "clearable", component: "checkbox" as const, defaultValue: true },
      { label: "禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

// ─── 场景演示状态 ─────
const empty = shallowRef("");
const selected = shallowRef("12:30:45");
const inputMessage = shallowRef("");
const formats = ref([
  { label: "时分秒", format: "HH:mm:ss", value: "09:30:15" },
  { label: "时", format: "HH", value: "09" },
  { label: "分", format: "mm", value: "30" },
  { label: "秒", format: "ss", value: "15" },
  { label: "时分", format: "HH:mm", value: "09:30" },
  { label: "分秒", format: "mm:ss", value: "30:15" },
]);
const limitedValue = shallowRef("12:30:15");
const rangeValue = ref(["09:00:00", "18:00:00"]);
const arrowValue = shallowRef("14:20:00");
const preciseValue = shallowRef("10:20:30.123");
const footerValue = shallowRef("08:30:00");
const noFooterValue = shallowRef("09:30:00");

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
      :code="timePickerCode"
      component-name="RebornTimePicker"
      title="交互演练场"
      description="切换点击置顶与滚动居中，对比时间列的选取行为、颜色和上下切换按钮。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          重置配置
        </RebornButton>
      </template>
      <div class="flex w-full min-w-0 flex-col items-center gap-3">
        <RebornTimePicker
          v-model="state.value"
          :interaction="state.interaction"
          :arrow-control="state.arrowControl"
          :size="state.size"
          :color="state.color"
          :variant="state.variant"
          :panel-variant="state.panelVariant"
          :allow-input="state.allowInput"
          :close-on="state.closeOn"
          :show-footer="state.showFooter"
          :clearable="state.clearable"
          :disabled="state.disabled"
          aria-label="演练场时间"
          class="max-w-xs"
          @change="lastEvent = '已更新选中值'"
          @confirm="lastEvent = '已确认时间'"
          @invalid="lastEvent = `无效输入：${$event}，请使用 HH:mm:ss。`"
        />
        <DemoNote tone="dimmed">
          <template v-if="state.interaction === 'click'">
            点击选中并置顶，滚动只浏览；选中背景跟随颜色，首尾不循环。
          </template>
          <template v-else>
            滚动停止后选中并居中，首尾不循环；中心形态仅在此模式生效。
          </template>
        </DemoNote>
        <DemoNote tone="dimmed" role="status" aria-live="polite">
          当前值：{{ state.value || "空" }}；{{ lastEvent || "尚未操作" }}。
        </DemoNote>
      </div>
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
            interaction="click"
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
            interaction="click"
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
            interaction="click"
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
            interaction="click"
            :variant="variant"
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="交互与面板">
      <template #description>
        <code>interaction="click"</code> 只在点击后选中并置顶，滚动用于浏览；
        选中背景使用对应色板第 1 阶，未选项悬停为 <code>gray-2</code>。
      </template>
      <RebornTimePanel v-model="selected" interaction="click" class="border-gray-2 rounded-lg border" />
      <DemoNote tone="dimmed">
        组件默认使用 scroll：滚动停止后选中并居中，首尾不循环。
        可在交互演练场切换选取方式，滚动模式下通过 panelVariant 对比填充与上下细线。
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
          interaction="click"
          :size="size"
          :aria-label="size"
        />
        <RebornTimePicker
          v-for="color in timePickerColors"
          :key="color"
          v-model="selected"
          interaction="click"
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
          interaction="click"
          :disabled-hours="disabledHours"
          :disabled-minutes="disabledMinutes"
          :disabled-seconds="disabledSeconds"
          aria-label="受限时间"
        />
        <RebornTimePicker
          interaction="click"
          model-value="08:00:00"
          disabled
          aria-label="禁用时间"
        />
        <RebornTimePicker
          interaction="click"
          disabled
          placeholder="禁用空值"
        />
        <RebornTimePicker
          interaction="click"
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
          interaction="click"
          is-range
          class="max-w-md"
        />
        <RebornTimePicker
          v-model="arrowValue"
          interaction="click"
          arrow-control
          class="max-w-xs"
        />
        <RebornTimePicker
          v-model="preciseValue"
          interaction="click"
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
        <code>closeOn</code> 与 <code>reborn-select</code> 一致：默认 <code>mousedown</code>，也可选 <code>click</code>。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <RebornTimePicker interaction="click" close-on="mousedown" aria-label="外部按下即关闭" placeholder="mousedown（默认）：外部按下即关闭" />
        <RebornTimePicker interaction="click" close-on="click" aria-label="点击完成后关闭" placeholder="click：外部点击后关闭" />
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
          interaction="click"
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
          interaction="click"
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
