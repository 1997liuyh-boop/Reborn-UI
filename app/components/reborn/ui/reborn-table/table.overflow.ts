import type { InjectionKey } from 'vue';

/** 同一表格共享尺寸观察器，单元格只登记测量回调。 */
export interface TableOverflowRegistry {
  observe: (element: Element, measure: () => void) => () => void;
}

export const TABLE_OVERFLOW_KEY: InjectionKey<TableOverflowRegistry> = Symbol('reborn-table-overflow');
