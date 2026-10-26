<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core';
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue';
import { cn } from '@/lib/utils';
import { rebornNoticeBar, type NoticeBarUI } from './reborn-notice-bar.config';

defineOptions({ name: 'RebornNoticeBar' });

type NoticeBarDirection = 'horizontal' | 'vertical';

interface RebornNoticeBarProps {
  /** 通知文本内容，支持单条或多条 */
  text?: string | string[];
  /** 滚动速率，单位 px/s（水平滚动时生效） */
  speed?: number;
  /** 是否开启滚动播放，内容溢出时生效 */
  scrollable?: boolean;
  /** 是否开启多行展示 */
  wrapable?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 文本颜色 */
  color?: string;
  /** 背景色 */
  background?: string;
  /** 左侧图标名称 */
  leftIcon?: string;
  /** 右侧图标名称 */
  rightIcon?: string;
  /** 滚动方向：horizontal 水平滚动，vertical 垂直滚动 */
  direction?: NoticeBarDirection;
  /** 垂直滚动时的轮播间隔时间，单位 ms */
  interval?: number;
  /** UI 覆盖 */
  ui?: NoticeBarUI;
  /** 自定义类名 */
  customClass?: string;
  /** 自定义样式，追加在 color / background 之后 */
  customStyle?: string;
}

const props = withDefaults(defineProps<RebornNoticeBarProps>(), {
  text: '',
  speed: 60,
  background: '#F7F7F9',
  color: '#888A8C',
  scrollable: true,
  wrapable: false,
  disabled: false,
  direction: 'horizontal',
  interval: 3000,
  customClass: '',
  customStyle: '',
  ui: () => ({}),
});

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'close'): void;
  (e: 'replay'): void;
  (e: 'change', index: number): void;
}>();

const slots = defineSlots<{
  default(props: { item?: string; index?: number }): any;
  'left-icon'(): any;
  'right-icon'(): any;
}>();

const textRef = useTemplateRef<HTMLElement>('textRef');
const wrapperRef = useTemplateRef<HTMLElement>('wrapperRef');

/** 测量结果：文本是否溢出容器（由 measure 写入，其余滚动状态全部由它派生） */
const overflowing = shallowRef(false);
/** 测量结果：文本内容宽度（px） */
const textWidth = shallowRef(0);
/** 测量结果：容器宽度（px），同时是滚动的起点距离 */
const wrapperWidth = shallowRef(0);
/** 是否暂停：鼠标悬停或调用 pause() 时为 true */
const isPaused = shallowRef(false);
/** 重播计数：作为水平文本节点的 key，自增即重建节点，CSS 动画从头开始 */
const replayKey = shallowRef(0);

/** 垂直滚动状态 */
const verticalIndex = shallowRef(0);
let verticalTimer: ReturnType<typeof setInterval> | null = null;

/** 文本列表 */
const textList = computed(() => {
  if (Array.isArray(props.text)) return props.text;
  if (props.text) return [props.text];
  return [];
});

/** 是否有多条消息 */
const hasMultipleText = computed(() => textList.value.length > 1);

/** 是否需要垂直滚动 */
const isVerticalScroll = computed(() => props.direction === 'vertical' && hasMultipleText.value);

/** 是否水平滚动：文本溢出、允许滚动、非多行、未禁用且不是垂直轮播时才滚动，任一条件在运行时变化都会立即生效 */
const shouldScroll = computed(() =>
  overflowing.value && props.scrollable && !props.wrapable && !props.disabled && !isVerticalScroll.value);

/** 一轮滚动时长（s）：文本从容器右缘滚到完全移出左缘，路程为文本宽度加容器宽度 */
const animationDuration = computed(() => (textWidth.value + wrapperWidth.value) / props.speed);

