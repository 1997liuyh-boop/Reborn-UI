<script setup lang="ts">
import type {
    CouponDirection,
    CouponPosition,
    CouponSplit,
    CouponType,
} from "./reborn-coupon.config";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { computed } from "vue";
import { tv } from "~/lib/tv";
import theme from "./reborn-coupon.config";

export interface RebornCouponBaseProps {
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

export interface RebornCouponProps extends RebornCouponBaseProps {
    sm?: RebornCouponBaseProps;
    md?: RebornCouponBaseProps;
    lg?: RebornCouponBaseProps;
    xl?: RebornCouponBaseProps;
    xxl?: RebornCouponBaseProps;
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
    sm: undefined,
    md: undefined,
    lg: undefined,
    xl: undefined,
    xxl: undefined,
});

const breakpoints = useBreakpoints(breakpointsTailwind);

const activeProps = computed(() => {
    const isSm = breakpoints.greaterOrEqual("sm").value;
    const isMd = breakpoints.greaterOrEqual("md").value;
    const isLg = breakpoints.greaterOrEqual("lg").value;
    const isXl = breakpoints.greaterOrEqual("xl").value;
    const is2xl = breakpoints.greaterOrEqual("2xl").value;

    const {
        sm,
        md,
        lg,
        xl,
        xxl,
        ...baseProps
    } = props;
    const merged = { ...baseProps };

    const overrides = [
        { active: isSm, values: sm },
        { active: isMd, values: md },
        { active: isLg, values: lg },
        { active: isXl, values: xl },
        { active: is2xl, values: xxl },
    ];

    overrides.forEach((o) => {
        if (o.active && o.values) {
            Object.keys(o.values).forEach((key) => {
                if (o.values![key as keyof RebornCouponBaseProps] !== undefined) {
                    (merged as any)[key] = o.values![key as keyof RebornCouponBaseProps];
                }
            });
        }
    });


    return merged;
});

const ui = computed(() => {
    const b = tv(theme)({
        direction: activeProps.value.direction as any || props.direction,
        hoverable: activeProps.value.hoverable || props.hoverable,
    });

    return {
        root: () => b.root({ class: [activeProps.value.ui?.root, activeProps.value.class] }),
        left: () => b.left({ class: [activeProps.value.ui?.left] }),
        right: () => b.right({ class: [activeProps.value.ui?.right] }),
        center: () => b.center({ class: [activeProps.value.ui?.center] }),
    };
});

// size 属性同时兼容数字 (number) 和数组 ([width, height])：
// 1. 为数字时，保持原有语义，即圆孔直径或虚线粗细。
// 2. 为数组时，专供 dashed（虚线）模式下精准控制虚线段的长宽尺寸。
const normalizedSize = computed(() => {
    if (Array.isArray(activeProps.value.size)) {
        const [width = 0, height = 0] = activeProps.value.size;
        return {
            isTuple: true,
            value: width,
            width,
            height,
        };
    }

    const value = Number(activeProps.value.size ?? 0);
    return {
        isTuple: false,
        value,
        width: value,
        height: value,
    };
});

const leftStyle = computed(() => {
    if (!["notch", "perforated"].includes(activeProps.value.type!)) return {};

    const basis =
        activeProps.value.position === "center"
            ? "50%"
            : activeProps.value.position === "end"
                ? `calc(100% - ${activeProps.value.offset}px)`
                : `${activeProps.value.offset}px`;

    if (activeProps.value.direction === "vertical") {
        return {
            flexBasis: `calc(${basis} - ${activeProps.value.radius}px)`,
            width: `calc(${basis} - ${activeProps.value.radius}px)`,
        };
    }

    return {
        flexBasis: `calc(${basis} - ${activeProps.value.radius}px)`,
        height: `calc(${basis} - ${activeProps.value.radius}px)`,
    };
});

