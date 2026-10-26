<script setup lang="ts">
import type { CSSProperties, FunctionalComponent, VNode } from 'vue';
import type {
  NotificationInstance,
  NotificationNode,
  NotificationPlacement,
  NotificationProgressOptions,
} from './reborn-notification.config';
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue';
import { useMotionList } from '@/composables/useMotionList';
import { cn } from '~/lib/utils';
import {
  closeNotification,
  NOTIFICATION_EDGE_GAP,
  NOTIFICATION_TYPE_ICON,
  notificationPlacements,
  notificationState,
  notificationTheme,
  pauseNotification,
  resumeNotification,
} from './reborn-notification.config';

defineOptions({ name: 'RebornNotification' });

/** 飘带位置：未开启为 none，true 视作贴左 */
function ribbonSide(item: NotificationInstance): 'none' | 'left' | 'right' {
  if (!item.ribbon) return 'none';
  return item.ribbon === true ? 'left' : item.ribbon;
}

/** 进度条选项：仅在开启 progress 且会自动关闭时才有意义 */
function progressOf(item: NotificationInstance): NotificationProgressOptions | null {
  if (!item.progress || item.duration <= 0) return null;
  return typeof item.progress === 'object' ? item.progress : {};
}

/**
 * 单条通知的派生数据：槽位类名在这里一次算好。
 * 原先模板里每个节点各调一次 themeOf，一条通知一次渲染要做十余次 tailwind-variants 合成与 twMerge
 */
function buildEntry(item: NotificationInstance) {
  const progress = progressOf(item);
  const ribbon = ribbonSide(item);
  const t = notificationTheme({
    placement: item.placement,
    type: item.type,
    ribbon,
    clickable: Boolean(item.onClick),
    withProgress: Boolean(progress),
    stripedFlow: Boolean(progress?.striped && progress.stripedFlow),
  });
  const o = item.ui ?? {};
  return {
    item,
    progress,
    ribbon,
    ui: {
      root: cn(t.root(), item.customClass, o.root),
      header: cn(t.header(), o.header),
      iconWrapper: cn(t.iconWrapper(), o.iconWrapper),
      icon: cn(t.icon(), o.icon),
      headerContent: cn(t.headerContent(), o.headerContent),
      title: cn(t.title(), o.title),
      message: cn(t.message(), o.message),
      close: cn(t.close(), o.close),
      body: cn(t.body(), o.body),
      footer: cn(t.footer(), o.footer),
      progressTrack: cn(t.progressTrack(), o.progressTrack),
      progressFill: cn(t.progressFill(), progress?.class, o.progressFill),
      progressStripes: cn(t.progressStripes(), o.progressStripes),
      ribbon: cn(t.ribbon(), o.ribbon),
    },
  };
}

/** 按位置分组：四个角各自维护一条堆叠队列；悬停暂停只改 paused，不会让这里重算 */
const stacks = computed(() =>
  notificationPlacements.map((placement) => {
    const items = notificationState.list.filter(item => item.placement === placement);
    return {
      placement,
      wrapperClass: cn(notificationTheme({ placement }).wrapper(), items[0]?.ui?.wrapper),
      entries: items.map(buildEntry),
    };
  }),
);

/**
 * 视口滚动条占位（px）。position: fixed 的包含块不含经典滚动条，
 * 于是 right: 16px 在带 10px 滚动条的页面上看着离窗口边 26px，与 top: 16px 不对称。
 * 这里实测滚动条宽 / 高并从贴边值里扣掉，让四个方向的视觉留白一致；
 * 覆盖式滚动条（移动端 / macOS）或页面不滚动时测得 0，不产生任何影响。
 */
const gutter = shallowRef({ x: 0, y: 0 });

