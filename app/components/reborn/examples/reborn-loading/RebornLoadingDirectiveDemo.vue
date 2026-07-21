<script setup lang="ts">
/**
 * Loading 指令与服务演示
 * 聚焦 v-loading 指令与 useLoading 服务式调用（加载图标本身的样式请参阅 RebornLoadingDemo）
 */
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
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

/** 状态徽标配色（成对适配暗色模式） */
const statusTone: Record<string, string> = {
  success: "bg-success/10 text-success dark:bg-success/15",
  warning: "bg-warning/10 text-warning dark:bg-warning/15",
  info: "bg-info/10 text-info dark:bg-info/15",
  error: "bg-error/10 text-error dark:bg-error/15",
  neutral: "bg-gray-500/10 text-gray-500 dark:bg-gray-400/15 dark:text-gray-400",
};

/* ==================== 区域加载（数据看板） ==================== */

const boardLoading = ref(false);
/** 看板统计卡数据 */
const boardStats = [
  { label: "今日成交", value: "¥ 86,420", trend: "+12.6%", icon: "lucide:trending-up" },
  { label: "新增用户", value: "1,284", trend: "+4.2%", icon: "lucide:users" },
  { label: "转化率", value: "38.9%", trend: "+1.8%", icon: "lucide:target" },
];

