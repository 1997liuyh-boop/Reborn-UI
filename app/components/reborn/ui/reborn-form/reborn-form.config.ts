const labelPositions = ['left', 'top', 'right'] as const

export { labelPositions as formLabelPositions }

export default {
    slots: {
        // 表单项之间的间距由 FormItem 根据是否有标签自行控制（有标签 24px / 无标签 16px）
        root: 'w-full',
    },
}
