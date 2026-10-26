<script setup lang="ts">
import type { PlaygroundControlGroup } from "~/components/common/play-ground/Playground.vue";
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import dayjs from "dayjs";
import { computed, onMounted, shallowRef, useTemplateRef, watch } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornCountdown from "~/components/reborn/ui/reborn-countdown/RebornCountdown.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 时长只是示例控制项，实际传给组件的是绝对时间戳。 */
const defaultState = {
  seconds: 90,
  format: "HH:mm:ss",
  title: "活动剩余时间",
  prefix: "",
  suffix: "",
  emphasized: false,
};
const state = shallowRef({ ...defaultState });
/** 客户端挂载后赋值，避免示例本身在服务端读取不同时钟。 */
const target = shallowRef<number>();
/** 获取公开的显示文本，与组件实际显示内容一起更新。 */
const countdownRef = useTemplateRef<InstanceType<typeof RebornCountdown>>("countdownRef");
/** 收起原生输入框的默认字符宽度，防止控制项撑开演练场窄栏。 */
const inputControlProps = { ui: { input: "w-0" } };
/** 回显时间变化与结束次数。 */
const lastRemaining = shallowRef(0);
const finishCount = shallowRef(0);
/** 重新计算演练场的截止时间。 */
function restartPlayground() {
  lastRemaining.value = 0;
  target.value = Date.now() + state.value.seconds * 1000;
}
/** 重置配置与事件计数，并开始新的倒计时。 */
function resetState() {
  state.value = { ...defaultState };
  finishCount.value = 0;
  restartPlayground();
}
/** 记录组件派发的剩余毫秒数。 */
function handleChange(value: number) {
  lastRemaining.value = value;
}
/** 演练场控制项，不把示例时长开关当作组件参数。 */
const controls: PlaygroundControlGroup[] = [
  {
    title: "基础属性",
    children: [
      {
        label: "从现在开始的秒数",
        key: "seconds",
        component: "input-number",
        defaultValue: 90,
        props: { ...inputControlProps, min: 0, max: 604800 },
        codeIgnore: true,
      },
      { label: "显示格式", key: "format", component: "input", defaultValue: "HH:mm:ss", props: inputControlProps },
      { label: "标题", key: "title", component: "input", defaultValue: defaultState.title, props: inputControlProps },
      { label: "前缀", key: "prefix", component: "input", defaultValue: "", props: inputControlProps },
      { label: "后缀", key: "suffix", component: "input", defaultValue: "", props: inputControlProps },
    ],
  },
  {
    title: "样式",
    children: [
      { label: "数字区使用主题色", key: "emphasized", component: "checkbox", defaultValue: false, codeIgnore: true },
    ],
  },
];
/** 生成可直接运行的配置代码，时间值保持毫秒时间戳语义。 */
const countdownCode = computed(() => {
  const s = state.value;
  return `<RebornCountdown\n  :value="Date.now() + ${s.seconds} * 1000"\n  format="${s.format}"\n  title="${s.title}"\n  prefix="${s.prefix}"\n  suffix="${s.suffix}"\n  :value-style="${s.emphasized ? "{ color: 'var(--color-primary-6)' }" : "{}"}"\n/>`;
});
watch(() => state.value.seconds, restartPlayground);

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 各场景使用独立目标，重新开始一个示例不会影响其他倒计时。 */
const basicTarget = shallowRef<number>();
const longTarget = shallowRef<dayjs.Dayjs>();
const millisecondTarget = shallowRef<number>();
const eventTarget = shallowRef<number>();
const eventRemaining = shallowRef(0);
const eventFinished = shallowRef(false);
/** 重新开始短倒计时，便于观察完成回调。 */
function restartEvent() {
  eventFinished.value = false;
  eventTarget.value = Date.now() + 5000;
}
/** 重放毫秒示例，结束后保持零。 */
function restartMilliseconds() {
  millisecondTarget.value = Date.now() + 10000;
}
onMounted(() => {
  restartPlayground();
  basicTarget.value = Date.now() + 7 * 3600000;
  longTarget.value = dayjs().add(2, "day").add(3, "hour");
  restartMilliseconds();
  restartEvent();
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="countdownCode"
      component-name="RebornCountdown"
      title="交互演练场"
      description="调节目标时长和显示格式，观察剩余毫秒变化与倒计时结束事件。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading><Icon name="lucide:rotate-ccw" size="12" /></template>
          重置配置
        </RebornButton>
      </template>
      <div class="flex w-full min-w-0 flex-col items-start gap-5">
        <RebornCountdown
          ref="countdownRef"
          :value="target"
          :format="state.format"
          :title="state.title"
          :prefix="state.prefix"
          :suffix="state.suffix"
          :value-style="state.emphasized ? { color: 'var(--color-primary-6)' } : undefined"
          @change="handleChange"
          @finish="finishCount++"
        />
        <RebornButton size="sm" variant="outlined" @click="restartPlayground">重新开始</RebornButton>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          displayValue：{{ countdownRef?.displayValue }}；剩余 {{ lastRemaining }} ms；已结束 {{ finishCount }} 次
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="目标时间">
      <template #description>
        <code>value</code>
        接收毫秒时间戳或 Dayjs 对象，默认格式为
        <code>HH:mm:ss</code>。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <RebornCountdown title="距离活动开始" :value="basicTarget" />
        <RebornCountdown title="会员剩余时长" :value="longTarget" />
      </DemoBlock>
      <DemoNote tone="dimmed">默认格式没有天数，超过一天时小时会累计，例如两天显示为 48 小时。</DemoNote>
    </DemoSection>

    <DemoSection title="显示格式">
      <template #description>
        <code>format</code>
        支持天、小时、分、秒和毫秒；方括号中的文字原样输出，不参与单位计算。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <RebornCountdown title="包含天数" :value="longTarget" format="DD [天] HH:mm:ss" />
        <div class="flex flex-col items-start gap-3">
          <RebornCountdown title="毫秒倒计时" :value="millisecondTarget" format="ss.SSS" suffix="秒" />
          <RebornButton size="sm" variant="outlined" @click="restartMilliseconds">重播 10 秒</RebornButton>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="标题与前后缀">
      <template #description>
        <code>title</code>、<code>prefix</code>、<code>suffix</code>
        的同名插槽覆盖文字，结构样式与 Statistic 一致。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <RebornCountdown
          title="限时活动"
          :value="basicTarget"
          prefix="还剩"
          suffix="结束"
          :ui="{ prefix: 'text-base text-gray-8', suffix: 'text-base text-gray-8' }"
        />
        <RebornCountdown :value="basicTarget" :value-style="{ color: 'var(--color-primary-6)' }">
          <template #title>
            <span class="inline-flex items-center gap-1">
              <Icon name="lucide:calendar-clock" class="size-4" />
              距离开售
            </span>
          </template>
          <template #prefix><Icon name="lucide:timer" class="size-5" /></template>
          <template #suffix><span class="text-base">后开始</span></template>
        </RebornCountdown>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="事件与重置">
      <template #description>
        <code>change</code>
        回传剩余毫秒数，<code>finish</code>
        在到零时触发一次；更新
        <code>value</code>
        可重新开始。
      </template>
      <DemoBlock layout="stack">
        <RebornCountdown
          title="短倒计时"
          :value="eventTarget"
          @change="eventRemaining = $event"
          @finish="eventFinished = true"
        />
        <RebornButton size="sm" variant="outlined" @click="restartEvent">开始 5 秒倒计时</RebornButton>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          剩余 {{ eventRemaining }} ms；{{ eventFinished ? "已结束，未再重复派发 finish" : "进行中" }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
