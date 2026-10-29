/**
 * 单选框组件基础常量定义
 */

/** 单选尺寸：sm / md / lg（variant=radio 时圆形图标直径分别为 12 / 14 / 16px） */
export const radioSizes = ["sm", "md", "lg"] as const;

/** 旧版类型取值，仅用于兼容 type 参数 */
export const radioTypes = ["radio", "button", "pure-button"] as const;

/** 单选形态：圆点、分段按钮、实体拼接按钮 */
export const radioVariants = ["radio", "button", "pure-button"] as const;

/** 单选框组方向：水平 / 垂直 */
export const radioDirections = ["horizontal", "vertical"] as const;

/** 语义色板，与 RebornButton 同一套取值 */
export const radioColors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

/** 样式变体：filled 实底（语义色背景 + 白色前景）/ outlined 描边（语义色描边 + 语义色前景，默认） */
export const radioAppearances = ["filled", "outlined"] as const;

/** 单选尺寸类型 */
export type RadioSize = (typeof radioSizes)[number];

/** 单选类型 */
export type RadioType = (typeof radioTypes)[number];

/** 单选框组方向类型 */
export type RadioDirection = (typeof radioDirections)[number];

/** 单选语义色类型 */
export type RadioColor = (typeof radioColors)[number];

/** 单选样式变体类型 */
export type RadioVariant = (typeof radioVariants)[number];

/** 选中态的填充方式 */
export type RadioAppearance = (typeof radioAppearances)[number];

/** 新版 variant 优先；旧 filled/outlined 与 type 组合仍可使用 */
export function resolveRadioVariant(variant?: RadioVariant | RadioAppearance, type?: RadioType): RadioVariant {
    return variant && variant !== "filled" && variant !== "outlined" ? variant : (type ?? "radio");
}

/** 显式 appearance 优先，否则读取旧版 variant 中的填充方式 */
export function resolveRadioAppearance(appearance?: RadioAppearance, variant?: RadioVariant | RadioAppearance): RadioAppearance | undefined {
    return appearance ?? (variant === "filled" || variant === "outlined" ? variant : undefined);
}

/** options 传参时的选项对象；其余字段原样保留，label 插槽的 data 可以读到 */
export interface RadioOption {
    /** 选项文案 */
    label?: string;
    /** 选项的 value */
    value: string | number;
    /** 是否禁用该选项 */
    disabled?: boolean;
    [key: string]: any;
}

/** options 的字段别名映射：数据字段名与默认的 label / value / disabled 不一致时配置 */
export interface RadioFieldNames {
    /** 展示文案字段名，默认 `label` */
    label?: string;
    /** 选项值字段名，默认 `value` */
    value?: string;
    /** 禁用字段名，默认 `disabled` */
    disabled?: string;
}

