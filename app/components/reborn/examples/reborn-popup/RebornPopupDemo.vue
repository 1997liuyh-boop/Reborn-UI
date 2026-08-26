<script setup lang="ts">
// ─── 交互演练场 ─────────────────────────────────────────────────

/** 弹出方向 */
const positionOptions = [
  { label: "居中 center", value: "center" },
  { label: "顶部 top", value: "top" },
  { label: "底部 bottom", value: "bottom" },
  { label: "左侧 left", value: "left" },
  { label: "右侧 right", value: "right" },
];

/** 过渡动画；留空表示按 position 自动推导 */
const transitionOptions = [
  { label: "自动（跟随 position）", value: "" },
  { label: "fade 淡入淡出", value: "fade" },
  { label: "fade-up 上浮淡入", value: "fade-up" },
  { label: "fade-down 下沉淡入", value: "fade-down" },
  { label: "zoom 缩放", value: "zoom" },
  { label: "zoom-in 放大进入", value: "zoom-in" },
  { label: "zoom-out 缩小进入", value: "zoom-out" },
  { label: "slide-up 上滑", value: "slide-up" },
  { label: "slide-right 右滑", value: "slide-right" },
];

const state = ref<Record<string, any>>({
  position: "center",
  transition: "",
  size: "420px",
  title: "RebornPopup 演示",
  showHeader: true,
  showClose: true,
  modal: true,
  resizable: false,
  round: true,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "方向与尺寸",
    children: [
      {
        label: "弹出方向",
        key: "position",
        component: "select" as const,
        defaultValue: "center",
        props: { options: positionOptions },
      },
      {
        label: "过渡动画",
        key: "transition",
        component: "select" as const,
        defaultValue: "",
        props: { options: transitionOptions },
      },
      {
        label: "尺寸（宽或高，随方向而定）",
        key: "size",
        component: "input" as const,
        defaultValue: "420px",
      },
    ],
  },
  {
    title: "结构与交互",
    children: [
      { label: "标题文案", key: "title", component: "input" as const, defaultValue: "RebornPopup 演示" },
      { label: "显示头部", key: "showHeader", component: "checkbox" as const, defaultValue: true },
      { label: "显示关闭按钮", key: "showClose", component: "checkbox" as const, defaultValue: true },
      { label: "显示遮罩层", key: "modal", component: "checkbox" as const, defaultValue: true },
      { label: "边缘拖拽缩放", key: "resizable", component: "checkbox" as const, defaultValue: false },
      { label: "圆角样式", key: "round", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const popupCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="open"'];

  if (s.position !== "bottom") props.push(`position="${s.position}"`);
  if (s.transition) props.push(`transition="${s.transition}"`);
  if (s.size !== "30%") props.push(`size="${s.size}"`);
  if (s.title) props.push(`title="${s.title}"`);
  if (!s.showHeader) props.push(":show-header=\"false\"");
  if (!s.showClose) props.push(":show-close=\"false\"");
  if (!s.modal) props.push(":modal=\"false\"");
  if (s.resizable) props.push("resizable");
  if (!s.round) props.push(":round=\"false\"");

  return `<RebornPopup\n  ${props.join("\n  ")}\n>\n  弹出层内容\n</RebornPopup>`;
});

/** 演练场弹出层的开关 */
const playgroundOpen = ref(false);

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 三层嵌套弹出层 */
const nestedLevel1 = ref(false);
const nestedLevel2 = ref(false);
const nestedLevel3 = ref(false);

/** 一次性收起所有嵌套层 */
function closeAllNested() {
  nestedLevel1.value = false;
  nestedLevel2.value = false;
  nestedLevel3.value = false;
}

/** 带页脚与关闭拦截的表单式弹出层 */
const formOpen = ref(false);
const agreed = ref(false);

/** 最近一次关闭是否被拦截 */
const lastBlocked = ref(false);

/** 未勾选协议时阻止关闭；done(true) 表示取消本次关闭 */
function guardClose(done: (cancel?: boolean) => void) {
  if (agreed.value) {
    done();
    return;
  }
  lastBlocked.value = true;
  done(true);
}

/** 无遮罩弹出层：不锁定页面滚动，可继续操作背后内容 */
const maskFreeOpen = ref(false);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="popupCode"
      component-name="RebornPopup"
      title="交互演练场"
      description="position 决定贴边方向与默认动画；size 在左右方向表示宽度，在上下方向表示高度。"
    >
      <RebornButton
        label="打开弹出层"
        @click="playgroundOpen = true"
      >
        <template #leading>
          <Icon name="lucide:panel-right-open" />
        </template>
      </RebornButton>

      <RebornPopup
        v-model="playgroundOpen"
        append-to-body
        :position="state.position"
        :transition="state.transition"
        :size="state.size"
        :title="state.title"
        :show-header="state.showHeader"
        :show-close="state.showClose"
        :modal="state.modal"
        :resizable="state.resizable"
        :round="state.round"
      >
        <div class="flex flex-col gap-3 p-4">
          <p class="text-muted text-sm leading-relaxed">
            弹出层自带表面样式与阴影，内容区直接书写业务结构即可，无需再包一层卡片。
          </p>
          <p
            v-if="state.resizable && state.position !== 'center'"
            class="text-dimmed flex items-center gap-2 text-xs"
          >
            <Icon name="lucide:grab" />
            拖拽弹出层的内侧边缘可实时调整尺寸。
          </p>
          <RebornButton
            variant="soft"
            color="neutral"
            label="关闭"
            @click="playgroundOpen = false"
          />
        </div>
      </RebornPopup>
    </Playground>

    <DemoSection
      title="多层嵌套"
      description="嵌套弹出层的 z-index 与遮罩会自动按层级递增，内层不会被外层遮罩压住。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornButton
          variant="outline"
          label="打开第一层"
          @click="nestedLevel1 = true"
        />
      </DemoBlock>

      <RebornPopup
        v-model="nestedLevel1"
        append-to-body
        position="center"
        title="第一层"
        size="420px"
      >
        <div class="flex flex-col gap-4 p-4">
          <p class="text-muted text-sm leading-relaxed">
            复杂业务里经常需要在当前会话之上再开一个子流程，此时直接嵌套即可。
          </p>
          <RebornButton
            variant="soft"
            label="开启第二层"
            @click="nestedLevel2 = true"
          />
        </div>

        <RebornPopup
          v-model="nestedLevel2"
          append-to-body
          position="center"
          title="第二层"
          size="340px"
        >
          <div class="flex flex-col gap-4 p-4">
            <p class="text-muted text-sm leading-relaxed">层级与遮罩已自动处理，无需手写 z-index。</p>
            <RebornButton
              variant="soft"
              color="neutral"
              label="开启第三层"
              @click="nestedLevel3 = true"
            />
          </div>

          <RebornPopup
            v-model="nestedLevel3"
            append-to-body
            position="center"
            title="第三层"
            size="280px"
          >
            <div class="flex flex-col items-center gap-3 p-4 text-center">
              <Icon
                name="lucide:check-circle"
                class="text-success size-8"
              />
              <p class="text-muted text-sm">三层堆叠完成，点击下方按钮可一次性全部关闭。</p>
              <RebornButton
                label="全部关闭"
                block
                @click="closeAllNested"
              />
            </div>
          </RebornPopup>
        </RebornPopup>
      </RebornPopup>
    </DemoSection>

    <DemoSection
      title="页脚与关闭拦截"
      description="footer 插槽用于放置操作区；before-close 接收 done 回调，调用 done(true) 即可取消本次关闭。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornButton
          variant="outline"
          label="打开带拦截的弹出层"
          @click="formOpen = true"
        />
      </DemoBlock>

      <DemoNote tone="dimmed">
        <template v-if="lastBlocked">
          最近一次关闭被 <code>before-close</code> 拦截，请先勾选协议。
        </template>
        <template v-else> 未勾选协议时点击关闭会被拦截。 </template>
      </DemoNote>

      <RebornPopup
        v-model="formOpen"
        append-to-body
        position="center"
        title="服务条款"
        size="440px"
        :before-close="guardClose"
      >
        <div class="flex flex-col gap-4 p-4">
          <p class="text-muted text-sm leading-relaxed">
            请先阅读并勾选下方协议，否则关闭动作会被 <code>before-close</code> 拦截。
          </p>
          <RebornCheckbox
            v-model="agreed"
            label="我已阅读并同意服务条款"
          />
        </div>

        <template #footer>
          <div class="flex w-full items-center justify-end gap-3 p-3">
            <RebornButton
              variant="soft"
              color="neutral"
              label="稍后再说"
              @click="formOpen = false"
            />
            <RebornButton
              label="确认并关闭"
              :disabled="!agreed"
              @click="formOpen = false"
            />
          </div>
        </template>
      </RebornPopup>
    </DemoSection>

    <DemoSection
      title="无遮罩模式"
      description="modal 为 false 时不渲染遮罩，页面滚动也不会被锁定，适合常驻的辅助面板。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornButton
          variant="outline"
          label="打开无遮罩面板"
          @click="maskFreeOpen = true"
        />
      </DemoBlock>

      <RebornPopup
        v-model="maskFreeOpen"
        append-to-body
        position="right"
        title="辅助面板"
        size="320px"
        :modal="false"
        :lock-scroll="false"
      >
        <div class="flex flex-col gap-3 p-4">
          <p class="text-muted text-sm leading-relaxed">
            没有遮罩，背后的页面依旧可以滚动与点击。
          </p>
          <RebornButton
            variant="soft"
            color="neutral"
            label="关闭面板"
            @click="maskFreeOpen = false"
          />
        </div>
      </RebornPopup>
    </DemoSection>
  </div>
</template>
