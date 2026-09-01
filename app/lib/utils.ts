import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

export const twMergeConfig = {
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            (value: string) => !Number.isNaN(Number(value)),
            (value: string) => value.startsWith("caption-"),
            (value: string) => value.startsWith("body-"),
            (value: string) => value.startsWith("title-"),
          ],
        },
      ],
      // 自定义水平内边距令牌（typography.css 的 --spacing-input-px-*）纳入 px 冲突组：
      // 否则 px-input-px-md 与后写的 px-0 会共存，由 CSS 源序决定胜负而非类名顺序
      px: [
        {
          px: [(value: string) => value.startsWith("input-px-")],
        },
      ],
    },
  },
};

const customTwMerge = extendTailwindMerge(twMergeConfig);

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}

export type ObjectValues<T> = T[keyof T];
