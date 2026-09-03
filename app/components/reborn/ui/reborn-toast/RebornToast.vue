<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type {MessageInstance, MessageNode, MessageSemanticDOM} from './reborn-toast.config';
import { computed } from 'vue';
import {
  MESSAGE_TYPE_ICON,
  
  
  
  messageState,
  messageTheme,
  pauseMessage,
  resumeMessage
} from './reborn-toast.config';

defineOptions({ name: 'RebornToast' });

/** 顶部偏移：数字视为 px */
const topStyle = computed(() => {
  const top = messageState.top;
  return typeof top === 'number' ? `${top}px` : top;
});

/** 取单条消息的样式构建器 */
const themeOf = (item: MessageInstance) => messageTheme({ variant: item.variant, color: item.color });

/** classNames / styles 支持对象或函数两种形态 */
function semanticClass(item: MessageInstance, key: MessageSemanticDOM): string | undefined {
  const source = typeof item.classNames === 'function' ? item.classNames({ props: item }) : item.classNames;
  return source?.[key];
}
function semanticStyle(item: MessageInstance, key: MessageSemanticDOM): CSSProperties | undefined {
  const source = typeof item.styles === 'function' ? item.styles({ props: item }) : item.styles;
  return source?.[key];
}

/** VNode（或返回 VNode 的函数）走 component :is 渲染 */
function asComponent(node?: MessageNode) {
  if (!node || typeof node === 'string') return null;
  return typeof node === 'function' ? node : () => node;
}

/** 图标名：icon 传字符串时优先，否则按 type 取默认图标 */
function iconName(item: MessageInstance) {
  return typeof item.icon === 'string' ? item.icon : MESSAGE_TYPE_ICON[item.type];
}

function handleMouseEnter(item: MessageInstance) {
  if (item.pauseOnHover) pauseMessage(item.id);
}
function handleMouseLeave(item: MessageInstance) {
  if (item.pauseOnHover) resumeMessage(item.id);
}
</script>

<template>
  <TransitionGroup
    tag="div" name="reborn-message" :class="messageTheme().wrapper()" :style="{ top: topStyle }"
    :dir="messageState.rtl ? 'rtl' : undefined"
  >
    <div
      v-for="item in messageState.list" :key="item.id"
      :class="[themeOf(item).root(), item.className, semanticClass(item, 'root')]"
      :style="[item.style ?? {}, semanticStyle(item, 'root') ?? {}]"
      role="alert"
      @click="item.onClick?.($event)"
      @mouseenter="handleMouseEnter(item)"
      @mouseleave="handleMouseLeave(item)"
    >
      <span :class="[themeOf(item).iconWrapper(), semanticClass(item, 'icon')]" :style="semanticStyle(item, 'icon')">
        <component :is="asComponent(item.icon)" v-if="asComponent(item.icon)" />
        <Icon
          v-else :name="iconName(item)"
          :class="[themeOf(item).icon(), item.type === 'loading' && !item.icon ? 'animate-spin' : '']"
        />
      </span>

      <span :class="[themeOf(item).content(), semanticClass(item, 'content')]" :style="semanticStyle(item, 'content')">
        <component :is="asComponent(item.content)" v-if="asComponent(item.content)" />
        <template v-else>{{ item.content }}</template>
      </span>
    </div>
  </TransitionGroup>
</template>

<style scoped>
.reborn-message-enter-active,
.reborn-message-leave-active,
.reborn-message-move {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.reborn-message-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.96);
}

.reborn-message-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

/* 离场元素脱离文档流，让后续消息的 move 过渡平滑上移 */
.reborn-message-leave-active {
  position: absolute;
}
</style>
