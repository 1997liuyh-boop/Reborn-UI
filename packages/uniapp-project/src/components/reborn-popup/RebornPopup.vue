<template>
    <!-- #ifdef H5 -->
    <teleport to="uni-app" :disabled="!enablePortal">
        <!-- #endif -->

        <!-- #ifdef MP -->
        <root-portal :enable="enablePortal">
            <!-- #endif -->

            <view :class="ui.wrapper()" :style="{
                zIndex,
                pointerEvents
            }" v-show="visible" v-if="keepAlive ? true : visible" @touchmove.stop.prevent>
                <!-- 遮罩 -->
                <view :class="ui.mask()" @tap="maskClose" v-if="showMask"></view>

                <!-- 弹出层 -->
                <view :class="[ui.popup(), popupH5Class]" :style="popupStyle" @touchstart="onTouchStart"
                    @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd">
                    <view :class="ui.inner()" :style="{ paddingBottom }">

                        <!-- 拖拽条 -->
                        <view :class="[ui.draw(), swipe.isMove ? '!bg-gray-4' : '']" v-if="isSwipeClose">
                        </view>

                        <!-- 头部 -->
                        <view :class="ui.header()" v-if="showHeader">
                            <slot name="header">
                                <text :class="ui.title()">{{ title }}</text>
                            </slot>

                            <view v-if="isOpen && showClose"
                                class="absolute right-3 i-lucide-x text-gray-4 dark:text-gray-2 size-5" @tap="close"
                                @touchmove.stop />
                        </view>

                        <!-- 内容 -->
                        <view :class="ui.container()" @touchmove.stop>
                            <slot></slot>
                        </view>
                    </view>
                </view>
            </view>

            <!-- #ifdef MP -->
        </root-portal>
        <!-- #endif -->

        <!-- #ifdef H5 -->
    </teleport>
    <!-- #endif -->
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { isAppIOS } from "@/lib/device";
import { tv } from "@/lib/tv";
import theme from "./reborn-popup.config";

const b = tv(theme);

defineOptions({
    name: "reborn-popup",
});

defineSlots<{
    header: () => any;
    default: () => any;
}>();

export type PopupDirection = "top" | "bottom" | "left" | "right" | "center";

export interface PopupProps {
    /** 是否可见 */
    modelValue?: boolean;
    /** 标题 */
    title?: string;
    /** 弹出方向 */
    direction?: PopupDirection;
    /** 弹出框尺寸 */
    size?: string | number;
    /** 是否显示头部 */
    showHeader?: boolean;
    /** 是否显示关闭按钮 */
    showClose?: boolean;
    /** 是否显示遮罩 */
    showMask?: boolean;
    /** 是否点击遮罩关闭 */
    maskClosable?: boolean;
    /** 是否开启拖拽关闭 */
    swipeClose?: boolean;
    /** 拖拽关闭阈值 */
    swipeCloseThreshold?: number;
    /** 触摸事件响应方式 */
    pointerEvents?: "auto" | "none";
    /** 是否缓存 */
    keepAlive?: boolean;
    /** 是否启用 portal */
    enablePortal?: boolean;
}

const props = withDefaults(defineProps<PopupProps>(), {
    modelValue: false,
    title: "",
    direction: "bottom",
    size: "",
    showHeader: true,
    showClose: true,
    showMask: true,
    maskClosable: true,
    swipeClose: true,
    swipeCloseThreshold: 150,
    pointerEvents: "auto",
    keepAlive: false,
    enablePortal: true,
});

const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "open"): void;
    (e: "opened"): void;
    (e: "close"): void;
    (e: "closed"): void;
    (e: "maskClose"): void;
}>();

// 全局 zIndex 计数器
let globalZIndex = 1000;

// 控制显示/隐藏
const visible = ref(false);

// 0: 初始 1: 打开 2: 关闭
const status = ref(0);
const isOpen = ref(false);
const isOpened = ref(false);
const zIndex = ref(globalZIndex);

// 将 size 转为 css 单位
function toUnit(val: string | number): string {
    if (val === "" || val == null) return "";
    if (typeof val === "number") return `${val}px`;
    return val;
}

// 弹出层高度
const height = computed(() => {
    switch (props.direction) {
        case "top":
        case "bottom":
            return toUnit(props.size);
        case "left":
        case "right":
            return "100%";
        default:
            return "";
    }
});

