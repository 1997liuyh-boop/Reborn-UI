export const waterfallColumnInnerClass = 'reborn-waterfall__column-inner'
export const waterfallVirtualClass = 'reborn-waterfall__virtual-item'

export default {
  slots: {
    root: 'flex w-full flex-row relative',
    column: 'flex-1',
    inner: waterfallColumnInnerClass,
    item: '',
    virtual: `absolute top-0 w-full -left-full opacity-0 ${waterfallVirtualClass}`,
  },
} as const
