<template>
    <div :class="ui.root()" :style="rootStyle" ref="couponRef">
        <div :class="ui.left()" :style="leftStyle">
            <slot name="left"></slot>
        </div>
        <div :class="ui.center()"
            :style="{ height: `calc(100% - ${props.radius * 2}px)`, margin: `${props.radius}px 0` }">
            <div :style="centerStyle"></div>
        </div>
        <div :class="ui.right()">
            <slot name="right"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { tv } from "~/lib/tv";
import theme, {
    type CouponDirection,
    type CouponPosition,
    type CouponSplit,
    type CouponType,
} from "./reborn-coupon.config";

export interface RebornCouponProps {
    type?: CouponType;
    width?: string | number;
    height?: string | number;
    radius?: number;
    direction?: CouponDirection;
    position?: CouponPosition;
    offset?: number;
    corner?: number;
    gap?: number;
    split?: CouponSplit;
    size?: number | [number, number];
    // Optional divider color. Falls back to inherited text color when omitted.
    splitColor?: string;
    class?: any;
    ui?: {
        root?: any;
        left?: any;
        right?: any;
        center?: any;
    };
    hoverable?: boolean;
}

const props = withDefaults(defineProps<RebornCouponProps>(), {
    type: "notch",
    width: "100%",
    height: "auto",
    radius: 10,
    direction: "horizontal",
    position: "start",
    offset: 50,
    corner: 20,
    gap: 14,
    split: "dotted",
    size: 4,
    splitColor: undefined,
    class: "",
    ui: () => ({}),
    hoverable: false,
});


const ui = computed(() => {
    const b = tv(theme)({
        direction: props.direction as any,
        hoverable: props.hoverable,
    });

    return {
        root: () => b.root({ class: [props.ui?.root, props.class] }),
        left: () => b.left({ class: [props.ui?.left] }),
        right: () => b.right({ class: [props.ui?.right] }),
        center: () => b.center({ class: [props.ui?.center] }),
    };
});

// size 属性同时兼容数字 (number) 和数组 ([width, height])：
// 1. 为数字时，保持原有语义，即圆孔直径或虚线粗细。
// 2. 为数组时，专供 dashed（虚线）模式下精准控制虚线段的长宽尺寸。
const normalizedSize = computed(() => {
    if (Array.isArray(props.size)) {
        const [width = 0, height = 0] = props.size;
        return {
            isTuple: true,
            value: width,
            width,
            height,
        };
    }

    const value = Number(props.size ?? 0);
    return {
        isTuple: false,
        value,
        width: value,
        height: value,
    };
});

const leftStyle = computed(() => {
    if (!["notch", "perforated"].includes(props.type)) return {};

    const basis =
        props.position === "center"
            ? "50%"
            : props.position === "end"
                ? `calc(100% - ${props.offset}px)`
                : `${props.offset}px`;

    if (props.direction === "vertical") {
        return {
            flexBasis: `calc(${basis} - ${props.radius}px)`,
            width: `calc(${basis} - ${props.radius}px)`,
        };
    }

    return {
        flexBasis: `calc(${basis} - ${props.radius}px)`,
        height: `calc(${basis} - ${props.radius}px)`,
    };
});

// center 元素接管中间分割线的绘制：
// 1. notch 类型仅作为间隔占位，不绘制任何线条。
// 2. perforated（穿孔）类型利用背景渐变 (background-image) 实现虚线或点状线，相比蒙版方案兼容性更好。
const centerStyle = computed(() => {
    if (!["notch", "perforated"].includes(props.type)) {
        return { display: "none" };
    }

    const bandSize = `${props.radius * 2}px`;
    const isVertical = props.direction === "vertical";
    const baseStyle: Record<string, string> = isVertical
        ? {
            display: "block",
            width: bandSize,
            height: "100%",
            flexShrink: "0",
        }
        : {
            display: "block",
            width: "100%",
            height: bandSize,
            flexShrink: "0",
        };

    if (props.type !== "perforated") {
        return baseStyle;
    }

    const dotSize = normalizedSize.value.value;
    const dashWidth = normalizedSize.value.width;
    const dashHeight = normalizedSize.value.height;
    const gap = props.gap;

    // 虚线与点线共用的单元尺寸逻辑：
    // 在主轴 (direction 对应轴) 方向加上 gap，交叉轴保持 size 原样。
    const cellWidth = isVertical ? dashWidth : dashWidth + gap;
    const cellHeight = isVertical ? dashHeight + gap : dashHeight;

    const dottedBackground = `radial-gradient(circle, currentColor ${dotSize / 2}px, transparent ${dotSize / 2 + 0.5}px)`;
    const dashedBackground = isVertical
        ? `linear-gradient(to bottom, currentColor ${dashHeight}px, transparent 0)`
        : `linear-gradient(to right, currentColor ${dashWidth}px, transparent 0)`;

    return {
        ...baseStyle,
        ...(props.splitColor ? { color: props.splitColor } : {}),
        backgroundImage: props.split === "dashed" ? dashedBackground : dottedBackground,
        backgroundSize: `${cellWidth}px ${cellHeight}px`,
        backgroundRepeat: isVertical ? "repeat-y" : "repeat-x",
        backgroundPosition: "center",
    };
});

