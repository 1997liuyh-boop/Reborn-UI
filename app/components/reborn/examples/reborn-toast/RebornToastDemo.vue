<script setup lang="ts">
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { message } from "~/components/reborn/ui/reborn-toast/index";
import {
  messageTypes,
  messageVariants,
} from "~/components/reborn/ui/reborn-toast/reborn-toast.config";

const typeOptions = messageTypes.map((t) => ({ label: t, value: t }));
const variantOptions = messageVariants.map((v) => ({ label: v, value: v }));

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  content: "这是一条消息提示",
  type: "success",
  variant: "base",
  duration: 3,
  pauseOnHover: true,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "内容与外观",
    children: [
      { label: "提示内容", key: "content", component: "input" as const, defaultValue: "这是一条消息提示" },
      {
        label: "消息类型",
        key: "type",
        component: "select" as const,
        defaultValue: "success",
        props: { options: typeOptions },
      },
      {
        label: "视觉变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "base",
        props: { options: variantOptions },
      },
    ],
  },
  {
    title: "行为",
    children: [
      {
        label: "自动关闭延时（秒，0 不自动关闭）",
        key: "duration",
        component: "slider" as const,
        defaultValue: 3,
        props: { min: 0, max: 10, step: 1 },
      },
      { label: "悬停暂停计时", key: "pauseOnHover", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const messageCode = computed(() => {
  const s = state.value;
  const config: string[] = [`content: "${s.content}"`];
  if (s.variant !== "base") config.push(`variant: "${s.variant}"`);
  if (s.duration !== 3) config.push(`duration: ${s.duration}`);
  if (!s.pauseOnHover) config.push("pauseOnHover: false");

  return config.length === 1 && s.duration === 3
    ? `message.${s.type}("${s.content}")`
    : `message.${s.type}({\n  ${config.join(",\n  ")},\n})`;
});

function fireFromPlayground() {
  const s = state.value;
  message[s.type as (typeof messageTypes)[number]]({
    content: s.content,
    variant: s.variant,
    duration: s.duration,
    pauseOnHover: s.pauseOnHover,
  });
}

// ─── 场景演示 ───────────────────────────────────────────────────

/** Promise 接口：loading 关闭后接续提示 */
function firePromiseDemo() {
  message.loading("正在提交…", 1.5).then(() => {
    message.success("提交成功，感谢反馈！");
  });
}

/** 同 key 更新：先 loading 再原位变成功 */
function fireKeyDemo() {
  message.loading({ content: "加载中…", key: "updatable", duration: 0 });
  setTimeout(() => {
    message.success({ content: "加载完成！", key: "updatable", duration: 2 });
  }, 1200);
}

/** maxCount 演示：限 3 条后连发 6 条 */
function fireMaxCountDemo() {
  message.config({ maxCount: 3 });
  for (let i = 1; i <= 6; i++) {
    message.info(`第 ${i} 条消息（最多同时 3 条）`, 2 + i * 0.4);
  }
  // 演示完还原，避免影响其他示例
  setTimeout(() => message.config({ maxCount: 0 }), 100);
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="messageCode"
      component-name="message"
      title="交互演练场"
      description="message 为命令式 API，调节参数后点击按钮触发；悬停在消息上可暂停自动关闭计时。"
    >
      <RebornButton @click="fireFromPlayground">弹出消息</RebornButton>
    </Playground>

    <DemoSection
      title="基本用法"
      description="五个静态方法对应五种消息类型；基础变体为白底浮层 + 语义色圆形图标，3 秒后自动关闭。"
    >
      <DemoBlock layout="row" align="center">
        <RebornButton @click="message.success('操作成功！')">Success</RebornButton>
        <RebornButton color="error" @click="message.error('出错了，请稍后重试。')">Error</RebornButton>
        <RebornButton color="warning" @click="message.warning('这是一条警告提示。')">Warning</RebornButton>
        <RebornButton color="info" @click="message.info('这是一条普通信息。')">Info</RebornButton>
        <RebornButton color="neutral" @click="message.loading('加载中…', 2)">Loading</RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="视觉变体"
      description="base 之外提供 filled / outlined / soft / subtle 四种变体，配色与按钮组件的同名变体一致。"
    >
      <DemoBlock layout="row" align="center">
        <RebornButton
          v-for="v in messageVariants" :key="v"
          @click="message.success({ content: `${v} 变体的消息提示`, variant: v })"
        >
          {{ v }}
        </RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="Promise 接口"
      description="静态方法返回 Promise，在消息关闭后兑现，可用 then 串联后续动作。"
    >
      <DemoBlock layout="row" align="center">
        <RebornButton @click="firePromiseDemo">loading → then → success</RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="更新内容与全局方法"
      description="传相同 key 可原位更新消息并重置计时；message.config 设置 maxCount 等全局项，message.destroy 立即关闭。"
    >
      <DemoBlock layout="row" align="center">
        <RebornButton @click="fireKeyDemo">同 key 原位更新</RebornButton>
        <RebornButton @click="fireMaxCountDemo">maxCount 限 3 连发 6 条</RebornButton>
        <RebornButton color="error" variant="outlined" @click="message.destroy()">destroy 全部关闭</RebornButton>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