/** 点击刷新：1.6 秒后自动结束加载 */
function refreshBoard() {
  if (boardLoading.value) return;
  boardLoading.value = true;
  setTimeout(() => {
    boardLoading.value = false;
  }, 1600);
}

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
  <div class="flex w-full flex-col gap-12 pt-4 pb-24">
    <!-- 标题头 -->
    <div class="flex flex-col gap-3">
      <h2 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Loading 加载指令</h2>
      <p class="max-w-3xl text-xl text-gray-500 dark:text-gray-400">
        通过 <code class="text-lg text-violet-500 dark:text-violet-400">v-loading</code> 指令为任意元素声明式挂载加载遮罩，或使用
        <code class="text-lg text-violet-500 dark:text-violet-400">useLoading</code> 服务式调用命令式控制全屏 /
        局部加载，支持文字、图标、颜色与滚动锁定的全量定制。
      </p>
    </div>

    <!-- 交互演练场 -->
    <Playground v-model="state" :controls="controls" :code="codeString" component-name="v-loading" title="交互演练场"
      description="实时调节遮罩参数；开启全屏模式后遮罩将覆盖整页并在 2 秒后自动关闭">
      <template #tag>
        <button
          class="flex cursor-pointer items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-widest text-primary uppercase transition-all hover:bg-primary/20 active:scale-95"
          @click="resetState">
          <Icon name="lucide:rotate-ccw" size="12" />
          重置配置
        </button>
      </template>

      <!-- 宿主容器：模拟订单表格（自身可滚动，遮罩随滚动实时钉在可视区域；开启 lock 后滚动被锁定） -->
      <div v-loading="{ loading: state.loading, fullscreen: state.fullscreen, lock: state.lock }"
        :reborn-loading-text="state.text || null" :reborn-loading-type="state.type"
        :reborn-loading-color="playgroundColor" :reborn-loading-size="state.size + 'px'"
        :reborn-loading-background="playgroundBackground"
        class="h-[400px] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200/60 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40 dark:shadow-black/30">
        <!-- 表格头 -->
        <div
          class="sticky top-0 z-[1] flex items-center justify-between border-b border-slate-200/60 bg-white/85 px-6 py-4 backdrop-blur-xl dark:border-white/5 dark:bg-slate-900/80">
          <div class="flex flex-col">
            <span class="text-sm font-bold text-gray-900 dark:text-white">订单中心</span>
            <span class="text-[10px] tracking-[0.25em] text-gray-400 uppercase dark:text-gray-500">Order Center</span>
          </div>
          <span
            class="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
            <span class="size-1.5 animate-pulse rounded-full bg-primary" />
            实时同步
          </span>
        </div>
        <!-- 表格体 -->
        <div class="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
          <div v-for="order in orders" :key="order.id"
            class="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/5">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 font-mono text-[10px] font-bold text-violet-500 dark:text-violet-300">
              {{ order.id.slice(-2) }}
            </span>
            <div class="flex min-w-0 flex-1 flex-col">
              <span class="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{{ order.name }}</span>
              <span class="font-mono text-[10px] text-gray-400 dark:text-gray-500">{{ order.id }}</span>
            </div>
            <span class="rounded-full px-2.5 py-1 text-[10px] font-bold" :class="statusTone[order.tone]">
              {{ order.status }}
            </span>
            <span class="w-20 text-right font-mono text-xs font-bold text-gray-700 dark:text-gray-200">
              {{ order.amount }}
            </span>
          </div>
        </div>
      </div>
    </Playground>

    <!-- 场景编排 -->
    <div class="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">

      <!-- 标题行 -->
      <div class="flex flex-col gap-1">
        <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">区域加载</h4>
        <p class="text-sm text-gray-500">最常见的用法：在数据请求期间为看板 / 表格覆盖遮罩，宿主定位由指令自动修正。</p>
      </div>
      <div class="flex flex-col gap-1">
        <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">
          自定义文字与图标 <code class="text-sm font-normal text-violet-400">reborn-loading-*</code>
        </h4>
        <p class="text-sm text-gray-500">通过元素属性定制图标类型、颜色与遮罩背景，属性响应式生效。</p>
      </div>

      <!-- 区域加载：数据看板 -->
      <section
        class="flex flex-col gap-5 rounded-3xl border border-slate-200/50 bg-white/60 p-6 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
        <div v-loading="boardLoading" reborn-loading-text="正在同步看板数据…"
          class="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/80 p-5 dark:border-white/5 dark:bg-slate-950/50">
          <div class="grid grid-cols-3 gap-3">
            <div v-for="stat in boardStats" :key="stat.label"
              class="flex flex-col gap-1.5 rounded-xl bg-slate-50/80 p-3.5 dark:bg-white/5">
              <span class="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                <Icon :name="stat.icon" size="12" class="text-primary" />
                {{ stat.label }}
              </span>
              <span class="text-lg font-black tracking-tight text-gray-900 dark:text-white">{{ stat.value }}</span>
              <span class="text-[10px] font-bold text-success">{{ stat.trend }}</span>
            </div>
          </div>
          <!-- 模拟趋势条 -->
          <div class="flex h-16 items-end gap-1.5 rounded-xl bg-slate-50/80 p-3 dark:bg-white/5">
            <div v-for="(h, i) in [42, 66, 51, 80, 62, 92, 71, 58, 84, 68, 95, 76]" :key="i"
              class="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500/70 to-fuchsia-400/70 transition-all duration-500 hover:from-violet-500 hover:to-fuchsia-400"
              :style="{ height: h + '%' }" />
          </div>
        </div>
        <div class="flex items-center justify-between">
          <Transition name="fade" mode="out-in">
            <span v-if="boardLoading" key="loading" class="flex items-center gap-1.5 text-xs text-gray-400">
              <span class="size-1.5 animate-pulse rounded-full bg-primary" />
              指令已挂载遮罩…
            </span>
            <span v-else key="idle" class="font-mono text-[10px] text-gray-400">v-loading="boardLoading"</span>
          </Transition>
          <RebornButton label="刷新看板" color="primary" variant="soft" size="sm" :disabled="boardLoading"
            @click="refreshBoard">
            <template #leading>
              <Icon name="lucide:refresh-cw" size="14" :class="boardLoading ? 'animate-spin' : ''" />
            </template>
          </RebornButton>
        </div>
      </section>

      <!-- 属性定制矩阵：四种风格常驻展示 -->
      <section
        class="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200/50 bg-white/60 p-6 backdrop-blur-2xl sm:grid-cols-2 dark:border-white/5 dark:bg-slate-900/40">
        <!-- 预设色 + bars-scale -->
        <div v-loading="true" reborn-loading-type="bars-scale" reborn-loading-color="info" reborn-loading-text="信息流刷新中…"
          class="relative h-40 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/5">
          <div
            class="absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-cyan-50 dark:from-sky-950 dark:via-slate-950 dark:to-cyan-950" />
        </div>
        <!-- 自定义色 + gooey-balls -->
        <div v-loading="true" reborn-loading-type="gooey-balls" reborn-loading-color="#d946ef"
          reborn-loading-text="AI 生成中…" reborn-loading-size="30px"
          class="relative h-40 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/5">
          <div
            class="absolute inset-0 bg-gradient-to-br from-fuchsia-100 via-white to-violet-50 dark:from-fuchsia-950 dark:via-slate-950 dark:to-violet-950" />
        </div>
        <!-- 深色遮罩背景 + 自定义浅色图标 -->
        <div v-loading="true" reborn-loading-type="blocks-wave" reborn-loading-color="#a78bfa"
          reborn-loading-background="rgba(2, 6, 23, 0.85)" reborn-loading-text="夜间模式渲染…"
          class="relative h-40 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/5">
          <div
            class="absolute inset-0 bg-gradient-to-br from-indigo-200 via-slate-100 to-violet-200 dark:from-indigo-900 dark:via-slate-900 dark:to-violet-900" />
        </div>
        <!-- 无文字 + spinner 警示色 -->
        <div v-loading="true" reborn-loading-type="spinner" reborn-loading-color="warning" reborn-loading-size="32px"
          class="relative h-40 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/5">
          <div
            class="absolute inset-0 bg-gradient-to-br from-amber-100 via-white to-orange-50 dark:from-amber-950 dark:via-slate-950 dark:to-orange-950" />
        </div>
      </section>

      <!-- 标题行 -->
      <div class="mt-4 flex flex-col gap-1">
        <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">
          全屏加载 <code class="text-sm font-normal text-violet-400">.fullscreen.lock</code>
        </h4>
        <p class="text-sm text-gray-500">修饰符将遮罩挂载至 body 铺满视口，并以全局引用计数锁定页面滚动。</p>
      </div>
      <div class="mt-4 flex flex-col gap-1">
        <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">
          服务式调用 <code class="text-sm font-normal text-violet-400">useLoading</code>
        </h4>
        <p class="text-sm text-gray-500">命令式创建遮罩，返回实例句柄进行 setText / patch / close 全流程控制。</p>
      </div>

      <!-- 全屏加载 -->
      <section v-loading.fullscreen.lock="fullscreenOn" reborn-loading-text="整页处理中 · 2 秒后自动关闭"
        reborn-loading-type="gooey-balls" reborn-loading-size="34px"
        class="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-white/10 bg-gray-950 p-7 shadow-2xl shadow-black/40">
        <!-- 装饰光斑 -->
        <div class="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-violet-600/20 blur-3xl" />
        <div class="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-fuchsia-600/10 blur-3xl" />
        <div class="relative flex flex-col gap-3">
          <span class="text-[10px] tracking-[0.4em] text-gray-500 uppercase">Fullscreen · Lock</span>
          <h5 class="text-2xl font-black tracking-tight text-white">整页阻断式加载</h5>
          <p class="text-sm leading-relaxed text-gray-400">
            适合支付、发布等不可中断流程。遮罩层级默认 <code class="text-violet-300">3000</code>，
            滚动锁与 Overlay 共享同一个全局计数器，互不踩踏；重复触发全屏遮罩时复用同一单例。
          </p>
          <pre
            class="mt-1 w-fit rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-[11px] leading-relaxed text-violet-200">
        <code>&lt;section v-loading.fullscreen.lock="submitting"&gt;</code>
      </pre>
        </div>
        <div class="relative flex items-center justify-between">
          <span class="font-mono text-[10px] text-gray-600">z-index: 3000 · scroll locked</span>
          <RebornButton label="触发全屏加载" color="primary" variant="solid" :disabled="fullscreenOn"
            @click="triggerFullscreen">
            <template #leading>
              <Icon name="lucide:expand" size="14" />
            </template>
          </RebornButton>
        </div>
      </section>

      <!-- 服务式 useLoading -->
      <section
        class="flex flex-col gap-4 rounded-3xl border border-slate-200/50 bg-white/60 p-6 backdrop-blur-2xl dark:border-white/5 dark:bg-slate-900/40">
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

        <!-- 调用日志面板：同时也是局部遮罩的 target 容器 -->
        <div id="reborn-loading-service-panel"
          class="flex min-h-[220px] flex-1 flex-col gap-2 overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-950 p-5 font-mono text-[11px] shadow-inner dark:border-white/10">
          <div class="mb-1 flex items-center gap-2 text-[10px] tracking-[0.3em] text-gray-500 uppercase">
            <span class="flex gap-1.5">
              <span class="size-2 rounded-full bg-error/70" />
              <span class="size-2 rounded-full bg-warning/70" />
              <span class="size-2 rounded-full bg-success/70" />
            </span>
            service console
          </div>
          <TransitionGroup name="log">
            <div v-for="(item, i) in serviceLogs" :key="item.time + item.msg + i" class="flex items-start gap-2">
              <span class="shrink-0 text-gray-600">{{ item.time }}</span>
              <span :class="item.tone === 'success' ? 'text-emerald-400' : 'text-violet-300'">{{ item.msg }}</span>
            </div>
          </TransitionGroup>
          <div v-if="serviceLogs.length === 0" class="flex flex-1 items-center justify-center text-gray-600">
            点击上方按钮，观察 useLoading 实例的完整生命周期 →
          </div>
        </div>
      </section>
    </div>

    <!-- 特性说明卡 -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div v-for="feature in [
        { no: '01', title: '全屏单例', desc: '未关闭时重复调用 useLoading 全屏模式，返回同一个实例，避免遮罩叠加。' },
        { no: '02', title: '实例复用', desc: 'v-loading 快速开关复用同一遮罩实例，淡出未结束即重开时自动作废销毁意图。' },
        { no: '03', title: '属性响应式', desc: 'reborn-loading-* 元素属性在组件更新时重读，可随业务状态实时切换文案与样式。' },
      ]" :key="feature.no"
        class="group flex flex-col gap-3 rounded-3xl border border-slate-200/50 bg-white/60 p-6 backdrop-blur-2xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10 dark:border-white/5 dark:bg-slate-900/40">
        <span
          class="w-fit bg-gradient-to-br from-violet-500 to-fuchsia-500 bg-clip-text font-mono text-3xl font-black text-transparent opacity-40 transition-opacity group-hover:opacity-100">
          {{ feature.no }}
        </span>
        <h5 class="text-base font-bold text-gray-900 dark:text-white">{{ feature.title }}</h5>
        <p class="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{{ feature.desc }}</p>
      </div>
    </div>
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
