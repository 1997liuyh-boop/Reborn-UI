<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { rateColors, rateSizes } from "./reborn-rate.config";
import { computed, ref, watch } from "vue";

import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-rate.config";

defineOptions({
    name: "RebornRate",
});

const props = withDefaults(defineProps<RateProps>(), {
    modelValue: 0,
    count: 5,
    allowHalf: false,
    showValue: false,
    disabled: false,
    readonly: false,
    icon: "lucide:star",
    activeIcon: "lucide:star",
    size: "md",
    color: "warning",
    ui: () => ({}),
});

const emit = defineEmits<{
    (e: "update:modelValue", value: number): void;
    (e: "change", value: number): void;
}>();

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
    /** 未选中图标 (Nuxt Icon name) */
    icon?: string;
    /** 选中图标 (Nuxt Icon name) */
    activeIcon?: string;
    /** 半星选中图标 (Nuxt Icon name) */
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
    class?: any;
}

const isInteractive = computed(() => !props.disabled && !props.readonly);

// ui 样式系统
const uiOverrides = computed(() => props.ui || {});
const b = tv(theme);

const ui = computed(() => {
    const styles = b({
        size: props.size as any,
        color: props.color,
        disabled: props.disabled,
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

function getActiveIcon(index: number) {
    if (isHalf(index)) {
        return props.halfIcon ?? props.activeIcon;
    }
    return props.activeIcon;
}

// 当前评分
const currentValue = ref<number>(props.modelValue);

// 判断当前星星是否为半星状态
function isHalf(index: number): boolean {
    return props.allowHalf && currentValue.value >= index - 0.5 && currentValue.value < index;
}

// 点击事件（Web 版：用鼠标位置判断半星）
function onClick(e: MouseEvent, index: number) {
    if (!isInteractive.value) {
        return;
    }

    if (props.allowHalf) {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const newValue = e.clientX < midX ? index - 0.5 : index;

        if (currentValue.value === newValue) {
            updateValue(0);
        } else {
            updateValue(newValue);
        }
    } else {
        // 点击同一个星星则清零
        if (currentValue.value === index) {
            updateValue(0);
        } else {
            updateValue(index);
        }
    }
}

// Web 增强：鼠标移动 hover 预览
const hoverValue = ref(-1);
let moveRaf = 0;

const displayValue = computed(() =>
    hoverValue.value >= 0 ? hoverValue.value : currentValue.value,
);

function isHalfDisplay(index: number): boolean {
    return props.allowHalf && displayValue.value >= index - 0.5 && displayValue.value < index;
}

function isActiveDisplay(index: number): boolean {
    return (
        displayValue.value >= index - (props.allowHalf ? 0.5 : 0) && displayValue.value >= index - 0.5
    );
}

function onMouseMove(e: MouseEvent) {
    if (!isInteractive.value) {
        return;
    }
    if (moveRaf) cancelAnimationFrame(moveRaf);

    const x = e.clientX;
    const wrapper = e.currentTarget as HTMLElement;

    moveRaf = requestAnimationFrame(() => {
        const stars = wrapper.querySelectorAll(".reborn-rate__star");
        for (let i = stars.length - 1; i >= 0; i--) {
            const rect = (stars[i] as HTMLElement).getBoundingClientRect();
            if (x >= rect.left) {
                if (props.allowHalf) {
                    const midX = rect.left + rect.width / 2;
                    hoverValue.value = x < midX ? i + 0.5 : i + 1;
                } else {
                    hoverValue.value = i + 1;
                }
                return;
            }
        }
        hoverValue.value = 0;
    });
}

function onMouseLeave() {
    if (moveRaf) cancelAnimationFrame(moveRaf);
    hoverValue.value = -1;
}

// 更新值
function updateValue(newValue: number) {
    if (currentValue.value !== newValue) {
        currentValue.value = newValue;
        emit("update:modelValue", newValue);
        emit("change", newValue);
    }
}

// 同步外部值
watch(
    () => props.modelValue,
    (val) => {
        if (val !== currentValue.value) {
            currentValue.value = Math.max(0, Math.min(props.count, val));
        }
    },
    { immediate: true },
);
</script>

<template>
    <div :class="ui.wrapper({ class: props.class })" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
        <div v-for="index in count" :key="index" class="reborn-rate__star" :class="ui.star()"
            @click="onClick($event, index)">
            <!-- 未激活图标 -->
            <div :class="ui.icon()" class="opacity-30">
                <slot name="icon" :index="index" :active="false">
                    <Icon :name="props.icon" class="size-full" />
                </slot>
            </div>

            <!-- 激活图标（整星 / 半星） -->
            <div v-if="isActiveDisplay(index)" class="absolute inset-0" :class="ui.iconActive()"
                :style="isHalfDisplay(index) ? { clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' } : {}">
                <slot name="icon" :index="index" :active="true">
                    <Icon :name="getActiveIcon(index)" class="size-full" />
                </slot>
            </div>
        </div>

        <!-- 分数显示 -->
        <slot name="value" :value="currentValue">
            <span v-if="showValue" :class="ui.value()">{{ currentValue }}</span>
        </slot>
    </div>
</template>
