<script setup lang="ts">
import { useToast } from "~/components/reborn/ui/reborn-toast/index";

const toast = useToast();

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  msg: "操作成功",
  iconName: "success",
  position: "middle",
  duration: 2000,
  cover: false,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "内容与图标",
    children: [
      { label: "提示文案", key: "msg", component: "input" as const, defaultValue: "操作成功" },
      {
        label: "图标类型",
        key: "iconName",
        component: "select" as const,
        defaultValue: "success",
        props: {
          options: [
            { label: "success 成功", value: "success" },
            { label: "error 错误", value: "error" },
            { label: "warning 警告", value: "warning" },
            { label: "info 常规", value: "info" },
            { label: "loading 加载", value: "loading" },
          ],
        },
      },
    ],
  },
  {
    title: "位置与行为",
    children: [
      {
        label: "弹出位置",
        key: "position",
        component: "select" as const,
        defaultValue: "middle",
        props: {
          options: [
            { label: "顶部 top", value: "top" },
            { label: "偏上 middle-top", value: "middle-top" },
            { label: "居中 middle", value: "middle" },
            { label: "底部 bottom", value: "bottom" },
          ],
        },
      },
      {
        label: "停留时长（ms，0 表示常驻）",
        key: "duration",
        component: "slider" as const,
        defaultValue: 2000,
        props: { min: 0, max: 5000, step: 500 },
      },
      { label: "显示遮罩层", key: "cover", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const toastCode = computed(() => {
  const s = state.value;
  const lines: string[] = [`msg: "${s.msg}"`, `iconName: "${s.iconName}"`];

  if (s.position !== "middle") lines.push(`position: "${s.position}"`);
  if (s.duration !== 2000) lines.push(`duration: ${s.duration}`);
  if (s.cover) lines.push("cover: true");

  return `const toast = useToast()\n\ntoast.show({\n  ${lines.join(",\n  ")},\n})`;
});

/** 按当前演练场配置弹出提示 */
function showPlaygroundToast() {
  toast.show({
    msg: state.value.msg,
    iconName: state.value.iconName,
    position: state.value.position,
    duration: state.value.duration,
    cover: state.value.cover,
  });
}

// ─── 场景演示 ───────────────────────────────────────────────────

/** 语义化快捷方法：自带配色与图标 */
const semanticTypes = [
  { key: "success", label: "成功", color: "success" },
  { key: "info", label: "常规", color: "info" },
  { key: "error", label: "错误", color: "error" },
  { key: "warning", label: "警告", color: "warning" },
] as const;

function showSemantic(type: (typeof semanticTypes)[number]["key"]) {
  toast[type]({ msg: `这是一条 ${type} 提示`, duration: 1500 });
}

/** 四个方位的定位演示 */
const positions = [
  { value: "top", label: "顶部" },
  { value: "middle-top", label: "偏上" },
  { value: "middle", label: "居中" },
  { value: "bottom", label: "底部" },
] as const;

function showPosition(position: (typeof positions)[number]["value"], label: string) {
  toast.show({ position, msg: `${label} Toast` });
}

/** 基础加载：duration 为 0 时需手动关闭 */
function showLoading() {
  toast.loading("3 秒后自动关闭");
  setTimeout(() => toast.close(), 3000);
}

/** 长文本加载：验证 max-w 与换行表现 */
function showLongLoading() {
  toast.loading({
    msg: "芦叶满汀洲，寒沙带浅流。二十年重过南楼。柳下系船犹未稳，能几日，又中秋。",
    duration: 0,
  });
  setTimeout(() => toast.close(), 3000);
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="toastCode"
      component-name="RebornToast"
      title="交互演练场"
      description="Toast 通过 useToast() 命令式调用，无需在模板中放置组件；调节参数后点击按钮即可预览。"
    >
      <RebornButton
        label="触发 Toast"
        @click="showPlaygroundToast"
      >
        <template #leading>
          <Icon name="lucide:bell-ring" />
        </template>
      </RebornButton>
    </Playground>

    <DemoSection
      title="语义化提示"
      description="success / info / error / warning 四个快捷方法会自动带上对应的配色与图标。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornButton
          v-for="item in semanticTypes"
          :key="item.key"
          :color="item.color"
          :label="item.label"
          @click="showSemantic(item.key)"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="弹出位置"
      description="position 支持 top / middle-top / middle / bottom 四档，居中为默认值。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornButton
          v-for="item in positions"
          :key="item.value"
          variant="outlined"
          :label="item.label"
          @click="showPosition(item.value, item.label)"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="加载提示"
      description="loading 默认 duration 为 0，即常驻显示，需要业务侧在流程结束后主动调用 close()。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornButton
          variant="soft"
          label="基础加载"
          @click="showLoading"
        />
        <RebornButton
          variant="soft"
          label="长文本加载"
          @click="showLongLoading"
        />
        <RebornButton
          variant="soft"
          color="neutral"
          label="立即关闭"
          @click="toast.close()"
        />
      </DemoBlock>

      <DemoNote tone="dimmed">
        <code>toast.close()</code> 与 <code>toast.hide()</code> 等价，均只关闭当前这一条全局提示。
      </DemoNote>
    </DemoSection>
  </div>
</template>
