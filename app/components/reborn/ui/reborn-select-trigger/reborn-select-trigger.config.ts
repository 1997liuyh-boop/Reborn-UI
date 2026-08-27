import type { ClassValue } from "clsx";

const sizes = ["sm", "md", "lg"] as const;

export { sizes as selectTriggerSizes };

/** 浮层容器可覆盖的样式键 */
export type SelectTriggerUI = Partial<{
    wrapper: ClassValue;
    dropdown: ClassValue;
    dropdownInner: ClassValue;
}>;

/** 浮层容器独占的 ui 键，用于把消费方的合并 ui 配置拆成两半 */
const OVERLAY_UI_KEYS = ["wrapper", "dropdown", "dropdownInner"] as const;

/**
 * 把消费方对外暴露的 triggerUi（触发器盒子 + 浮层两部分混在一起）拆开：
 * overlay 交给 RebornSelectTrigger，field 交给 RebornFieldTrigger。
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
        dropdown: "absolute z-50 w-full border border-gray-2 dark:border-gray-7 bg-white dark:bg-gray-8 shadow-lg overflow-y-auto overscroll-contain scrollbar-hide flex flex-col",
        dropdownInner: "w-full shrink-0",
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
                dropdown: "absolute top-0 left-0 z-[9999] w-auto min-w-[var(--rb-trigger-width)]"
            },
            false: {
                dropdown: "absolute z-50 w-full"
            }
        },
        /** 尺寸只影响浮层圆角，触发器盒子的高度与内边距已移交 RebornFieldTrigger */
        size: {
            sm: {
                dropdown: "rounded-ui-sm",
            },
            md: {
                dropdown: "rounded-ui-md",
            },
            lg: {
                dropdown: "rounded-ui-base",
            },
        },
        /**
         * 展开方向。偏移类只在行内模式下给出：
         * 传送模式的 top / left / transform 全部由组件内联下发，
         * 若这里再叠 top-full / bottom-full，两套定位会互相打架（只是恰好被内联优先级压住）。
         */
        placement: {
            bottom: {},
            top: {},
        },
    },
    compoundVariants: [
        { portal: false, placement: "bottom", class: { dropdown: "top-full mt-1" } },
        { portal: false, placement: "top", class: { dropdown: "bottom-full mb-1" } },
    ],
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        placement: "bottom" as const,
    },
};
