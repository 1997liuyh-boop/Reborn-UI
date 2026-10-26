<script setup lang="ts">
/**
 * AI 助手抽屉（Ask AI）
 *
 * 取代 Docus 内置的 AssistantPanel：外壳换成 RebornDrawer，宽度 45%，可切全屏；
 * 正文左右分栏，左侧是最近 20 条历史会话，右侧是聊天消息，底部是输入框。
 *
 * 对话能力沿用原面板：Docus assistant 模块提供的接口、useAssistant 共享状态、
 * 原补丁里的登录门控 / 自动保存 / 刷新后续上会话，都搬到这里统一维护，不再改 node_modules 补丁。
 */
import type { UIMessage } from "ai";
import type { AssistantConversation } from "./AppAssistantHistory.vue";
import { Chat } from "@ai-sdk/vue";
import { until, useResizeObserver } from "@vueuse/core";
import { DefaultChatTransport } from "ai";
import { withBase } from "ufo";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornDrawer from "~/components/reborn/ui/reborn-drawer/RebornDrawer.vue";
import RebornTextarea from "~/components/reborn/ui/reborn-textarea/RebornTextarea.vue";
import AppAssistantHistory from "./AppAssistantHistory.vue";
import AppAssistantMessage from "./AppAssistantMessage.vue";
import AppAssistantMessageItem from "./AppAssistantMessageItem.vue";

/** AI 回答方的显示名 */
const ASSISTANT_NAME = "客服机器人";
/** 单次提问的最大字数，与原面板一致 */
const INPUT_MAX = 1000;

const { isOpen, isExpanded, isMobile, toggleExpanded, messages, pendingMessage, clearPending, faqQuestions }
  = useAssistant();
const config = useRuntimeConfig();

/** 聊天区的装饰背景：「正在思考」表情图的像素风版本，62×64 的透明 PNG，页面上按像素块放大（来源与生成方式见 public/images/assistant/README.md） */
const backgroundImage = withBase("/images/assistant/thinking-pixel.png", config.app.baseURL);
/** AI 回答的头像 */
const assistantAvatar = withBase("/images/assistant/avatar.webp", config.app.baseURL);

const input = shallowRef("");
/** 窄屏下左侧历史栏是否以浮层展开；宽屏时历史栏常驻，不读这个值 */
const historyOpen = shallowRef(false);

/** 桌面端 45%；全屏或手机端占满视口，手机上 45% 放不下双栏 */
const drawerSize = computed(() => (isMobile.value || isExpanded.value ? "100%" : "45%"));

// ============ 消息时间 ============

/**
 * 每条消息的时间戳（毫秒），按消息 id 记录。
 * 不直接写进 message.metadata：AI 回答流式输出时，SDK 每收到一段就用内部副本整体替换这条消息，
 * 写在当前对象上的 metadata 会被下一段覆盖。这里单独记，保存时再合并进 metadata 落库。
 * 值为 0 表示旧记录当初没有存时间，界面上只显示名称。
 */
const messageTimes = reactive(new Map<string, number>());

/** 读取已落库消息里的时间 */
function readSavedTime(message: UIMessage) {
  const value = (message.metadata as { createdAt?: unknown } | undefined)?.createdAt;
  return typeof value === "number" ? value : 0;
}

/** 保存前把时间合并进 metadata，历史记录再打开时才能显示当时的时间 */
function withTimes(list: UIMessage[]): UIMessage[] {
  return list.map((message) => {
    const createdAt = messageTimes.get(message.id);
    if (!createdAt) return message;
    return { ...message, metadata: { ...(message.metadata as object | undefined), createdAt } };
  });
}

function messageTime(message: UIMessage) {
  return formatChatTime(messageTimes.get(message.id) ?? 0);
}

// ============ 对话实例 ============

const chat = new Chat({
  messages: messages.value,
  transport: new DefaultChatTransport({ api: config.public.assistant.apiPath }),
  // 出错不再弹 toast：抽屉层级（2000）高于 toast 容器，提示会被遮罩盖住；改为在消息流末尾内联显示
  onFinish: () => {
    messages.value = chat.messages;
    saveHistory();
  },
});

