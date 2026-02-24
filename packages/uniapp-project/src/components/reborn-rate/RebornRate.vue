<template>
    <view :class="ui.wrapper({ class: props.customClass })">
        <view v-for="index in count" :key="index" class="reborn-rate__star" :class="ui.star()" @tap="onTap(index)"
            @touchstart="onTouchStart($event, index)" @touchmove="onTouchMove($event, index)">
            <!--未激活图标 -->
            <view :class="ui.icon()" class="opacity-30">
                <slot name="icon" :index="index" :active="false">
                    <view :class="props.icon" class="w-full h-full" />
                </slot>
            </view>

            <!-- 激活图标（整星 / 半星） -->
            <view v-if="currentValue >= index - (allowHalf ? 0.5 : 0) && currentValue >= index - 0.5"
                class="absolute inset-0" :class="[ui.iconActive(), isHalf(index) && 'overflow-hidden w-1/2']">
                <slot name="icon" :index="index" :active="true" :style="isHalf(index) ? { width: '200%' } : {}">
                    <view :class="activeIcon(index)" class="w-full h-full"
                        :style="isHalf(index) ? { width: '200%' } : {}" />
                </slot>
            </view>
        </view>

        <!-- 分数显示 -->
        <slot name="value" :value="currentValue">
            <text v-if="showValue" :class="ui.value()">{{ currentValue }}</text>
        </slot>
    </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref, watch } from "vue";
import type { ClassValue } from "clsx";
import theme, { rateColors, rateSizes } from "./reborn-rate.config";

import { useFormInject } from "@/composables/useFieldGroup";
import { cn } from "@/lib/utils";
import { tv } from "@/lib/tv";

defineOptions({
    name: "reborn-rate",
});

export interface RateProps {
    /** 当前评分 */
    modelValue?: number;
    /** 星星总数 */
    count?: number;
    /** 允许半星 */
    allowHalf?: boolean;
    /** 显示分数 */
    showValue?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否只读 */
    readonly?: boolean;
    /** 未选中图标 class */
    icon?: string;
    /** 选中图标 class */
    activeIcon?: string;
    /** 半星选中图标 class */
    halfIcon?: string;
    /** 尺寸 */
    size?: (typeof rateSizes)[number];
    /** 颜色 */
    color?: (typeof rateColors)[number];
    /** 样式覆盖 */
    ui?: Partial<{
        wrapper: ClassValue;
        star: ClassValue;
        icon: ClassValue;
        iconActive: ClassValue;
        value: ClassValue;
    }>;
    /** 自定义 class */
    customClass?: any;
}

const props = withDefaults(defineProps<RateProps>(), {
    modelValue: 0,
    count: 5,
    allowHalf: false,
    showValue: false,
    disabled: false,
    readonly: false,
    icon: "i-lucide-star",
    activeIcon: "i-lucide-star",
    size: "md",
    color: "warning",
    ui: () => ({}),
});

const emit = defineEmits<{
    (e: "update:modelValue", value: number): void;
    (e: "change", value: number): void;
}>();

const { proxy } = getCurrentInstance()!;

// reborn-form 上下文
const { disabled, size } = useFormInject(props);

const isInteractive = computed(
    () => !disabled.value && !props.readonly
);

// ui 样式系统
const uiOverrides = computed(() => props.ui || {});
const b = tv(theme);

const ui = computed(() => {
    const styles = b({
        size: (size.value || props.size) as any,
        color: props.color,
        disabled: disabled.value,
        readonly: props.readonly,
    });

    return {
        wrapper: (opts?: { class?: any }) =>
            styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        star: (opts?: { class?: any }) =>
            styles.star({ class: cn(opts?.class, uiOverrides.value.star) }),
        icon: (opts?: { class?: any }) =>
            styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
        iconActive: (opts?: { class?: any }) =>
            styles.iconActive({ class: cn(opts?.class, uiOverrides.value.iconActive) }),
        value: (opts?: { class?: any }) =>
            styles.value({ class: cn(opts?.class, uiOverrides.value.value) }),
    };
});

const activeIcon = (index: number) => {
    if (isHalf(index)) {
        return props.halfIcon ?? props.activeIcon;
    }
    return props.activeIcon;
};

// 当前评分
const currentValue = ref<number>(props.modelValue);


// 判断当前星星是否为半星状态
function isHalf(index: number): boolean {
    return props.allowHalf && currentValue.value >= index - 0.5 && currentValue.value < index;
}


// 防止 touchstart 和 tap 重复触发
let touchHandled = false;

// 点击事件
function onTap(index: number) {
    if (!isInteractive.value) return;

    // 如果 touchStart 已处理（半星模式），跳过 tap
    if (touchHandled) {
        touchHandled = false;
        return;
    }

    let newValue = index;

    if (props.allowHalf) {
        if (currentValue.value === index) {
            newValue = index - 0.5;
        } else if (currentValue.value === index - 0.5) {
            newValue = 0;
        }
    } else {
        // 点击同一个星星则清零
        if (currentValue.value === index) {
            newValue = 0;
        }
    }

    updateValue(newValue);
}

// 触摸开始 — 用于半星判断
function onTouchStart(e: TouchEvent, index: number) {
    if (!isInteractive.value || !props.allowHalf) return;

    touchHandled = true;

    const touch = e.touches[0];
    if (!touch) return;

    // 获取当前星星的位置进行左/右判断
    getStarRect(index - 1).then((rect) => {
        if (!rect) return;
        const midX = rect.left + rect.width / 2;
        const newValue = touch.clientX < midX ? index - 0.5 : index;
        updateValue(newValue);
    });
}

// 触摸移动 — 拖动评分
function onTouchMove(e: TouchEvent, index: number) {
    if (!isInteractive.value) return;

    const touch = e.touches[0];
    if (!touch) return;

    // 通过触摸位置计算哪个星星
    getAllStarRects().then((rects) => {
        if (!rects || rects.length === 0) return;

        for (let i = rects.length - 1; i >= 0; i--) {
            const rect = rects[i];
            if (touch.clientX >= rect.left) {
                if (props.allowHalf) {
                    const midX = rect.left + rect.width / 2;
                    const newValue = touch.clientX < midX ? i + 0.5 : i + 1;
                    updateValue(newValue);
                } else {
                    updateValue(i + 1);
                }
                return;
            }
        }

        // 在所有星星左边
        updateValue(0);
    });
}

// 更新值
function updateValue(newValue: number) {
    if (currentValue.value !== newValue) {
        currentValue.value = newValue;
        emit("update:modelValue", newValue);
        emit("change", newValue);
    }
}

// 获取单个星星的矩形信息
function getStarRect(index: number): Promise<any> {
    return new Promise((resolve) => {
        uni.createSelectorQuery()
            .in(proxy)
            .selectAll(".reborn-rate__star")
            .boundingClientRect((nodes: any) => {
                resolve(nodes?.[index] ?? null);
            })
            .exec();
    });
}

// 获取所有星星的矩形信息
function getAllStarRects(): Promise<any[]> {
    return new Promise((resolve) => {
        uni.createSelectorQuery()
            .in(proxy)
            .selectAll(".reborn-rate__star")
            .boundingClientRect((nodes: any) => {
                resolve(nodes ?? []);
            })
            .exec();
    });
}

// 同步外部值
watch(
    () => props.modelValue,
    (val) => {
        if (val !== currentValue.value) {
            currentValue.value = Math.max(0, Math.min(props.count, val));
        }
    },
    { immediate: true }
);
</script>
