<script setup lang="ts">
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";
import RebornCheckboxGroup from "~/components/reborn/ui/reborn-checkbox/RebornCheckboxGroup.vue";
import {
  checkboxColors,
  checkboxSizes,
} from "~/components/reborn/ui/reborn-checkbox/reborn-checkbox.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  checked: true,
  size: "md",
  color: "primary",
  label: "同意用户协议",
  disabled: false,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "基础属性",
    children: [
      {
        label: "标签文本",
        key: "label",
        component: "input" as const,
        defaultValue: "同意用户协议",
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: checkboxSizes.map((s) => ({ label: s.toUpperCase(), value: s })) },
      },
      {
        label: "配色方案",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: checkboxColors.map((c) => ({ label: c, value: c })) },
      },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const checkboxCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="checked"', `label="${s.label}"`];

  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.disabled) props.push("disabled");

  return `<RebornCheckbox\n  ${props.join("\n  ")}\n/>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 三种基础状态 */
const uncheckedValue = ref(false);
const checkedValue = ref(true);
const disabledValue = ref(true);

/** 自定义真假值：未选中时也会写入具体文案 */
const noticeValue = ref("系统更新");

/** 复选框组的选中集合 */
const brands = ref<string[]>(["Apple"]);
const brandOptions = ["Apple", "Huawei", "Xiaomi"];

/** 卡片式多选 */
const selectedPlans = ref<string[]>(["标准版"]);
const plans = [
  { value: "基础版", title: "基础版", description: "适合快速接入的轻量配置。" },
  { value: "标准版", title: "标准版", description: "涵盖常用场景的均衡方案。" },
  { value: "旗舰版", title: "旗舰版", description: "完整能力组合，满足复杂业务。" },
];

/** 高级定制演示用的独立状态 */
const roundedValue = ref(true);
const iconValue = ref(true);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="checkboxCode"
      component-name="RebornCheckbox"
      title="交互演练场"
      description="调节尺寸与配色，实时预览勾选框的选中动画与禁用表现。"
    >
      <RebornCheckbox
        v-model="state.checked"
        :size="state.size"
        :color="state.color"
        :label="state.label"
        :disabled="state.disabled"
      />
    </Playground>

    <DemoSection
      title="基础状态"
      description="未选中、已选中与禁用三种状态；禁用后仍会保留当前勾选结果。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-10"
      >
        <RebornCheckbox
          v-model="uncheckedValue"
          label="未选中"
        />
        <RebornCheckbox
          v-model="checkedValue"
          label="已选中"
        />
        <RebornCheckbox
          v-model="disabledValue"
          label="禁用"
          disabled
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="自定义真假值"
      description="true-value 与 false-value 让单个勾选框直接绑定业务文案，而不局限于布尔值。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-10"
      >
        <RebornCheckbox
          v-model="noticeValue"
          true-value="系统更新"
          false-value="系统不更新"
          label="系统更新"
        />
        <RebornCheckbox
          v-model="noticeValue"
          true-value="产品迭代"
          false-value="产品不迭代"
          label="产品迭代"
          color="info"
        />
        <RebornCheckbox
          v-model="noticeValue"
          true-value="活动通知"
          false-value="活动不通知"
          label="活动通知"
          color="success"
        />
      </DemoBlock>

      <DemoNote tone="dimmed">
        当前值：<code>{{ noticeValue }}</code>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="复选框组"
      description="RebornCheckboxGroup 统一托管数组值，并向下派发 size 与 color。"
    >
      <DemoBlock layout="stack">
        <RebornCheckboxGroup
          v-model="brands"
          color="secondary"
          class="flex flex-wrap items-center gap-8"
        >
          <RebornCheckbox
            v-for="option in brandOptions"
            :key="option"
            :value="option"
            :label="option"
          />
        </RebornCheckboxGroup>
      </DemoBlock>

      <DemoNote tone="dimmed">
        已选：<code>{{ brands.length ? brands.join("、") : "空" }}</code>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="卡片式多选"
      description="value 与数组型 v-model 配合，可把勾选框嵌入到整块可点击的描边卡片中。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
        <label
          v-for="plan in plans"
          :key="plan.value"
          class="border-default rounded-ui-md hover:border-inverted flex cursor-pointer items-start gap-4 border p-4 transition-colors"
        >
          <RebornCheckbox
            v-model="selectedPlans"
            :value="plan.value"
          />
          <div class="flex flex-col gap-1">
            <p class="text-highlighted text-sm font-semibold">{{ plan.title }}</p>
            <p class="text-muted text-xs">{{ plan.description }}</p>
          </div>
        </label>
      </DemoBlock>

      <DemoNote tone="dimmed">
        已选套餐：<code>{{ selectedPlans.length ? selectedPlans.join("、") : "空" }}</code>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="进阶自定义"
      description="ui 可逐槽覆盖 control / icon / label 的样式，icon 插槽还能整体替换勾选标记。"
    >
      <DemoBlock
        layout="grid"
        align="center"
      >
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">全圆角 · <code>ui</code> 覆盖</span>
          <RebornCheckbox
            v-model="roundedValue"
            label="渐变文字标签"
            :ui="{
              control: 'rounded-full',
              label: 'font-bold bg-linear-to-r from-primary to-info bg-clip-text text-transparent',
            }"
          />
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">自定义图标 · <code>#icon</code></span>
          <RebornCheckbox
            v-model="iconValue"
            label="收藏这个组件"
            color="error"
            :ui="{ control: 'size-8' }"
          >
            <template #icon="{ checked }">
              <Icon
                :name="checked ? 'lucide:heart' : 'lucide:heart-crack'"
                class="size-5 transition-all duration-300"
                :class="checked ? 'fill-current' : 'text-dimmed'"
              />
            </template>
          </RebornCheckbox>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
