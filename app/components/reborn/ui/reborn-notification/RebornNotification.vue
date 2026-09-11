<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type {
  NotificationInstance,
  NotificationNode,
  NotificationProgressOptions,
} from './reborn-notification.config';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { cn } from '~/lib/utils';
import {
  closeNotification,
  NOTIFICATION_EDGE_GAP,
  NOTIFICATION_TYPE_ICON,
  notificationPositions,
  notificationState,
  notificationTheme,
  pauseNotification,
  resumeNotification,
} from './reborn-notification.config';

defineOptions({ name: 'RebornNotification' });

/** 按位置分组：四个角各自维护一条堆叠队列 */
const stacks = computed(() =>
  notificationPositions.map(position => ({
    position,
    items: notificationState.list.filter(item => item.position === position),
  })),
);

/** 飘带位置：未开启为 none，true 视作贴左 */
function ribbonSide(item: NotificationInstance): 'none' | 'left' | 'right' {
  if (!item.ribbon) return 'none';
  return item.ribbon === true ? 'left' : item.ribbon;
}

/** 取单条通知的样式构建器 */
function themeOf(item: NotificationInstance) {
  return notificationTheme({
    position: item.position,
    type: item.type,
    ribbon: ribbonSide(item),
    clickable: Boolean(item.onClick),
    withProgress: Boolean(progressOf(item)),
    stripedFlow: Boolean(progressOf(item)?.striped && progressOf(item)?.stripedFlow),
  });
}

/**
 * 视口滚动条占位（px）。position: fixed 的包含块不含经典滚动条，
 * 于是 right: 16px 在带 10px 滚动条的页面上看着离窗口边 26px，与 top: 16px 不对称。
 * 这里实测滚动条宽 / 高并从贴边值里扣掉，让四个方向的视觉留白一致；
 * 覆盖式滚动条（移动端 / macOS）或页面不滚动时测得 0，不产生任何影响。
 */
const gutter = ref({ x: 0, y: 0 });

function measureGutter() {
  const doc = document.documentElement;
  gutter.value = {
    x: Math.max(0, window.innerWidth - doc.clientWidth),
    y: Math.max(0, window.innerHeight - doc.clientHeight),
  };
}

let gutterObserver: ResizeObserver | null = null;

onMounted(() => {
  measureGutter();
  window.addEventListener('resize', measureGutter);
  // 内容增减导致滚动条出现 / 消失时不会触发 resize，用 ResizeObserver 补齐
  if (typeof ResizeObserver !== 'undefined') {
    gutterObserver = new ResizeObserver(measureGutter);
    gutterObserver.observe(document.documentElement);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureGutter);
  gutterObserver?.disconnect();
  gutterObserver = null;
});

/**
 * 定位容器样式：四条边的贴边留白统一取 NOTIFICATION_EDGE_GAP，
 * 贴视口时按所在侧扣掉滚动条占位；offset 只叠加在锚定的纵向边（top / bottom）上；
 * zIndex 为 0 时用内置层级 2200（高于 message 的 2100）
 */
function wrapperStyle(position: (typeof notificationPositions)[number]): CSSProperties {
  const anchored = notificationState.viewportAnchored;
  const isTop = position.startsWith('top');
  const isRight = position.endsWith('right');
  // 滚动条只占右侧与底部，另外两条边无需补偿
  const trimY = !isTop && anchored ? gutter.value.y : 0;
  const trimX = isRight && anchored ? gutter.value.x : 0;

  const style: CSSProperties = {
    zIndex: notificationState.zIndex > 0 ? notificationState.zIndex : 2200,
  };
  const vertical = `${Math.max(0, NOTIFICATION_EDGE_GAP - trimY) + notificationState.offset}px`;
  const horizontal = `${Math.max(0, NOTIFICATION_EDGE_GAP - trimX)}px`;
  if (isTop) style.top = vertical;
  else style.bottom = vertical;
  if (isRight) style.right = horizontal;
  else style.left = horizontal;
  return style;
}

