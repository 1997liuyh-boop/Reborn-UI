import type { ClassValue } from 'tailwind-variants';
import { tv } from '~/lib/tv';

export const avatarSizes = ['sm', 'md', 'lg'] as const;
export const avatarShapes = ['circle', 'square'] as const;
export const avatarFits = ['fill', 'contain', 'cover', 'none', 'scale-down'] as const;
export type AvatarSize = (typeof avatarSizes)[number] | number;
export type AvatarShape = (typeof avatarShapes)[number];
export type AvatarFit = (typeof avatarFits)[number];

/** 固定像素尺寸不受根字号影响，头像组的描边用于区分相邻头像。 */
export const avatarTheme = tv({
  slots: {
    root: 'reborn-avatar relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gray-5 font-medium text-gray-1 align-middle select-none',
    image: 'block size-full',
    icon: 'size-1/2 shrink-0',
    fallback: 'max-w-full truncate px-0.5',
    editOverlay: 'pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(25,30,39,0.5)] text-gray-1 opacity-0 transition-opacity group-hover/avatar:opacity-100 group-focus-visible/avatar:opacity-100',
    editIcon: 'size-4 shrink-0',
  },
  variants: {
    fallbackContent: {
      true: { root: 'hover:bg-gray-7' },
      false: {},
    },
    editable: {
      true: { root: 'group/avatar cursor-pointer border-0 p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary' },
      false: {},
    },
    size: {
      sm: { root: 'size-6 text-sm' },
      md: { root: 'size-8 text-base' },
      lg: { root: 'size-10 text-lg' },
      custom: { root: 'size-(--rb-avatar-size) text-base' },
    },
    shape: {
      circle: { root: 'rounded-full' },
      square: { root: 'rounded-md' },
    },
    fit: {
      fill: { image: 'object-fill' },
      contain: { image: 'object-contain' },
      cover: { image: 'object-cover' },
      none: { image: 'object-none' },
      'scale-down': { image: 'object-scale-down' },
    },
    grouped: {
      true: { root: 'ring-1 ring-gray-1' },
      false: {},
    },
  },
  compoundVariants: [{ grouped: true, size: 'lg', class: { root: 'ring-2' } }],
  defaultVariants: { size: 'md', shape: 'circle', fit: 'cover', grouped: false, editable: false },
});

export interface AvatarUI {
  /** 头像外框 */
  root?: ClassValue;
  /** 图片 */
  image?: ClassValue;
  /** 图标 */
  icon?: ClassValue;
  /** 可编辑遮罩 */
  editOverlay?: ClassValue;
  /** 编辑图标 */
  editIcon?: ClassValue;
  /** 默认插槽内容的容器 */
  fallback?: ClassValue;
}

export default avatarTheme;
