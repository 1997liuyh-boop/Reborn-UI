<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type {
  MessageColor,
  MessageInstance,
  MessageNode,
  MessagePlacement,
  MessageSemanticDOM,
  MessageVariant,
} from './reborn-toast.config';
import { computed } from 'vue';
import { useMotionList } from '@/composables/useMotionList';
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

/** 单条消息各节点的完整类名 */
interface MessageClasses {
  root: string;
  iconWrapper: string;
  icon: string;
  content: string;
  close: string;
  badge: string;
}

/** 类名只由 variant 与 color 决定（最多 35 种组合），按组合缓存，渲染时不再逐条调用 tv */
const classCache = new Map<string, MessageClasses>();
function classesOf(variant: MessageVariant, color: MessageColor): MessageClasses {
  const cacheKey = `${variant}|${color}`;
  let classes = classCache.get(cacheKey);
  if (!classes) {
    const theme = messageTheme({ variant, color });
    classes = {
      root: theme.root(),
      iconWrapper: theme.iconWrapper(),
      icon: theme.icon(),
      content: theme.content(),
      close: theme.close(),
      badge: theme.badge(),
    };
    classCache.set(cacheKey, classes);
  }
  return classes;
}

/** 按位置分组：六个方位各自维护一条堆叠队列；每条消息带上算好的类名，模板直接取字符串 */
const stacks = computed(() =>
  messagePlacements.map(placement => ({
    placement,
    wrapperClass: messageTheme({ placement }).wrapper(),
    items: messageState.list
      .filter(item => item.placement === placement)
      .map(item => ({ item, cls: classesOf(item.variant, item.color) })),
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

/** 各栈保留自己的入场方向，增删补位统一由 Motion 承担。 */
const listMotion = useMotionList({
  duration: 0.24,
  enter: element => ({ opacity: [0, 1], translate: [`0px ${element.dataset.placement?.startsWith('bottom') ? 16 : -16}px`, '0px 0px'] }),
  leave: element => ({ opacity: 0, translate: `0px ${element.dataset.placement?.startsWith('bottom') ? 8 : -8}px` }),
});
const vMotionList = listMotion.directive;

/** classNames / styles 支持对象或函数两种形态 */
function semanticClass(item: MessageInstance, key: MessageSemanticDOM): string | undefined {
  const source = typeof item.classNames === 'function' ? item.classNames({ props: item }) : item.classNames;
  return source?.[key];
}
function semanticStyle(item: MessageInstance, key: MessageSemanticDOM): CSSProperties | undefined {
  const source = typeof item.styles === 'function' ? item.styles({ props: item }) : item.styles;
  return source?.[key];
}

/**
 * VNode 或返回 VNode 的函数直接交给 component :is：
 * VNode 会被克隆后按原类型 patch，函数保持同一引用，容器重渲染时内容不会被卸载重建。
 * 不能每次渲染包一层新的箭头函数，那样组件类型每次都变，内部状态与动画会被重置
 */
function isNodeContent(node?: MessageNode): node is Exclude<MessageNode, string> {
  return !!node && typeof node !== 'string';
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
    v-motion-list tag="div" :css="false"
    :class="stack.wrapperClass" :style="edgeStyle(stack.placement)"
    :dir="messageState.rtl ? 'rtl' : undefined" @enter="listMotion.enter"
    @leave="listMotion.leave" @enter-cancelled="listMotion.cancel"
    @leave-cancelled="listMotion.cancel"
  >
    <div
      v-for="{ item, cls } in stack.items" :key="item.id"
      :data-placement="stack.placement"
      :class="[cls.root, item.className, semanticClass(item, 'root')]"
      :style="[item.style ?? {}, semanticStyle(item, 'root') ?? {}]"
      role="alert"
      @click="item.onClick?.($event)"
      @mouseenter="handleMouseEnter(item)"
      @mouseleave="handleMouseLeave(item)"
    >
      <span :class="[cls.iconWrapper, semanticClass(item, 'icon')]" :style="semanticStyle(item, 'icon')">
        <component :is="item.icon" v-if="isNodeContent(item.icon)" />
        <Icon
          v-else :name="iconName(item)"
          :class="[cls.icon, item.type === 'loading' && !item.icon ? 'animate-spin' : '']"
        />
      </span>

      <!-- dangerouslyUseHTMLString 开启时按 HTML 片段渲染，调用方需保证内容可信 -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-if="htmlContent(item)" :class="[cls.content, semanticClass(item, 'content')]" :style="semanticStyle(item, 'content')" v-html="htmlContent(item)" />
      <span
        v-else
        :class="[cls.content, semanticClass(item, 'content')]" :style="semanticStyle(item, 'content')"
      >
        <component :is="item.content" v-if="isNodeContent(item.content)" />
        <template v-else>{{ item.content }}</template>
      </span>

      <span
        v-if="item.showClose"
        :class="[cls.close, semanticClass(item, 'close')]" :style="semanticStyle(item, 'close')"
        role="button" aria-label="关闭"
        @click.stop="closeMessage(item.id)"
      >
        <component :is="item.closeIcon" v-if="isNodeContent(item.closeIcon)" />
        <Icon v-else :name="closeIconName(item)" class="size-full" />
      </span>

      <span
        v-if="item.repeatNum > 1"
        :class="[cls.badge, semanticClass(item, 'badge')]" :style="semanticStyle(item, 'badge')"
        :aria-label="`重复 ${item.repeatNum} 次`"
      >
        {{ badgeText(item) }}
      </span>
    </div>
  </TransitionGroup>
</template>
