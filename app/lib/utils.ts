import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

export const twMergeConfig = {
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            (value: string) => !isNaN(Number(value)),
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
