/** RebornSku 基础样式配置 */
export default {
  slots: {
    /** 最外层容器 */
    wrapper: "flex flex-col gap-6",
    /** 单个属性组容器 */
    group: "flex flex-col gap-2",
    /** 属性组标题 */
    title: "text-28 font-medium text-gray-7 dark:text-gray-3",
    /** 属性值列表容器 */
    list: "flex flex-wrap gap-2",
    /** 单个属性值项 */
    item: "px-3 py-1.5 rounded-ui-sm border border-gray-2 dark:border-gray-7 text-28 text-gray-7 dark:text-gray-3 cursor-pointer transition-all hover:border-primary hover:text-primary select-none",
    /** 选中状态的属性值项 */
    itemActive: "border-primary! text-primary! bg-primary-50 dark:bg-primary-950",
    /** 禁用状态的属性值项 */
    itemDisabled: "opacity-40 cursor-not-allowed pointer-events-none",
  },
} as const;
