<template>
    <view :class="ui.wrapper({ disabled: disabled, class: props.customClass })">
        <view :class="ui.inner()" :style="{ height: blockSize + 4 + 'px' }">
            <view class="reborn-slider__track" :class="ui.track()">
                <view :class="ui.progress()" :style="progressStyle"></view>
            </view>

            <!-- 单滑块模式 -->
            <template v-if="!range">
                <slot name="thumb" :value="{ value: displayValue, style: singleThumbStyle }">
                    <view :class="ui.thumb()" :style="singleThumbStyle"></view>
                </slot>
            </template>

            <!-- 双滑块模式 -->
            <template v-if="range">
                <view :class="[ui.thumb(), ui.thumbActive()]" :style="minThumbStyle"></view>
                <view :class="[ui.thumb(), ui.thumbActive()]" :style="maxThumbStyle"></view>
            </template>

            <view :class="ui.picker()" :style="{ height: blockSize * 1.5 + 'px' }" @touchstart.prevent="onTouchStart"
                @touchmove.prevent="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd"></view>
        </view>

        <slot name="value" :value="displayValue">
            <text v-if="showValue" :class="ui.value()">
                {{ displayValue }}
            </text>
        </slot>
    </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from "vue";
import type { ClassValue } from "clsx";
import theme, { sliderColors, sliderSizes } from "./reborn-slider.config";

import { useFormInject } from "@/composables/useFieldGroup";
import { cn } from "@/lib/utils";
import { tv } from "@/lib/tv";

defineOptions({
    name: "reborn-slider"
});

export interface SliderProps {
    /** v-model 绑定的值，单值模式使用 */
    modelValue?: number;
    /** v-model:values 绑定的值，范围模式使用 */
    values?: number[];
    /** 最小值 */
    min?: number;
    /** 最大值 */
    max?: number;
    /** 步长 */
    step?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 滑块的大小 */
    blockSize?: number;
    /** 线的高度 */
    trackHeight?: number;
    /** 是否显示当前值 */
    showValue?: boolean;
    /** 是否启用范围选择 */
    range?: boolean;
    /** 尺寸 */
    size?: typeof sliderSizes[number];
    /** 颜色 */
    color?: typeof sliderColors[number];
    /** 样式覆盖 */
    ui?: Partial<{
        wrapper: ClassValue;
        inner: ClassValue;
        picker: ClassValue;
        track: ClassValue;
        progress: ClassValue;
        thumb: ClassValue;
        thumbActive: ClassValue;
        value: ClassValue;
    }>;
    /** 自定义 class */
    customClass?: any;
}

const props = withDefaults(defineProps<SliderProps>(), {
    modelValue: 0,
    values: () => [0, 0],
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    blockSize: 20,
    trackHeight: 4,
    showValue: false,
    range: false,
    size: "md",
    color: "primary",
    ui: () => ({}),
});

const emit = defineEmits(["update:modelValue", "update:values", "change", "changing"]);

const { proxy } = getCurrentInstance()!;

// ui 样式系统
const uiOverrides = computed(() => props.ui || {});
const b = tv(theme);

const ui = computed(() => {
    const styles = b({
        size: (size.value || props.size) as any,
        color: props.color,
        disabled: disabled.value,
    });

    return {
        wrapper: (opts?: { class?: any; disabled?: boolean }) =>
            styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
        inner: (opts?: { class?: any }) =>
            styles.inner({ class: cn(opts?.class, uiOverrides.value.inner) }),
        picker: (opts?: { class?: any }) =>
            styles.picker({ class: cn(opts?.class, uiOverrides.value.picker) }),
        track: (opts?: { class?: any }) =>
            styles.track({ class: cn(opts?.class, uiOverrides.value.track) }),
        progress: (opts?: { class?: any }) =>
            styles.progress({ class: cn(opts?.class, uiOverrides.value.progress) }),
        thumb: (opts?: { class?: any }) =>
            styles.thumb({ class: cn(opts?.class, uiOverrides.value.thumb) }),
        thumbActive: (opts?: { class?: any }) =>
            styles.thumbActive({ class: cn(opts?.class, uiOverrides.value.thumbActive) }),
        value: (opts?: { class?: any }) =>
            styles.value({ class: cn(opts?.class, uiOverrides.value.value) }),
    };
});

