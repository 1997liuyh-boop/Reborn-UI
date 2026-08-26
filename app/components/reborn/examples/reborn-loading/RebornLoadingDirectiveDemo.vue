<script setup lang="ts">
/**
 * Loading 指令与服务演示
 * 聚焦 v-loading 指令与 useLoading 服务式调用（加载图标本身的样式请参阅 RebornLoadingDemo）
 */
import { LoadingTypes, LoadingColors } from "~/components/reborn/ui/reborn-loading/reborn-loading.config";
import { useLoading } from "~/composables/useLoading";

/* ==================== 交互演练场 ==================== */

/** 默认状态：抽出便于一键重置 */
const defaultState = {
  loading: true,
  fullscreen: false,
  lock: false,
  text: "正在同步订单数据…",
  type: "ring",
  color: "primary",
  customColor: "#7c3aed",
  size: 24,
  background: "default",
};
const state = ref<Record<string, any>>({ ...defaultState });

function resetState() {
  state.value = { ...defaultState };
}

/** 图标类型选项：直接由组件 config 的枚举驱动，与真实能力永远同步 */
const typeOptions = LoadingTypes.map((t) => ({ label: t, value: t }));

/** 颜色选项：预设色 + 自定义（联动 color-picker） */
const colorOptions = [
  ...LoadingColors.map((c) => ({ label: c, value: c })),
  { label: "自定义颜色…", value: "custom" },
];

/** 遮罩背景选项：默认跟随主题，其余为精选半透明配方 */
const backgroundOptions = [
  { label: "默认（跟随主题）", value: "default" },
  { label: "玻璃白雾", value: "rgba(255,255,255,0.62)" },
  { label: "深邃暗夜", value: "rgba(2,6,23,0.78)" },
  { label: "品牌薄雾", value: "rgba(124,58,237,0.14)" },
];

