<script lang="ts" setup>
import {
  transitionStyles,
  type TransitionName,
} from "~/components/reborn/ui/reborn-transition/reborn-transition.config";

/** 内置动画名称，直接取自组件配置，避免手工维护列表 */
const transitionNames = Object.keys(transitionStyles) as TransitionName[];

const state = ref<Record<string, any>>({
  name: "fade-up" as TransitionName,
  duration: 500,
  hold: 1500,
});

/** 演练场控制面板配置 */
const controls = computed(() => [
  {
    title: "动画配置",
    children: [
      {
        label: "动画名称",
        key: "name",
        component: "select" as const,
        defaultValue: "fade-up",
        props: { options: transitionNames.map((n) => ({ label: n, value: n })) },
      },
      {
        label: "动画时长 (ms)",
        key: "duration",
        component: "slider" as const,
        defaultValue: 500,
        props: { min: 100, max: 2000, step: 50 },
      },
      {
        label: "停留时长 (ms)",
        key: "hold",
        component: "slider" as const,
        defaultValue: 1500,
        props: { min: 500, max: 4000, step: 100 },
      },
    ],
  },
]);

/** 演练场右上角展示的等价代码 */
const transitionCode = computed(
  () =>
    `<RebornTransition\n  :show="show"\n  name="${state.value.name}"\n  :duration="${state.value.duration}"\n>\n  <div class="...">内容</div>\n</RebornTransition>`,
);

const show = ref(false);
const customShow = ref(false);

let timer: ReturnType<typeof setTimeout> | null = null;

/** 播放内置动画：显示后按停留时长自动收起 */
function play() {
  if (timer) clearTimeout(timer);
  show.value = false;

  // 下一帧再置为 true，保证连续点击时能重新触发入场
  requestAnimationFrame(() => {
    show.value = true;
    timer = setTimeout(() => {
      show.value = false;
    }, state.value.hold);
  });
}

let customTimer: ReturnType<typeof setTimeout> | null = null;

/** 播放自定义动画类 */
function playCustom() {
  if (customTimer) clearTimeout(customTimer);
  customShow.value = true;
  customTimer = setTimeout(() => {
    customShow.value = false;
  }, 1200);
}

onUnmounted(() => {
  if (timer) clearTimeout(timer);
  if (customTimer) clearTimeout(customTimer);
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="transitionCode"
      component-name="RebornTransition"
      title="交互演练场"
      description="show 控制显隐，name 指定内置动画，duration 可传数字或 { enter, leave } 分别设置进出场时长。"
    >
      <template #tag>
        <RebornButton
          size="sm"
          variant="soft"
          color="primary"
          label="播放动画"
          @click="play"
        >
          <template #leading>
            <Icon
              name="lucide:play"
              size="12"
            />
          </template>
        </RebornButton>
      </template>

      <!-- 动画舞台：滑动类动画需要一个有边界的可视区域才说得清，此处仅描边不填充 -->
      <div
        class="border-default rounded-ui-md relative flex h-44 w-full items-center justify-center overflow-hidden border"
      >
        <span
          v-if="!show"
          class="text-dimmed text-sm"
        >点击右上角「播放动画」预览</span>

        <RebornTransition
          :show="show"
          :name="state.name"
          :duration="state.duration"
          class="absolute"
        >
          <div
            class="bg-primary rounded-ui-sm flex size-24 items-center justify-center text-xs font-medium text-white"
          >
            {{ state.name }}
          </div>
        </RebornTransition>
      </div>
    </Playground>

    <DemoSection
      title="自定义动画类"
      description="不使用内置 name，改为传入 enter-class / enter-active-class / enter-to-class 等六个类名，可完全接管动画曲线；duration 传对象即可让进出场时长不同。"
    >
      <DemoBlock layout="stack">
        <RebornButton
          size="sm"
          variant="outline"
          color="neutral"
          label="播放自定义动画"
          @click="playCustom"
        >
          <template #leading>
            <Icon
              name="lucide:play"
              size="12"
            />
          </template>
        </RebornButton>

        <div
          class="border-default rounded-ui-md relative flex h-44 w-full items-center justify-center overflow-hidden border"
        >
          <span
            v-if="!customShow"
            class="text-dimmed text-sm"
          >进场旋转 180° 飞入，离场反向飞出</span>

          <RebornTransition
            :show="customShow"
            :duration="{ enter: 700, leave: 1000 }"
            enter-class="custom-enter"
            enter-active-class="custom-enter-active"
            enter-to-class="custom-enter-to"
            leave-class="custom-leave"
            leave-active-class="custom-leave-active"
            leave-to-class="custom-leave-to"
            class="absolute"
          >
            <div
              class="bg-error rounded-ui-sm flex size-24 items-center justify-center text-xs font-medium text-white"
            >
              custom
            </div>
          </RebornTransition>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>

<style scoped>
/* 自定义动画：进场从左上角旋转飞入，离场向右下角旋转飞出 */
:deep(.custom-enter-active),
:deep(.custom-leave-active) {
  transition-property: transform, opacity;
}

:deep(.custom-enter) {
  transform: translate3d(-100px, -100px, 0) rotate(-180deg);
  opacity: 0;
}

:deep(.custom-leave-to) {
  transform: translate3d(100px, 100px, 0) rotate(180deg);
  opacity: 0;
}
</style>
