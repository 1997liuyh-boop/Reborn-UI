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

/** 自定义关闭元素示例的显隐状态 */
const closeElementShow = ref(true);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="alertCode"
      component-name="RebornAlert"
      title="交互演练场"
      description="调节参数实时预览警告提示；banner 模式会去除边框和圆角作为顶部公告使用。"
    >
      <RebornAlert
        :key="`${state.closable}`"
        :type="state.type"
        :variant="state.variant"
        :title="state.title || undefined"
        :show-icon="state.showIcon"
        :closable="state.closable"
        :banner="state.banner"
        :center="state.center"
      >
        {{ state.content }}
      </RebornAlert>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        <code>type</code> 同时决定默认图标与配色，五种类型对应五种语义；<code>normal</code> 用于公告等中性场景，配色映射为 <code>neutral</code>。
      </template>
      <DemoBlock layout="stack">
        <RebornAlert v-for="t in alertTypes" :key="t" :type="t">
          这是一条 {{ t }} 类型的警告提示
        </RebornAlert>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="变体：六种 variant">
      <template #description>
        <code>variant</code> 与 <code>RebornButton</code> 的同名变体着色规则一致（不含 <code>circle</code>），默认 <code>soft</code> 浅底；<code>round</code> 只把圆角改为胶囊。
      </template>
      <DemoBlock layout="stack">
        <RebornAlert v-for="v in alertVariants" :key="v" type="success" :variant="v">
          {{ v }} 变体的警告提示
        </RebornAlert>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="标题与操作区：title 与 action 插槽">
      <template #description>
        <code>title</code> 属性（或 <code>title</code> 插槽）设置加粗标题；<code>action</code> 插槽放在关闭按钮左侧，适合放一个跳转或处理按钮。
      </template>
      <DemoBlock layout="stack">
        <RebornAlert type="warning" title="存储空间不足">
          当前可用空间不足 10%，可能影响新数据写入，请及时清理。
          <template #action>
            <RebornButton size="sm" color="warning" variant="outlined">
              去清理
            </RebornButton>
          </template>
        </RebornAlert>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="关闭与受控显隐：closable 与 v-model:show">
      <template #description>
        <code>closable</code> 展示关闭按钮，点击后把 <code>show</code> 置为 <code>false</code> 并触发 <code>close</code>；200ms 淡出结束后触发 <code>after-close</code>。绑定 <code>v-model:show</code> 才能从外部重新唤起。
      </template>
      <DemoBlock layout="stack">
        <RebornAlert v-model:show="closableShow" type="info" closable @after-close="handleAfterClose">
          点击右侧按钮关闭这条提示
        </RebornAlert>
        <div class="flex items-center gap-3">
          <RebornButton v-if="!closableShow" size="sm" @click="closableShow = true; afterCloseLog = ''">
            重新显示
          </RebornButton>
          <span v-if="afterCloseLog" class="text-sm text-gray-6">{{ afterCloseLog }}</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义关闭元素：close-element 插槽">
      <template #description>
        <code>close-element</code> 插槽替换默认的关闭图标，仍需开启 <code>closable</code>。插槽外层已绑定关闭点击，插槽内的元素点击会冒泡触发关闭，无需再调用作用域参数 <code>close</code>。
      </template>
      <DemoBlock layout="stack">
        <RebornAlert v-model:show="closeElementShow" type="warning" closable>
          检测到新版本，刷新页面后生效。
          <template #close-element>
            <span class="whitespace-nowrap text-xs">不再提示</span>
          </template>
        </RebornAlert>
        <RebornButton v-if="!closeElementShow" size="sm" class="self-start" @click="closeElementShow = true">
          重新显示
        </RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="顶部公告与居中：banner 与 center">
      <template #description>
        <code>banner</code> 去除圆角与边框，适合贴着页面顶部通栏铺开；<code>center</code> 让图标与内容整体居中。
      </template>
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

    <DemoSection title="消息轮播：messages、direction 与 rows">
      <template #description>
        传入 <code>messages</code> 即变为轮播通知栏，默认插槽不再渲染。默认单条逐条垂直切换，间隔由 <code>interval</code> 控制；<code>direction="horizontal"</code> 把全部消息拼成一行跑马灯，<code>speed</code> 为每秒滚动像素；<code>rows</code> 大于 1 时多条同时可见并逐行上移。鼠标移入时暂停。
      </template>
      <DemoBlock layout="stack">
        <RebornAlert
          type="normal"
          banner
          :messages="noticeMessages"
          :interval="2500"
          closable
          @change="noticeIndex = $event"
        />
        <span class="text-sm text-gray-6">单条逐条垂直轮播：当前第 {{ noticeIndex + 1 }} / {{ noticeMessages.length }} 条</span>
        <RebornAlert type="info" banner :messages="noticeMessages" direction="horizontal" :speed="60" closable />
        <span class="text-sm text-gray-6">水平跑马灯滚动（speed = 60 px/s）</span>
        <RebornAlert type="warning" banner :messages="noticeMessages" :rows="2" :interval="2000" closable />
        <span class="text-sm text-gray-6">多条消息垂直滚动（rows = 2，每次上移一行）</span>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
