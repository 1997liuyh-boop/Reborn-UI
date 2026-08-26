<script setup lang="ts">
import RebornNoticeBar from "~/components/reborn/ui/reborn-notice-bar/RebornNoticeBar.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  text: "在代码的宇宙里，每一行都是一颗星星，照亮前行的路。愿你的代码如诗般优雅，如画般美丽，Bug 永远追不上你的脚步。",
  speed: 60,
  scrollable: true,
  wrapable: false,
  color: "#ffffff",
  background: "#35B6F2",
  leftIcon: "lucide:volume-2",
  rightIcon: "lucide:chevron-right",
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "内容配置",
    children: [
      { label: "通知文本", key: "text", component: "input" as const, defaultValue: "" },
      { label: "左侧图标", key: "leftIcon", component: "input" as const },
      { label: "右侧图标", key: "rightIcon", component: "input" as const },
    ],
  },
  {
    title: "滚动控制",
    children: [
      { label: "自动滚动", key: "scrollable", component: "checkbox" as const, defaultValue: true },
      { label: "多行展示", key: "wrapable", component: "checkbox" as const, defaultValue: false },
      {
        label: "滚动速率",
        key: "speed",
        component: "slider" as const,
        defaultValue: 60,
        props: { min: 10, max: 200, step: 10 },
      },
    ],
  },
  {
    title: "样式自定义",
    children: [
      { label: "文本颜色", key: "color", component: "color-picker" as const, defaultValue: "#ffffff" },
      { label: "背景颜色", key: "background", component: "color-picker" as const, defaultValue: "#35B6F2" },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const noticeBarCode = computed(() => {
  const s = state.value;
  const props: string[] = [`text="${s.text}"`];

  if (!s.scrollable) props.push(':scrollable="false"');
  if (s.wrapable) props.push("wrapable");
  if (s.speed !== 60) props.push(`:speed="${s.speed}"`);
  if (s.leftIcon) props.push(`left-icon="${s.leftIcon}"`);
  if (s.rightIcon) props.push(`right-icon="${s.rightIcon}"`);
  props.push(`color="${s.color}"`, `background="${s.background}"`);

  return `<RebornNoticeBar\n  ${props.join("\n  ")}\n/>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 可关闭示例的显隐状态 */
const visible = ref(true);
const noticeBarRef = ref<any>(null);

/** 重新播放滚动动画 */
function handleReplay() {
  noticeBarRef.value?.replay();
}

function handleClose() {
  visible.value = false;
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="noticeBarCode"
      component-name="RebornNoticeBar"
      title="交互演练场"
      description="调节滚动速率、图标与配色，实时预览通知栏的循环播放效果。"
    >
      <RebornNoticeBar
        v-bind="state"
        class="w-full max-w-xl"
      />
    </Playground>

    <DemoSection
      title="多消息轮播"
      description="text 传入数组即可轮播多条消息，direction 决定横向滚动还是纵向切换。"
    >
      <DemoBlock layout="stack">
        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">水平滚动 · 默认 <code>direction="horizontal"</code></span>
          <RebornNoticeBar
            :text="['🔥 消息1：系统升级公告', '📢 消息2：新功能上线区', '🎯 消息3：限时优惠开启']"
            scrollable
          />
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">垂直轮播 · <code>direction="vertical"</code></span>
          <RebornNoticeBar
            :text="['第一条：在代码的宇宙里，每一行都是一颗星星。', '第二条：愿你的代码如诗般优雅，如画般美丽。', '第三条：Bug 永远追不上你的脚步。']"
            direction="vertical"
            :interval="1500"
            left-icon="lucide:megaphone"
          />
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">垂直轮播 + 默认插槽 · <code>{ item, index }</code></span>
          <RebornNoticeBar
            :text="['账户安全提示', '系统维护公告', '会员福利发放']"
            direction="vertical"
            :interval="2500"
            background="#f0f9ff"
            color="#0369a1"
            left-icon="lucide:shield-check"
          >
            <template #default="{ item, index }">
              <div class="flex items-center gap-2">
                <span class="bg-primary/20 text-primary rounded-ui-2xs px-1.5 py-0.5 text-sm font-bold">
                  {{ index === 0 ? "安全" : index === 1 ? "公告" : "福利" }}
                </span>
                <span class="cursor-pointer font-medium underline">{{ item }}</span>
              </div>
            </template>
          </RebornNoticeBar>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="语义化风格"
      description="通过 color 与 background 组合出提示、警告、成功、错误四类语义样式。"
    >
      <DemoBlock layout="stack">
        <RebornNoticeBar
          text="这是一条普通通知，使用了默认样式。"
          left-icon="lucide:info"
        />
        <RebornNoticeBar
          text="这是一条告警通知，自定义了明亮的警告色。"
          color="#ed6a0c"
          background="#fffbe8"
          left-icon="lucide:alert-triangle"
        />
        <RebornNoticeBar
          text="操作成功！系统已完成所有挂起任务。"
          color="#07c160"
          background="#e8f7e8"
          left-icon="lucide:check-circle"
        />
        <RebornNoticeBar
          text="发现严重错误，请立即检查服务器状态。"
          color="#ee0a24"
          background="#fff0f0"
          left-icon="lucide:x-circle"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="插槽灵活性"
      description="left-icon / right-icon / 默认插槽均可替换，用于承载富文本与自定义图形。"
    >
      <DemoBlock layout="stack">
        <RebornNoticeBar>
          <template #left-icon>
            <div class="bg-primary/20 flex size-6 items-center justify-center rounded-full">
              <span class="text-xs">🔥</span>
            </div>
          </template>
          <span class="font-medium">限时抢购：</span>
          <span class="text-primary font-bold">5折</span>
          <span>优惠最后两小时，不要错过！</span>
        </RebornNoticeBar>

        <RebornNoticeBar>
          <span class="hover:text-primary cursor-pointer underline decoration-dashed transition-colors">
            点击查看协议详情
          </span>
          <template #right-icon>
            <Icon
              name="lucide:external-link"
              class="size-4 opacity-50"
            />
          </template>
        </RebornNoticeBar>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="事件与方法"
      description="监听 close 事件实现关闭；通过模板 ref 调用 replay() 可重新播放滚动动画。"
    >
      <DemoBlock layout="stack">
        <RebornNoticeBar
          ref="noticeBarRef"
          text="点击右侧图标可重新播放滚动动画。"
          right-icon="lucide:refresh-cw"
          @click="handleReplay"
        />
        <RebornNoticeBar
          v-if="visible"
          text="点击右侧图标即可关闭此通知栏。"
          right-icon="lucide:x"
          @close="handleClose"
          @click="handleClose"
        />
        <RebornButton
          v-else
          variant="soft"
          size="sm"
          label="重置可见性"
          @click="visible = true"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="状态控制"
      description="disabled 会停止全部动画并降低不透明度；内容未溢出时组件也会自动停止滚动。"
    >
      <DemoBlock layout="stack">
        <RebornNoticeBar
          text="这条通知栏将停止所有动画并降低不透明度。"
          disabled
        />
        <RebornNoticeBar
          :text="state.text"
          :scrollable="false"
        />
      </DemoBlock>
      <DemoNote tone="dimmed">提示：当内容宽度未超出容器时，滚动动画不会启动。</DemoNote>
    </DemoSection>
  </div>
</template>