/** 单选框样式配置；灰阶随主题自动翻转 */
export default {
    slots: {
        /** 单选框组容器（radio 风格默认 gap-4，button/pure-button 由 variant 变体覆盖间距） */
        group: "reborn-radio-group inline-flex flex-wrap items-center gap-4",
        /** 单个单选框根节点；group/radio 供圆形图标做悬停联动 */
        root: "reborn-radio group/radio inline-flex cursor-pointer select-none items-center transition-colors",
        /** 圆形图标外圈（variant=radio）；relative 为圆点的绝对居中提供定位参照 */
        icon: "relative box-border inline-flex shrink-0 rounded-full border border-solid bg-transparent transition-all duration-200",
        /** 选中态实心圆点：绝对定位 + transform 居中，避免奇偶像素下 flex 居中出现半像素偏移 */
        dot: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200",
        /** 标签文本；字号与行高都由 size 变体的字号令牌给出，此处不写 leading- */
        label: "transition-colors",
        /**
         * 分段按钮（variant=button）的选中滑块：组容器量出选中项的位置交给 useLiquidSlider 写进行内样式，
         * 这里只管形态与过渡。液体形变两段的时长与缓动由行内样式按阶段给出，要用到 transform 压扁，所以过渡取 all。
         * z-0 压在选项下面，选项自身 relative z-[1] 浮在上层，滑过途中不会遮住沿途文字；
         * 底色随选中项的 appearance × color 切换，也一起过渡
         */
        slider: "pointer-events-none absolute z-0 rounded-sm shadow-sm transition-all duration-300 ease-out motion-reduce:transition-none",
    },
    variants: {
        variant: {
            radio: {
                root: "gap-2",
                label: "text-gray-8",
            },
            // 文字颜色沿用根节点默认的 150ms 过渡，与 tabs 胶囊型标签一致：
            // 液体形变的行程段滑块朝新选项拉长、前缘先到，新选中项的白字一开始就有底衬着
            button: {
                icon: "hidden",
                dot: "hidden",
                root: "relative z-[1] justify-center rounded-sm",
                group: "relative gap-[2px] rounded-md bg-gray-2 p-[2px]",
            },
            /**
             * 实体按钮拼接风格：每项渲染一个 RebornButton。
             * 组容器负责拼接细节——全员去圆角，选中项 z-[1] 保证彩色边框盖住相邻灰边；
             * 相邻项 -1px 折叠边框与首尾圆角随方向、尺寸在 compoundVariants 里给出。
             */
            "pure-button": {
                icon: "hidden",
                dot: "hidden",
                group: [
                    "gap-0 items-stretch",
                    "[&>.reborn-radio]:relative",
                    "[&>.reborn-radio[data-checked=true]]:z-[1]",
                    "[&>.reborn-radio_button]:rounded-none",
                ].join(" "),
            },
        },
        direction: {
            horizontal: { group: "flex-row" },
            vertical: { group: "flex-col items-start" },
        },
        // 标签字号走 7 级字号令牌（sm 12px / md 14px / lg 16px），行高由令牌自带。
        size: {
            sm: { icon: "size-3", dot: "size-1.5", label: "text-sm" },
            md: { icon: "size-3.5", dot: "size-radio-dot-md", label: "text-base" },
            lg: { icon: "size-4", dot: "size-2", label: "text-lg" },
        },
        color: {
            primary: {},
            secondary: {},
            success: {},
            info: {},
            warning: {},
            error: {},
            neutral: {},
        },
        /** 样式变体：具体外观按 variant × appearance × color 在 compoundVariants 中展开 */
        appearance: {
            filled: {},
            outlined: {},
        },
        checked: {
            true: {},
            false: {},
        },
        disabled: {
            // 不能再加 pointer-events-none：它会让光标直接穿透到下层，禁止光标永远显示不出来；
            // 点击由 onTap 的禁用判断拦住，悬停变色由各 hover 复合变体的 disabled: false 排除
            true: { root: "cursor-not-allowed opacity-50" },
            false: {},
        },
        error: {
            true: { icon: "border-error" },
            false: {},
        },
        /**
         * 分段按钮的选中底色是否交给组容器的滑块绘制。
         * 组容器挂载并量好位置后才置为 true；服务端渲染与独立使用的 RebornRadio 仍由选项自己画底色
         */
        slider: {
            true: {},
            false: {},
        },
    },
    compoundVariants: [
        // 圆点风格 · 选中 · outlined（默认）：透明底，外圈与圆点同取语义色
        { variant: "radio", appearance: "outlined", checked: true, color: "primary", class: { icon: "border-primary", dot: "bg-primary" } },
        { variant: "radio", appearance: "outlined", checked: true, color: "secondary", class: { icon: "border-secondary", dot: "bg-secondary" } },
        { variant: "radio", appearance: "outlined", checked: true, color: "success", class: { icon: "border-success", dot: "bg-success" } },
        { variant: "radio", appearance: "outlined", checked: true, color: "info", class: { icon: "border-info", dot: "bg-info" } },
        { variant: "radio", appearance: "outlined", checked: true, color: "warning", class: { icon: "border-warning", dot: "bg-warning" } },
        { variant: "radio", appearance: "outlined", checked: true, color: "error", class: { icon: "border-error", dot: "bg-error" } },
        { variant: "radio", appearance: "outlined", checked: true, color: "neutral", class: { icon: "border-neutral", dot: "bg-neutral" } },

        // 圆点风格 · 选中 · filled：外圈实底语义色，中心圆点为白色（前景对比色，两种主题下都取白）
        { variant: "radio", appearance: "filled", checked: true, color: "primary", class: { icon: "border-primary bg-primary", dot: "bg-white" } },
        { variant: "radio", appearance: "filled", checked: true, color: "secondary", class: { icon: "border-secondary bg-secondary", dot: "bg-white" } },
        { variant: "radio", appearance: "filled", checked: true, color: "success", class: { icon: "border-success bg-success", dot: "bg-white" } },
        { variant: "radio", appearance: "filled", checked: true, color: "info", class: { icon: "border-info bg-info", dot: "bg-white" } },
        { variant: "radio", appearance: "filled", checked: true, color: "warning", class: { icon: "border-warning bg-warning", dot: "bg-white" } },
        { variant: "radio", appearance: "filled", checked: true, color: "error", class: { icon: "border-error bg-error", dot: "bg-white" } },
        { variant: "radio", appearance: "filled", checked: true, color: "neutral", class: { icon: "border-neutral bg-neutral", dot: "bg-white" } },

        // 圆点风格 · 未选中：灰色空心圆，悬停时外圈预示语义色
        { variant: "radio", checked: false, class: { icon: "border-gray-4", dot: "hidden" } },
        { variant: "radio", checked: false, disabled: false, color: "primary", class: { icon: "group-hover/radio:border-primary" } },
        { variant: "radio", checked: false, disabled: false, color: "secondary", class: { icon: "group-hover/radio:border-secondary" } },
        { variant: "radio", checked: false, disabled: false, color: "success", class: { icon: "group-hover/radio:border-success" } },
        { variant: "radio", checked: false, disabled: false, color: "info", class: { icon: "group-hover/radio:border-info" } },
        { variant: "radio", checked: false, disabled: false, color: "warning", class: { icon: "group-hover/radio:border-warning" } },
        { variant: "radio", checked: false, disabled: false, color: "error", class: { icon: "group-hover/radio:border-error" } },
        { variant: "radio", checked: false, disabled: false, color: "neutral", class: { icon: "group-hover/radio:border-neutral" } },

        // 分段按钮风格 · 选中：加粗为两种变体共用
        { variant: "button", checked: true, class: { label: "font-medium" } },

        // 分段按钮风格 · 选中 · outlined（默认）：浮起并高亮语义色（gray-1 亮色为白、深色自动翻转，不可写 bg-white）。
        // 底色与阴影只在没有滑块时由选项自己画，有滑块时交给组容器的 slider 槽
        { variant: "button", appearance: "outlined", checked: true, slider: false, class: { root: "bg-gray-1 shadow-sm" } },
        { variant: "button", appearance: "outlined", checked: true, color: "primary", class: { root: "text-primary" } },
        { variant: "button", appearance: "outlined", checked: true, color: "secondary", class: { root: "text-secondary" } },
        { variant: "button", appearance: "outlined", checked: true, color: "success", class: { root: "text-success" } },
        { variant: "button", appearance: "outlined", checked: true, color: "info", class: { root: "text-info" } },
        { variant: "button", appearance: "outlined", checked: true, color: "warning", class: { root: "text-warning" } },
        { variant: "button", appearance: "outlined", checked: true, color: "error", class: { root: "text-error" } },
        { variant: "button", appearance: "outlined", checked: true, color: "neutral", class: { root: "text-neutral" } },

        // 分段按钮风格 · 选中 · filled：语义色实底 + 白色字体；实底同样只在没有滑块时由选项自己画
        { variant: "button", appearance: "filled", checked: true, class: { root: "text-white" } },
        { variant: "button", appearance: "filled", checked: true, slider: false, color: "primary", class: { root: "bg-primary shadow-sm" } },
        { variant: "button", appearance: "filled", checked: true, slider: false, color: "secondary", class: { root: "bg-secondary shadow-sm" } },
        { variant: "button", appearance: "filled", checked: true, slider: false, color: "success", class: { root: "bg-success shadow-sm" } },
        { variant: "button", appearance: "filled", checked: true, slider: false, color: "info", class: { root: "bg-info shadow-sm" } },
        { variant: "button", appearance: "filled", checked: true, slider: false, color: "warning", class: { root: "bg-warning shadow-sm" } },
        { variant: "button", appearance: "filled", checked: true, slider: false, color: "error", class: { root: "bg-error shadow-sm" } },
        { variant: "button", appearance: "filled", checked: true, slider: false, color: "neutral", class: { root: "bg-neutral shadow-sm" } },

        // 分段按钮滑块底色：组容器以选中项的 appearance / color / disabled 调用，与上面选项自绘的底色一一对应
        { variant: "button", appearance: "outlined", class: { slider: "bg-gray-1" } },
        { variant: "button", appearance: "filled", color: "primary", class: { slider: "bg-primary" } },
        { variant: "button", appearance: "filled", color: "secondary", class: { slider: "bg-secondary" } },
        { variant: "button", appearance: "filled", color: "success", class: { slider: "bg-success" } },
        { variant: "button", appearance: "filled", color: "info", class: { slider: "bg-info" } },
        { variant: "button", appearance: "filled", color: "warning", class: { slider: "bg-warning" } },
        { variant: "button", appearance: "filled", color: "error", class: { slider: "bg-error" } },
        { variant: "button", appearance: "filled", color: "neutral", class: { slider: "bg-neutral" } },
        // 选中项禁用时整项半透明，滑块跟着淡化，否则会出现一块不透明底衬着半透明文字
        { variant: "button", disabled: true, class: { slider: "opacity-50" } },

        // 分段按钮风格 · 未选中：灰字，悬停预示语义色
        { variant: "button", checked: false, class: { root: "text-gray-6" } },
        { variant: "button", checked: false, disabled: false, color: "primary", class: { root: "hover:text-primary" } },
        { variant: "button", checked: false, disabled: false, color: "secondary", class: { root: "hover:text-secondary" } },
        { variant: "button", checked: false, disabled: false, color: "success", class: { root: "hover:text-success" } },
        { variant: "button", checked: false, disabled: false, color: "info", class: { root: "hover:text-info" } },
        { variant: "button", checked: false, disabled: false, color: "warning", class: { root: "hover:text-warning" } },
        { variant: "button", checked: false, disabled: false, color: "error", class: { root: "hover:text-error" } },
        { variant: "button", checked: false, disabled: false, color: "neutral", class: { root: "hover:text-neutral" } },

        // 分段按钮风格尺寸：高度取 RebornButton 同款令牌（24/32/40px），与 pure-button 对齐
        { variant: "button", size: "sm", class: { root: "h-6 px-[8px]" } },
        { variant: "button", size: "md", class: { root: "h-8 px-[12px]" } },
        { variant: "button", size: "lg", class: { root: "h-10 px-[16px]" } },

        // 实体按钮拼接风格 · 禁用：视觉交给 RebornButton 的 bg-gray-2/text-gray-5 精确呈现，
        // 压掉根节点的整体半透明，避免二次淡化
        { variant: "pure-button", disabled: true, class: { root: "opacity-100" } },

        // 实体按钮拼接 · 水平：相邻项 -1px 折叠左右边框
        { variant: "pure-button", direction: "horizontal", class: { group: "[&>.reborn-radio:not(:first-child)]:-ml-px" } },
        // 实体按钮拼接 · 垂直：相邻项 -1px 折叠上下边框，成员等宽拉伸对齐
        {
            variant: "pure-button",
            direction: "vertical",
            class: { group: "items-stretch [&>.reborn-radio:not(:first-child)]:-mt-px [&>.reborn-radio_button]:w-full" },
        },

        // 实体按钮拼接 · 首尾圆角：随尺寸取 RebornButton 同款圆角令牌（sm→4px / md→6px / lg→8px），
        // 水平恢复首左尾右，垂直恢复首顶尾底
        {
            variant: "pure-button",
            direction: "horizontal",
            size: "sm",
            class: { group: "[&>.reborn-radio:first-child_button]:rounded-s-sm [&>.reborn-radio:last-child_button]:rounded-e-sm" },
        },
        {
            variant: "pure-button",
            direction: "horizontal",
            size: "md",
            class: { group: "[&>.reborn-radio:first-child_button]:rounded-s-md [&>.reborn-radio:last-child_button]:rounded-e-md" },
        },
        {
            variant: "pure-button",
            direction: "horizontal",
            size: "lg",
            class: { group: "[&>.reborn-radio:first-child_button]:rounded-s-lg [&>.reborn-radio:last-child_button]:rounded-e-lg" },
        },
        {
            variant: "pure-button",
            direction: "vertical",
            size: "sm",
            class: { group: "[&>.reborn-radio:first-child_button]:rounded-t-sm [&>.reborn-radio:last-child_button]:rounded-b-sm" },
        },
        {
            variant: "pure-button",
            direction: "vertical",
            size: "md",
            class: { group: "[&>.reborn-radio:first-child_button]:rounded-t-md [&>.reborn-radio:last-child_button]:rounded-b-md" },
        },
        {
            variant: "pure-button",
            direction: "vertical",
            size: "lg",
            class: { group: "[&>.reborn-radio:first-child_button]:rounded-t-lg [&>.reborn-radio:last-child_button]:rounded-b-lg" },
        },
    ] as const,
    defaultVariants: {
        variant: "radio" as RadioVariant,
        direction: "horizontal" as RadioDirection,
        size: "md" as RadioSize,
        color: "primary" as RadioColor,
        appearance: "outlined" as RadioAppearance,
        checked: false,
        disabled: false,
        error: false,
        slider: false,
    },
} as const;
