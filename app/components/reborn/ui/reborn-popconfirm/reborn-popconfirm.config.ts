import type { ClassValue } from 'tailwind-variants';

/** 结构键样式覆盖；气泡定位层的覆盖走 ui.popover 透传给底层 Popover。 */
export type PopconfirmUi = Partial<Record<'body' | 'header' | 'title' | 'description' | 'footer', ClassValue>>;

export default {
  slots: {
    // 气泡内边距 12px 由组件传给底层 Popover 的 content；body 用 16px 间距分隔文字区与按钮区。
    body: 'flex w-max min-w-[244px] max-w-[280px] flex-col gap-[16px]',
    // 标题与描述间隔 8px；两者都缺省时整个文字区不渲染，避免残留空隙。
    header: 'flex flex-col gap-[8px]',
    title: 'text-base leading-[22px] font-medium text-gray-10',
    description: 'text-base leading-[22px] text-gray-8',
    // 按钮之间间隔 8px，右对齐。
    footer: 'flex items-center justify-end gap-[8px]',
  },
};
