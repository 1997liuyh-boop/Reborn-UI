import { type ClassValue, clsx } from 'clsx'
import { create } from '@weapp-tailwindcss/merge-v3'

// @ts-ignore
const isH5 = process.env.UNI_PLATFORM === 'h5'
const { twMerge } = create({
  escape: !isH5,
  unescape: !isH5,
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