// 弹出层宽度
const width = computed(() => {
    switch (props.direction) {
        case "top":
        case "bottom":
            return "100%";
        case "left":
        case "right":
        case "center":
            return toUnit(props.size);
        default:
            return "";
    }
});

// 底部安全距离
const paddingBottom = computed(() => {
    let h = 0;
    if (props.direction == "bottom") {
        h += getSafeAreaHeight("bottom");
    }
    return h + "px";
});

// 是否显示拖动条
const isSwipeClose = computed(() => {
    return props.direction == "bottom" && props.swipeClose;
});

// 动画定时器
let timer: number = 0;

// 打开弹出层
function open() {
    zIndex.value = ++globalZIndex;

    if (!visible.value) {
        visible.value = true;
        emit("update:modelValue", true);
        emit("open");

        setTimeout(
            () => {
                status.value = 1;
                // @ts-ignore
                timer = setTimeout(() => {
                    isOpened.value = true;
                    emit("opened");
                }, 350);
            },
            isAppIOS() ? 100 : 50
        );
    }
}

// 关闭弹出层
function close() {
    if (status.value == 1) {
        isOpened.value = false;
        status.value = 2;
        emit("close");

        if (timer != 0) {
            clearTimeout(timer);
        }

        // @ts-ignore
        timer = setTimeout(() => {
            visible.value = false;
            status.value = 0;
            emit("update:modelValue", false);
            emit("closed");
        }, 350);
    }
}

// 遮罩关闭
function maskClose() {
    if (props.maskClosable) {
        close();
    }
    emit("maskClose");
}

// === 拖拽关闭 ===
type Swipe = {
    isMove: boolean;
    isTouch: boolean;
    startY: number;
    offsetY: number;
};

const swipe = reactive<Swipe>({
    isMove: false,
    isTouch: false,
    startY: 0,
    offsetY: 0,
});

function onTouchStart(e: any) {
    if (props.direction != "bottom") return;
    if (isOpened.value && isSwipeClose.value) {
        swipe.isTouch = true;
        swipe.startY = e.touches[0].clientY;
    }
}

function onTouchMove(e: any) {
    if (swipe.isTouch) {
        swipe.isMove = true;
        const offsetY = e.touches[0].clientY - swipe.startY;
        if (offsetY > 0) {
            swipe.offsetY = offsetY;
        }
    }
}

function onTouchEnd() {
    if (swipe.isTouch) {
        swipe.isTouch = false;
        swipe.isMove = false;
        if (swipe.offsetY > props.swipeCloseThreshold) {
            close();
        }
        swipe.offsetY = 0;
    }
}

const ui = computed(() => b({
    direction: props.direction as any,
    isOpen: status.value == 1,
    isClose: status.value == 2,
    stopTransition: swipe.isTouch
}));

const popupH5Class = computed(() => {
    // #ifdef H5
    let classes = [];
    if (['left', 'right', 'top'].includes(props.direction)) {
        classes.push('top-[44px]');
    }
    if (['left', 'right'].includes(props.direction)) {
        classes.push('!h-[calc(100%-44px)]');
    }
    return classes.join(' ');
    // #endif
    // #ifndef H5
    return '';
    // #endif
});


// 弹出层样式
const popupStyle = computed(() => {
    const style: Record<string, string> = {};
    style["height"] = height.value;
    style["width"] = width.value;
    if (swipe.isTouch) {
        style["transform"] = `translateY(${swipe.offsetY}px)`;
    }
    return style;
});
/**
 * 获取安全区域高度
 * @param type 类型
 * @returns 安全区域高度
 */
function getSafeAreaHeight(type: "top" | "bottom") {
    const { safeAreaInsets } = uni.getWindowInfo();

    let h: number;

    if (type == "top") {
        h = safeAreaInsets.top;
    } else {
        h = safeAreaInsets.bottom;

        // #ifdef APP-ANDROID
        if (h == 0) {
            h = 16;
        }
        // #endif
    }

    return h;
}
// 监听 modelValue
watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            open();
        } else {
            close();
        }
    },
    { immediate: true }
);

// 监听状态
watch(status, (val) => {
    isOpen.value = val == 1;
});

defineExpose({
    isOpened,
    isOpen,
    open,
    close,
});
</script>
