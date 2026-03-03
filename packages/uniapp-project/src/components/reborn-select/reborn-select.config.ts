const size = ['sm', 'md', 'lg'] as const
const color = ['primary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export { color as selectColors, size as selectSizes }

const config = {
    slots: {
        empty: 'py-3 text-center text-gray-400 text-sm',
        emptyText: 'text-gray-400 text-sm',
        buttons: 'flex flex-row items-center justify-center gap-2 p-3',
        cancel: 'flex-1',
        confirm: 'flex-1',
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