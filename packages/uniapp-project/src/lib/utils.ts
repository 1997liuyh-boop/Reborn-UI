
import { type ClassValue, clsx } from 'clsx'

// #ifndef MP-WEIXIN
import { extendTailwindMerge } from 'tailwind-merge'
// @ts-ignore
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['20', '22', '24', '26', '28', '30', '32', '36', '40', '48', '52'] }],
    },
  },
})

// #endif

// #ifdef MP-WEIXIN
import { create } from '@weapp-tailwindcss/merge-v3'

// @ts-ignore
const isH5 = process.env.UNI_PLATFORM === 'h5'
// @ts-ignore
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
// #endif

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isArray(value: any): boolean {
  if (typeof Array.isArray === "function") {
    return Array.isArray(value);
  } else {
    return Object.prototype.toString.call(value) === "[object Array]";
  }
}

export function isEmpty(value: any): boolean {
  if (isArray(value)) {
    return value.length === 0;
  }

  if (value instanceof Object) {
    return Object.keys(value).length === 0;
  }

  return value === "" || value === undefined || value === null;
}

export function last<T>(array: T[]): T | null {
  return isArray(array) && array.length > 0 ? array[array.length - 1] : null;
}
