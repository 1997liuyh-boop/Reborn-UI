import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

export const twMergeConfig = {
  extend: {
    theme: {
      // 组件尺寸令牌统一纳入间距体系，沿用宽高、size 和间距的原生冲突规则。
      spacing: [(value: string) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(value)],
    },
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
    },
  },
};

const customTwMerge = extendTailwindMerge(twMergeConfig);

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}

export type ObjectValues<T> = T[keyof T];
