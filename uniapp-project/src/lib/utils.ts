import { type ClassValue, clsx } from 'clsx'
import { twMerge } from '@weapp-tailwindcss/merge-v3'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
