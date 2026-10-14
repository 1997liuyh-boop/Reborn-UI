import type { TableUi } from './table.types';

export const tableSizes = ['sm', 'md', 'lg'] as const;
export const tableAligns = ['left', 'center', 'right'] as const;
export type { TableUi as TableUI } from './table.types';

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
    loading: 'absolute inset-0 z-40 flex items-center justify-center gap-2 bg-gray-1/80 text-gray-6',
    summary: 'bg-gray-2',
    footer: 'px-4 py-3',
    pagination: 'flex justify-end py-3',
  } satisfies Record<keyof Required<TableUi>, string>,
  variants: {
    size: {
      sm: { cell: 'h-[36px]', headerCell: 'h-[36px]' },
      md: { cell: 'h-[48px]', headerCell: 'h-[48px]' },
      lg: { cell: 'h-[56px]', headerCell: 'h-[56px]' },
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
