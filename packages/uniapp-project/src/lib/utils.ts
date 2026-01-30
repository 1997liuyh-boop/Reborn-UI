import { type ClassValue, clsx } from 'clsx'
import { create } from '@weapp-tailwindcss/merge-v3'

// @ts-ignore
const isH5 = process.env.UNI_PLATFORM === 'h5'
const { twMerge } = create({
  escape: !isH5,
  unescape: !isH5,
  // @ts-ignore
  extend: {
    classGroups: {
      'font-size': [{ text: ['20', '22', '24', '26', '28', '30', '32', '36', '40', '48', '52'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
