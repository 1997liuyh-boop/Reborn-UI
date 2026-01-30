// @ts-ignore
import type { TV } from "tailwind-variants";
import { create } from '@weapp-tailwindcss/variants-v3'

// @ts-ignore
const isH5 = process.env.UNI_PLATFORM === 'h5'

const { tv: createTV } = create({
  // @ts-ignore
  escape: !isH5,
  // @ts-ignore
  unescape: !isH5,
})

const textSizeKeys = ['20', '22', '24', '26', '28', '30', '32', '36', '40', '48', '52']

const twMergeConfig = {
  extend: {
    classGroups: {
      'font-size': [{ text: textSizeKeys }],
    },
  },
} as const

export const tv: TV = (options, config) =>
  createTV(options, {
    ...config,
    twMerge: config?.twMerge ?? true,
    twMergeConfig: {
      ...config?.twMergeConfig,
      ...twMergeConfig,
    },
  });
