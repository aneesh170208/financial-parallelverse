import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const numberFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function compactValue(value: number): string {
  const absolute = Math.abs(value)
  if (absolute >= 10_000_000) {
    return `${trimDecimal(absolute / 10_000_000)}Cr`
  }
  if (absolute >= 100_000) {
    return `${trimDecimal(absolute / 100_000)}L`
  }
  if (absolute >= 1_000) {
    return `${trimDecimal(absolute / 1_000)}k`
  }
  return numberFormatter.format(absolute)
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}

interface CurrencyOptions {
  compact?: boolean
  decimals?: boolean
  sign?: boolean
}

export function formatCurrency(value: number, options: CurrencyOptions = {}): string {
  const { compact = false, decimals = false, sign = false } = options
  const safeValue = Number.isFinite(value) ? value : 0
  const prefix = safeValue < 0 ? '−' : sign && safeValue > 0 ? '+' : ''
  const body = compact
    ? compactValue(safeValue)
    : decimals
      ? decimalFormatter.format(Math.abs(safeValue))
      : numberFormatter.format(Math.abs(safeValue))
  return `${prefix}₹${body}`
}

export function formatNumber(value: number, decimals = 0): string {
  const safeValue = Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(safeValue)
}

export function formatPercent(value: number, decimals = 0): string {
  const safe = Number.isFinite(value) ? value : 0
  return `${trimTo(safe, decimals)}%`
}

function trimTo(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(new RegExp(`\\.${'0'.repeat(decimals)}$`), '')
}

export function parseDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`)
  }
  return new Date(value)
}

export function formatDate(
  value: string | Date,
  style: 'short' | 'medium' | 'long' | 'monthYear' = 'medium',
): string {
  const date = typeof value === 'string' ? parseDate(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { day: 'numeric', month: 'short' }
      : style === 'long'
        ? { day: 'numeric', month: 'long', year: 'numeric' }
        : style === 'monthYear'
          ? { month: 'long', year: 'numeric' }
          : { day: 'numeric', month: 'short', year: 'numeric' }
  return new Intl.DateTimeFormat('en-IN', options).format(date)
}

export function formatDueDate(value: string): string {
  const date = parseDate(value)
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const days = Math.round((startOfDate.getTime() - startOfToday.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return formatDate(value, 'short')
}

export function relativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, duration] of units) {
    if (Math.abs(seconds) >= duration || unit === 'minute') {
      return formatter.format(Math.round(seconds / duration), unit)
    }
  }
  return 'Just now'
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function clamped(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function toDateInput(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(value: Date, days: number): Date {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

export function addMonths(value: Date, months: number): Date {
  const date = new Date(value)
  date.setMonth(date.getMonth() + months)
  return date
}

export function sentenceCase(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function dueLabel(status: string, days: number): string {
  if (status === 'overdue') {
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
  }
  if (status === 'completed') return 'Complete'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (status === 'due_soon') return `Due in ${days} days`
  return `Due in ${days} days`
}

export function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function daysInFuture(dateString: string): number {
  const target = parseDate(dateString)
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}
