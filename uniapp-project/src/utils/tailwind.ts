import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type { ClassValue };

export const parseClass = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const parsePt = <T extends Record<string, any>>(value?: T): T =>
  (value ?? ({} as T));
