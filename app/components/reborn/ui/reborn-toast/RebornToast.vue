<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type {
  MessageInstance,
  MessageNode,
  MessagePlacement,
  MessageSemanticDOM,
} from './reborn-toast.config';
import { computed } from 'vue';
import {
  closeMessage,
  MESSAGE_TYPE_ICON,
  messagePlacements,
  messageState,
  messageTheme,
  pauseMessage,
  resumeMessage,
} from './reborn-toast.config';

defineOptions({ name: 'RebornToast' });

/** 按位置分组：六个方位各自维护一条堆叠队列 */
const stacks = computed(() =>
  messagePlacements.map(placement => ({
    placement,
    items: messageState.list.filter(item => item.placement === placement),
  })),
);

/** 贴边距离：数字视为 px；顶部方位作为 top，底部方位作为 bottom */
const edge = computed(() => {
  const top = messageState.top;
  return typeof top === 'number' ? `${top}px` : top;
});

function isBottom(placement: MessagePlacement) {
  return placement.startsWith('bottom');
}

function edgeStyle(placement: MessagePlacement): CSSProperties {
  return isBottom(placement) ? { bottom: edge.value } : { top: edge.value };
}

/** 上下两侧入场方向相反，过渡名按侧边区分 */
function transitionName(placement: MessagePlacement) {
  return isBottom(placement) ? 'reborn-message-bottom' : 'reborn-message-top';
}

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

/** 关闭图标名：缺省 lucide:x */
function closeIconName(item: MessageInstance) {
  return typeof item.closeIcon === 'string' ? item.closeIcon : 'lucide:x';
}

/** 仅字符串内容才允许按 HTML 片段渲染 */
function htmlContent(item: MessageInstance) {
  return item.dangerouslyUseHTMLString && typeof item.content === 'string' ? item.content : '';
}

/** 徽标文案：超过 99 次显示 99+ */
function badgeText(item: MessageInstance) {
  return item.repeatNum > 99 ? '99+' : String(item.repeatNum);
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
    v-for="stack in stacks" :key="stack.placement"
    tag="div" :name="transitionName(stack.placement)"
    :class="messageTheme({ placement: stack.placement }).wrapper()" :style="edgeStyle(stack.placement)"
    :dir="messageState.rtl ? 'rtl' : undefined"
  >
    <div
      v-for="item in stack.items" :key="item.id"
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

      <!-- dangerouslyUseHTMLString 开启时按 HTML 片段渲染，调用方需保证内容可信 -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-if="htmlContent(item)" :class="[themeOf(item).content(), semanticClass(item, 'content')]" :style="semanticStyle(item, 'content')" v-html="htmlContent(item)" />
      <span
        v-else
        :class="[themeOf(item).content(), semanticClass(item, 'content')]" :style="semanticStyle(item, 'content')"
      >
        <component :is="asComponent(item.content)" v-if="asComponent(item.content)" />
        <template v-else>{{ item.content }}</template>
      </span>

      <span
        v-if="item.showClose"
        :class="[themeOf(item).close(), semanticClass(item, 'close')]" :style="semanticStyle(item, 'close')"
        role="button" aria-label="关闭"
        @click.stop="closeMessage(item.id)"
      >
        <component :is="asComponent(item.closeIcon)" v-if="asComponent(item.closeIcon)" />
        <Icon v-else :name="closeIconName(item)" class="size-full" />
      </span>

      <span
        v-if="item.repeatNum > 1"
        :class="[themeOf(item).badge(), semanticClass(item, 'badge')]" :style="semanticStyle(item, 'badge')"
        :aria-label="`重复 ${item.repeatNum} 次`"
      >
        {{ badgeText(item) }}
      </span>
    </div>
  </TransitionGroup>
</template>

<style scoped>
/*
 * 入场走关键帧而不是「-enter-from 类 + 过渡」：入场偏移只存在于动画内部，
 * 页面在后台（rAF 挂起、双帧回调不执行）时元素直接落在最终位置，不会卡在半途
 */
.reborn-message-top-enter-active {
  animation: reborn-message-in-top 0.24s ease;
}

.reborn-message-bottom-enter-active {
  animation: reborn-message-in-bottom 0.24s ease;
}

@keyframes reborn-message-in-top {
  from {
    opacity: 0;
    transform: translateY(-16px) scale(0.96);
  }
}

@keyframes reborn-message-in-bottom {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.96);
  }
}

/* 离场与同栈内的位置收拢仍走过渡 */
.reborn-message-top-leave-active,
.reborn-message-top-move,
.reborn-message-bottom-leave-active,
.reborn-message-bottom-move {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.reborn-message-top-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.reborn-message-bottom-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

/* 离场元素脱离文档流，让同栈内其余消息的 move 过渡平滑收拢 */
.reborn-message-top-leave-active,
.reborn-message-bottom-leave-active {
  position: absolute;
}
</style>
