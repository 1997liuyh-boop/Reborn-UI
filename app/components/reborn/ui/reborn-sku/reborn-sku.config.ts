/** RebornSku 基础样式配置 */
export default {
  slots: {
    /** 最外层容器 */
    wrapper: "flex flex-col gap-6",
    /** 单个属性组容器 */
    group: "flex flex-col gap-2",
    /** 属性组标题 */
    title: "text-base font-medium text-gray-8 dark:text-gray-1",
    /** 属性值列表容器 */
    list: "flex flex-wrap gap-2",
    /** 单个属性值项 */
    item: "cursor-pointer transition-all hover:border-primary hover:text-primary select-none",
  },
} as const;