/** 计算样式 */
const styles = computed(() => {
  const b = rebornNoticeBar({
    wrapable: props.wrapable,
    disabled: props.disabled,
  });
  return {
    root: (opts?: { class?: any }) => b.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
    textWrapper: (opts?: { class?: any }) => b.textWrapper({ class: cn(opts?.class, props.ui?.textWrapper) }),
    text: (opts?: { class?: any }) => b.text({ class: cn(opts?.class, props.ui?.text) }),
    icon: (opts?: { class?: any }) => b.icon({ class: cn(opts?.class, props.ui?.icon) }),
    verticalWrapper: (opts?: { class?: any }) => b.verticalWrapper({ class: cn(opts?.class, props.ui?.verticalWrapper) }),
    verticalItem: (opts?: { class?: any }) => b.verticalItem({ class: cn(opts?.class, props.ui?.verticalItem) }),
  };
});

/** 内联样式：color / background 在前，customStyle 在后，同名属性以 customStyle 为准（与 UniApp 端的拼接顺序一致） */
const rootStyle = computed(() => [
  { color: props.color, backgroundColor: props.background },
  props.customStyle,
]);

/** 水平滚动动画样式 */
const textStyle = computed(() => {
  if (!shouldScroll.value) return {};
  return {
    '--scroll-distance': `${wrapperWidth.value}px`,
    animationDuration: `${animationDuration.value}s`,
    animationPlayState: isPaused.value ? 'paused' : 'running',
  };
});

/** 测量文本与容器宽度并判定是否溢出；垂直轮播时没有水平文本节点，直接跳过 */
const measure = () => {
  const wrapper = wrapperRef.value;
  const text = textRef.value;
  if (!wrapper || !text) return;
  const nextWrapperWidth = wrapper.offsetWidth;
  const nextTextWidth = text.scrollWidth;
  wrapperWidth.value = nextWrapperWidth;
  textWidth.value = nextTextWidth;
  overflowing.value = nextWrapperWidth > 0 && nextTextWidth > nextWrapperWidth;
};

/** 手动重新检测溢出：等本轮渲染完成后再测量，保证读到最新布局 */
const checkOverflow = () => {
  nextTick(measure);
};

/** 停止垂直滚动定时器 */
const stopVerticalTimer = () => {
  if (verticalTimer) {
    clearInterval(verticalTimer);
    verticalTimer = null;
  }
};

/** 按当前状态重建垂直轮播定时器：只在垂直轮播且未禁用时运行，间隔取最新的 interval */
const restartVerticalTimer = () => {
  stopVerticalTimer();
  if (!isVerticalScroll.value || props.disabled) return;
  verticalTimer = setInterval(() => {
    if (isPaused.value) return;
    verticalIndex.value = (verticalIndex.value + 1) % textList.value.length;
    emit('change', verticalIndex.value);
  }, props.interval);
};

/** 暂停滚动 */
const pause = () => {
  isPaused.value = true;
};

/** 恢复滚动 */
const resume = () => {
  isPaused.value = false;
};

/** 重播动画 */
const replay = () => {
  if (isVerticalScroll.value) {
    verticalIndex.value = 0;
    emit('change', 0);
    restartVerticalTimer();
  } else {
    // 不直接改 DOM 的 animation：那会连带抹掉 Vue 写入的 animation-duration，而 textStyle 缓存未变时 Vue 不会补写
    replayKey.value++;
  }
  emit('replay');
};

/** 点击事件 */
const handleClick = () => {
  // 禁用时根节点仍接收指针（用来显示禁止光标），点击在这里拦下，与禁用前「点不到」的行为一致
  if (props.disabled) return;
  emit('click');
};

/** 关闭事件：由 right-icon 属性渲染的图标触发，禁用时与 handleClick 同一口径拦截 */
const handleClose = () => {
  if (props.disabled) return;
  emit('close');
};

/** 切换到指定索引 */
const goTo = (index: number) => {
  if (isVerticalScroll.value && index >= 0 && index < textList.value.length) {
    verticalIndex.value = index;
    emit('change', index);
  }
};

// 容器或文本尺寸变化（窗口缩放、侧栏折叠、插槽内容变化）都重新测量；重播重建文本节点后自动改为观察新节点
useResizeObserver(() => [wrapperRef.value, textRef.value], () => measure());

// 文本、多行、方向切换会改变排版或节点结构，等渲染完成后再测量
watch([() => props.text, () => props.wrapable, isVerticalScroll], () => measure(), { flush: 'post' });

