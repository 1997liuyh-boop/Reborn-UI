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
    root: 'reborn-avatar relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gray-3 font-medium text-gray-8 align-middle select-none',
    image: 'block size-full',
    icon: 'size-[60%] shrink-0',
    fallback: 'max-w-full truncate px-0.5',
  },
  variants: {
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
      true: { root: 'ring-2 ring-gray-1' },
      false: {},
    },
  },
  defaultVariants: { size: 'md', shape: 'circle', fit: 'cover', grouped: false },
});

export interface AvatarUI {
  /** 头像外框 */
  root?: ClassValue;
  /** 图片 */
  image?: ClassValue;
  /** 图标 */
  icon?: ClassValue;
  /** 默认插槽内容的容器 */
  fallback?: ClassValue;
}

export default avatarTheme;
