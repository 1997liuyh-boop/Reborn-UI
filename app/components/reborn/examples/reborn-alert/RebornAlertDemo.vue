<script setup lang="ts">
import {
  alertTypes,
  alertVariants,
} from "~/components/reborn/ui/reborn-alert/reborn-alert.config";
import RebornAlert from "~/components/reborn/ui/reborn-alert/RebornAlert.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";

const typeOptions = alertTypes.map((t) => ({ label: t, value: t }));
const variantOptions = alertVariants.map((v) => ({ label: v, value: v }));

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  type: "info",
  variant: "soft",
  title: "",
  content: "这是一条警告提示的内容",
  showIcon: true,
  closable: false,
  banner: false,
  center: false,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "内容与外观",
    children: [
      {
        label: "消息类型",
        key: "type",
        component: "select" as const,
        defaultValue: "info",
        props: { options: typeOptions },
      },
      {
        label: "视觉变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "soft",
        props: { options: variantOptions },
      },
      { label: "标题", key: "title", component: "input" as const, defaultValue: "" },
      { label: "提示内容", key: "content", component: "input" as const, defaultValue: "这是一条警告提示的内容" },
    ],
  },
  {
    title: "行为与布局",
    children: [
      { label: "展示图标", key: "showIcon", component: "checkbox" as const, defaultValue: true },
      { label: "展示关闭按钮", key: "closable", component: "checkbox" as const, defaultValue: false },
      { label: "顶部公告模式（banner）", key: "banner", component: "checkbox" as const, defaultValue: false },
      { label: "内容居中", key: "center", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const alertCode = computed(() => {
  const s = state.value;
  const attrs: string[] = [`type="${s.type}"`];
  if (s.variant !== "soft") attrs.push(`variant="${s.variant}"`);
  if (s.title) attrs.push(`title="${s.title}"`);
  if (!s.showIcon) attrs.push(':show-icon="false"');
  if (s.closable) attrs.push("closable");
  if (s.banner) attrs.push("banner");
  if (s.center) attrs.push("center");
  return `<RebornAlert ${attrs.join(" ")}>${s.content}</RebornAlert>`;
});

// ─── 场景演示 ───────────────────────────────────────────────────

/** 可关闭示例的显隐状态与关闭动画回调 */
const closableShow = ref(true);
const afterCloseLog = ref("");
function handleAfterClose() {
  afterCloseLog.value = "after-close 已触发（关闭动画结束）";
}

/** 轮播通知栏消息 */
const noticeMessages = [
  "系统将于今晚 24:00 进行升级维护",
  "新版本 2.41.0 已发布，新增 normal 类型",
  "文档站已支持双端演示与在线运行",
  "组件库知识库与 AI 助手已上线，欢迎试用",
];
const noticeIndex = ref(0);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground v-model="state" :controls="controls" :code="alertCode" component-name="RebornAlert" title="交互演练场"
      description="调节参数实时预览警告提示；banner 模式会去除边框和圆角作为顶部公告使用。">
      <RebornAlert :key="`${state.closable}`" :type="state.type" :variant="state.variant"
        :title="state.title || undefined" :show-icon="state.showIcon" :closable="state.closable" :banner="state.banner"
        :center="state.center">
        {{ state.content }}
      </RebornAlert>
    </Playground>

    <DemoSection title="基本用法" description="五种消息类型对应五种语义配色与默认图标；normal 为 2.41.0 新增类型，用于公告等中性场景。">
      <DemoBlock layout="stack">
        <RebornAlert v-for="t in alertTypes" :key="t" :type="t">
          这是一条 {{ t }} 类型的警告提示
        </RebornAlert>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="视觉变体" description="六种视觉变体对齐按钮组件的同名变体（不含 circle），默认为 soft 浅底。">
      <DemoBlock layout="stack">
        <RebornAlert v-for="v in alertVariants" :key="v" type="success" :variant="v">
          {{ v }} 变体的警告提示
        </RebornAlert>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="标题与操作项" description="通过 title 属性（或 title 插槽）设置标题，action 插槽放置右侧操作项。">
      <DemoBlock layout="stack">
        <RebornAlert type="warning" title="存储空间不足">
          当前可用空间不足 10%，可能影响新数据写入，请及时清理。
          <template #action>
            <RebornButton size="sm" color="warning" variant="outlined">去清理</RebornButton>
          </template>
        </RebornAlert>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="可关闭" description="closable 展示关闭按钮，点击触发 close 事件；关闭动画结束后触发 after-close，支持 v-model:show 受控。">
      <DemoBlock layout="stack">
        <RebornAlert v-model:show="closableShow" type="info" closable @after-close="handleAfterClose">
          点击右侧按钮关闭这条提示
        </RebornAlert>
        <div class="flex items-center gap-3">
          <RebornButton v-if="!closableShow" size="sm" @click="closableShow = true; afterCloseLog = ''">重新显示
          </RebornButton>
          <span v-if="afterCloseLog" class="text-sm text-gray-6">{{ afterCloseLog }}</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="顶部公告（banner）" description="banner 模式去除边框和圆角，适合置于页面顶部；可配合 center 让内容居中。">
      <DemoBlock layout="stack">
        <RebornAlert title="重要消息提示" type="warning" banner closable>
          注意：本环境为演示环境，数据每日凌晨重置。
          <template #action>
            <div class="flex flex-col gap-1">
              <RebornButton size="sm">
                确定
              </RebornButton>
              <RebornButton size="sm" variant="subtle" color="warning">
                收到
              </RebornButton>
            </div>
          </template>
        </RebornAlert>
        <RebornAlert type="error" banner center closable>
          服务当前不可用，请稍后重试。
        </RebornAlert>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="消息轮播通知栏"
      description="通过 messages 传入消息即变为轮播通知栏，三种形态：默认单条逐条垂直轮播；direction=horizontal 全部消息拼成一行水平跑马灯，speed 控制速率；rows 大于 1 时多条消息同时可见并逐行向上滚动。interval 控制间隔，悬停暂停。"
    >
      <DemoBlock layout="stack">
        <RebornAlert type="normal" banner :messages="noticeMessages" :interval="2500" closable
          @change="noticeIndex = $event" />
        <span class="text-sm text-gray-6">单条逐条垂直轮播：当前第 {{ noticeIndex + 1 }} / {{ noticeMessages.length }} 条</span>
        <RebornAlert type="info" banner :messages="noticeMessages" direction="horizontal" :speed="60" closable />
        <span class="text-sm text-gray-6">水平跑马灯滚动（speed = 60 px/s）</span>
        <RebornAlert type="warning" banner :messages="noticeMessages" :rows="2" :interval="2000" closable />
        <span class="text-sm text-gray-6">多条消息垂直滚动（rows = 2，每次上移一行）</span>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
