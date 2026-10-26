<script setup lang="ts">
import type { ClassValue } from 'tailwind-variants';
import type { Component } from 'vue';
import type { AvatarFit, AvatarShape, AvatarSize, AvatarUI } from './reborn-avatar.config';
import { Icon } from '#components';
import { computed, inject, onMounted, shallowRef, useTemplateRef, watch } from 'vue';
import { cn } from '~/lib/utils';
import { avatarTheme } from './reborn-avatar.config';
import { avatarGroupKey } from './reborn-avatar.context';

export interface AvatarProps {
  /** 图标名称或 Vue 组件，图片不可用时优先于默认插槽 */
  icon?: string | Component;
  /** 三档固定尺寸或自定义像素；未传时继承组设置，最终默认 md */
  size?: AvatarSize;
  /** 头像形状；未传时继承组设置，最终默认 circle */
  shape?: AvatarShape;
  /** 图片地址 */
  src?: string;
  /** 原生响应式图片候选地址 */
  srcSet?: string;
  /** 图片替代文字，回退图标也会使用该名称 */
  alt?: string;
  /** 图片在头像外框中的适应方式 */
  fit?: AvatarFit;
  /** 根节点追加类名 */
  class?: ClassValue;
  /** 按结构覆盖样式 */
  ui?: AvatarUI;
}

defineOptions({ name: 'RebornAvatar' });
const props = withDefaults(defineProps<AvatarProps>(), { fit: 'cover', ui: () => ({}) });
const emit = defineEmits<{
  /** 图片加载失败，随后展示图标或默认插槽 */
  error: [event: Event];
}>();
defineSlots<{
  /** 无图片或图片失败时的自定义内容，未设置 icon 时显示 */
  default?: () => unknown;
}>();

const group = inject(avatarGroupKey, undefined);
const failed = shallowRef(false);
const img = useTemplateRef<HTMLImageElement>('img');
const size = computed(() => props.size ?? group?.size.value ?? 'md');
const shape = computed(() => props.shape ?? group?.shape.value ?? 'circle');
const imageKey = computed(() => JSON.stringify([props.src, props.srcSet]));
const showImage = computed(() => !!(props.src || props.srcSet) && !failed.value);
const iconName = computed(() => typeof props.icon === 'string' ? props.icon : undefined);
const iconComponent = computed(() => typeof props.icon !== 'string' ? props.icon : undefined);
/** 无效数字回落到默认大小，避免产生负尺寸或无效 CSS。 */
const sizeStyle = computed(() => typeof size.value === 'number'
  ? { '--rb-avatar-size': `${Number.isFinite(size.value) && size.value > 0 ? size.value : 32}px` }
  : undefined);
const styles = computed(() => avatarTheme({
  size: typeof size.value === 'number' ? 'custom' : size.value,
  shape: shape.value,
  fit: props.fit,
  grouped: !!group,
}));

/** 图片候选变化后重试，并重建图片节点，避免沿用旧请求的失败状态。 */
watch(imageKey, () => { failed.value = false; });
/** 失败只影响当前头像，原生事件保留给调用方记录或切换图片。 */
function handleError(event: Event) {
  failed.value = true;
  emit('error', event);
}

/**
 * SSR 首屏的图片在 HTML 解析时就开始请求，地址无效时 error 往往在水合挂上 @error 之前就已触发，
 * 水合不会补发，回退内容就永远不出现。挂载后补查一次：已完成却没有固有尺寸，再用 decode() 确认确实解码失败
 * （没有固有尺寸的 SVG 也是 naturalWidth 0，但能正常解码），失败就按 error 处理，载荷是新建的 Event。
 */
onMounted(() => {
  const el = img.value;
  if (!el?.complete || el.naturalWidth > 0) return;
  const fail = () => {
    // 期间换了图片或已经走过 @error，就不再重复处理
    if (img.value === el && !failed.value) handleError(new Event('error'));
  };
  // 没有 decode() 的环境无法区分「坏图」与「无固有尺寸的 SVG」，宁可不补发，也不误把正常图片判成失败
  if (typeof el.decode === 'function') el.decode().catch(fail);
});
</script>

<template>
  <span
    :class="styles.root({ class: cn(props.ui.root, props.class) })" :style="sizeStyle"
    :role="!showImage && alt ? 'img' : undefined" :aria-label="!showImage && alt ? alt : undefined"
  >
    <img
      v-if="showImage" ref="img" :key="imageKey" :src="src || undefined" :srcset="srcSet" :alt="alt ?? ''"
      :class="styles.image({ class: props.ui.image })" @error="handleError"
    >
    <Icon v-else-if="iconName" :name="iconName" :class="styles.icon({ class: props.ui.icon })" aria-hidden="true" />
    <component :is="iconComponent" v-else-if="iconComponent" :class="styles.icon({ class: props.ui.icon })" aria-hidden="true" />
    <span v-else :class="styles.fallback({ class: props.ui.fallback })"><slot /></span>
  </span>
</template>
