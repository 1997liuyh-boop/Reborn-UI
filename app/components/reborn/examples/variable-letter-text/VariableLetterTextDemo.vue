<script setup lang="ts">
import type { Transition } from "motion-v";
import type { VariableLetterTextProps } from "../../ui/variable-letter-text";
import { computed, ref } from "vue";
import RebornButton from "../../ui/reborn-button/RebornButton.vue";
import VariableLetterText from "../../ui/variable-letter-text/VariableLetterText.vue";

type StaggerOrigin = NonNullable<VariableLetterTextProps["staggerFrom"]>;

const defaultState = {
  label: "Variable Letter Text",
  fromWeight: 400,
  toWeight: 900,
  duration: 0.7,
  staggerDuration: 0.03,
  staggerFrom: "first" as StaggerOrigin,
};
const state = ref({ ...defaultState });
const controls = [
  {
    title: "文本与字重",
    children: [
      { label: "文字", key: "label", component: "input" as const, defaultValue: defaultState.label },
      { label: "起始字重", key: "fromWeight", component: "slider" as const, defaultValue: 400, props: { min: 100, max: 900, step: 100 } },
      { label: "悬停字重", key: "toWeight", component: "slider" as const, defaultValue: 900, props: { min: 100, max: 900, step: 100 } },
    ],
  },
  {
    title: "动画节奏",
    children: [
      { label: "时长（秒）", key: "duration", component: "slider" as const, defaultValue: 0.7, props: { min: 0.1, max: 1, step: 0.1 } },
      { label: "字符间隔（秒）", key: "staggerDuration", component: "slider" as const, defaultValue: 0.03, props: { min: 0, max: 0.1, step: 0.01 } },
      {
        label: "起始位置",
        key: "staggerFrom",
        component: "select" as const,
        defaultValue: "first",
        props: { options: [{ label: "首字", value: "first" }, { label: "中间", value: "center" }, { label: "尾字", value: "last" }] },
      },
    ],
  },
];

const transition = computed<Transition>(() => ({ type: "spring", duration: state.value.duration }));
const code = computed(() => [
  "<VariableLetterText",
  `  :label='${JSON.stringify(state.value.label).replaceAll("'", "&#39;")}'`,
  `  from-font-variation-settings="'wght' ${state.value.fromWeight}"`,
  `  to-font-variation-settings="'wght' ${state.value.toWeight}"`,
  `  :transition="{ type: 'spring', duration: ${state.value.duration} }"`,
  `  :stagger-duration="${state.value.staggerDuration}"`,
  `  stagger-from="${state.value.staggerFrom}"`,
  '  class="font-sans text-3xl"',
  "/>",
].join("\n"));

function resetState() {
  state.value = { ...defaultState };
}
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground
      v-model="state" :controls="controls" :code="code" component-name="VariableLetterText"
      title="交互演练场" description="调整起始字重、悬停字重和字符间隔，再将鼠标移到文字上。"
    >
      <template #tag>
        <RebornButton size="md" variant="soft" color="neutral" @click="resetState">
          重置配置
        </RebornButton>
      </template>
      <VariableLetterText
        class="font-sans text-3xl"
        :label="state.label" :from-font-variation-settings="`'wght' ${state.fromWeight}`"
        :to-font-variation-settings="`'wght' ${state.toWeight}`" :transition="transition"
        :stagger-duration="state.staggerDuration" :stagger-from="state.staggerFrom"
      />
    </Playground>

    <DemoSection title="字重变化" description="悬停时从初始字重过渡到目标字重，移出后复原。">
      <VariableLetterText class="font-sans text-2xl" label="Variable Weight" />
    </DemoSection>

    <DemoSection title="交错顺序" description="将 `staggerFrom` 设为 `center`，让动画从文字中间向两侧播放。">
      <VariableLetterText class="font-sans text-2xl" label="From the Center" stagger-from="center" :stagger-duration="0.05" />
    </DemoSection>
  </div>
</template>
