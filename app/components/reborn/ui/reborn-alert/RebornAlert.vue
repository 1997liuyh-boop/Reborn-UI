<script setup lang="ts">
import type { AlertColor, AlertType, AlertUI, AlertVariant } from './reborn-alert.config';
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue';
import { cn } from '~/lib/utils';
import RebornTransition from '../reborn-transition/RebornTransition.vue';
import { ALERT_TYPE_COLOR, ALERT_TYPE_ICON, alertTheme } from './reborn-alert.config';

defineOptions({ name: 'RebornAlert' });

const props = withDefaults(defineProps<AlertProps>(), {
  type: 'info',
  variant: 'soft',
  showIcon: true,
  closable: false,
  banner: false,
  center: false,
  closeIcon: 'lucide:x',
  interval: 3000,
});

const emit = defineEmits<{
  /** 点击关闭按钮时触发 */
  close: [ev: MouseEvent];
  /** 关闭动画结束后触发（模板中以 @after-close 监听） */
  afterClose: [];
  /** 轮播消息切换时触发 */
  change: [index: number];
}>();

export interface AlertProps {
  /**
   * 警告提示的类型，决定默认图标与配色
   * @defaultValue 'info'
   */
  type?: AlertType;
  /**
   * 视觉变体，对齐 reborn-button 的同名变体（不含 circle）
   * @defaultValue 'soft'
   */
  variant?: AlertVariant;
  /** 配色覆盖；缺省时由 type 映射（normal → neutral） */
  color?: AlertColor;
  /**
   * 是否展示图标
   * @defaultValue true
   */
  showIcon?: boolean;
  /**
   * 是否展示关闭按钮
   * @defaultValue false
   */
  closable?: boolean;
  /** 警告提示的标题 */
  title?: string;
  /**
   * 是否作为顶部公告使用（去除边框和圆角）
   * @defaultValue false
   */
  banner?: boolean;
  /**
   * 内容是否居中显示
   * @defaultValue false
   */
  center?: boolean;
  /** 自定义图标名（也可用 icon 插槽） */
  icon?: string;
  /** 关闭按钮的图标 */
  closeIcon?: string;
  /** 轮播消息列表：传入即变为消息轮播通知栏，多条消息垂直轮播展示 */
  messages?: string[];
  /**
   * 轮播间隔时间，单位毫秒
   * @defaultValue 3000
   */
  interval?: number;
  class?: any;
  /** 按语义化结构覆盖各节点样式 */
  ui?: AlertUI;
}

const slots = useSlots();

/** 关闭状态支持 v-model:show 受控 */
const show = defineModel<boolean>('show', { default: true });

/** 配色：显式 color 优先，否则由 type 映射 */
const resolvedColor = computed(() => props.color ?? ALERT_TYPE_COLOR[props.type]);

/** 图标：显式 icon 优先，否则按 type 取默认图标 */
const iconName = computed(() => props.icon ?? ALERT_TYPE_ICON[props.type]);

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
  const styles = alertTheme({
    variant: props.variant,
    color: resolvedColor.value,
    banner: props.banner,
    center: props.center,
  });
  return {
    root: () => styles.root({ class: cn(uiOverrides.value.root, props.class) }),
    icon: () => styles.icon({ class: cn(uiOverrides.value.icon) }),
    content: () => styles.content({ class: cn(uiOverrides.value.content) }),
    title: () => styles.title({ class: cn(uiOverrides.value.title) }),
    description: () => styles.description({ class: cn(uiOverrides.value.description) }),
    action: () => styles.action({ class: cn(uiOverrides.value.action) }),
    closeButton: () => styles.closeButton({ class: cn(uiOverrides.value.closeButton) }),
    closeIcon: () => styles.closeIcon({ class: cn(uiOverrides.value.closeIcon) }),
    carouselWrapper: () => styles.carouselWrapper({ class: cn(uiOverrides.value.carouselWrapper) }),
    carouselItem: () => styles.carouselItem({ class: cn(uiOverrides.value.carouselItem) }),
  };
});

// ─── 消息轮播通知栏 ─────────────────────────────────────────────

/** 传入 messages 即进入轮播模式 */
const isCarousel = computed(() => (props.messages?.length ?? 0) > 0);
const activeIndex = ref(0);
const isPaused = ref(false);
let carouselTimer: ReturnType<typeof setInterval> | null = null;

function startCarousel() {
  stopCarousel();
  if (!isCarousel.value || (props.messages?.length ?? 0) < 2) return;
  carouselTimer = setInterval(() => {
    if (isPaused.value) return;
    activeIndex.value = (activeIndex.value + 1) % props.messages!.length;
    emit('change', activeIndex.value);
  }, props.interval);
}

function stopCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }
}

watch(() => props.messages, () => {
  activeIndex.value = 0;
  startCarousel();
});

onMounted(startCarousel);
onBeforeUnmount(stopCarousel);

// ─── 关闭 ───────────────────────────────────────────────────────

function handleClose(e: MouseEvent) {
  show.value = false;
  emit('close', e);
}
</script>

<template>
  <RebornTransition
    :show="show" name="fade" :duration="200" custom-class="w-full"
    @after-leave="emit('afterClose')"
  >
    <div
      :class="ui.root()" role="alert"
      @mouseenter="isPaused = true" @mouseleave="isPaused = false"
    >
      <span v-if="showIcon" :class="ui.icon()">
        <slot name="icon">
          <Icon :name="iconName" class="size-full" />
        </slot>
      </span>

      <div :class="ui.content()">
        <div v-if="title || slots.title" :class="ui.title()">
          <slot name="title">{{ title }}</slot>
        </div>

        <!-- 轮播模式：messages 多条消息垂直轮播 -->
        <div v-if="isCarousel" :class="ui.carouselWrapper()">
          <Transition name="reborn-alert-carousel" mode="out-in">
            <div :key="activeIndex" :class="ui.carouselItem()">
              <slot name="message" :item="messages![activeIndex]" :index="activeIndex">
                {{ messages![activeIndex] }}
              </slot>
            </div>
          </Transition>
        </div>
        <div v-else-if="slots.default" :class="ui.description()">
          <slot />
        </div>
      </div>

      <div v-if="slots.action" :class="ui.action()">
        <slot name="action" />
      </div>

      <span v-if="closable" :class="ui.closeButton()" @click.stop="handleClose">
        <slot name="close-element" :close="handleClose">
          <Icon :name="closeIcon" :class="ui.closeIcon()" />
        </slot>
      </span>
    </div>
  </RebornTransition>
</template>

<style scoped>
/* 轮播消息的垂直进出场 */
.reborn-alert-carousel-enter-active,
.reborn-alert-carousel-leave-active {
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}

.reborn-alert-carousel-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.reborn-alert-carousel-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