// reborn-form 上下文
const { disabled, size } = useFormInject(props);


// 当前滑块的值，单值模式
const value = ref<number>(props.modelValue);

// 当前范围值，范围模式
const rangeValue = ref<number[]>([...props.values]);

// 轨道宽度（像素）
const trackWidth = ref<number>(0);

// 轨道左侧距离屏幕的距离（像素）
const trackLeft = ref<number>(0);

// 当前活动的滑块索引（0: min, 1: max），仅在范围模式下使用
const activeThumbIndex = ref<number>(0);

// 计算当前值在滑块轨道上的百分比位置（单值模式专用）
const percentage = computed(() => {
    if (props.range) return 0;
    return ((value.value - props.min) / (props.max - props.min)) * 100;
});

// 计算范围模式下两个滑块的百分比位置
type RangePercentage = {
    min: number;
    max: number;
};

const rangePercentage = computed<RangePercentage>(() => {
    if (!props.range) return { min: 0, max: 0 };

    const currentValues = rangeValue.value;
    const valueRange = props.max - props.min;

    const minPercent = ((currentValues[0] - props.min) / valueRange) * 100;
    const maxPercent = ((currentValues[1] - props.min) / valueRange) * 100;

    return { min: minPercent, max: maxPercent };
});

// 计算进度条的样式属性
const progressStyle = computed(() => {
    const style: any = {};

    if (props.range) {
        const { min, max } = rangePercentage.value;
        style["left"] = `${min}%`;
        style["width"] = `${max - min}%`;
    } else {
        style["width"] = `${percentage.value}%`;
    }

    return style;
});

// 创建滑块的定位样式（通用函数）
function createThumbStyle(percentPosition: number) {
    const style: any = {};

    const effectiveTrackWidth = trackWidth.value - props.blockSize + 1;
    const leftPosition = (percentPosition / 100) * effectiveTrackWidth;
    const finalLeftPosition = Math.max(0, Math.min(effectiveTrackWidth, leftPosition));

    style["left"] = `${finalLeftPosition}px`;

    return style;
}

// 单值模式滑块的样式
const singleThumbStyle = computed(() => {
    return createThumbStyle(percentage.value);
});

// 范围模式最小值滑块的样式
const minThumbStyle = computed(() => {
    return createThumbStyle(rangePercentage.value.min);
});

// 范围模式最大值滑块的样式
const maxThumbStyle = computed(() => {
    return createThumbStyle(rangePercentage.value.max);
});

// 计算要显示的数值文本
const displayValue = computed<string>(() => {
    if (props.range) {
        const currentValues = rangeValue.value;
        return `${currentValues[0]} - ${currentValues[1]}`;
    }
    return `${value.value}`;
});

// 获取滑块轨道的位置和尺寸信息
function getTrackInfo(): Promise<void> {
    return new Promise((resolve) => {
        uni.createSelectorQuery()
            .in(proxy)
            .select(".reborn-slider__track")
            .boundingClientRect((node: any) => {
                trackWidth.value = node.width ?? 0;
                trackLeft.value = node.left ?? 0;
                resolve();
            })
            .exec();
    });
}

// 根据触摸点的横坐标计算对应的滑块数值
function calculateValue(clientX: number): number {
    if (trackWidth.value == 0) return props.min;

    const touchOffset = clientX - trackLeft.value;
    const progressPercentage = Math.max(0, Math.min(1, touchOffset / trackWidth.value));
    const valueRange = props.max - props.min;
    let calculatedValue = props.min + progressPercentage * valueRange;

    if (props.step > 0) {
        calculatedValue =
            Math.round((calculatedValue - props.min) / props.step) * props.step + props.min;
    }

    return Math.max(props.min, Math.min(props.max, calculatedValue));
}

// 在范围模式下，根据触摸点离哪个滑块更近来确定应该移动哪个滑块
function determineActiveThumb(clientX: number): number {
    if (!props.range) return 0;

    const currentValues = rangeValue.value;
    const touchValue = calculateValue(clientX);

    const distanceToMinThumb = Math.abs(touchValue - currentValues[0]);
    const distanceToMaxThumb = Math.abs(touchValue - currentValues[1]);

    return distanceToMinThumb <= distanceToMaxThumb ? 0 : 1;
}

