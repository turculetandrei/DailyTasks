export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Category = 'personal' | 'work' | 'health' | 'study'
export type Recurring = null | 'daily' | 'weekly' | 'monthly'
export type ViewKey = 'today' | 'upcoming' | 'all' | 'stats'
export type SortKey = 'manual' | 'priority' | 'dueDate' | 'created' | 'alpha'

export interface Task {
  id: string
  title: string
  priority: Priority
  category: Category
  dueDate: string | null // ISO date string (yyyy-MM-dd)
  recurring: Recurring
  notes: string
  done: boolean
  completedAt: string | null // ISO datetime
  createdAt: string // ISO datetime
  order: number
}

export interface StreakState {
  streak: number
  lastCompletedDate: string | null // yyyy-MM-dd
  lastStreakDate: string | null // yyyy-MM-dd
  dailyHistory: Record<string, number> // yyyy-MM-dd -> tasks done
}

export interface Prefs {
  defaultView: ViewKey
  defaultCategory: Category
  soundEnabled: boolean
}

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info' | 'streak'
  message: string
}

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string }
> = {
  low: { label: 'Low', color: '#5B8DF6' },
  medium: { label: 'Medium', color: '#C8F135' },
  high: { label: 'High', color: '#FF8C42' },
  urgent: { label: 'Urgent', color: '#FF4D4D' },
}

export const PRIORITY_RANK: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string }
> = {
  personal: { label: 'Personal', color: '#F0EEE6' },
  work: { label: 'Work', color: '#5B8DF6' },
  health: { label: 'Health', color: '#4CD97B' },
  study: { label: 'Study', color: '#C8F135' },
}
