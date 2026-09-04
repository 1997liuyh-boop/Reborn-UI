<script setup lang="ts">
import type { AlertColor, AlertDirection, AlertType, AlertUI, AlertVariant } from './reborn-alert.config';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue';
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
  direction: 'vertical',
  speed: 60,
  rows: 1,
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
  /**
   * 轮播方向：vertical 垂直切换，horizontal 全部消息拼成一行水平跑马灯滚动
   * @defaultValue 'vertical'
   */
  direction?: AlertDirection;
  /**
   * 水平跑马灯的滚动速率，单位 px/s
   * @defaultValue 60
   */
  speed?: number;
  /**
   * 垂直轮播时同时展示的行数；大于 1 时多条消息同时可见并逐行向上滚动
   * @defaultValue 1
   */
  rows?: number;
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
    carouselList: () => styles.carouselList({ class: cn(uiOverrides.value.carouselList) }),
    marqueeWrapper: () => styles.marqueeWrapper({ class: cn(uiOverrides.value.marqueeWrapper) }),
    marquee: () => styles.marquee({ class: cn(uiOverrides.value.marquee) }),
    marqueeItem: () => styles.marqueeItem({ class: cn(uiOverrides.value.marqueeItem) }),
  };
});

// ─── 消息轮播通知栏 ─────────────────────────────────────────────

/** 传入 messages 即进入轮播模式 */
const isCarousel = computed(() => (props.messages?.length ?? 0) > 0);
const messageCount = computed(() => props.messages?.length ?? 0);
/** 水平跑马灯 */
const isHorizontal = computed(() => isCarousel.value && props.direction === 'horizontal');
/** 垂直模式同时可见的行数 */
const rowCount = computed(() => Math.max(1, Math.floor(props.rows)));
/** 多行垂直滚动：rows > 1 时多条消息同时可见并逐行上移 */
const isList = computed(() => isCarousel.value && !isHorizontal.value && rowCount.value > 1);
const activeIndex = ref(0);
const isPaused = ref(false);
let carouselTimer: ReturnType<typeof setInterval> | null = null;
let rewindTimer: ReturnType<typeof setTimeout> | null = null;

/** 多行滚动轨道的过渡时长，需与 carouselList 的 duration-300 一致 */
const LIST_TRANSITION_MS = 300;

/** 多行模式为无缝衔接，在列表末尾补上前 rows 条；条数不足一屏时静态展示 */
const listItems = computed(() => {
  const msgs = props.messages ?? [];
  return msgs.length > rowCount.value ? [...msgs, ...msgs.slice(0, rowCount.value)] : msgs;
});
/** 回卷到真实第 0 条时临时关闭过渡，避免出现反向滚动 */
const listNoTransition = ref(false);
const listWrapperStyle = computed(() => ({ height: `${rowCount.value * 1.5}em` }));
const listTrackStyle = computed(() => ({
  transform: `translateY(-${activeIndex.value * 1.5}em)`,
  transition: listNoTransition.value ? 'none' : undefined,
}));

/** 是否需要定时切换：单行至少 2 条，多行需超过可见行数；水平模式由 CSS 动画驱动 */
const needsTimer = computed(() => isCarousel.value && !isHorizontal.value && messageCount.value > rowCount.value);

function tickCarousel() {
  if (isPaused.value) return;
  if (isList.value) {
    activeIndex.value += 1;
    emit('change', activeIndex.value % messageCount.value);
    if (activeIndex.value >= messageCount.value) {
      // 已滚到补位的首条，过渡结束后无动画地回到真实第 0 条
      rewindTimer = setTimeout(() => {
        listNoTransition.value = true;
        activeIndex.value = 0;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          listNoTransition.value = false;
        }));
      }, LIST_TRANSITION_MS);
    }
    return;
  }
  activeIndex.value = (activeIndex.value + 1) % messageCount.value;
  emit('change', activeIndex.value);
}

