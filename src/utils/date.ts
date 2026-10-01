import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isBefore,
  isToday,
  parseISO,
  startOfDay,
} from 'date-fns'
import type { Recurring } from '../types'

export const ISO_DAY = 'yyyy-MM-dd'

export function todayKey(): string {
  return format(new Date(), ISO_DAY)
}

export function formatDay(iso: string): string {
  return format(parseISO(iso), ISO_DAY)
}

export function parseDay(iso: string): Date {
  return startOfDay(parseISO(iso))
}

export function isOverdue(dueDate: string | null, done: boolean): boolean {
  if (!dueDate || done) return false
  return isBefore(parseDay(dueDate), startOfDay(new Date()))
}

export function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false
  return isToday(parseDay(dueDate))
}

export function nextDueDate(dueDate: string | null, recurring: Recurring): string | null {
  if (!recurring) return null
  const base = dueDate ? parseDay(dueDate) : startOfDay(new Date())
  let next: Date
  switch (recurring) {
    case 'daily':
      next = addDays(base, 1)
      break
    case 'weekly':
      next = addWeeks(base, 1)
      break
    case 'monthly':
      next = addMonths(base, 1)
      break
    default:
      return null
  }
  return format(next, ISO_DAY)
}

export function prettyDate(iso: string | null): string {
  if (!iso) return 'No date'
  const d = parseDay(iso)
  if (isToday(d)) return 'Today'
  return format(d, 'MMM d')
}

export { addDays, addMonths, addWeeks, format, parseISO, startOfDay }
