<script setup lang="ts">
import type { PlaygroundControlGroup } from "~/components/common/play-ground/Playground.vue";
import { DemoBlock, DemoNote, DemoSection, Playground } from "#components";
import { computed, shallowRef } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { launchScreenEffects } from "~/components/reborn/ui/reui-launch/reui-launch.config";
import ReuiLaunchDoodle from "~/components/reborn/ui/reui-launch/ReuiLaunchDoodle.vue";

type ScreenEffect = (typeof launchScreenEffects)[number];

/** 屏幕模式来自组件枚举，选项与对比卡片共用中文名称。 */
const screenEffectLabels: Record<ScreenEffect, string> = {
  crt: "CRT扫描",
  blink: "文字闪烁",
  typewriter: "终端打字",
  none: "静态",
};
const screenEffectOptions = launchScreenEffects.map(value => ({ label: screenEffectLabels[value], value }));
/** 对比卡片说明每种模式的实际表现。 */
const screenEffectDescriptions: Record<ScreenEffect, string> = {
  crt: "文字轻微明暗变化，扫描光带掠过屏幕，光标闪烁。",
  blink: "屏幕文字低频明暗闪烁，保留闪烁光标。",
  typewriter: "按完整字素逐字显现，完成后停留，再重新播放。",
  none: "完整显示屏幕文字，关闭屏幕动效。",
};

// ─── 交互演练场 ─────────────────────────────────────────────────
/** 演练场覆盖组件的文字、屏幕动效、取景和展开状态。 */
const defaultState = { text: "REUI", screenText: "RE", screenEffect: "crt" as ScreenEffect, compact: false, expanded: false };
const state = shallowRef({ ...defaultState });
/** 原生点击次数与重新挂载序号，重置时同时清除内部固定状态。 */
const clickCount = shallowRef(0);
const previewKey = shallowRef(0);

/** 恢复默认参数和交互状态。 */
function resetState() {
  state.value = { ...defaultState };
  clickCount.value = 0;
  previewKey.value += 1;
}

/** 统计根按钮继承的原生点击，不依赖自定义事件。 */
function onClick() {
  clickCount.value += 1;
}

/** 转义静态属性，避免引号、标签或换行破坏复制代码。 */
function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#13;").replace(/\n/g, "&#10;");
}

/** 全量参数代码与预览使用同一份状态。 */
const launchCode = computed(() => `<ReuiLaunchDoodle\n  text="${escapeAttribute(state.value.text)}"\n  screen-text="${escapeAttribute(state.value.screenText)}"\n  screen-effect="${state.value.screenEffect}"\n  :compact="${state.value.compact}"\n  :expanded="${state.value.expanded}"\n/>`);

/** 控件只绑定组件已实现的参数。 */
const controls: PlaygroundControlGroup[] = [
  {
    title: "文字与屏幕",
    children: [
      { label: "外侧文字", key: "text", component: "input", defaultValue: "REUI" },
      { label: "屏幕文字", key: "screenText", component: "input", defaultValue: "RE" },
      { label: "屏幕动效", key: "screenEffect", component: "select", defaultValue: "crt", props: { options: screenEffectOptions } },
    ],
  },
  {
    title: "布局与状态",
    children: [
      { label: "紧凑标题", key: "compact", component: "checkbox", defaultValue: false },
      { label: "保持展开", key: "expanded", component: "checkbox", defaultValue: false },
    ],
  },
];

// ─── 场景演示状态 ───────────────────────────────────────────────
/** 保持展开示例可切回默认交互。 */
const expanded = shallowRef(true);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="launchCode" component-name="ReuiLaunchDoodle"
      title="交互演练场" description="编辑外侧与屏幕文字，切换屏幕动效、紧凑取景和保持展开，查看不同组合的表现。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">重置配置</RebornButton>
      </template>
      <div class="flex w-full min-w-0 flex-col items-center gap-4">
        <ReuiLaunchDoodle
          :key="previewKey" v-bind="state" class="max-w-2xl" @click="onClick"
        />
        <DemoNote tone="dimmed" aria-live="polite">已点击 {{ clickCount }} 次；鼠标移入展开，点击固定，触屏轻点切换；键盘可用 Enter、空格和 Esc。</DemoNote>
      </div>
    </Playground>

    <DemoSection title="文本演示">
      <template #description>
        <code>text</code> 设置电脑两侧的文字，空格划分左右；<code>screenText</code> 独立设置屏幕文字。
      </template>
      <DemoBlock layout="stack">
        <ReuiLaunchDoodle text="Reborn UI" screen-text="RE" class="mx-auto w-full max-w-2xl" />
      </DemoBlock>
      <DemoNote tone="dimmed">没有空格时，<code>text</code> 按字素平分左右；短词更适合电脑两侧的有限空间。</DemoNote>
    </DemoSection>

    <DemoSection title="屏幕动效">
      <template #description>
        <code>screenEffect</code> 默认使用 <code>crt</code>；屏幕动效独立于展开状态，无需悬停即可播放。
      </template>
      <DemoBlock layout="stack">
        <div class="grid w-full gap-4 md:grid-cols-2">
          <figure v-for="effect in screenEffectOptions" :key="effect.value" class="min-w-0">
            <ReuiLaunchDoodle text="REUI" screen-text="READY" :screen-effect="effect.value" class="w-full" />
            <figcaption class="mt-3 text-base font-medium">{{ effect.label }}</figcaption>
            <p class="mt-1 text-sm text-gray-7">{{ screenEffectDescriptions[effect.value] }}</p>
          </figure>
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">离开视口或切到后台时暂停播放；系统开启减少动态效果时，所有模式均显示静态完整文字。</DemoNote>
    </DemoSection>

    <DemoSection title="紧凑标题">
      <template #description>
        <code>compact</code> 收紧取景留白；通过根节点的文字色与透明背景，把动画放入页面标题区域。
      </template>
      <DemoBlock layout="stack">
        <div class="w-full rounded-2xl bg-gray-1 p-4 sm:p-6">
          <ReuiLaunchDoodle text="Reborn UI" screen-text="RE" compact class="mx-auto max-w-xl bg-transparent! text-gray-10!" />
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">紧凑取景保留展开图形；宽度由外层布局决定，<code>compact</code> 不设置固定像素宽度。</DemoNote>
    </DemoSection>

    <DemoSection title="保持展开">
      <template #description>
        <code>expanded</code> 强制展示展开构图，适合核对图形细节；关闭后恢复悬停和点击控制。
      </template>
      <DemoBlock layout="stack">
        <RebornButton
          size="sm" color="neutral" variant="outlined" :aria-pressed="expanded" @click="expanded = !expanded"
        >
          {{ expanded ? "恢复交互" : "保持展开" }}
        </RebornButton>
        <ReuiLaunchDoodle :expanded="expanded" class="mx-auto w-full max-w-2xl" />
      </DemoBlock>
      <DemoNote tone="dimmed"><code>expanded</code> 为 true 时，点击与 Esc 不会收起图形；系统开启减少动态效果时，旋转动画停止。</DemoNote>
    </DemoSection>
  </div>
</template>