/** 左右两侧入场方向不同，过渡名按侧边区分 */
function transitionName(position: (typeof notificationPositions)[number]) {
  return position.endsWith('right') ? 'reborn-notification-right' : 'reborn-notification-left';
}

/** VNode（或返回 VNode 的函数）走 component :is 渲染 */
function asComponent(node?: NotificationNode) {
  if (!node || typeof node === 'string') return null;
  return typeof node === 'function' ? node : () => node;
}

/** 图标名：设置了 type 时按 type 取默认图标（type 覆盖 icon），否则用字符串形式的 icon */
function iconName(item: NotificationInstance) {
  if (item.type) return NOTIFICATION_TYPE_ICON[item.type];
  return typeof item.icon === 'string' ? item.icon : '';
}

/** 是否需要渲染图标区：有 type 或有自定义 icon */
function hasIcon(item: NotificationInstance) {
  return Boolean(item.type || item.icon);
}

/** 自定义图标为 VNode 且未被 type 覆盖时，走组件渲染 */
function iconComponent(item: NotificationInstance) {
  return item.type ? null : asComponent(item.icon);
}

/** 关闭图标：缺省 lucide:x */
function closeIconName(item: NotificationInstance) {
  return typeof item.closeIcon === 'string' ? item.closeIcon : 'lucide:x';
}

/** 字符串正文贴在标题下方（间隔 8px），VNode 正文独立成段（间隔 20px） */
function inlineMessage(item: NotificationInstance) {
  return typeof item.message === 'string' ? item.message : '';
}

/** 头部是否渲染：标题、字符串正文、图标、关闭按钮任一存在即渲染 */
function headerVisible(item: NotificationInstance) {
  return Boolean(item.title || inlineMessage(item) || hasIcon(item) || item.showClose);
}

/** 进度条选项：仅在开启 progress 且会自动关闭时才有意义 */
function progressOf(item: NotificationInstance): NotificationProgressOptions | null {
  if (!item.progress || item.duration <= 0) return null;
  return typeof item.progress === 'object' ? item.progress : {};
}

/** 轨道高度：数字视为 px，缺省 3px */
function progressTrackStyle(item: NotificationInstance): CSSProperties {
  const size = progressOf(item)?.size;
  return { height: typeof size === 'number' ? `${size}px` : (size ?? '3px') };
}

/**
 * 填充层动画：scaleX 从 1 线性收到 0，时长即 duration（毫秒）；
 * 悬停暂停时冻结在当前进度（与计时器的剩余时长保持一致）
 */
function progressFillStyle(item: NotificationInstance): CSSProperties {
  const options = progressOf(item);
  return {
    animationName: 'reborn-notification-progress',
    animationDuration: `${item.duration}ms`,
    animationTimingFunction: 'linear',
    animationFillMode: 'forwards',
    animationPlayState: item.paused ? 'paused' : 'running',
    ...(options?.strokeColor ? { backgroundColor: options.strokeColor } : {}),
  };
}

function handleMouseEnter(item: NotificationInstance) {
  if (item.pauseOnHover) pauseNotification(item.id);
}
function handleMouseLeave(item: NotificationInstance) {
  if (item.pauseOnHover) resumeNotification(item.id);
}
</script>

