<script setup lang="ts">
import {
  textareaColors,
  textareaSizes,
} from "~/components/reborn/ui/reborn-textarea/reborn-textarea.config";

/** 演练场绑定值 */
const state = ref<Record<string, any>>({
  size: "md",
  color: "primary",
  border: true,
  showWordLimit: true,
  customLimit: false,
  disabled: false,
  autoHeight: false,
});

/** 演练场中输入框的内容 */
const value = ref("");

/** 自定义 ui 示例的初始内容 */
const poem = ref(
  "轻轻的我走了，正如我轻轻的来；我轻轻的招手，作别西天的云彩。那河畔的金柳，是夕阳中的新娘；波光里的艳影，在我的心头荡漾。",
);

/** 演练场控制面板配置 */
const controls = [
  {
    title: "外观",
    children: [
      {
        label: "字号",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: textareaSizes.map((s) => ({ label: s, value: s })) },
      },
      {
        label: "聚焦边框颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: textareaColors.map((c) => ({ label: c, value: c })) },
      },
      { label: "边框", key: "border", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "行为",
    children: [
      { label: "字数统计", key: "showWordLimit", component: "checkbox" as const, defaultValue: true },
      { label: "自定义统计插槽", key: "customLimit", component: "checkbox" as const, defaultValue: false },
      { label: "高度自适应", key: "autoHeight", component: "checkbox" as const, defaultValue: false },
      { label: "禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const textareaCode = computed(
  () =>
    `<RebornTextarea\n  v-model="value"\n  size="${state.value.size}"\n  color="${state.value.color}"\n  :border="${state.value.border}"\n  :show-word-limit="${state.value.showWordLimit}"\n  :auto-height="${state.value.autoHeight}"\n  :disabled="${state.value.disabled}"\n  placeholder="请输入内容..."\n/>`,
);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="textareaCode"
      component-name="RebornTextarea"
      title="交互演练场"
      description="color 只在聚焦态生效，需要同时开启 border 才能看到；开启高度自适应后 rows 失效，输入框会随内容增长。"
    >
      <RebornTextarea
        v-model="value"
        :size="state.size"
        :color="state.color"
        :border="state.border"
        :show-word-limit="state.showWordLimit"
        :auto-height="state.autoHeight"
        :disabled="state.disabled"
        placeholder="请输入内容..."
      >
        <template
          v-if="state.customLimit"
          #limit="{ length, max }"
        >
          <span class="text-dimmed absolute right-3 bottom-2 text-xs">
            已输入 {{ length }} / {{ max }}
          </span>
        </template>
      </RebornTextarea>
    </Playground>

    <DemoSection
      title="自定义样式"
      description="通过 ui 覆盖 root / inner / text 三个插槽的类名，可在不改组件源码的前提下换一套配色。"
    >
      <DemoBlock layout="stack">
        <RebornTextarea
          v-model="poem"
          show-word-limit
          :maxlength="1000"
          :rows="6"
          placeholder="自定义样式"
          :ui="{
            root: 'bg-elevated ring-primary/40 focus-within:ring-primary',
            inner: 'text-primary placeholder:text-primary/50',
            text: 'text-primary/70',
          }"
        />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