// 更新滑块的值，并触发相应的事件
function updateValue(newValue: number | number[]) {
    if (props.range) {
        const newRangeValues = newValue as number[];
        const currentRangeValues = rangeValue.value;

        if (newRangeValues[0] > newRangeValues[1]) {
            activeThumbIndex.value = 1 - activeThumbIndex.value;
        }

        const sortedValues = [
            Math.min(newRangeValues[0], newRangeValues[1]),
            Math.max(newRangeValues[0], newRangeValues[1])
        ];

        if (JSON.stringify(currentRangeValues) !== JSON.stringify(sortedValues)) {
            rangeValue.value = sortedValues;
            emit("update:values", sortedValues);
            emit("changing", sortedValues);
        }
    } else {
        const newSingleValue = newValue as number;
        const currentSingleValue = value.value;

        if (currentSingleValue !== newSingleValue) {
            value.value = newSingleValue;
            emit("update:modelValue", newSingleValue);
            emit("changing", newSingleValue);
        }
    }
}

// 触摸开始事件
async function onTouchStart(e: TouchEvent) {
    if (disabled.value) return;

    await getTrackInfo();

    nextTick(() => {
        const clientX = e.touches[0].clientX;
        const calculatedValue = calculateValue(clientX);

        if (props.range) {
            activeThumbIndex.value = determineActiveThumb(clientX);
            const updatedValues = [...rangeValue.value];
            updatedValues[activeThumbIndex.value] = calculatedValue;
            updateValue(updatedValues);
        } else {
            updateValue(calculatedValue);
        }
    });
}

// 触摸移动事件
function onTouchMove(e: TouchEvent) {
    if (disabled.value) return;

    const clientX = e.touches[0].clientX;
    const calculatedValue = calculateValue(clientX);

    if (props.range) {
        const updatedValues = [...rangeValue.value];
        updatedValues[activeThumbIndex.value] = calculatedValue;
        updateValue(updatedValues);
    } else {
        updateValue(calculatedValue);
    }
}

// 触摸结束事件
function onTouchEnd() {
    if (disabled.value) return;

    if (props.range) {
        emit("change", rangeValue.value);
    } else {
        emit("change", value.value);
    }
}

// 监听外部传入的 modelValue 变化
watch(
    () => props.modelValue,
    (newModelValue: number) => {
        if (newModelValue !== value.value) {
            value.value = Math.max(props.min, Math.min(props.max, newModelValue));
        }
    },
    { immediate: true }
);

// 监听外部传入的 values 变化
watch(
    () => props.values,
    (newValues: number[]) => {
        rangeValue.value = newValues.map((singleValue) => {
            return Math.max(props.min, Math.min(props.max, singleValue));
        });
    },
    { immediate: true }
);

// 监听最大值变化
watch(
    () => props.max,
    (newMaxValue: number) => {
        if (props.range) {
            const currentRangeValues = rangeValue.value;
            if (currentRangeValues[0] > newMaxValue || currentRangeValues[1] > newMaxValue) {
                updateValue([
                    Math.min(currentRangeValues[0], newMaxValue),
                    Math.min(currentRangeValues[1], newMaxValue)
                ]);
            }
        } else {
            if (value.value > newMaxValue) {
                updateValue(newMaxValue);
            }
        }
    },
    { immediate: true }
);

// 监听最小值变化
watch(
    () => props.min,
    (newMinValue: number) => {
        if (props.range) {
            const currentRangeValues = rangeValue.value;
            if (currentRangeValues[0] < newMinValue || currentRangeValues[1] < newMinValue) {
                updateValue([
                    Math.max(currentRangeValues[0], newMinValue),
                    Math.max(currentRangeValues[1], newMinValue)
                ]);
            }
        } else {
            if (value.value < newMinValue) {
                updateValue(newMinValue);
            }
        }
    },
    { immediate: true }
);

onMounted(() => {
    watch(
        () => [props.showValue],
        () => {
            nextTick(() => {
                getTrackInfo();
            });
        }
    );

    getTrackInfo();
});
</script>
