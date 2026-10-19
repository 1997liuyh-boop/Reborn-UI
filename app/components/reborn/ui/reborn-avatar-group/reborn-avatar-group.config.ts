import type { ClassValue } from 'tailwind-variants';
import { tv } from '~/lib/tv';

export const avatarGroupEffects = ['light', 'dark'] as const;
export type AvatarGroupEffect = (typeof avatarGroupEffects)[number] | (string & {});

export const avatarGroupTheme = tv({
  slots: {
    root: 'reborn-avatar-group inline-flex items-center align-middle',
    /** 通过包装层重叠，避免覆盖单个头像自定义的尺寸与圆角。 */
    item: 'relative inline-flex shrink-0 not-first:-ms-[var(--rb-avatar-group-gap)] hover:z-10 focus-within:z-10',
    collapse: 'inline-flex cursor-default items-center justify-center border-0 bg-transparent p-0 font-inherit text-inherit outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    tooltip: 'flex max-w-80 flex-wrap items-center gap-2 rounded-lg border border-gray-4 bg-gray-1 p-3 text-gray-10 shadow-lg',
  },
  variants: {
    shape: {
      circle: { collapse: 'rounded-full' },
      square: { collapse: 'rounded-md' },
    },
    effect: {
      light: {},
      dark: { tooltip: 'border-gray-10 bg-gray-10 text-gray-1' },
    },
    interactive: {
      true: { collapse: 'cursor-pointer' },
      false: {},
    },
  },
  defaultVariants: { shape: 'circle', effect: 'light', interactive: false },
});

export interface AvatarGroupUI {
  /** 头像组容器 */
  root?: ClassValue;
  /** 各可见头像的重叠包装层 */
  item?: ClassValue;
  /** 折叠计数头像 */
  collapse?: ClassValue;
  /** 悬停面板 */
  tooltip?: ClassValue;
}

export default avatarGroupTheme;