const controls = [
  {
    title: "遮罩状态",
    children: [
      {
        label: "加载中 (v-loading)",
        key: "loading",
        component: "checkbox" as const,
        defaultValue: true,
      },
      {
        label: "全屏遮罩 (.fullscreen · 2 秒后自动关闭)",
        key: "fullscreen",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "锁定滚动 (.lock)",
        key: "lock",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
  {
    title: "视觉定制",
    children: [
      {
        label: "加载文字",
        key: "text",
        component: "input" as const,
        defaultValue: "正在同步订单数据…",
        props: { placeholder: "留空则只显示图标" },
      },
      {
        label: "图标类型",
        key: "type",
        component: "select" as const,
        defaultValue: "ring",
        props: { options: typeOptions },
      },
      {
        label: "颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: colorOptions },
      },
      {
        // 仅在选择「自定义颜色…」时展示（hide 联动）
        label: "自定义色值",
        key: "customColor",
        component: "color-picker" as const,
        defaultValue: "#7c3aed",
        hide: (_v: any, m: Record<string, any>) => m.color !== "custom",
      },
      {
        label: "图标尺寸",
        key: "size",
        component: "slider" as const,
        defaultValue: 24,
        props: { min: 16, max: 56, step: 2 },
      },
      {
        label: "遮罩背景",
        key: "background",
        component: "select" as const,
        defaultValue: "default",
        props: { options: backgroundOptions },
      },
    ],
  },
];

/** 最终生效的颜色：预设色名或自定义色值 */
const playgroundColor = computed(() =>
  state.value.color === "custom" ? state.value.customColor : state.value.color,
);

/** 最终生效的遮罩背景：default 表示不覆盖（跟随主题） */
const playgroundBackground = computed(() =>
  state.value.background === "default" ? null : state.value.background,
);

/**
 * 指令用法的代码生成：
 * Playground 自动生成固定假设 v-model，指令场景不适用，
 * 故用 computed 拼接真实的「修饰符 + reborn-loading-* 属性」写法
 */
const codeString = computed(() => {
  const s = state.value;
  const mods = `${s.fullscreen ? ".fullscreen" : ""}${s.lock ? ".lock" : ""}`;
  const lines = ["<div", `  v-loading${mods}="loading"`];
  if (s.text) lines.push(`  reborn-loading-text="${s.text}"`);
  if (s.type !== "ring") lines.push(`  reborn-loading-type="${s.type}"`);
  if (playgroundColor.value !== "primary") lines.push(`  reborn-loading-color="${playgroundColor.value}"`);
  if (s.size !== 24) lines.push(`  reborn-loading-size="${s.size}px"`);
  if (playgroundBackground.value) lines.push(`  reborn-loading-background="${playgroundBackground.value}"`);
  lines.push(">", "  <!-- 业务内容 -->", "</div>");
  return lines.join("\n");
});

/** 全屏演练保护：全屏遮罩会覆盖控制面板，开启后 2.2 秒自动结束加载，避免用户被「锁」在遮罩后面 */
let fullscreenTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => [state.value.fullscreen, state.value.loading],
  ([fs, ld]) => {
    if (fullscreenTimer) {
      clearTimeout(fullscreenTimer);
      fullscreenTimer = null;
    }
    if (fs && ld) {
      fullscreenTimer = setTimeout(() => {
        state.value.loading = false;
      }, 2200);
    }
  },
);

/** 演练场的宿主数据：模拟订单表格（可滚动，便于观察 lock 锁定效果） */
const orders = [
  { id: "RB-2107", name: "流光无线耳机 Pro", status: "已发货", tone: "success", amount: "¥ 1,299" },
  { id: "RB-2106", name: "星环智能手表 S2", status: "待支付", tone: "warning", amount: "¥ 2,499" },
  { id: "RB-2105", name: "极光机械键盘 87", status: "配送中", tone: "info", amount: "¥ 699" },
  { id: "RB-2104", name: "云感人体工学椅", status: "已完成", tone: "neutral", amount: "¥ 1,899" },
  { id: "RB-2103", name: "澄澈显示器 4K 27", status: "已发货", tone: "success", amount: "¥ 3,299" },
  { id: "RB-2102", name: "随行充电宝 20000", status: "退款中", tone: "error", amount: "¥ 199" },
  { id: "RB-2101", name: "轻语降噪耳塞", status: "已完成", tone: "neutral", amount: "¥ 499" },
  { id: "RB-2100", name: "晨昏氛围灯", status: "配送中", tone: "info", amount: "¥ 329" },
];

/** 状态徽标配色：只用语义色，徽标属于原子标记而非嵌套盒子 */
const statusTone: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  error: "bg-error/10 text-error",
  neutral: "bg-accented text-muted",
};

/* ==================== 区域加载（数据看板） ==================== */

const boardLoading = ref(false);
/** 看板统计卡数据 */
const boardStats = [
  { label: "今日成交", value: "¥ 86,420", trend: "+12.6%", icon: "lucide:trending-up" },
  { label: "新增用户", value: "1,284", trend: "+4.2%", icon: "lucide:users" },
  { label: "转化率", value: "38.9%", trend: "+1.8%", icon: "lucide:target" },
];

/** 趋势条的高度百分比（纯装饰数据，用来撑出一个有内容的加载宿主） */
const trendBars = [42, 66, 51, 80, 62, 92, 71, 58, 84, 68, 95, 76];

/** 点击刷新：1.6 秒后自动结束加载 */
function refreshBoard() {
  if (boardLoading.value) return;
  boardLoading.value = true;
  setTimeout(() => {
    boardLoading.value = false;
  }, 1600);
}

/* ==================== 属性定制矩阵 ==================== */

/** 四种 reborn-loading-* 组合，常驻展示 */
const attrCases = [
  { label: '预设色 · type="bars-scale" color="info"', type: "bars-scale", color: "info", text: "信息流刷新中…", size: null as string | null, background: null as string | null },
  { label: '自定义色 · color="#d946ef" size="30px"', type: "gooey-balls", color: "#d946ef", text: "AI 生成中…", size: "30px", background: null },
  { label: "深色遮罩 · background 覆盖默认底", type: "blocks-wave", color: "#a78bfa", text: "夜间模式渲染…", size: null, background: "rgba(2, 6, 23, 0.85)" },
  { label: '无文字 · type="spinner" color="warning"', type: "spinner", color: "warning", text: null as string | null, size: "32px", background: null },
];

/* ==================== 全屏加载（指令修饰符） ==================== */

const fullscreenOn = ref(false);
/** 触发全屏加载：2 秒后自动关闭，期间 .lock 锁定页面滚动 */
function triggerFullscreen() {
  if (fullscreenOn.value) return;
  fullscreenOn.value = true;
  setTimeout(() => {
    fullscreenOn.value = false;
  }, 2000);
}

/* ==================== 服务式 useLoading ==================== */

/** 操作日志（让每一次调用都「有回应」） */
const serviceLogs = ref<{ time: string; msg: string; tone: "info" | "success" }[]>([]);

function pushLog(msg: string, tone: "info" | "success" = "info") {
  serviceLogs.value.push({
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
    msg,
    tone,
  });
  // 最多保留 7 条，超出后滚动淘汰
  if (serviceLogs.value.length > 7) serviceLogs.value.shift();
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const publishing = ref(false);
/** 模拟分步发布流程：演示 setText 更新文案 + patch 动态换装 + close 关闭 */
async function runPublishFlow() {
  if (publishing.value) return;
  publishing.value = true;
  const loading = useLoading({ text: "正在连接服务器…", type: "ring", size: "30px" });
  pushLog("useLoading() 创建全屏加载实例");
  await sleep(900);
  loading.setText("正在上传资源 (1/2)…");
  pushLog("setText('正在上传资源 (1/2)…')");
  await sleep(900);
  loading.setText("正在上传资源 (2/2)…");
  pushLog("setText('正在上传资源 (2/2)…')");
  await sleep(900);
  loading.patch({ type: "bars-scale", color: "success", text: "发布成功，正在收尾…" });
  pushLog("patch({ type: 'bars-scale', color: 'success' })");
  await sleep(1100);
  loading.close();
  pushLog("close() 遮罩淡出并销毁", "success");
  publishing.value = false;
}

const targetRunning = ref(false);
/** 局部服务式加载：通过 CSS 选择器锁定目标容器（日志面板），3 秒后关闭 */
async function runTargetLoading() {
  if (targetRunning.value) return;
  targetRunning.value = true;
  const loading = useLoading({
    target: "#reborn-loading-service-panel",
    text: "局部遮罩 · 3 秒后 close()",
    type: "blocks-shuffle",
    color: "secondary",
    size: "28px",
  });
  pushLog("useLoading({ target: '#…' }) 局部遮罩");
  await sleep(3000);
  loading.close();
  pushLog("close() 关闭局部遮罩", "success");
  targetRunning.value = false;
}

/** 组件卸载时清理演练场遗留定时器 */
onUnmounted(() => {
  if (fullscreenTimer) clearTimeout(fullscreenTimer);
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <!-- 交互演练场：Playground 自带标题栏 -->
    <Playground v-model="state" :controls="controls" :code="codeString" component-name="v-loading" title="交互演练场"
      description="实时调节遮罩参数；开启全屏模式后遮罩将覆盖整页并在 2 秒后自动关闭">
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <!--
        宿主容器：遮罩必须覆盖在一个真实区域上，这个区域本身就是被演示的对象，
        属示例规范里唯一允许的那层浅填充；其内部不再出现任何填充盒。
      -->
      <div v-loading="{ loading: state.loading, fullscreen: state.fullscreen, lock: state.lock }"
        :reborn-loading-text="state.text || null" :reborn-loading-type="state.type"
        :reborn-loading-color="playgroundColor" :reborn-loading-size="state.size + 'px'"
        :reborn-loading-background="playgroundBackground"
        class="bg-elevated rounded-ui-base h-[400px] w-full max-w-2xl overflow-y-auto">
        <!-- 表头需遮挡下方滚过的行，沿用与容器同色的底，视觉上仍是同一层表面 -->
        <div class="bg-elevated border-default sticky top-0 z-[1] flex items-center justify-between border-b px-6 py-4">
          <div class="flex flex-col">
            <span class="text-highlighted text-sm font-bold">订单中心</span>
            <span class="text-dimmed text-[10px] tracking-[0.25em] uppercase">Order Center</span>
          </div>
          <span class="bg-primary/10 text-primary flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
            <span class="bg-primary size-1.5 animate-pulse rounded-full" />
            实时同步
          </span>
        </div>

        <div class="divide-default flex flex-col divide-y">
          <div v-for="order in orders" :key="order.id"
            class="hover:bg-accented/60 flex items-center gap-4 px-6 py-4 transition-colors">
            <div class="flex min-w-0 flex-1 flex-col">
              <span class="text-default truncate text-sm font-semibold">{{ order.name }}</span>
              <span class="text-dimmed font-mono text-[10px]">{{ order.id }}</span>
            </div>
            <span class="rounded-full px-2.5 py-1 text-[10px] font-bold" :class="statusTone[order.tone]">
              {{ order.status }}
            </span>
            <span class="text-muted w-20 text-right font-mono text-xs font-bold">
              {{ order.amount }}
            </span>
          </div>
        </div>
      </div>
    </Playground>

    <DemoSection title="区域加载" description="最常见的用法：在数据请求期间为看板 / 表格覆盖遮罩，宿主定位由指令自动修正。">
      <DemoBlock layout="stack" class="gap-4">
        <!-- 看板同样是遮罩宿主，沿用那唯一一层浅填充 -->
        <div v-loading="boardLoading" reborn-loading-text="正在同步看板数据…"
          class="bg-elevated rounded-ui-sm flex w-full flex-col gap-5 p-5">
          <div class="divide-default grid grid-cols-3 sm:divide-x">
            <div v-for="(stat, i) in boardStats" :key="stat.label" class="flex flex-col gap-1.5"
              :class="i === 0 ? 'sm:pr-4' : i === boardStats.length - 1 ? 'sm:pl-4' : 'sm:px-4'">
              <span class="text-dimmed flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase">
                <Icon :name="stat.icon" size="12" class="text-primary" />
                {{ stat.label }}
              </span>
              <span class="text-highlighted text-lg font-bold tracking-tight">{{ stat.value }}</span>
              <span class="text-success text-[10px] font-bold">{{ stat.trend }}</span>
            </div>
          </div>

          <!-- 模拟趋势条：柱体是内容标记，不构成额外的背景层 -->
          <div class="flex h-16 items-end gap-1.5">
            <div v-for="(h, i) in trendBars" :key="i"
              class="bg-primary/50 hover:bg-primary flex-1 rounded-t-sm transition-all duration-500"
              :style="{ height: h + '%' }" />
          </div>
        </div>

        <div class="flex w-full items-center justify-between">
          <Transition name="fade" mode="out-in">
            <DemoNote v-if="boardLoading" key="loading" tone="dimmed" class="flex items-center gap-1.5 text-xs">
              <span class="bg-primary size-1.5 animate-pulse rounded-full" />
              指令已挂载遮罩…
            </DemoNote>
            <DemoNote v-else key="idle" tone="dimmed" class="font-mono text-[10px]">v-loading="boardLoading"</DemoNote>
          </Transition>
          <RebornButton label="刷新看板" color="primary" variant="soft" size="sm" :disabled="boardLoading"
            @click="refreshBoard">
            <template #leading>
              <Icon name="lucide:refresh-cw" size="14" :class="boardLoading ? 'animate-spin' : ''" />
            </template>
          </RebornButton>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义文字与图标" description="通过 reborn-loading-* 元素属性定制图标类型、颜色、尺寸与遮罩背景，属性变化时响应式生效。">
      <DemoBlock layout="grid" align="start" class="sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="item in attrCases" :key="item.label" class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">{{ item.label }}</span>
          <!-- 宿主只描边不填充：遮罩自带背景，这里只需要一块可辨认的落点 -->
          <div v-loading="true" :reborn-loading-type="item.type" :reborn-loading-color="item.color"
            :reborn-loading-text="item.text" :reborn-loading-size="item.size"
            :reborn-loading-background="item.background"
            class="border-default rounded-ui-sm relative h-40 overflow-hidden border border-dashed" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="全屏加载" description="`.fullscreen` 将遮罩挂载至 body 铺满视口，`.lock` 以全局引用计数锁定页面滚动。">
      <div v-loading.fullscreen.lock="fullscreenOn" reborn-loading-text="整页处理中 · 2 秒后自动关闭"
        reborn-loading-type="gooey-balls" reborn-loading-size="34px" class="flex flex-col gap-4">
        <DemoNote class="max-w-2xl">
          适合支付、发布等不可中断流程。遮罩层级默认 <code>3000</code>，滚动锁与 Overlay 共享同一个全局计数器，互不踩踏；重复触发全屏遮罩时复用同一单例。
        </DemoNote>

        <pre
          class="bg-elevated rounded-ui-sm text-muted w-fit px-4 py-3 font-mono text-[11px] leading-relaxed"><code>&lt;section v-loading.fullscreen.lock="submitting"&gt;</code></pre>

        <div class="flex items-center gap-4">
          <RebornButton label="触发全屏加载" color="primary" variant="solid" :disabled="fullscreenOn"
            @click="triggerFullscreen">
            <template #leading>
              <Icon name="lucide:expand" size="14" />
            </template>
          </RebornButton>
          <DemoNote tone="dimmed" class="font-mono text-[10px]">z-index: 3000 · scroll locked</DemoNote>
        </div>
      </div>
    </DemoSection>

    <DemoSection title="服务式调用" description="useLoading 命令式创建遮罩，返回实例句柄进行 setText / patch / close 全流程控制。">
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex flex-wrap gap-3">
          <RebornButton label="模拟发布流程 (全屏分步)" color="primary" variant="soft" size="sm" :disabled="publishing"
            @click="runPublishFlow">
            <template #leading>
              <Icon name="lucide:rocket" size="14" />
            </template>
          </RebornButton>
          <RebornButton label="局部遮罩 (target 选择器)" color="secondary" variant="soft" size="sm" :disabled="targetRunning"
            @click="runTargetLoading">
            <template #leading>
              <Icon name="lucide:crosshair" size="14" />
            </template>
          </RebornButton>
        </div>

        <!-- 调用日志面板：它同时是局部遮罩的 target 容器，即被演示的宿主，故保留这层浅填充 -->
        <div id="reborn-loading-service-panel"
          class="bg-elevated rounded-ui-sm flex min-h-[220px] w-full flex-col gap-2 overflow-hidden p-5 font-mono text-[11px]">
          <div class="text-dimmed mb-1 flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase">
            <span class="flex gap-1.5">
              <span class="bg-error/70 size-2 rounded-full" />
              <span class="bg-warning/70 size-2 rounded-full" />
              <span class="bg-success/70 size-2 rounded-full" />
            </span>
            service console
          </div>
          <TransitionGroup name="log">
            <div v-for="(item, i) in serviceLogs" :key="item.time + item.msg + i" class="flex items-start gap-2">
              <span class="text-dimmed shrink-0">{{ item.time }}</span>
              <span :class="item.tone === 'success' ? 'text-success' : 'text-primary'">{{ item.msg }}</span>
            </div>
          </TransitionGroup>
          <div v-if="serviceLogs.length === 0" class="text-dimmed flex flex-1 items-center justify-center">
            点击上方按钮，观察 useLoading 实例的完整生命周期 →
          </div>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>

<style scoped>
/* 状态提示的淡入淡出过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 服务日志的滑入过渡 */
.log-enter-active {
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.log-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.log-leave-active {
  transition: all 0.2s ease;
}

.log-leave-from,
.log-leave-to {
  opacity: 0;
}
</style>