function startCarousel() {
  stopCarousel();
  if (!needsTimer.value) return;
  carouselTimer = setInterval(tickCarousel, props.interval);
}

function stopCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }
  if (rewindTimer) {
    clearTimeout(rewindTimer);
    rewindTimer = null;
  }
}

// ─── 水平跑马灯 ─────────────────────────────────────────────────

const marqueeWrapperRef = ref<HTMLElement | null>(null);
const marqueeTextRef = ref<HTMLElement | null>(null);
/** 起点为容器宽度（从右缘滚入），一轮时长按 speed 折算以保持匀速 */
const marqueeFrom = ref(0);
const marqueeDuration = ref(0);

function measureMarquee() {
  if (!isHorizontal.value) return;
  nextTick(() => {
    const wrapper = marqueeWrapperRef.value;
    const text = marqueeTextRef.value;
    if (!wrapper || !text || !wrapper.offsetWidth) return;
    marqueeFrom.value = wrapper.offsetWidth;
    marqueeDuration.value = (text.scrollWidth + wrapper.offsetWidth) / props.speed;
  });
}

const marqueeStyle = computed(() => ({
  '--reborn-alert-marquee-from': `${marqueeFrom.value}px`,
  animationDuration: `${marqueeDuration.value}s`,
  animationPlayState: isPaused.value ? 'paused' : 'running',
}));

watch(() => [props.messages, props.direction, props.rows, props.interval, props.speed], () => {
  activeIndex.value = 0;
  startCarousel();
  measureMarquee();
});

/** 重新显示后容器才有宽度，需再测一次 */
watch(show, (visible) => {
  if (visible) measureMarquee();
});

onMounted(() => {
  startCarousel();
  measureMarquee();
  window.addEventListener('resize', measureMarquee);
});

onBeforeUnmount(() => {
  stopCarousel();
  window.removeEventListener('resize', measureMarquee);
});

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
          <Icon :name="iconName" class="size-4" />
        </slot>
      </span>

      <div :class="ui.content()">
        <div v-if="title || slots.title" :class="ui.title()">
          <slot name="title">{{ title }}</slot>
        </div>

        <!-- 轮播模式：messages 传入即进入，按 direction / rows 分三种形态 -->
        <!-- 水平跑马灯：全部消息拼成一行，从右向左匀速滚动 -->
        <div v-if="isHorizontal" ref="marqueeWrapperRef" :class="ui.marqueeWrapper()">
          <div
            ref="marqueeTextRef" :class="[ui.marquee(), marqueeDuration > 0 && 'reborn-alert-marquee']"
            :style="marqueeStyle"
          >
            <span v-for="(item, index) in messages" :key="index" :class="ui.marqueeItem()">
              <slot name="message" :item="item" :index="index">{{ item }}</slot>
            </span>
          </div>
        </div>
        <div v-else-if="isCarousel" :class="ui.carouselWrapper()" :style="isList ? listWrapperStyle : undefined">
          <!-- 多行垂直滚动：rows 条同时可见，逐行向上滚动 -->
          <div v-if="isList" :class="ui.carouselList()" :style="listTrackStyle">
            <div v-for="(item, index) in listItems" :key="index" :class="ui.carouselItem()">
              <slot name="message" :item="item" :index="index % messageCount">{{ item }}</slot>
            </div>
          </div>
          <!-- 单行逐条轮播：一次一条，垂直进出场切换 -->
          <Transition v-else name="reborn-alert-carousel" mode="out-in">
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

/* 水平跑马灯：从容器右缘滚入，整行滚出左缘后循环 */
@keyframes reborn-alert-marquee {
  from {
    transform: translateX(var(--reborn-alert-marquee-from, 100%));
  }

  to {
    transform: translateX(-100%);
  }
}

.reborn-alert-marquee {
  animation: reborn-alert-marquee linear infinite;
}
</style>
