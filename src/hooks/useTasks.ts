import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import type { Category, Prefs, Priority, Recurring, StreakState, Task } from '../types'
import {
  loadPrefs,
  loadStreak,
  loadTasks,
  savePrefs,
  saveStreak,
  saveTasks,
} from '../utils/storage'
import { ISO_DAY, nextDueDate, parseDay, todayKey } from '../utils/date'
import { format, isToday, startOfDay, subDays } from 'date-fns'

export interface NewTaskInput {
  title: string
  priority: Priority
  category: Category
  dueDate: string | null
  recurring: Recurring
  notes: string
}

function isPastPeriod(completedAtISO: string | null): boolean {
  if (!completedAtISO) return false
  return !isToday(new Date(completedAtISO))
}

/** Spawn fresh instances for recurring tasks completed in a previous period. */
function processRecurring(tasks: Task[]): { tasks: Task[]; spawned: number } {
  const additions: Task[] = []
  for (const t of tasks) {
    if (t.recurring && t.done && isPastPeriod(t.completedAt)) {
      const alreadySpawned = tasks.some(
        (o) => !o.done && o.title === t.title && o.recurring === t.recurring && o.createdAt > (t.completedAt ?? ''),
      )
      if (alreadySpawned) continue
      additions.push({
        ...t,
        id: nanoid(),
        done: false,
        completedAt: null,
        dueDate: nextDueDate(t.dueDate, t.recurring),
        createdAt: new Date().toISOString(),
        order: 0,
      })
    }
  }
  if (additions.length === 0) return { tasks, spawned: 0 }
  return { tasks: [...additions, ...tasks], spawned: additions.length }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const { tasks: processed } = processRecurring(loadTasks())
    return processed
  })
  const [streak, setStreak] = useState<StreakState>(() => loadStreak())
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs())
  const wasAllDone = useRef(false)

  // Debounced persistence
  useEffect(() => saveTasks(tasks), [tasks])
  useEffect(() => saveStreak(streak), [streak])
  useEffect(() => savePrefs(prefs), [prefs])

  const todaysTasks = useMemo(
    () => tasks.filter((t) => t.dueDate && isToday(parseDay(t.dueDate))),
    [tasks],
  )

  const allTodayDone = useMemo(
    () => todaysTasks.length > 0 && todaysTasks.every((t) => t.done),
    [todaysTasks],
  )

  // Streak handling when all of today's tasks complete
  const onAllTodayDone = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (allTodayDone && !wasAllDone.current) {
      wasAllDone.current = true
      const today = todayKey()
      setStreak((prev) => {
        if (prev.lastStreakDate === today) return prev
        const yesterday = format(subDays(startOfDay(new Date()), 1), ISO_DAY)
        const continues = prev.lastStreakDate === yesterday
        return {
          ...prev,
          streak: continues ? prev.streak + 1 : 1,
          lastStreakDate: today,
          lastCompletedDate: today,
        }
      })
      onAllTodayDone.current?.()
    }
    if (!allTodayDone) wasAllDone.current = false
  }, [allTodayDone])

  // Keep daily history in sync with completed-today count
  useEffect(() => {
    const today = todayKey()
    const doneToday = tasks.filter(
      (t) => t.done && t.completedAt && isToday(new Date(t.completedAt)),
    ).length
    setStreak((prev) => {
      if (prev.dailyHistory[today] === doneToday) return prev
      return { ...prev, dailyHistory: { ...prev.dailyHistory, [today]: doneToday } }
    })
  }, [tasks])

  const addTask = useCallback((input: NewTaskInput) => {
    const task: Task = {
      id: nanoid(),
      title: input.title.trim() || 'Untitled task',
      priority: input.priority,
      category: input.category,
      dueDate: input.dueDate,
      recurring: input.recurring,
      notes: input.notes,
      done: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      order: 0,
    }
    setTasks((prev) => [task, ...prev.map((t) => ({ ...t, order: t.order + 1 }))])
    return task
  }, [])

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const done = !t.done
        return { ...t, done, completedAt: done ? new Date().toISOString() : null }
      }),
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const reorderTasks = useCallback((ordered: Task[]) => {
    setTasks((prev) => {
      const map = new Map(ordered.map((t, i) => [t.id, i]))
      return prev
        .map((t) => (map.has(t.id) ? { ...t, order: map.get(t.id)! } : t))
        .sort((a, b) => a.order - b.order)
    })
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.done || t.recurring))
  }, [])

  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => ({ ...prev, ...patch }))
  }, [])

  return {
    tasks,
    setTasks,
    streak,
    prefs,
    todaysTasks,
    allTodayDone,
    onAllTodayDone,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    reorderTasks,
    clearCompleted,
    updatePrefs,
  }
}

export type TasksApi = ReturnType<typeof useTasks>
