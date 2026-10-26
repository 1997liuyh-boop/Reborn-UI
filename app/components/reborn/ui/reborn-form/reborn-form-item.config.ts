const size = ['sm', 'md', 'lg'] as const
const labelPositions = ['left', 'top', 'right'] as const

export default {
    slots: {
        // items-start 而非 items-baseline / items-center：标签靠 size 变体的最小高度与控件行对齐，
        // 错误信息出现时不会把标签拽向「控件 + 错误」的整体中线
        root: 'flex items-start last:mb-0',
        wrapper: 'flex-1 min-w-0',
        label: 'text-sm text-gray-9 font-semibold flex items-center shrink-0',
        /**
         * 内容区取 flex-col + justify-center：与 size 变体的最小高度配合，
         * 比控件高度矮的内容（勾选框组、开关、滑块等）在令牌高度内垂直居中，与标签中线对齐；
         * 比令牌高的内容（多行文本、卡片列表）高度自然撑开、从顶部排起，标签便与第一行对齐
         */
        content: 'relative w-full flex-1 flex flex-col justify-center',
        // 定位与间距随 inlineMessage 变体给出：两种模式下错误出现与消失都不改变表单项高度。
        // 进场 / 离场动画由 RebornFormItem 的 <Transition name="form-error"> 负责，这里不再叠加 animate-in 关键帧
        error: 'text-sm text-red-5',
    },
    variants: {
        /**
         * 标签与内容区共用 min-h-6 / min-h-8 / min-h-10，与输入控件的高度刻度一致，
         * 配合根节点 items-start：两者的第一行恒等高，标签始终与内容的第一行互相垂直居中——
         * 标准控件恰为令牌高度，矮于令牌的控件由内容区的 justify-center 抬到同一中线；
         * 出现错误信息时 wrapper 变高，但标签不会随「控件 + 错误」整体居中。
         * 勾选框组 / 单选组的子项行高天然矮于令牌，组一旦换行，第一行就对不上标签中线，
         * 所以对表单项内的组子项同样下发令牌最小高度：每一行都是令牌高度，
         * 第一行与标签精确对中，后续行的节奏也与其他控件行一致（Element Plus 同款做法）。
         */
        size: {
            sm: {
                label: 'min-h-6',
                content:
                    'min-h-6 [&_.reborn-checkbox-group>*]:min-h-6 [&_.reborn-radio-group>*]:min-h-6',
            },
            md: {
                label: 'min-h-8',
                content:
                    'min-h-8 [&_.reborn-checkbox-group>*]:min-h-8 [&_.reborn-radio-group>*]:min-h-8',
            },
            lg: {
                label: 'min-h-10',
                content:
                    'min-h-10 [&_.reborn-checkbox-group>*]:min-h-10 [&_.reborn-radio-group>*]:min-h-10',
            },
        },
        error: {
            true: {
                root: 're-form-item--error',
            },
        },
        /**
         * 错误信息的摆放方式（取自 RebornForm 的 inlineMessage）。两种都不占文档流里的高度，
         * 出现、消失时下方表单项不会被推动：
         * - false：绝对定位在控件下方，落在表单项的下外边距里（2px + 14px 行高 = 16px，
         *   不超过无标签项的 16px 间距）；与 Element Plus 默认一致。
         * - true：与控件同一行、排在控件右侧，单行截断；控件让出宽度，表单项高度不变。
         */
        inlineMessage: {
            false: {
                wrapper: 'relative',
                error: 'absolute top-full left-0 pt-0.5 leading-[14px]',
            },
            true: {
                wrapper: 'flex items-start gap-2',
                content: 'min-w-0',
                error: 'max-w-[50%] shrink-0 truncate',
            },
        },
        labelPosition: {
            left: {
                root: 'flex-row',
                label: 'justify-start text-left',
            },
            right: {
                root: 'flex-row',
                label: 'justify-end text-right pr-[12px]',
            },
            top: {
                root: 'flex-col items-stretch',
                // 上置标签与控件之间间隔 4px
                label: 'justify-start text-left w-full min-h-0 mb-1',
            },
        },
        // 表单项之间的间距：有标签 24px、无标签 16px（末项由 root 的 last:mb-0 归零）
        hasLabel: {
            true: {
                root: 'mb-[24px]',
            },
            false: {
                root: 'mb-[16px]',
            },
        },
    },
    /**
     * 行内错误的行高与控件行等高（24 / 32 / 40px），单行文字因此与控件第一行垂直居中；
     * 多行控件（如文本域）时错误对齐的是第一行，不随整体高度居中
     */
    compoundVariants: [
        { inlineMessage: true, size: 'sm', class: { error: 'leading-6' } },
        { inlineMessage: true, size: 'md', class: { error: 'leading-8' } },
        { inlineMessage: true, size: 'lg', class: { error: 'leading-10' } },
    ],
    defaultVariants: {
        size: 'sm',
        error: false,
        labelPosition: 'left',
        hasLabel: true,
        inlineMessage: false,
    },
} as const

export { size as formItemLabelSize, labelPositions as formItemLabelPositions }
