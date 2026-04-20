<script setup lang="ts">
/**
 * RebornNoticeBar 通用版通知栏组件
 * 适配 UniApp 各端，支持水平滚动与垂直轮播
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, getCurrentInstance } from 'vue';
import { tv } from '@/lib/tv';
import { cn } from '@/lib/utils';
import theme, { type NoticeBarUI } from './reborn-notice-bar.config';

type NoticeBarDirection = 'horizontal' | 'vertical';

export interface RebornNoticeBarProps {
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
    /** 左侧图标类名 (e.g. i-lucide-volume-2) */
    leftIcon?: string;
    /** 右侧图标类名 (e.g. i-lucide-chevron-right) */
    rightIcon?: string;
    /** 滚动方向：horizontal 水平滚动，vertical 垂直滚动 */
    direction?: NoticeBarDirection;
    /** 垂直滚动时的轮播间隔时间，单位 ms */
    interval?: number;
    /** 自定义类名 */
    customClass?: string;
    /** 自定义样式 */
    customStyle?: string;
    /** UI 覆盖 */
    ui?: NoticeBarUI;
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

const instance = getCurrentInstance();
const b = tv(theme);

const shouldScroll = ref(false);
const animationDuration = ref(0);
const scrollDistance = ref(0);
const isPaused = ref(false);

/** 垂直滚动状态 */
const verticalIndex = ref(0);
let verticalTimer: any = null;

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
const ui = computed(() => {
    const styles = b({ wrapable: props.wrapable, disabled: props.disabled });
    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
        content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, props.ui?.content) }),
        textWrapper: (opts?: { class?: any }) => styles.textWrapper({ class: cn(opts?.class, props.ui?.textWrapper) }),
        text: (opts?: { class?: any }) => styles.text({ class: cn(opts?.class, props.ui?.text) }),
        icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, props.ui?.icon) }),
        verticalWrapper: (opts?: { class?: any }) => styles.verticalWrapper({ class: cn(opts?.class, props.ui?.verticalWrapper) }),
        verticalItem: (opts?: { class?: any }) => styles.verticalItem({ class: cn(opts?.class, props.ui?.verticalItem) }),
    };
});

/** 内联样式 */
const rootStyle = computed(() => {
    return `color: ${props.color}; background-color: ${props.background}; ${props.customStyle}`;
});

/** 水平滚动动画样式 */
const textStyle = computed(() => {
    if (!shouldScroll.value || props.wrapable || isVerticalScroll.value) return '';
    return `animation-duration: ${animationDuration.value}s; animation-play-state: ${isPaused.value ? 'paused' : 'running'}; --scroll-distance: ${scrollDistance.value}px;`;
});

/** 检查是否需要水平滚动 */
const checkOverflow = () => {
    if (isVerticalScroll.value || !props.scrollable || props.wrapable || props.disabled) {
        shouldScroll.value = false;
        return;
    }

    // 延迟执行以确保布局完成
    setTimeout(() => {
        const query = uni.createSelectorQuery().in(instance);
        query.select('.reborn-notice-bar__wrapper').boundingClientRect();
        query.select('.reborn-notice-bar__text').boundingClientRect();
        query.exec((res) => {
            if (res && res[0] && res[1]) {
                const wrapperWidth = Math.floor(res[0].width || 0);
                const textWidth = Math.ceil(res[1].width || 0);

                if (textWidth > wrapperWidth && wrapperWidth > 0) {
                    shouldScroll.value = true;
                    scrollDistance.value = wrapperWidth;
                    animationDuration.value = (textWidth + wrapperWidth) / props.speed;
                } else {
                    shouldScroll.value = false;
                }
            }
        });
    }, 200); // 增加延迟到 200ms
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
    } else {
        shouldScroll.value = false;
        nextTick(() => {
            checkOverflow();
        });
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
    checkOverflow();
    if (isVerticalScroll.value) {
        verticalIndex.value = 0;
        startVerticalTimer();
    }
}, { immediate: true });

// 监听方向变化
watch(() => props.direction, () => {
    checkOverflow();
    if (isVerticalScroll.value) {
        startVerticalTimer();
    } else {
        stopVerticalTimer();
    }
});

// 监听禁用状态
watch(() => props.disabled, (disabled) => {
    if (disabled) {
        stopVerticalTimer();
    } else if (isVerticalScroll.value) {
        startVerticalTimer();
    }
});

onMounted(() => {
    checkOverflow();
    if (isVerticalScroll.value) {
        startVerticalTimer();
    }
});

onBeforeUnmount(() => {
    stopVerticalTimer();
});

defineExpose({
    pause,
    resume,
    replay,
    checkOverflow,
    goTo,
});
</script>

<template>
    <view :class="ui.root()" :style="rootStyle" @tap="handleClick">
        <!-- 左侧图标插槽 -->
        <view v-if="$slots['left-icon'] || props.leftIcon" :class="ui.icon()">
            <slot name="left-icon">
                <view v-if="props.leftIcon" :class="props.leftIcon" />
            </slot>
        </view>

        <!-- 内容区域 -->
        <view class="reborn-notice-bar__wrapper" :class="ui.textWrapper()">
            <!-- 垂直滚动模式 -->
            <view v-if="isVerticalScroll" :class="ui.verticalWrapper()">
                <transition name="notice-bar-vertical" mode="out-in">
                    <view :key="verticalIndex" :class="ui.verticalItem()">
                        <slot :item="textList[verticalIndex]" :index="verticalIndex">
                            {{ textList[verticalIndex] }}
                        </slot>
                    </view>
                </transition>
            </view>

            <!-- 水平滚动模式 -->
            <view v-else class="reborn-notice-bar__text" :class="[
                ui.text(),
                shouldScroll && !wrapable ? 'animate-notice-bar-scroll' : '',
                !props.scrollable && !wrapable && !isVerticalScroll ? 'truncate w-full' : ''
            ]" :style="textStyle">
                <slot>
                    <template v-if="hasMultipleText">
                        <text v-for="(item, index) in textList" :key="index" class="mr-[16rpx]">
                            {{ item }}
                        </text>
                    </template>
                    <template v-else>{{ props.text }}</template>
                </slot>
            </view>
        </view>

        <!-- 右侧图标插槽 -->
        <view v-if="$slots['right-icon'] || props.rightIcon" :class="ui.icon()">
            <slot name="right-icon">
                <view v-if="props.rightIcon" :class="props.rightIcon" @tap.stop="handleClose" />
            </slot>
        </view>
    </view>
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