function measureGutter() {
  const doc = document.documentElement;
  const x = Math.max(0, window.innerWidth - doc.clientWidth);
  const y = Math.max(0, window.innerHeight - doc.clientHeight);
  // 页面高度一变 ResizeObserver 就会回调，数值不变时不赋值，避免容器跟着重渲染
  if (x === gutter.value.x && y === gutter.value.y) return;
  gutter.value = { x, y };
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
function wrapperStyle(placement: NotificationPlacement): CSSProperties {
  const anchored = notificationState.viewportAnchored;
  const isTop = placement.startsWith('top');
  // 没有 rtl 配置，end 固定对应右侧、start 固定对应左侧
  const isRight = placement.endsWith('end');
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

/** 进出方向跟随所在侧，栈内成员的补位由 Motion 连续跟随。 */
const listMotion = useMotionList({
  duration: 0.28,
  enter: element => ({ opacity: [0, 1], translate: [`${element.dataset.placement?.endsWith('end') ? 24 : -24}px 0px`, '0px 0px'] }),
  leave: element => ({ opacity: 0, translate: `${element.dataset.placement?.endsWith('end') ? 24 : -24}px 0px` }),
});
const vMotionList = listMotion.directive;

type RenderableNode = VNode | (() => VNode);

/**
 * 渲染通知里的自定义节点（VNode 或返回 VNode 的函数）。
 * 组件类型固定为同一个函数式组件，容器重渲染时按同类型 patch，节点里的组件状态、焦点不会被卸载重挂
 */
const RenderNode: FunctionalComponent<{ node: RenderableNode | null }> = props =>
  (typeof props.node === 'function' ? props.node() : props.node);
RenderNode.props = ['node'];

/** 取可渲染的自定义节点：字符串或未传时返回 null，交给模板走文本 / 图标名分支 */
function nodeOf(node?: NotificationNode): RenderableNode | null {
  if (!node || typeof node === 'string') return null;
  return node;
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

/** 自定义图标为 VNode 且未被 type 覆盖时，走节点渲染 */
function iconNode(item: NotificationInstance) {
  return item.type ? null : nodeOf(item.icon);
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

/** 轨道高度：数字视为 px，缺省 3px */
function progressTrackStyle(progress: NotificationProgressOptions): CSSProperties {
  const size = progress.size;
  return { height: typeof size === 'number' ? `${size}px` : (size ?? '3px') };
}

/**
 * 填充层动画：scaleX 从 1 线性收到 0，时长即 duration（毫秒）；
 * 悬停暂停时冻结在当前进度（与计时器的剩余时长保持一致）
 */
function progressFillStyle(item: NotificationInstance, progress: NotificationProgressOptions): CSSProperties {
  return {
    animationName: 'reborn-notification-progress',
    animationDuration: `${item.duration}ms`,
    animationTimingFunction: 'linear',
    animationFillMode: 'forwards',
    animationPlayState: item.paused ? 'paused' : 'running',
    ...(progress.strokeColor ? { backgroundColor: progress.strokeColor } : {}),
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
    v-for="stack in stacks" :key="stack.placement"
    v-motion-list tag="div" :css="false"
    :class="stack.wrapperClass" :style="wrapperStyle(stack.placement)"
    @enter="listMotion.enter" @leave="listMotion.leave"
    @enter-cancelled="listMotion.cancel"
    @leave-cancelled="listMotion.cancel"
  >
    <div
      v-for="{ item, ui, progress, ribbon } in stack.entries" :key="item.id"
      :data-placement="stack.placement"
      :class="ui.root"
      :style="item.style"
      role="alert" aria-live="polite"
      @click="item.onClick?.($event)"
      @mouseenter="handleMouseEnter(item)"
      @mouseleave="handleMouseLeave(item)"
    >
      <div v-if="headerVisible(item)" :class="ui.header">
        <span v-if="hasIcon(item)" :class="ui.iconWrapper">
          <RenderNode v-if="iconNode(item)" :node="iconNode(item)" />
          <Icon v-else :name="iconName(item)" :class="ui.icon" />
        </span>

        <div :class="ui.headerContent">
          <span v-if="item.title" :class="ui.title">{{ item.title }}</span>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p
            v-if="inlineMessage(item) && item.dangerouslyUseHTMLString"
            :class="ui.message" v-html="inlineMessage(item)"
          />
          <p
            v-else-if="inlineMessage(item)"
            :class="ui.message"
          >
            {{ inlineMessage(item) }}
          </p>
        </div>

        <span
          v-if="item.showClose"
          :class="ui.close"
          role="button" aria-label="关闭"
          @click.stop="closeNotification(item.id)"
        >
          <RenderNode v-if="nodeOf(item.closeIcon)" :node="nodeOf(item.closeIcon)" />
          <Icon v-else :name="closeIconName(item)" class="size-full" />
        </span>
      </div>

      <!-- VNode / 函数形式的正文独立成段，与头部间隔 20px -->
      <div v-if="nodeOf(item.message)" :class="ui.body">
        <RenderNode :node="nodeOf(item.message)" />
      </div>

      <div v-if="item.footer" :class="ui.footer">
        <RenderNode v-if="nodeOf(item.footer)" :node="nodeOf(item.footer)" />
        <template v-else>{{ item.footer }}</template>
      </div>

      <div
        v-if="progress"
        :class="ui.progressTrack"
        :style="progressTrackStyle(progress)"
      >
        <!-- key 带版本号：同 key 更新后重建填充层，进度动画与重置后的计时一起从头开始 -->
        <div
          :key="`${item.id}-${item.version}`"
          :class="ui.progressFill"
          :style="progressFillStyle(item, progress)"
        >
          <div
            v-if="progress.striped"
            :class="ui.progressStripes"
          />
        </div>
      </div>

      <!-- 飘带放在最后渲染，保证 3px 竖条压在进度条轨道之上通栏贯穿 -->
      <div
        v-if="ribbon !== 'none'"
        :class="ui.ribbon"
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
