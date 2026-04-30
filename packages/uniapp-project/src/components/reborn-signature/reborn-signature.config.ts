import type { ClassValue } from 'clsx'

export const signatureColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const signatureSizes = ['sm', 'md', 'lg'] as const
export const signatureToolbarPositions = ['left', 'right', 'bottom'] as const

export type SignatureColor = (typeof signatureColors)[number]
export type SignatureSize = (typeof signatureSizes)[number]
export type SignatureToolbarPosition = (typeof signatureToolbarPositions)[number]

export interface SignatureUI {
  root?: ClassValue
  board?: ClassValue
  canvas?: ClassValue
  placeholder?: ClassValue
  colorBar?: ClassValue
  colorSwatch?: ClassValue
  colorSwatchInner?: ClassValue
  toolbar?: ClassValue
  action?: ClassValue
  actionIcon?: ClassValue
  actionText?: ClassValue
}

const config = {
  slots: {
    root: 'w-full flex gap-[20rpx]',
    board: 'relative w-full overflow-hidden rounded-lg bg-white ring-1 ring-gray-3 transition-all duration-200',
    canvas: 'absolute left-0 top-0 z-[1]',
    placeholder: 'pointer-events-none absolute inset-0 z-[2] flex items-center justify-center px-[32rpx] text-center text-[28rpx] text-gray-4',
    colorBar: 'flex flex-row items-center gap-[12rpx]',
    colorSwatch: 'size-[52rpx] flex items-center justify-center rounded-full border border-solid border-gray-3 bg-white transition-all duration-200',
    colorSwatchInner: 'size-[34rpx] rounded-full',
    toolbar: 'flex flex-row flex-wrap items-center justify-end gap-[16rpx]',
    action: 'h-[64rpx] min-w-[128rpx] flex flex-row items-center justify-center gap-[8rpx] rounded-full border border-solid border-transparent px-[24rpx] transition-all duration-200',
    actionIcon: 'size-[30rpx]',
    actionText: 'text-[26rpx] font-medium',
  },
  variants: {
    size: {
      sm: {
        colorBar: 'gap-[10rpx]',
        colorSwatch: 'size-[46rpx]',
        colorSwatchInner: 'size-[30rpx]',
        toolbar: 'gap-[12rpx]',
        action: 'h-[56rpx] min-w-[108rpx] px-[20rpx]',
        actionIcon: 'size-[26rpx]',
        actionText: 'text-[24rpx]',
      },
      md: {},
      lg: {
        colorBar: 'gap-[14rpx]',
        colorSwatch: 'size-[58rpx]',
        colorSwatchInner: 'size-[38rpx]',
        toolbar: 'gap-[20rpx]',
        action: 'h-[72rpx] min-w-[148rpx] px-[28rpx]',
        actionIcon: 'size-[34rpx]',
        actionText: 'text-[28rpx]',
      },
    },
    color: {
      primary: {
        board: 'focus-within:ring-primary',
        action: 'bg-primary/10 text-primary',
      },
      secondary: {
        board: 'focus-within:ring-secondary',
        action: 'bg-secondary/10 text-secondary',
      },
      success: {
        board: 'focus-within:ring-success',
        action: 'bg-success/10 text-success',
      },
      info: {
        board: 'focus-within:ring-info',
        action: 'bg-info/10 text-info',
      },
      warning: {
        board: 'focus-within:ring-warning',
        action: 'bg-warning/10 text-warning',
      },
      error: {
        board: 'focus-within:ring-error',
        action: 'bg-error/10 text-error',
      },
      neutral: {
        board: 'focus-within:ring-neutral',
        action: 'bg-gray-2 text-gray-7',
      },
    },
    disabled: {
      true: {
        root: 'opacity-50',
        board: 'bg-gray-2',
        colorSwatch: 'opacity-60',
        action: 'opacity-60',
      },
    },
    readonly: {
      true: {
        board: 'bg-gray-1',
      },
    },
    error: {
      true: {
        board: 'ring-error',
      },
    },
    toolbarPosition: {
      bottom: {
        root: 'flex-col',
        board: 'w-full',
        toolbar: 'flex-row flex-wrap items-center justify-end',
      },
      left: {
        root: 'flex-row-reverse items-stretch',
        board: 'w-auto flex-1',
        toolbar: 'w-[92rpx] shrink-0 flex-col flex-nowrap items-stretch justify-center gap-[8rpx]',
        action: 'h-[44rpx] w-full min-w-0 gap-[2rpx] px-[4rpx]',
        actionIcon: 'size-[20rpx]',
        actionText: 'text-[20rpx]',
      },
      right: {
        root: 'flex-row items-stretch',
        board: 'w-auto flex-1',
        toolbar: 'w-[92rpx] shrink-0 flex-col flex-nowrap items-stretch justify-center gap-[8rpx]',
        action: 'h-[44rpx] w-full min-w-0 gap-[2rpx] px-[4rpx]',
        actionIcon: 'size-[20rpx]',
        actionText: 'text-[20rpx]',
      },
    },
  },
  defaultVariants: {
    size: 'md' as SignatureSize,
    color: 'primary' as SignatureColor,
    toolbarPosition: 'bottom' as SignatureToolbarPosition,
  },
} as const

export default config
