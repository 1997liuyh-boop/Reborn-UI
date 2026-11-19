import type { ClassValue } from 'tailwind-variants';

/** 结构键样式覆盖；气泡定位层的覆盖走 ui.popover 透传给底层 Popover。 */
export type PopconfirmUi = Partial<Record<'body' | 'header' | 'title' | 'icon' | 'description' | 'footer', ClassValue>>;

export default {
  slots: {
    // 气泡内边距 12px 由组件传给底层 Popover 的 content；body 用 16px 间距分隔文字区与按钮区。
    body: 'flex w-max min-w-61 max-w-70 flex-col gap-4',
    // 标题与描述间隔 8px；两者都缺省时整个文字区不渲染，避免残留空隙。
    header: 'flex flex-col gap-2',
    titleRow: 'flex items-center gap-2',
    icon: 'size-4 shrink-0 text-gray-10',
    // 22px 行高就是 text-base 令牌自带的值，不用再写 leading-[22px]
    title: 'text-base font-medium text-gray-10',
    description: 'text-base text-gray-8',
    // 按钮之间间隔 8px，右对齐。
    footer: 'flex items-center justify-end gap-2',
  },
};
