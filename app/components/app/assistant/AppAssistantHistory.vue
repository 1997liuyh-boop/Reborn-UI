<script setup lang="ts">
/**
 * AI 助手抽屉左侧的历史会话列表
 *
 * 纯展示：列表数据、当前会话 id、加载与登录状态都由抽屉传入，
 * 点击、删除、新建只抛事件，会话切换与接口调用留在抽屉里统一处理。
 */

/** 会话列表项，对应 /api/chat/list 的返回 */
export interface AssistantConversation {
  /** 会话 id */
  id: string;
  /** 标题，取首条提问的前 30 字 */
  title: string;
  /** 最近更新时间，SQLite datetime('now') 生成的 UTC 文本 */
  updatedAt: string;
}

interface AppAssistantHistoryProps {
  /** 会话列表，接口已按最近更新倒序并截取最新 20 条 */
  items: AssistantConversation[];
  /** 当前正在查看的会话 id，用于高亮 */
  activeId?: string;
  /** 是否正在拉取列表 */
  loading?: boolean;
  /** 是否已登录；未登录时没有可展示的记录 */
  loggedIn?: boolean;
}

const props = withDefaults(defineProps<AppAssistantHistoryProps>(), {
  activeId: undefined,
  loading: false,
  loggedIn: false,
});

const emit = defineEmits<{
  /** 点击某条记录，参数为会话 id */
  select: [id: string];
  /** 删除某条记录，参数为会话 id */
  remove: [id: string];
  /** 新建对话 */
  create: [];
}>();

/**
 * SQLite 的 datetime('now') 产出 UTC 的 `YYYY-MM-DD HH:MM:SS`，不带时区标记，
 * 直接交给 Date 会被当成本地时间，东八区下整整差 8 小时，所以先补成 ISO 再解析。
 */
function formatUpdatedAt(value: string) {
  const date = new Date(`${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return "";
  return formatChatTime(date.getTime());
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="shrink-0 p-3">
      <button
        type="button"
        :disabled="!props.loggedIn"
        class="
          flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md
          border border-gray-3 px-3 py-2 text-sm text-gray-9 transition-colors
          hover:border-primary hover:text-primary
          disabled:cursor-not-allowed disabled:opacity-50
          disabled:hover:border-gray-3 disabled:hover:text-gray-9
        "
        @click="emit('create')"
      >
        <Icon name="lucide:square-pen" class="size-4" />
        新建对话
      </button>
    </div>

    <p class="shrink-0 px-4 pb-2 text-xs text-gray-6">最近 20 条</p>

    <div class="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
      <p v-if="!props.loggedIn" class="px-2 py-6 text-center text-xs text-gray-6">
        登录后可查看历史记录
      </p>
      <p v-else-if="props.loading && props.items.length === 0" class="px-2 py-6 text-center text-xs text-gray-6">
        加载中…
      </p>
      <p v-else-if="props.items.length === 0" class="px-2 py-6 text-center text-xs text-gray-6">
        暂无历史会话
      </p>
      <ul v-else class="flex flex-col gap-0.5">
        <li v-for="item in props.items" :key="item.id">
          <!--
            整行是按钮，删除按钮放在它的兄弟位置而不是嵌套在里面：
            按钮里套按钮是无效 HTML，键盘也无法单独聚焦到删除。
          -->
          <div
            class="group relative flex items-center rounded-md transition-colors"
            :class="item.id === props.activeId ? 'bg-primary/10' : 'hover:bg-gray-2'"
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5 py-2 pr-8 pl-3 text-left"
              :aria-current="item.id === props.activeId ? 'true' : undefined"
              @click="emit('select', item.id)"
            >
              <span
                class="truncate text-sm"
                :class="item.id === props.activeId ? 'text-primary' : 'text-gray-9'"
              >{{ item.title }}</span>
              <span class="text-xs text-gray-6">{{ formatUpdatedAt(item.updatedAt) }}</span>
            </button>
            <button
              type="button"
              :aria-label="`删除会话：${item.title}`"
              title="删除"
              class="
                absolute right-1.5 flex size-6 cursor-pointer items-center justify-center rounded
                text-gray-6 opacity-0 transition-opacity
                group-hover:opacity-100 hover:text-error focus-visible:opacity-100
              "
              @click="emit('remove', item.id)"
            >
              <Icon name="lucide:trash-2" class="size-3.5" />
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