// mask 蒙版仅负责 coupon 的外轮廓缺口或切角，不再承担中间分割线的绘制工作。
const maskStyle = computed(() => {
    const type = props.type;
    const direction = props.direction;
    const radius = props.radius;
    const position = props.position;
    const offsetValue = props.offset;
    const corner = props.corner;

    if (type === "notch" || type === "perforated") {
        const offset = position === "center" ? "50%" : `${offsetValue}px`;
        const maskPosition = `${direction === "horizontal" ? "" : "0 "}${position === "end" ? "" : "-"}${radius}px`;

        return {
            "-webkit-mask-image": `radial-gradient(circle at ${position === "end" ? "right " : ""}${direction === "horizontal" ? `${radius}px` : offset} ${position === "end" ? "bottom " : ""}${direction === "horizontal" ? offset : `${radius}px`}, transparent ${radius}px, red ${radius}.5px)`,
            "-webkit-mask-position": maskPosition,
        };
    }

    if (type === "ticket") {
        return {
            "-webkit-mask-image": `radial-gradient(circle at ${corner}px ${corner}px, transparent ${corner}px, red ${corner}.5px)`,
            "-webkit-mask-position": `-${corner}px -${corner}px`,
        };
    }

    if (type === "stamp") {
        const gap = `${props.gap + radius * 2}px`;
        const size = direction === "horizontal" ? `100% ${gap}` : `${gap} 100%`;
        const maskPosition = `${direction === "horizontal" ? "" : "50% "}-${radius}px`;
        const horizontal = `radial-gradient(circle at ${radius}px, transparent ${radius}px, red ${radius}.5px)`;
        const vertical = `radial-gradient(circle at 50% ${radius}px, transparent ${radius}px, red ${radius}.5px)`;
        const imageMap: Record<string, string> = { horizontal, vertical };

        return {
            "-webkit-mask-image": imageMap[direction],
            "-webkit-mask-position": maskPosition,
            "-webkit-mask-size": size,
        };
    }

    if (type === "combined") {
        const gap = `${props.gap + radius * 2}px`;
        const size = direction === "horizontal" ? `100% ${gap}` : `${gap} 100%`;
        const maskPosition = `${direction === "horizontal" ? "" : "50% "}-${radius}px`;
        const horizontal = `radial-gradient(circle at ${radius}px, transparent ${radius}px, red ${radius}.5px)`;
        const vertical = `radial-gradient(circle at 50% ${radius}px, transparent ${radius}px, red ${radius}.5px)`;
        const imageMap: Record<string, string> = { horizontal, vertical };

        return {
            "-webkit-mask-image": `${imageMap[direction]}, radial-gradient(circle at ${corner}px ${corner}px, red ${corner}px, transparent ${corner}.5px)`,
            "-webkit-mask-position": `${maskPosition}, -${corner}px -${corner}px`,
            "-webkit-mask-size": `${size}, 100%`,
            "-webkit-mask-composite": "source-out, destination-over",
            "mask-composite": "subtract, add",
        };
    }

    return {};
});

const rootStyle = computed(() => {
    const width = typeof props.width === "number" ? `${props.width}px` : props.width;
    const height = typeof props.height === "number" ? `${props.height}px` : props.height;

    return {
        width,
        height,
        ...maskStyle.value,
    };
});
</script>
