import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns a YYYY-MM-DD string using local timezone (avoids UTC drift). */
export function getLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Validates a CSS color value (hex, rgb, rgba, hsl, hsla, named). */
export function isValidCSSColor(color: string): boolean {
  if (!color || typeof color !== "string") return false
  return /^(#[0-9a-f]{3,8}|rgb(a)?\([^)]*\)|hsl(a)?\([^)]*\)|[a-z]+)$/i.test(color)
}

/** Formats a duration in seconds as "Xh Ym" or "Ym". */
export function formatDuration(seconds: number): string {
  const hrs  = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
}
