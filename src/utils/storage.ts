import type { Prefs, StreakState, Task } from '../types'

const TASKS_KEY = 'daily_tasks_v2'
const STREAK_KEY = 'daily_streak_v2'
const PREFS_KEY = 'daily_prefs_v2'

export const DEFAULT_PREFS: Prefs = {
  defaultView: 'today',
  defaultCategory: 'personal',
  soundEnabled: false,
}

export const DEFAULT_STREAK: StreakState = {
  streak: 0,
  lastCompletedDate: null,
  lastStreakDate: null,
  dailyHistory: {},
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as T
    if (parsed == null || typeof parsed !== 'object') return fallback
    return parsed
  } catch {
    return fallback
  }
}

export function loadTasks(): Task[] {
  const data = safeParse<Task[]>(localStorage.getItem(TASKS_KEY), [])
  if (!Array.isArray(data)) return []
  // basic validation / normalization
  return data
    .filter((t) => t && typeof t.id === 'string' && typeof t.title === 'string')
    .map((t, i) => ({
      order: typeof t.order === 'number' ? t.order : i,
      recurring: t.recurring ?? null,
      notes: t.notes ?? '',
      completedAt: t.completedAt ?? null,
      createdAt: t.createdAt ?? new Date().toISOString(),
      dueDate: t.dueDate ?? null,
      done: Boolean(t.done),
      category: t.category ?? 'personal',
      priority: t.priority ?? 'medium',
      id: t.id,
      title: t.title,
    }))
}

export function loadStreak(): StreakState {
  const s = safeParse<StreakState>(localStorage.getItem(STREAK_KEY), DEFAULT_STREAK)
  return {
    ...DEFAULT_STREAK,
    ...s,
    dailyHistory: s.dailyHistory ?? {},
  }
}

export function loadPrefs(): Prefs {
  return { ...DEFAULT_PREFS, ...safeParse<Prefs>(localStorage.getItem(PREFS_KEY), DEFAULT_PREFS) }
}

function makeDebouncedWriter<T>(key: string, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (value: T) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        /* storage full or unavailable */
      }
    }, delay)
  }
}

export const saveTasks = makeDebouncedWriter<Task[]>(TASKS_KEY)
export const saveStreak = makeDebouncedWriter<StreakState>(STREAK_KEY)
export const savePrefs = makeDebouncedWriter<Prefs>(PREFS_KEY)