// 新消息在第一次出现时打点；带着时间落库的历史消息沿用原值
watch(
  () => chat.messages.map((message) => message.id).join("\0"),
  () => {
    const now = Date.now();
    for (const message of chat.messages) {
      if (!messageTimes.has(message.id)) messageTimes.set(message.id, readSavedTime(message) || now);
    }
  },
  { immediate: true },
);

const lastMessage = computed(() => chat.messages.at(-1));
const isBusy = computed(() => chat.status === "submitted" || chat.status === "streaming");

/**
 * 界面只渲染用户与 AI 两种角色。
 * 网关报错或中途停止时，SDK 可能留下一条既没正文也没工具调用的 AI 消息，空气泡没有信息量，跳过；
 * 正在输出的那条例外，它要显示「思考中」。
 */
const visibleMessages = computed(() =>
  chat.messages.filter((message) => {
    if (message.role === "user") return true;
    if (message.role !== "assistant") return false;
    if (isBusy.value && message.id === lastMessage.value?.id) return true;
    return message.parts.some((part) => (part.type === "text" && part.text) || part.type === "data-tool-calls");
  }),
);
/** 已发出提问、AI 还没返回第一段：此时没有 AI 消息，补一个占位气泡显示思考中 */
const waitingFirstChunk = computed(() => chat.status === "submitted" && lastMessage.value?.role === "user");

/** 含中文即视为服务端已换好的提示 */
const CJK_PATTERN = /[\u4E00-\u9FFF]/;

/**
 * 面板上的错误文案。接口错误体是 JSON 时先取其中的 message；
 * 服务端的模型错误已换成中文，原样显示。剩下的英文都是浏览器或 AI SDK 在客户端产生的
 * （断网、服务没有响应等），用户读不懂，统一换成中文。
 */
const errorText = computed(() => {
  const raw = chat.error?.message;
  if (!raw) return "";
  let message = raw;
  try {
    message = JSON.parse(raw)?.message || raw;
  } catch {
    // 不是 JSON，按原文处理
  }
  if (CJK_PATTERN.test(message)) return message;
  if (/failed to fetch|networkerror|load failed|network/i.test(message)) {
    return "无法连接服务器，请检查网络后重试。";
  }
  return "服务暂时出现问题，请稍后重试。";
});

// ============ 滚动 ============

const scrollRef = useTemplateRef<HTMLElement>("scrollRef");
const contentRef = useTemplateRef<HTMLElement>("contentRef");
/** 用户停在底部附近时才跟随新内容滚动；往上翻看时不打断阅读 */
let stickToBottom = true;

function onScroll() {
  const el = scrollRef.value;
  if (el) stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
}

