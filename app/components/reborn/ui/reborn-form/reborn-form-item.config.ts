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
        error: 'text-sm text-red-5 mt-1.5 animate-in slide-in-from-top-1 fade-in duration-300',
    },
    variants: {
        /**
         * 标签与内容区共用同一控件高度令牌（--height-input-*，与 Input / FieldTrigger 同源）做最小高度，
         * 配合根节点 items-start：两者的第一行恒等高，标签始终与内容的第一行互相垂直居中——
         * 标准控件恰为令牌高度，矮于令牌的控件由内容区的 justify-center 抬到同一中线；
         * 出现错误信息时 wrapper 变高，但标签不会随「控件 + 错误」整体居中。
         * 勾选框组 / 单选组的子项行高天然矮于令牌，组一旦换行，第一行就对不上标签中线，
         * 所以对表单项内的组子项同样下发令牌最小高度：每一行都是令牌高度，
         * 第一行与标签精确对中，后续行的节奏也与其他控件行一致（Element Plus 同款做法）。
         */
        size: {
            sm: {
                label: 'min-h-[var(--height-input-sm)]',
                content:
                    'min-h-[var(--height-input-sm)] [&_.reborn-checkbox-group>*]:min-h-[var(--height-input-sm)] [&_.reborn-radio-group>*]:min-h-[var(--height-input-sm)]',
            },
            md: {
                label: 'min-h-[var(--height-input-md)]',
                content:
                    'min-h-[var(--height-input-md)] [&_.reborn-checkbox-group>*]:min-h-[var(--height-input-md)] [&_.reborn-radio-group>*]:min-h-[var(--height-input-md)]',
            },
            lg: {
                label: 'min-h-[var(--height-input-lg)]',
                content:
                    'min-h-[var(--height-input-lg)] [&_.reborn-checkbox-group>*]:min-h-[var(--height-input-lg)] [&_.reborn-radio-group>*]:min-h-[var(--height-input-lg)]',
            },
        },
        error: {
            true: {
                root: 're-form-item--error',
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
    defaultVariants: {
        size: 'sm',
        error: false,
        labelPosition: 'left',
        hasLabel: true,
    },
} as const

export { size as formItemLabelSize, labelPositions as formItemLabelPositions }
