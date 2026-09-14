import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Копия host `app/lib/utils.ts`: те же классы — то же слияние.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