function scrollToBottom() {
  const el = scrollRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

// 流式输出是逐段撑高内容，监听内容尺寸比逐个 watch 消息更省事也更准
useResizeObserver(contentRef, () => {
  if (stickToBottom) scrollToBottom();
});

// ============ 登录态 ============

interface AuthUser { id: string; name: string; avatar?: string }

const authUser = shallowRef<AuthUser | null>(null);
const feishuEnabled = shallowRef(false);
/** 登录态是否已从服务端拉取完成；完成前不切换输入区，避免已登录用户看到登录入口一闪而过 */
const authReady = shallowRef(false);
const isDev = import.meta.dev;

async function fetchAuthUser() {
  try {
    const res = await $fetch<{ user: AuthUser | null; feishuEnabled: boolean }>("/api/auth/me");
    authUser.value = res.user;
    feishuEnabled.value = res.feishuEnabled;
  } catch {
    // 接口不可用时按未登录处理
  } finally {
    authReady.value = true;
  }
}

/** 本地开发免飞书凭证的模拟登录（生产构建中 /api/auth/dev-login 返回 404） */
async function devLogin() {
  try {
    await $fetch("/api/auth/dev-login", { method: "POST" });
    await fetchAuthUser();
  } catch {
    // 失败时登录入口保持原样，用户可以再点一次
  }
}

function feishuLogin() {
  navigateTo("/api/auth/feishu/login", { external: true });
}

// ============ 会话与历史记录 ============

/** 当前会话对应的服务端记录 id；新对话在首次保存时生成 */
const conversationId = useState<string | undefined>("assistant-conversation-id", () => undefined);
const historyList = shallowRef<AssistantConversation[]>([]);
const historyLoading = shallowRef(false);
/** 正在载入的会话 id：接口返回前先高亮被点的那条并显示载入提示，否则慢网络下像是点了没反应 */
const loadingConversationId = shallowRef<string>();

/**
 * 会话切换计数。切换会话时旧回答可能还在保存途中，
 * 返回后若直接写 conversationId，会把旧会话的 id 套到新会话上，下一轮就覆盖错记录。
 */
let sessionToken = 0;

/**
 * 当前会话 id 在 sessionStorage 中的存放键。
 * messages / conversationId 都是 useState，整页刷新即重置；把 id 落到 sessionStorage，
 * 刷新后就能续上同一段对话。不用 localStorage，是为了让新标签页和重开浏览器都从新会话开始。
 */
const CONVERSATION_KEY = "reborn-assistant-conversation";

function rememberConversation(id: string | undefined) {
  try {
    if (id) sessionStorage.setItem(CONVERSATION_KEY, id);
    else sessionStorage.removeItem(CONVERSATION_KEY);
  } catch {
    // 隐私模式下 sessionStorage 可能不可用，失败只是丢掉刷新恢复能力
  }
}

function readRememberedConversation() {
  try {
    return sessionStorage.getItem(CONVERSATION_KEY) || undefined;
  } catch {
    return undefined;
  }
}

/** 列表接口只返回最新 20 条，按最近更新倒序 */
async function loadHistoryList() {
  if (!authUser.value) return;
  historyLoading.value = true;
  try {
    historyList.value = await $fetch<AssistantConversation[]>("/api/chat/list");
  } catch {
    // 拉取失败时保留旧列表
  } finally {
    historyLoading.value = false;
  }
}

async function saveHistory() {
  if (!authUser.value || chat.messages.length === 0) return;
  const token = sessionToken;
  try {
    const res = await $fetch<{ id: string }>("/api/chat/save", {
      method: "POST",
      body: { conversationId: conversationId.value, messages: withTimes(chat.messages) },
    });
    if (token === sessionToken) {
      conversationId.value = res.id;
      rememberConversation(res.id);
    }
  } catch {
    // 保存失败不打断对话
  }
  // 新会话的标题、旧会话的排序都随保存变化
  loadHistoryList();
}

/** 正在回答时先停下，并等 SDK 走完收尾（onFinish 会把已输出的部分存进原会话） */
async function stopStreaming() {
  if (!isBusy.value) return;
  chat.stop();
  await until(() => chat.status).toMatch((status) => status !== "submitted" && status !== "streaming", {
    timeout: 3000,
  });
}

/**
 * 丢弃当前对话，开启新的一段会话。
 * 必须同时作废 conversationId 与本地标记：只清消息的话，下一次保存会带着旧 id 提交，
 * 把上一段会话在服务端覆盖掉。
 */
function startFreshConversation() {
  sessionToken++;
  loadingConversationId.value = undefined;
  chat.clearError();
  chat.messages = [];
  conversationId.value = undefined;
  rememberConversation(undefined);
}

async function newConversation() {
  historyOpen.value = false;
  await stopStreaming();
  messages.value = [];
  startFreshConversation();
}

/** 打开一条历史会话，返回是否成功（记录可能已在别处删除） */
async function openConversation(id: string) {
  historyOpen.value = false;
  if (id === conversationId.value) return true;
  loadingConversationId.value = id;
  await stopStreaming();
  try {
    const res = await $fetch<{ messages: UIMessage[] }>(`/api/chat/${id}`);
    // 等待期间又点了别的记录或新建了对话，以最后一次操作为准。
    // 记录本身是存在的，返回 true，免得刷新恢复流程误把本地标记清掉
    if (loadingConversationId.value !== id) return true;
    sessionToken++;
    // 先登记时间再替换消息：否则上方的打点 watch 会把没存时间的旧记录当成「现在」
    for (const message of res.messages) messageTimes.set(message.id, readSavedTime(message));
    chat.clearError();
    chat.messages = res.messages;
    messages.value = chat.messages;
    conversationId.value = id;
    rememberConversation(id);
    stickToBottom = true;
    await nextTick();
    scrollToBottom();
    return true;
  } catch {
    loadHistoryList();
    return false;
  } finally {
    if (loadingConversationId.value === id) loadingConversationId.value = undefined;
  }
}

async function removeConversation(id: string) {
  await $fetch(`/api/chat/${id}`, { method: "DELETE" }).catch(() => {});
  historyList.value = historyList.value.filter((item) => item.id !== id);
  // 删掉的正是当前会话时清空右侧，否则下一轮回答会把这些消息另存成一条新记录
  if (conversationId.value === id) {
    await stopStreaming();
    messages.value = [];
    startFreshConversation();
  }
}

/** 整页刷新后，按 sessionStorage 里的 id 把上一段会话拉回来 */
async function restoreConversation() {
  const id = readRememberedConversation();
  // 已有会话（同一页内的路由跳转）或从没记录过，都无需恢复
  if (!id || conversationId.value || chat.messages.length > 0) return;
  if (!(await openConversation(id))) rememberConversation(undefined);
}

// ============ 发送 ============

function send(text: string) {
  stickToBottom = true;
  chat.sendMessage({ text });
}

function handleSubmit() {
  const text = input.value.trim();
  if (!text || isBusy.value || !authUser.value) return;
  send(text);
  input.value = "";
}

/** Enter 发送、Shift + Enter 换行；输入法组字期间的 Enter / Esc 都留给输入法 */
function onKeydown(event: KeyboardEvent) {
  if (event.isComposing) {
    // 抽屉在 document 上监听 Esc 关闭，组字时按 Esc 只是取消候选词，不能把抽屉一起关掉
    if (event.key === "Escape") event.stopPropagation();
    return;
  }
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  handleSubmit();
}

/** 点击常见问题：未登录时先记下，登录后自动发送 */
function askQuestion(question: string) {
  if (!authUser.value) {
    pendingMessage.value = question;
    return;
  }
  if (!isBusy.value) send(question);
}

// 文档页「向 AI 提问」等入口经 useAssistant().open(msg) 写入 pendingMessage
watch(
  pendingMessage,
  (message) => {
    // 未登录时先保留，登录态就绪后由下方 authUser watch 统一补发
    if (!message || !authUser.value) return;
    // open(msg, true) 的语义是另起一段会话，此时 messages 已被清空
    if (messages.value.length === 0 && chat.messages.length > 0) startFreshConversation();
    send(message);
    clearPending();
  },
  { immediate: true },
);

// 登录态就绪后依次处理：未登录期间攒下的问题、整页刷新后的会话恢复、上轮以提问结尾的续答
watch(authUser, async (user) => {
  if (!user) return;
  if (pendingMessage.value) {
    if (messages.value.length === 0 && chat.messages.length > 0) startFreshConversation();
    send(pendingMessage.value);
    clearPending();
    return;
  }
  // 带着待发问题进来时不恢复旧会话，避免新问题被拼到无关的上下文后面
  await restoreConversation();
  if (chat.lastMessage?.role === "user" && chat.status === "ready") chat.regenerate();
});

// 外部把 messages 置空（如浮动输入框另起会话）即视为新会话，conversationId 必须同步作废
watch(
  () => messages.value.length,
  (length) => {
    if (length === 0 && chat.messages.length > 0) startFreshConversation();
  },
);

// 每次打开抽屉都刷新列表，其他标签页里新增的会话也能看到
watch(
  [isOpen, authUser],
  ([open, user]) => {
    if (open && user) loadHistoryList();
  },
  { immediate: true },
);

onMounted(fetchAuthUser);
</script>

<template>
  <RebornDrawer
    v-model="isOpen"
    :size="drawerSize"
    with-header
    aria-label="Ask AI"
    :ui="{
      root: '@container',
      header: 'h-14 gap-2 border-b border-gray-3 px-4 py-0',
      body: 'relative flex h-full overflow-hidden p-0',
      footer: 'border-t border-gray-3 px-4 py-3',
    }"
    @opened="scrollToBottom"
  >
    <template #header="{ close }">
      <div class="flex min-w-0 items-center gap-1">
        <!-- 抽屉宽度不足以并排放历史栏时（container < 36rem），历史栏收进这个按钮 -->
        <button
          type="button"
          class="
            flex size-8 cursor-pointer items-center justify-center rounded-md text-gray-6
            transition-colors
            hover:bg-gray-2 hover:text-gray-10
            focus-visible:outline-2 focus-visible:outline-primary
            @xl:hidden
          "
          :aria-expanded="historyOpen"
          aria-label="历史会话"
          title="历史会话"
          @click="historyOpen = !historyOpen"
        >
          <Icon name="lucide:panel-left" class="size-4" />
        </button>
        <h2 class="truncate text-base font-medium text-gray-10">Ask AI</h2>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <!-- 手机端抽屉本来就占满屏幕，全屏按钮没有意义 -->
        <button
          v-if="!isMobile"
          type="button"
          class="
            flex size-8 cursor-pointer items-center justify-center rounded-md text-gray-6
            transition-colors
            hover:bg-gray-2 hover:text-gray-10
            focus-visible:outline-2 focus-visible:outline-primary
          "
          :aria-label="isExpanded ? '退出全屏' : '全屏'"
          :title="isExpanded ? '退出全屏' : '全屏'"
          @click="toggleExpanded"
        >
          <Icon :name="isExpanded ? 'lucide:minimize-2' : 'lucide:maximize-2'" class="size-4" />
        </button>
        <button
          type="button"
          class="
            flex size-8 cursor-pointer items-center justify-center rounded-md text-gray-6
            transition-colors
            hover:bg-gray-2 hover:text-gray-10
            focus-visible:outline-2 focus-visible:outline-primary
          "
          aria-label="关闭"
          title="关闭"
          @click="close"
        >
          <Icon name="lucide:x" class="size-5" />
        </button>
      </div>
    </template>

    <!-- 窄屏下历史栏以浮层展开，点遮罩收起 -->
    <div
      v-if="historyOpen"
      class="absolute inset-0 z-10 bg-black/20 @xl:hidden"
      aria-hidden="true"
      @click="historyOpen = false"
    />
    <aside
      class="
        absolute inset-y-0 left-0 z-20 w-64 border-r border-gray-3 bg-gray-1 shadow-lg
        @xl:static @xl:z-auto @xl:flex @xl:w-56 @xl:shrink-0 @xl:shadow-none
      "
      :class="historyOpen ? 'flex' : 'hidden'"
      aria-label="历史会话"
    >
      <AppAssistantHistory
        class="w-full"
        :items="historyList"
        :active-id="loadingConversationId ?? conversationId"
        :loading="historyLoading"
        :logged-in="!!authUser"
        @select="openConversation"
        @remove="removeConversation"
        @create="newConversation"
      />
    </aside>

    <section class="relative isolate flex min-w-0 flex-1 flex-col" aria-label="聊天消息" :aria-busy="!!loadingConversationId">
      <!--
        装饰背景：像素风表情图，贴聊天区底部居中，透明度 0.1，不拦截指针。
        素材只有 62×64，靠 image-rendering: pixelated 放大成一格一格的像素块，不做平滑插值。
        section 带 isolate 自成层叠上下文，-z-10 只把图压在本区的消息之下，不会掉到抽屉底色后面。
      -->
      <img
        :src="backgroundImage"
        alt=""
        aria-hidden="true"
        draggable="false"
        decoding="async"
        class="pointer-events-none absolute bottom-0 left-1/2 -z-10 w-[min(100%,30rem)] -translate-x-1/2 opacity-10 select-none [image-rendering:pixelated]"
      >
      <div
        v-if="loadingConversationId"
        class="absolute inset-0 z-[1] flex items-center justify-center gap-2 bg-gray-1/70 text-sm text-gray-6"
      >
        <Icon name="lucide:loader-circle" class="size-4 animate-spin" />
        正在载入会话…
      </div>
      <div ref="scrollRef" class="min-h-0 flex-1 overflow-y-auto" @scroll.passive="onScroll">
        <div ref="contentRef" class="flex flex-col gap-5 p-5">
          <template v-if="visibleMessages.length > 0">
            <AppAssistantMessageItem
              v-for="message in visibleMessages" :key="message.id" :message="message"
              :user-name="authUser?.name ?? '我'" :assistant-name="ASSISTANT_NAME" :avatar="assistantAvatar"
              :time="messageTime(message)" :streaming="chat.status === 'streaming' && message.id === lastMessage?.id"
            />

            <AppAssistantMessage v-if="waitingFirstChunk" role="assistant" :name="ASSISTANT_NAME" :avatar="assistantAvatar">
              <AssistantLoading :tool-calls="[]" is-loading />
            </AppAssistantMessage>

            <div
              v-if="chat.status === 'error'"
              class="
                flex items-start gap-2 rounded-lg border border-error/30 bg-error/5 px-4 py-3
                text-sm text-gray-9
              "
              role="alert"
            >
              <Icon name="lucide:circle-alert" class="mt-0.5 size-4 shrink-0 text-error" />
              <p class="min-w-0 flex-1 break-words">回答失败：{{ errorText || "请稍后重试" }}</p>
              <button
                type="button"
                class="shrink-0 cursor-pointer text-primary hover:underline"
                @click="chat.regenerate()"
              >
                重试
              </button>
            </div>
          </template>

          <div v-else class="flex flex-col gap-6 py-4">
            <div class="flex flex-col items-center gap-2 text-center">
              <div class="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Icon name="lucide:message-circle-question" class="size-6 text-primary" />
              </div>
              <h3 class="text-base font-medium text-gray-10">有什么可以帮你？</h3>
              <p class="max-w-sm text-sm text-gray-6">
                可以询问组件用法、API 参数和 Web 与 UniApp 两端的差异，回答会查阅站内文档生成。
              </p>
            </div>

            <div v-for="category in faqQuestions" :key="category.category" class="flex flex-col gap-2">
              <h4 class="text-xs font-medium text-gray-6">{{ category.category }}</h4>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="question in category.items"
                  :key="question"
                  type="button"
                  class="
                    cursor-pointer rounded-full border border-gray-3 px-3 py-1.5 text-left
                    text-xs text-gray-8 transition-colors
                    hover:border-primary hover:text-primary
                  "
                  @click="askQuestion(question)"
                >
                  {{ question }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <template #footer>
      <!-- 登录门控：AI 端点已在服务端强制鉴权（server/middleware/ai-guard.ts），未登录时以登录入口替换输入框 -->
      <div
        v-if="authReady && !authUser"
        class="
          flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-3
          px-4 py-3
        "
      >
        <p class="text-sm text-gray-6">
          {{ pendingMessage ? "登录后会自动发送刚才的问题" : "AI 助手需登录后使用" }}
        </p>
        <RebornButton v-if="feishuEnabled" size="sm" @click="feishuLogin">
          <template #leading>
            <Icon name="lucide:log-in" />
          </template>
          飞书登录
        </RebornButton>
        <RebornButton v-else-if="isDev" size="sm" @click="devLogin">
          <template #leading>
            <Icon name="lucide:log-in" />
          </template>
          本地开发登录
        </RebornButton>
        <p v-else class="text-xs text-gray-6">未配置登录方式（NUXT_FEISHU_APP_ID），AI 助手暂不可用</p>
      </div>

      <div
        v-else
        class="
          flex flex-col gap-2 rounded-lg border border-gray-3 px-3 pt-2 pb-2.5 transition-colors
          focus-within:border-primary
        "
      >
        <!-- 边框与聚焦态由外层容器统一负责，所以关掉 RebornTextarea 自带的聚焦环，避免两层框 -->
        <RebornTextarea
          v-model="input"
          :border="false"
          :rows="2"
          auto-height
          autofocus
          :maxlength="INPUT_MAX"
          :disabled="!authReady"
          placeholder="输入问题，Enter 发送，Shift + Enter 换行"
          :ui="{ root: 'bg-transparent p-0 ring-0', inner: 'max-h-40 resize-none text-sm leading-6 text-gray-9' }"
          @keydown="onKeydown"
        />
        <div class="flex items-center justify-between gap-3 text-xs text-gray-6">
          <span class="truncate">{{ authUser ? `${authUser.name} · 聊天记录自动保存` : "" }}</span>
          <div class="flex shrink-0 items-center gap-3">
            <span>{{ input.length }}/{{ INPUT_MAX }}</span>
            <RebornButton v-if="isBusy" size="sm" color="neutral" variant="outlined" @click="chat.stop()">
              <template #leading>
                <Icon name="lucide:square" />
              </template>
              停止
            </RebornButton>
            <RebornButton v-else size="sm" :disabled="!input.trim() || !authUser" @click="handleSubmit">
              <template #leading>
                <Icon name="lucide:send-horizontal" />
              </template>
              发送
            </RebornButton>
          </div>
        </div>
      </div>
    </template>
  </RebornDrawer>
</template>
