<script setup lang="ts">
import type { ClassValue } from 'tailwind-variants';
import type { CSSProperties, VNode } from 'vue';
import type { AvatarShape, AvatarSize } from '../reborn-avatar/reborn-avatar.config';
import type { AvatarGroupEffect, AvatarGroupUI } from './reborn-avatar-group.config';
import type { Placement } from '~/lib/placement';
import { cloneVNode, computed, h, provide } from 'vue';
import { cn } from '~/lib/utils';
import { avatarGroupKey } from '../reborn-avatar/reborn-avatar.context';
import RebornAvatar from '../reborn-avatar/RebornAvatar.vue';
import RebornTooltip from '../reborn-tooltip/RebornTooltip.vue';
import { avatarGroupTheme } from './reborn-avatar-group.config';
import { flattenAvatarNodes, normalizeAvatarLimit } from './reborn-avatar-group.utils';

export interface AvatarGroupProps {
  /** 子头像默认尺寸，单个头像显式传值可覆盖 */
  size?: AvatarSize;
  /** 子头像默认形状，单个头像显式传值可覆盖 */
  shape?: AvatarShape;
  /** 相邻头像的重叠距离，单位 px；0 表示不重叠，负数按 0 处理 */
  gap?: number;
  /** 超出上限时显示折叠计数 */
  collapseAvatars?: boolean;
  /** 开启折叠后，悬停或聚焦计数头像展示隐藏头像 */
  collapseAvatarsTooltip?: boolean;
  /** 折叠时最多显示的普通头像数，至少一个 */
  maxCollapseAvatars?: number;
  /** 浮层主题；自定义名称可通过 data-effect 选择器配合样式 */
  effect?: AvatarGroupEffect;
  /** 浮层位置 */
  placement?: Placement;
  /** 浮层追加类名 */
  popperClass?: string;
  /** 浮层行内样式 */
  popperStyle?: string | CSSProperties;
  /** 折叠计数头像追加类名 */
  collapseClass?: string;
  /** 折叠计数头像行内样式 */
  collapseStyle?: string | CSSProperties;
  /** 根容器追加类名 */
  class?: ClassValue;
  /** 按结构覆盖样式 */
  ui?: AvatarGroupUI;
}

defineOptions({ name: 'RebornAvatarGroup' });
const props = withDefaults(defineProps<AvatarGroupProps>(), {
  gap: 8,
  collapseAvatars: false,
  collapseAvatarsTooltip: false,
  maxCollapseAvatars: 1,
  effect: 'light',
  placement: 'top',
  popperClass: '',
  collapseClass: '',
  ui: () => ({}),
});
const slots = defineSlots<{
  /** 放入 RebornAvatar，支持 v-for 与条件片段 */
  default?: () => VNode[];
}>();

provide(avatarGroupKey, { size: computed(() => props.size), shape: computed(() => props.shape) });
/** 数值通过变量交给 Tailwind 消费，避免动态拼接类名导致构建漏掉样式。 */
const gapStyle = computed(() => ({
  '--rb-avatar-group-gap': `${Number.isFinite(props.gap) ? Math.max(0, props.gap) : 8}px`,
}));
const styles = computed(() => avatarGroupTheme({
  shape: props.shape ?? 'circle',
  effect: props.effect === 'dark' ? 'dark' : 'light',
  interactive: props.collapseAvatarsTooltip,
}));

/** 在渲染期间读取插槽，确保父级增删头像和折叠参数变化都能实时更新。 */
const AvatarContent = () => {
  const avatars = flattenAvatarNodes(slots.default?.() ?? []);
  const limit = props.collapseAvatars ? normalizeAvatarLimit(props.maxCollapseAvatars) : avatars.length;
  const visible = avatars.slice(0, limit);
  const hidden = avatars.slice(limit);
  const items = visible.map((avatar, index) => h('span', {
    key: avatar.key ?? index,
    class: styles.value.item({ class: props.ui.item }),
  }, [avatar]));
  if (!hidden.length) return items;

  const counter = () => h(RebornAvatar, {
    class: cn(props.ui.collapse, props.collapseClass),
    style: props.collapseStyle,
    'aria-hidden': true,
  }, { default: () => `+${hidden.length}` });
  const label = `另外 ${hidden.length} 位成员`;
  const collapse = () => h(props.collapseAvatarsTooltip ? 'button' : 'span', {
    class: styles.value.collapse(),
    type: props.collapseAvatarsTooltip ? 'button' : undefined,
    role: props.collapseAvatarsTooltip ? undefined : 'img',
    'aria-label': label,
  }, [counter()]);
  const content = props.collapseAvatarsTooltip
    ? h(RebornTooltip, {
        placement: props.placement,
        trigger: ['hover', 'focus'],
        arrow: false,
        destroyOnHidden: true,
        ui: { wrapper: 'inline-flex', content: 'max-w-none bg-transparent p-0 text-inherit', contentWrapper: 'pointer-events-auto' },
      }, {
        default: collapse,
        // 延迟插槽会被过渡与定位多次求值，每次复制节点，避免复用已脱离 DOM 的头像。
        content: () => h('div', {
          class: styles.value.tooltip({ class: cn(props.ui.tooltip, props.popperClass) }),
          style: props.popperStyle,
          'data-effect': props.effect,
        }, hidden.map(avatar => cloneVNode(avatar))),
      })
    : collapse();
  items.push(h('span', { key: 'collapse', class: styles.value.item({ class: props.ui.item }) }, [content]));
  return items;
};
</script>

<template>
  <div role="group" :class="styles.root({ class: cn(props.ui.root, props.class) })" :style="gapStyle"><AvatarContent /></div>
</template>
