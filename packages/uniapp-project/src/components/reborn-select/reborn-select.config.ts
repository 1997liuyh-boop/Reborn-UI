const size = ['sm', 'md', 'lg'] as const
/**
 * 与 Web 端一致的 7 色枚举。本端调色板没有独立的 secondary 色阶
 * （theme.css 中 --color-secondary 即 gray-8），secondary 走灰阶，
 * 触发器 / 按钮 / 滚动选择器三处的配色映射均已覆盖该档。
 */
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export { color as selectColors, size as selectSizes }

const config = {
    slots: {
        empty: 'py-3 text-center text-gray-400 text-sm',
        emptyText: 'text-gray-400 text-sm',
        buttons: 'flex flex-row items-center justify-center gap-2 p-3',
        cancel: 'flex-1 ',
        cancelButton: 'w-full',
        confirm: 'flex-1 ',
        confirmButton: 'w-full',
    },
    variants: {
        hideButtons: {
            true: {
                buttons: 'hidden',
            },
        },
    },
}

export default config