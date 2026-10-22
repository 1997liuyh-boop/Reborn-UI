import type { TableUi } from './table.types';

export const tableSizes = ['sm', 'md', 'lg'] as const;
export const tableAligns = ['left', 'center', 'right'] as const;
export type { TableUi as TableUI } from './table.types';

/** 固定区只在靠近滚动内容的一侧绘制阴影，伪元素不拦截点击与拖拽。 */
export const tableFixedStyles = {
  edge: "after:pointer-events-none after:absolute after:-top-px after:-bottom-px after:w-3 after:content-[''] after:transition-opacity after:duration-150 motion-reduce:after:transition-none",
  left: 'after:-right-3 after:shadow-[inset_10px_0_10px_-10px_#00000026] dark:after:shadow-[inset_10px_0_10px_-10px_#00000066]',
  right: 'after:-left-3 after:shadow-[inset_-10px_0_10px_-10px_#00000026] dark:after:shadow-[inset_-10px_0_10px_-10px_#00000066]',
} as const;

/** 字号和行高完整沿用项目令牌，不为表格单独覆盖。 */
export default {
  slots: {
    root: 'relative min-w-0 w-full text-base font-medium text-gray-9 tracking-normal',
    scrollbar: 'relative min-w-0 w-full',
    table: 'w-full table-fixed border-separate border-spacing-0 border-b border-gray-3 text-left text-base font-medium text-gray-9 tracking-normal',
    thead: '',
    headerCell: 'box-border border-b border-gray-3 bg-gray-1 px-4 py-0 text-base font-medium text-gray-9 align-middle',
    row: 'group/row bg-gray-1',
    // 表体用上边框分隔行；底边由表格统一绘制，跨行合并也不会重复描边。
    cell: 'box-border border-t border-gray-3 px-4 py-0 text-base font-medium text-gray-9 align-middle',
    cellContent: 'min-w-0 py-1',
    expand: 'border-t border-gray-3 bg-gray-1 px-4 py-3',
    empty: 'px-4 py-10 text-center text-gray-6',
    // 遮罩盖住整个表体，等待光标同时压过下面所有被加载态禁用的控件
    loading: 'absolute inset-0 z-40 flex cursor-wait items-center justify-center gap-2 bg-gray-1/80 text-gray-6',
    summary: 'bg-gray-2',
    footer: 'px-4 py-3',
    pagination: 'flex justify-end py-3',
  } satisfies Record<keyof Required<TableUi>, string>,
  variants: {
    size: {
      sm: { cell: 'h-9', headerCell: 'h-9' },
      md: { cell: 'h-12', headerCell: 'h-12' },
      lg: { cell: 'h-14', headerCell: 'h-14' },
    },
    border: { true: {
      // 底框向内叠绘，内容撑满时与表格底线重合；短内容或 append 前仍保留表格底线。
      scrollbar: "border-x border-t border-gray-3 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-30 after:h-px after:bg-gray-3 after:content-['']",
      headerCell: 'border-r', cell: 'border-r',
    } },
    headerBackground: { true: { headerCell: 'bg-gray-2' } },
    hover: { true: { row: 'hover:bg-gray-2' } },
  },
  defaultVariants: { size: 'md' as const, hover: true },
};
