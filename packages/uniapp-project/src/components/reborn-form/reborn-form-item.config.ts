const size = ['sm', 'md', 'lg'] as const
const labelPositions = ['left', 'top', 'right'] as const
export default {
  slots: {
    root: 'flex gap-2 mb-4',
    wrapper: 'flex-1',
    label: 'text-gray-8 dark:text-gray-1 font-medium flex items-center shrink-0',
    content: 'relative w-full flex-1',
    // 定位与间距随 inlineMessage 变体给出：两种模式下错误出现与消失都不改变表单项高度
    error: 'text-xs text-red-500 animate-in slide-in-from-top-1 fade-in duration-200',
  },
  variants: {
    size: {
      sm: {
        label: 'text-26',
      },
      md: {
        label: 'text-28',
      },
      lg: {
        label: 'text-30',
      },
    },
    error: {
      true: {
        root: 're-form-item--error',
      },
    },
    /**
     * 错误信息的摆放方式（取自 RebornForm 的 inlineMessage），与 Web 端同一套规则，两种都不占文档流高度：
     * - false：绝对定位在控件下方，落在表单项的 mb-4 下外边距里（2px + 14px 行高 = 16px）。
     * - true：与控件同一行、排在控件右侧，单行截断；控件让出宽度，表单项高度不变。
     *   本端表单项没有控件行高令牌，行内错误与内容区整体垂直居中。
     */
    inlineMessage: {
      false: {
        wrapper: 'relative',
        error: 'absolute top-full left-0 pt-0.5 leading-[14px]',
      },
      true: {
        wrapper: 'flex flex-row items-center gap-2',
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
        label: 'justify-end text-right',
      },
      top: {
        root: 'flex-col items-stretch',
        label: 'justify-start text-left w-full',
      },
    },
  },
  defaultVariants: {
    size: 'sm',
    error: false,
    labelPosition: 'left',
    inlineMessage: false,
  },
} as const

export { size as formItemLabelSize, labelPositions as formItemLabelPositions }