// center 元素接管中间分割线的绘制：
// 1. notch 类型仅作为间隔占位，不绘制任何线条。
// 2. perforated（穿孔）类型利用背景渐变 (background-image) 实现虚线或点状线，相比蒙版方案兼容性更好。
const centerStyle = computed(() => {
    if (!["notch", "perforated"].includes(activeProps.value.type!)) {
        return { display: "none" };
    }

    const bandSize = `${activeProps.value.radius! * 2}px`;
    const isVertical = activeProps.value.direction === "vertical";
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

    if (activeProps.value.type !== "perforated") {
        return baseStyle;
    }

    const dotSize = normalizedSize.value.value;
    const dashWidth = normalizedSize.value.width;
    const dashHeight = normalizedSize.value.height;
    const gap = activeProps.value.gap!;

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
        ...(activeProps.value.splitColor ? { color: activeProps.value.splitColor } : {}),
        backgroundImage: activeProps.value.split === "dashed" ? dashedBackground : dottedBackground,
        backgroundSize: `${cellWidth}px ${cellHeight}px`,
        backgroundRepeat: isVertical ? "repeat-y" : "repeat-x",
        backgroundPosition: "center",
    };
});

// mask 蒙版仅负责 coupon 的外轮廓缺口或切角，不再承担中间分割线的绘制工作。
const maskStyle = computed(() => {
    const type = activeProps.value.type;
    const direction = activeProps.value.direction;
    const radius = activeProps.value.radius!;
    const position = activeProps.value.position;
    const offsetValue = activeProps.value.offset;
    const corner = activeProps.value.corner!;

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
        const gap = `${activeProps.value.gap! + radius * 2}px`;
        const size = direction === "horizontal" ? `100% ${gap}` : `${gap} 100%`;
        const maskPosition = `${direction === "horizontal" ? "" : "50% "}-${radius}px`;
        const horizontal = `radial-gradient(circle at ${radius}px, transparent ${radius}px, red ${radius}.5px)`;
        const vertical = `radial-gradient(circle at 50% ${radius}px, transparent ${radius}px, red ${radius}.5px)`;
        const imageMap: Record<string, string> = { horizontal, vertical };

        return {
            "-webkit-mask-image": imageMap[direction!],
            "-webkit-mask-position": maskPosition,
            "-webkit-mask-size": size,
        };
    }

    if (type === "combined") {
        const gap = `${activeProps.value.gap! + radius * 2}px`;
        const size = direction === "horizontal" ? `100% ${gap}` : `${gap} 100%`;
        const maskPosition = `${direction === "horizontal" ? "" : "50% "}-${radius}px`;
        const horizontal = `radial-gradient(circle at ${radius}px, transparent ${radius}px, red ${radius}.5px)`;
        const vertical = `radial-gradient(circle at 50% ${radius}px, transparent ${radius}px, red ${radius}.5px)`;
        const imageMap: Record<string, string> = { horizontal, vertical };

        return {
            "-webkit-mask-image": `${imageMap[direction!]}, radial-gradient(circle at ${corner}px ${corner}px, red ${corner}px, transparent ${corner}.5px)`,
            "-webkit-mask-position": `${maskPosition}, -${corner}px -${corner}px`,
            "-webkit-mask-size": `${size}, 100%`,
            "-webkit-mask-composite": "source-out, destination-over",
            "mask-composite": "subtract, add",
        };
    }

    return {};
});

const rootStyle = computed(() => {
    const width =
        typeof activeProps.value.width === "number"
            ? `${activeProps.value.width}px`
            : activeProps.value.width;
    const height =
        typeof activeProps.value.height === "number"
            ? `${activeProps.value.height}px`
            : activeProps.value.height;

    return {
        width,
        height,
        ...maskStyle.value,
    };
});
</script>

<template>
    <div :class="ui.root()" :style="rootStyle">
        <div :class="ui.left()" :style="leftStyle">
            <slot name="left" />
        </div>
        <div :class="ui.center()" :style="{
            height: `calc(100% - ${activeProps.radius * 2}px)`,
            margin: `${activeProps.radius}px 0`,
        }">
            <div :style="centerStyle" />
        </div>
        <div :class="ui.right()">
            <slot name="right" />
        </div>
    </div>
</template>
