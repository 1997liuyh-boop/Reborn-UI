<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue';
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
  /** 自定义样式 */
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

const rootRef = ref<HTMLElement | null>(null);
const textRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);

const scrollDistance = ref(0);
const shouldScroll = ref(false);
const animationDuration = ref(0);
const isPaused = ref(false);

/** 垂直滚动状态 */
const verticalIndex = ref(0);
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

/** 计算样式 */
const styles = computed(() => {
  const b = rebornNoticeBar({
    wrapable: props.wrapable,
    disabled: props.disabled,
  });
  return {
    root: (opts?: { class?: any }) => b.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
    content: (opts?: { class?: any }) => b.content({ class: cn(opts?.class, props.ui?.content) }),
    textWrapper: (opts?: { class?: any }) => b.textWrapper({ class: cn(opts?.class, props.ui?.textWrapper) }),
    text: (opts?: { class?: any }) => b.text({ class: cn(opts?.class, props.ui?.text) }),
    icon: (opts?: { class?: any }) => b.icon({ class: cn(opts?.class, props.ui?.icon) }),
    verticalWrapper: (opts?: { class?: any }) => b.verticalWrapper({ class: cn(opts?.class, props.ui?.verticalWrapper) }),
    verticalItem: (opts?: { class?: any }) => b.verticalItem({ class: cn(opts?.class, props.ui?.verticalItem) }),
  };
});

/** 内联样式 */
const rootStyle = computed(() => ({
  color: props.color,
  backgroundColor: props.background,
}));

/** 水平滚动动画样式 */
const textStyle = computed(() => {
  if (!shouldScroll.value || props.wrapable || isVerticalScroll.value) return {};
  return {
    '--scroll-distance': `${scrollDistance.value}px`,
    animationDuration: `${animationDuration.value}s`,
    animationPlayState: isPaused.value ? 'paused' : 'running',
  };
});


/** 检查是否需要水平滚动 */
const checkOverflow = () => {
  if (isVerticalScroll.value) {
    shouldScroll.value = false;
    return;
  }

  if (!props.scrollable || props.wrapable || props.disabled) {
    shouldScroll.value = false;
    return;
  }

  nextTick(() => {
    if (!wrapperRef.value || !textRef.value) return;

    const wrapperWidth = wrapperRef.value.offsetWidth;
    const textWidth = textRef.value.scrollWidth;

    if (textWidth > wrapperWidth && wrapperWidth > 0) {
      shouldScroll.value = true;
      scrollDistance.value = wrapperWidth;
      animationDuration.value = (textWidth + wrapperWidth) / props.speed;
    } else {
      shouldScroll.value = false;
    }
  });
};

/** 启动垂直滚动定时器 */
const startVerticalTimer = () => {
  if (!isVerticalScroll.value || props.disabled) return;

  stopVerticalTimer();
  verticalTimer = setInterval(() => {
    if (isPaused.value) return;
    verticalIndex.value = (verticalIndex.value + 1) % textList.value.length;
    emit('change', verticalIndex.value);
  }, props.interval);
};

/** 停止垂直滚动定时器 */
const stopVerticalTimer = () => {
  if (verticalTimer) {
    clearInterval(verticalTimer);
    verticalTimer = null;
  }
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
    stopVerticalTimer();
    startVerticalTimer();
  } else if (textRef.value) {
    textRef.value.style.animation = 'none';
    void textRef.value.offsetWidth;
    textRef.value.style.animation = '';
  }
  emit('replay');
};

/** 点击事件 */
const handleClick = () => {
  emit('click');
};

/** 关闭事件 */
const handleClose = () => {
  emit('close');
};

/** 切换到指定索引 */
const goTo = (index: number) => {
  if (isVerticalScroll.value && index >= 0 && index < textList.value.length) {
    verticalIndex.value = index;
    emit('change', index);
  }
};

// 监听内容变化
watch(() => props.text, () => {
  if (!import.meta.client) return;
  checkOverflow();
  if (isVerticalScroll.value) {
    verticalIndex.value = 0;
    startVerticalTimer();
  }
});

// 监听方向变化
watch(() => props.direction, () => {
  if (!import.meta.client) return;
  checkOverflow();
  if (isVerticalScroll.value) {
    startVerticalTimer();
  } else {
    stopVerticalTimer();
  }
});

// 监听禁用状态
watch(() => props.disabled, (disabled) => {
  if (!import.meta.client) return;
  if (disabled) {
    stopVerticalTimer();
  } else if (isVerticalScroll.value) {
    startVerticalTimer();
  }
});

onMounted(() => {
  checkOverflow();
  window.addEventListener('resize', checkOverflow);
  if (isVerticalScroll.value) {
    startVerticalTimer();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkOverflow);
  stopVerticalTimer();
});

defineExpose({
  /** 暂停播放：水平滚动动画停在原地，垂直轮播停止自动切换（web 端鼠标悬停会自动调用） */
  pause,
  /** 恢复被 pause 暂停的滚动/轮播（web 端鼠标移出会自动调用） */
  resume,
  /** 从头重播：垂直模式回到第 0 条并重启轮播计时（触发 change），水平模式重置 CSS 动画从头滚动；完成后触发 replay 事件 */
  replay,
  /** 重新检测文本是否溢出并更新水平滚动状态；内容或容器尺寸变化后可手动调用（垂直模式下无效） */
  checkOverflow,
  /** goTo(index)：垂直轮播模式下带过渡动画切换到指定索引并触发 change；水平模式或索引越界时无操作 */
  goTo,
});
</script>

<template>
  <div ref="rootRef" :class="styles.root()" :style="rootStyle" @click="handleClick" @mouseenter="pause"
    @mouseleave="resume">
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

      <!-- 水平滚动模式 -->
      <div v-else ref="textRef" :class="[
        styles.text(),
        shouldScroll && !wrapable ? 'animate-notice-bar-scroll' : '',
        !props.scrollable && !wrapable && !isVerticalScroll ? 'truncate w-full' : ''
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
        <Icon v-if="props.rightIcon" :name="props.rightIcon" />
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
