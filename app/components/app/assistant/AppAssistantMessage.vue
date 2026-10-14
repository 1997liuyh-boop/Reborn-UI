<script setup lang="ts">
/**
 * AI 助手抽屉里的单条聊天消息
 *
 * 只负责「谁 · 什么时候 + 气泡」这层排版：AI 回答靠左，用户提问靠右。
 * 气泡内容由默认插槽给出，AI 回答里的 Markdown、工具调用进度都在父组件渲染。
 */

interface AppAssistantMessageProps {
  /** 消息角色：assistant 靠左、user 靠右 */
  role: "assistant" | "user";
  /** 发送方名称，AI 回答固定为「客服机器人」，用户提问取登录用户名 */
  name: string;
  /** 已格式化的发送时间；旧记录没有存时间时为空串，此时只显示名称 */
  time?: string;
}

const props = withDefaults(defineProps<AppAssistantMessageProps>(), {
  time: "",
});

defineSlots<{
  /** 气泡内容 */
  default: () => unknown;
}>();

const isUser = computed(() => props.role === "user");
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1.5" :class="isUser ? 'items-end' : 'items-start'">
    <div class="flex items-center gap-2 text-xs text-gray-6">
      <span class="font-medium text-gray-8">{{ name }}</span>
      <time v-if="time">{{ time }}</time>
    </div>
    <!--
      用户气泡取主色 10% 的浅底配正文色：主题色可切换，浅色下 green-6 / orange-6
      做底配白字对比度只有约 1.6:1，浅底深字在任意主题色与明暗模式下都可读。
    -->
    <div
      class="min-w-0 rounded-lg px-4 text-sm leading-6 text-gray-9"
      :class="isUser
        ? 'max-w-[85%] rounded-tr-sm bg-primary/10 py-2.5 break-words'
        : 'max-w-full rounded-tl-sm bg-gray-2 py-3'"
    >
      <slot />
    </div>
  </div>
</template>
