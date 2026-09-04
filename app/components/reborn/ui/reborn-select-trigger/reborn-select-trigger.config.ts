import type { ClassValue } from "clsx";

const sizes = ["sm", "md", "lg"] as const;

export { sizes as selectTriggerSizes };

/** 浮层展开方向：auto 为向下展开、空间不足时自动向上（默认） */
export const selectTriggerSides = ["auto", "top", "bottom", "left", "right"] as const;
export type SelectTriggerSide = (typeof selectTriggerSides)[number];

/** 浮层在交叉轴上的对齐方式 */
export const selectTriggerAligns = ["start", "center", "end"] as const;
export type SelectTriggerAlign = (typeof selectTriggerAligns)[number];

/** 浮层容器可覆盖的样式键 */
export type SelectTriggerUI = Partial<{
    wrapper: ClassValue;
    dropdown: ClassValue;
    dropdownInner: ClassValue;
    arrow: ClassValue;
}>;

/** 浮层容器独占的 ui 键，用于把消费方的合并 ui 配置拆成两半 */
const OVERLAY_UI_KEYS = ["wrapper", "dropdown", "dropdownInner", "arrow"] as const;

/**
 * 把消费方对外暴露的 triggerUi（触发器盒子 + 浮层两部分混在一起）拆开：
 * overlay 交给 RebornSelectTrigger，field 交给消费方自己的触发器盒子。
 * 拆分后消费方对外的 triggerUi 键名不变，调用方无感知。
 */
export function splitTriggerUi<T extends Record<string, any>>(ui?: T) {
    const source = (ui ?? {}) as T;
    const overlay: Record<string, any> = {};
    const field: Record<string, any> = {};

    for (const key of Object.keys(source)) {
        if ((OVERLAY_UI_KEYS as readonly string[]).includes(key)) {
            overlay[key] = source[key];
        } else {
            field[key] = source[key];
        }
    }

    return { overlay: overlay as SelectTriggerUI, field };
}

export default {
    slots: {
        // 浮层锚点：relative 提供行内模式的定位参照，group + tabindex（由组件模板给出）支撑子级触发器的聚焦描边
        wrapper: "relative inline-flex w-full group outline-none",
        // 背景与描边只用灰阶 token（base.css 的 .dark 会整条翻转），不可写 bg-white / dark: 前缀，否则深色模式下会二次翻转
        // 圆角 8px（rounded-ui-sm）；内边距不放这里，展开动画走 height:0 → scrollHeight，border-box 下内边距会撑出一段残留高度
        dropdown: "absolute z-50 w-full flex flex-col rounded-ui-sm border border-gray-3 bg-gray-1 shadow-lg overflow-y-auto overscroll-contain scrollbar-hide",
        dropdownInner: "w-full shrink-0",
        // 指向触发器的小箭头：12px 正方形旋转 45°，与浮层同底色同描边。
        // 它是浮层的同级节点而非子节点：浮层展开 / 收起动画期间是 overflow-hidden，探出盒子的箭头会被瞬间裁掉；
        // 独立成节点后按同样时长淡入淡出。位置（贴在浮层朝向触发器的边上、对准触发器中心）与描边方向由组件内联下发
        arrow: "absolute size-3 border border-gray-3 bg-gray-1 pointer-events-none",
    },
    variants: {
        /**
         * 浮层的定位参照系，两者互斥：
         * - true：传送至 body，按文档坐标定位（left/top 由组件内联下发），
         *   因此不受任何祖先 overflow / transform 裁剪；层级对齐 RebornPopover、RebornTooltip 的 9999。
         *   页面滚动时浮层和触发器处在同一文档坐标系，不依赖 scroll 事件每帧补位。
         * - false：留在触发器内，absolute 相对 wrapper 定位，会被祖先的 overflow 裁掉。
         */
        portal: {
            true: {
                dropdown: "absolute top-0 left-0 z-[9999] w-auto min-w-[var(--rb-trigger-width)]",
                arrow: "z-[9999]",
            },
            false: {
                dropdown: "absolute z-50 w-full",
                arrow: "z-50",
            }
        },
        /**
         * 尺寸档位。浮层圆角已统一为 8px（见 slots.dropdown），
         * 不再随尺寸放大，因此此处三档均无附加样式；保留该变体是为了让调用方的 size 透传保持合法。
         * 触发器盒子的高度与内边距由各消费组件自行给出。
         */
        size: {
            sm: {},
            md: {},
            lg: {},
        },
        /**
         * 实际展开方向（auto 已在组件内解析为 top / bottom）。偏移类只在行内模式下给出：
         * 传送模式的 top / left / transform 全部由组件内联下发，
         * 若这里再叠 top-full / bottom-full，两套定位会互相打架（只是恰好被内联优先级压住）。
         */
        placement: {
            bottom: {},
            top: {},
            left: {},
            right: {},
        },
        /** 交叉轴对齐，仅传送模式生效（由组件内联下发），行内模式恒为 start */
        align: {
            start: {},
            center: {},
            end: {},
        },
    },
    compoundVariants: [
        { portal: false, placement: "bottom", class: { dropdown: "top-full mt-1" } },
        { portal: false, placement: "top", class: { dropdown: "bottom-full mb-1" } },
        { portal: false, placement: "left", class: { dropdown: "right-full top-0 mr-1 w-auto" } },
        { portal: false, placement: "right", class: { dropdown: "left-full top-0 ml-1 w-auto" } },
    ],
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        placement: "bottom" as const,
        align: "start" as const,
    },
};
