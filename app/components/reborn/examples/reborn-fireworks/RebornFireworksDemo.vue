<script lang="ts" setup>
/** 默认粒子参数：抽出便于一键重置 */
const defaultState = {
  burstCount: 160,
  angleCenter: 270,
  angleSpread: 130,
  speedMin: 8,
  speedMax: 24,
  particleScale: 1,
};

const state = ref<Record<string, any>>({ ...defaultState });

function resetState() {
  state.value = { ...defaultState };
}

/** 滑块步进可能带来浮点误差，粒子大小统一保留一位小数 */
watch(
  () => state.value.particleScale,
  (val) => {
    const rounded = Math.round(val * 10) / 10;
    if (rounded !== val) state.value.particleScale = rounded;
  },
);

/** 演练场控制面板配置 */
const controls = [
  {
    title: "粒子属性",
    children: [
      { label: "粒子数量", key: "burstCount", component: "slider" as const, defaultValue: 160, props: { min: 20, max: 400, step: 10 } },
      { label: "最小速度", key: "speedMin", component: "slider" as const, defaultValue: 8, props: { min: 1, max: 30 } },
      { label: "最大速度", key: "speedMax", component: "slider" as const, defaultValue: 24, props: { min: 1, max: 60 } },
      { label: "粒子大小", key: "particleScale", component: "slider" as const, defaultValue: 1, props: { min: 0.2, max: 3, step: 0.1 } },
    ],
  },
  {
    title: "发射方向",
    children: [
      { label: "中心角度", key: "angleCenter", component: "slider" as const, defaultValue: 270, props: { min: 0, max: 360 } },
      { label: "扩散范围", key: "angleSpread", component: "slider" as const, defaultValue: 130, props: { min: 10, max: 360 } },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const fireworksCode = computed(() => {
  const s = state.value;
  const props: string[] = [];

  if (s.burstCount !== 160) props.push(`:burst-count="${s.burstCount}"`);
  if (s.angleCenter !== 270) props.push(`:angle-center="${s.angleCenter}"`);
  if (s.angleSpread !== 130) props.push(`:angle-spread="${s.angleSpread}"`);
  if (s.speedMin !== 8) props.push(`:speed-min="${s.speedMin}"`);
  if (s.speedMax !== 24) props.push(`:speed-max="${s.speedMax}"`);
  if (s.particleScale !== 1) props.push(`:particle-scale="${s.particleScale}"`);

  const attrs = props.length ? `\n  ${props.join("\n  ")}\n` : "";

  return `<RebornFireworks${attrs}>\n  <template #default="{ launch }">\n    <!-- 业务内容，调用 launch(el) 发射 -->\n  </template>\n</RebornFireworks>`;
});

/** 演练场海报的说明文字：实时反映当前粒子参数 */
const playgroundCaption = computed(
  () => `粒子数: ${state.value.burstCount} · 角度: ${state.value.angleCenter}° ± ${Math.round(state.value.angleSpread / 2)}°`,
);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="fireworksCode"
      component-name="RebornFireworks"
      title="交互演练场"
      description="实时调节粒子参数，点击海报中的标题或底部按钮触发礼花；作用域插槽提供 launch 方法与 launchCount 计数。"
    >
      <template #tag>
        <RebornButton
          size="sm"
          variant="soft"
          color="neutral"
          label="重置配置"
          @click="resetState"
        >
          <template #leading>
            <Icon
              name="lucide:rotate-ccw"
              size="12"
            />
          </template>
        </RebornButton>
      </template>

      <FireworksPoster
        title="Fireworks"
        subtitle="Container"
        :caption="playgroundCaption"
        :burst-count="state.burstCount"
        :angle-center="state.angleCenter"
        :angle-spread="state.angleSpread"
        :speed-min="state.speedMin"
        :speed-max="state.speedMax"
        :particle-scale="state.particleScale"
      />
    </Playground>

    <DemoSection
      title="容器内绽放"
      description="默认模式：画布挂在组件自身容器内，粒子被容器的 overflow 裁切，不会溢出到页面其他区域。"
    >
      <DemoBlock
        layout="row"
        align="start"
      >
        <FireworksPoster
          title="Fireworks"
          subtitle="Container"
          caption="粒子在卡片内部绽放，适合局部庆祝反馈。"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="全屏弹出"
      description="开启 teleport 后画布传送至 body，礼花覆盖整个浏览器窗口，可突破容器的 overflow 与 z-index 限制。"
    >
      <DemoBlock
        layout="row"
        align="start"
      >
        <FireworksPoster
          title="Fireworks"
          subtitle="Browser Popup"
          caption="粒子铺满整个视口，适合支付成功、任务达成等全局庆祝。"
          teleport
        />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
