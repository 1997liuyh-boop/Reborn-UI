<script setup lang="ts">
import RebornOverlay from "~/components/reborn/ui/reborn-overlay/RebornOverlay.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  duration: 300,
  closeOnClickOverlay: true,
});

/** 演练场内局部遮罩的显隐 */
const playgroundVisible = ref(false);

/** 演练场控制面板配置 */
const controls = [
  {
    title: "基础属性",
    children: [
      {
        label: "过渡时长（ms）",
        key: "duration",
        component: "slider" as const,
        defaultValue: 300,
        props: { min: 100, max: 1200, step: 50 },
      },
      {
        label: "点击遮罩关闭",
        key: "closeOnClickOverlay",
        component: "checkbox" as const,
        defaultValue: true,
      },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const overlayCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="visible"', "absolute"];

  if (s.duration !== 300) props.push(`:duration="${s.duration}"`);
  if (!s.closeOnClickOverlay) props.push(':close-on-click-overlay="false"');

  return `<div class="relative">\n  <RebornOverlay\n    ${props.join("\n    ")}\n  />\n</div>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 全屏遮罩显隐 */
const fullscreenVisible = ref(false);

/** 自定义样式遮罩显隐 */
const gradientVisible = ref(false);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="overlayCode"
      component-name="RebornOverlay"
      title="交互演练场"
      description="absolute 让遮罩只覆盖最近的定位父级，适合在卡片或区块内部做局部蒙层。"
    >
      <div class="flex w-full flex-col items-center gap-4">
        <!-- 局部遮罩宿主：仅描边不填充，保证遮罩的覆盖范围可见 -->
        <div
          class="border-default rounded-ui-sm relative flex h-[260px] w-full max-w-md items-center justify-center overflow-hidden border border-dashed"
        >
          <span class="text-dimmed text-sm">遮罩仅覆盖这个虚线区域</span>

          <RebornOverlay
            v-model="playgroundVisible"
            absolute
            :duration="state.duration"
            :close-on-click-overlay="state.closeOnClickOverlay"
          >
            <div class="flex h-full items-center justify-center">
              <div class="bg-default border-default rounded-ui-md w-[240px] border p-5 text-center">
                <p class="text-highlighted text-sm font-medium">局部遮罩内容</p>
                <p class="text-muted mt-1 text-xs">
                  {{ state.closeOnClickOverlay ? "点击遮罩可关闭" : "已禁止点击遮罩关闭" }}
                </p>
                <RebornButton
                  class="mt-4"
                  size="sm"
                  variant="soft"
                  block
                  label="关闭"
                  @click="playgroundVisible = false"
                />
              </div>
            </div>
          </RebornOverlay>
        </div>

        <RebornButton
          label="展开局部遮罩"
          @click="playgroundVisible = true"
        />
      </div>
    </Playground>

    <DemoSection
      title="全屏遮罩"
      description="默认覆盖整个视口，并自动锁定页面滚动；关闭后按 duration 时长淡出。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornButton
          label="展开全屏遮罩"
          @click="fullscreenVisible = true"
        />
      </DemoBlock>

      <RebornOverlay v-model="fullscreenVisible">
        <div class="flex h-full items-center justify-center">
          <div class="bg-default border-default rounded-ui-md w-[280px] border p-6 text-center">
            <p class="text-highlighted text-base font-medium">全屏遮罩</p>
            <p class="text-muted mt-1.5 text-sm">页面滚动已被锁定，点击遮罩或按钮均可关闭。</p>
            <RebornButton
              class="mt-5"
              block
              label="我知道了"
              @click="fullscreenVisible = false"
            />
          </div>
        </div>
      </RebornOverlay>
    </DemoSection>

    <DemoSection
      title="自定义样式"
      description="custom-class 与 custom-style 可覆盖遮罩自身的背景，用于渐变蒙层等品牌化场景。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornButton
          variant="outline"
          label="展开渐变遮罩"
          @click="gradientVisible = true"
        />
      </DemoBlock>

      <RebornOverlay
        v-model="gradientVisible"
        :duration="450"
        custom-style="background: linear-gradient(135deg, rgba(53,182,242,0.92), rgba(50,236,149,0.92));"
      >
        <div class="flex h-full items-center justify-center">
          <div class="text-center text-white">
            <p class="text-2xl font-bold">Reborn UI</p>
            <p class="mt-2 text-sm opacity-80">点击任意位置关闭</p>
          </div>
        </div>
      </RebornOverlay>

      <DemoNote tone="dimmed">
        遮罩内容通过默认插槽渲染，容器高度为 100%，可直接用 flex 做居中布局。
      </DemoNote>
    </DemoSection>
  </div>
</template>
