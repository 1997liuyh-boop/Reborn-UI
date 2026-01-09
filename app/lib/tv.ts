
import { tv as tvBase } from 'tailwind-variants'
import type { ClassValue } from 'clsx'

// Simple wrapper or re-export. 
// The user code uses `tv({ extend: tv(theme), ... })` which suggests `tv` can take a config.
// tailwind-variants `tv` function accepts a config object.
// We also need to ensure it handles the structure passed to it.

export const tv = tvBase
export type { VariantProps } from 'tailwind-variants'