// 「是否轮播 / 是否禁用 / 间隔」任一变化都重建定时器，定时器的启停只由这三项决定
watch([isVerticalScroll, () => props.disabled, () => props.interval], restartVerticalTimer);

// 条数变少时把当前索引钳回有效范围，避免指向不存在的条目
watch(() => textList.value.length, (length) => {
  const maxIndex = Math.max(length - 1, 0);
  if (verticalIndex.value <= maxIndex) return;
  verticalIndex.value = maxIndex;
  if (isVerticalScroll.value) emit('change', maxIndex);
});

onMounted(() => {
  measure();
  restartVerticalTimer();
});

onBeforeUnmount(stopVerticalTimer);

defineExpose({
  /** 暂停播放：水平滚动动画停在原地，垂直轮播停止自动切换（web 端鼠标悬停会自动调用） */
  pause,
  /** 恢复被 pause 暂停的滚动/轮播（web 端鼠标移出会自动调用） */
  resume,
  /** 从头重播：垂直模式回到第 0 条并重启轮播计时（触发 change），水平模式重建文本节点从头滚动；完成后触发 replay 事件 */
  replay,
  /** 重新检测文本是否溢出并更新水平滚动状态；web 端已自动监听尺寸变化，一般无需手动调用（垂直模式下无效） */
  checkOverflow,
  /** goTo(index)：垂直轮播模式下带过渡动画切换到指定索引并触发 change；水平模式或索引越界时无操作 */
  goTo,
});
</script>

<template>
  <div :class="styles.root()" :style="rootStyle" @click="handleClick" @mouseenter="pause" @mouseleave="resume">
    <!-- 左侧图标插槽 -->
    <span v-if="slots['left-icon'] || props.leftIcon" :class="styles.icon()">
      <slot name="left-icon">
        <Icon v-if="props.leftIcon" :name="props.leftIcon" />
      </slot>
    </span>

    <!-- 内容区域 -->
    <div ref="wrapperRef" :class="styles.textWrapper()">
      <!-- 垂直滚动模式 -->
      <div v-if="isVerticalScroll" :class="styles.verticalWrapper()">
        <Transition name="notice-bar-vertical" mode="out-in">
          <div :key="verticalIndex" :class="styles.verticalItem()">
            <slot :item="textList[verticalIndex]" :index="verticalIndex">
              {{ textList[verticalIndex] }}
            </slot>
          </div>
        </Transition>
      </div>

      <!-- 水平滚动模式：key 随重播自增，节点重建后动画从头开始 -->
      <div v-else ref="textRef" :key="replayKey" :class="[
        styles.text(),
        shouldScroll ? 'animate-notice-bar-scroll' : '',
        !props.scrollable && !props.wrapable ? 'truncate w-full' : ''
      ]" :style="textStyle">
        <slot>
          <template v-if="hasMultipleText">
            <span v-for="(item, index) in textList" :key="index" class="mr-6 last:mr-0">
              {{ item }}
            </span>
          </template>
          <template v-else>{{ props.text }}</template>
        </slot>
      </div>
    </div>

    <!-- 右侧图标插槽 -->
    <span v-if="slots['right-icon'] || props.rightIcon" :class="styles.icon()">
      <slot name="right-icon">
        <!-- 与 UniApp 一致：只有 right-icon 属性渲染的图标负责关闭，并阻止冒泡，点它不再触发 click -->
        <Icon v-if="props.rightIcon" :name="props.rightIcon" class="cursor-pointer" @click.stop="handleClose" />
      </slot>
    </span>
  </div>
</template>

<style scoped>
@keyframes notice-bar-scroll {
  0% {
    transform: translateX(var(--scroll-distance, 100%));
  }

  100% {
    transform: translateX(-100%);
  }
}

.animate-notice-bar-scroll {
  animation: notice-bar-scroll linear infinite;
}

/* 垂直滚动动画 */
.notice-bar-vertical-enter-active,
.notice-bar-vertical-leave-active {
  transition: all 0.3s ease-out;
}

.notice-bar-vertical-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.notice-bar-vertical-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
