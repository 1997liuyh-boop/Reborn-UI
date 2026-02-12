
import type { TV } from "tailwind-variants";

// #ifdef MP-WEIXIN
// @ts-ignore
import { create } from '@weapp-tailwindcss/variants-v3'
// #endif

// #ifndef MP-WEIXIN
import { tv as originTv } from "tailwind-variants";
// #endif


const textSizeKeys = ['20', '22', '24', '26', '28', '30', '32', '36', '40', '48', '52']

const twMergeConfig = {
  extend: {
    classGroups: {
      'font-size': [{ text: textSizeKeys }],
    },
  },
}

// #ifdef MP-WEIXIN

// @ts-ignore
const isH5 = process.env.UNI_PLATFORM === 'h5'

const { tv: createTV } = create({
  // @ts-ignore
  escape: !isH5,
  // @ts-ignore
  unescape: !isH5,
})

// @ts-ignore
export const tv: TV = (options, config) =>
  // @ts-ignore
  createTV(options, {
    ...config,
    twMerge: config?.twMerge ?? true,
    twMergeConfig: {
      ...config?.twMergeConfig,
      ...twMergeConfig,
    },
  });

// #endif


// #ifndef MP-WEIXIN
// @ts-ignore
export const tv: TV = (options, config) =>
  originTv(options, {
    ...config,
    twMerge: config?.twMerge ?? true,
    twMergeConfig: {
      ...config?.twMergeConfig,
      ...twMergeConfig,
    },
  });

// #endif