<template>
  <TransitionGroup
    v-for="stack in stacks" :key="stack.position"
    tag="div" :name="transitionName(stack.position)"
    :class="cn(notificationTheme({ position: stack.position }).wrapper(), stack.items[0]?.ui?.wrapper)"
    :style="wrapperStyle(stack.position)"
  >
    <div
      v-for="item in stack.items" :key="item.id"
      :class="cn(themeOf(item).root(), item.customClass, item.ui?.root)"
      :style="item.style"
      role="alert" aria-live="polite"
      @click="item.onClick?.($event)"
      @mouseenter="handleMouseEnter(item)"
      @mouseleave="handleMouseLeave(item)"
    >
      <div v-if="headerVisible(item)" :class="cn(themeOf(item).header(), item.ui?.header)">
        <span v-if="hasIcon(item)" :class="cn(themeOf(item).iconWrapper(), item.ui?.iconWrapper)">
          <component :is="iconComponent(item)" v-if="iconComponent(item)" />
          <Icon v-else :name="iconName(item)" :class="cn(themeOf(item).icon(), item.ui?.icon)" />
        </span>

        <div :class="cn(themeOf(item).headerContent(), item.ui?.headerContent)">
          <span v-if="item.title" :class="cn(themeOf(item).title(), item.ui?.title)">{{ item.title }}</span>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p
            v-if="inlineMessage(item) && item.dangerouslyUseHTMLString"
            :class="cn(themeOf(item).message(), item.ui?.message)" v-html="inlineMessage(item)"
          />
          <p
            v-else-if="inlineMessage(item)"
            :class="cn(themeOf(item).message(), item.ui?.message)"
          >
            {{ inlineMessage(item) }}
          </p>
        </div>

        <span
          v-if="item.showClose"
          :class="cn(themeOf(item).close(), item.ui?.close)"
          role="button" aria-label="关闭"
          @click.stop="closeNotification(item.id)"
        >
          <component :is="asComponent(item.closeIcon)" v-if="asComponent(item.closeIcon)" />
          <Icon v-else :name="closeIconName(item)" class="size-full" />
        </span>
      </div>

      <!-- VNode / 函数形式的正文独立成段，与头部间隔 20px -->
      <div v-if="asComponent(item.message)" :class="cn(themeOf(item).body(), item.ui?.body)">
        <component :is="asComponent(item.message)" />
      </div>

      <div v-if="item.footer" :class="cn(themeOf(item).footer(), item.ui?.footer)">
        <component :is="asComponent(item.footer)" v-if="asComponent(item.footer)" />
        <template v-else>{{ item.footer }}</template>
      </div>

      <div
        v-if="progressOf(item)"
        :class="cn(themeOf(item).progressTrack(), item.ui?.progressTrack)"
        :style="progressTrackStyle(item)"
      >
        <div
          :class="cn(themeOf(item).progressFill(), progressOf(item)?.class, item.ui?.progressFill)"
          :style="progressFillStyle(item)"
        >
          <div
            v-if="progressOf(item)?.striped"
            :class="cn(themeOf(item).progressStripes(), item.ui?.progressStripes)"
          />
        </div>
      </div>

      <!-- 飘带放在最后渲染，保证 3px 竖条压在进度条轨道之上通栏贯穿 -->
      <div
        v-if="ribbonSide(item) !== 'none'"
        :class="cn(themeOf(item).ribbon(), item.ui?.ribbon)"
        aria-hidden="true"
      />
    </div>
  </TransitionGroup>
</template>

<!-- 关键帧写在非 scoped 块里：动画由行内样式指定名称，scoped 会重写 @keyframes 名导致匹配不上 -->
<style>
@keyframes reborn-notification-progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

@keyframes reborn-notification-stripes {
  from { background-position: 0 0; }
  to { background-position: 1.25em 0; }
}
</style>

<style scoped>
/*
 * 入场走关键帧而不是「-enter-from 类 + 过渡」：入场偏移只存在于动画内部，
 * 页面在后台（rAF 挂起、双帧回调不执行）时元素直接落在最终位置，
 * 不会卡在 translateX(±24px) 上看着像贴边距算错
 */
.reborn-notification-right-enter-active {
  animation: reborn-notification-slide-in-right 0.28s ease;
}

.reborn-notification-left-enter-active {
  animation: reborn-notification-slide-in-left 0.28s ease;
}

@keyframes reborn-notification-slide-in-right {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
}

@keyframes reborn-notification-slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-24px);
  }
}

/* 离场与同栈内的位置收拢仍走过渡 */
.reborn-notification-right-leave-active,
.reborn-notification-right-move,
.reborn-notification-left-leave-active,
.reborn-notification-left-move {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.reborn-notification-right-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

.reborn-notification-left-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

/* 离场元素脱离文档流，让同栈内其余通知的 move 过渡平滑收拢 */
.reborn-notification-right-leave-active,
.reborn-notification-left-leave-active {
  position: absolute;
}
</style>
