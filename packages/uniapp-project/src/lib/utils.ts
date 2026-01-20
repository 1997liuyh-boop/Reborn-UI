import { type ClassValue, clsx } from 'clsx'
import { twMerge } from '@weapp-tailwindcss/merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
