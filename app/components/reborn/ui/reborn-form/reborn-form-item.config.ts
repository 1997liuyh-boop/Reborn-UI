const size = ['sm', 'md', 'lg'] as const
const labelPositions = ['left', 'top', 'right'] as const

export default {
    slots: {
        // items-start 而非 items-baseline / items-center：标签靠 size 变体的最小高度与控件行对齐，
        // 错误信息出现时不会把标签拽向「控件 + 错误」的整体中线
        root: 'flex items-start last:mb-0',
        wrapper: 'flex-1 min-w-0',
        label: 'text-sm text-gray-9 font-semibold flex items-center shrink-0',
        content: 'relative w-full flex-1',
        error: 'text-sm text-red-5 mt-1.5 animate-in slide-in-from-top-1 fade-in duration-300',
    },
    variants: {
        /**
         * 标签最小高度取控件高度令牌（--height-input-*，与 Input / FieldTrigger 同源），
         * 配合根节点 items-start：标签始终与控件那一行垂直居中；
         * 出现错误信息时 wrapper 变高，但标签不会随「控件 + 错误」整体居中。
         */
        size: {
            sm: {
                label: 'min-h-[var(--height-input-sm)]',
            },
            md: {
                label: 'min-h-[var(--height-input-md)]',
            },
            lg: {
                label: 'min-h-[var(--height-input-lg)]',
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
