import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { nanoid } from 'nanoid'
import confetti from 'canvas-confetti'
import ToastContainer from './components/Toast'
import Sidebar, { MobileNav } from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import TaskList from './components/Tasks/TaskList'
import TaskModal from './components/Tasks/TaskModal'
import StatsPanel from './components/Stats/StatsPanel'
import CommandPalette from './components/CommandPalette'
import ShortcutsPanel from './components/ShortcutsPanel'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastContext } from './context/ToastContext'
import { CursorContext, dispatchMode } from './context/CursorContext'
import { useTasks, type NewTaskInput } from './hooks/useTasks'
import { useIsMobile } from './hooks/useMediaQuery'
import { sound } from './utils/sound'
import {
  PRIORITY_RANK,
  type Category,
  type SortKey,
  type Task,
  type ToastItem,
  type ViewKey,
} from './types'
import { isDueToday, isOverdue, parseDay } from './utils/date'
import { isAfter, startOfDay } from 'date-fns'

const Background3D = lazy(() => import('./components/Background3D'))

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260606_154941_df1a96e1-a06f-450c-bd02-d863414cc1a0.mp4'

export default function App() {
  const api = useTasks()
  const reduce = useReducedMotion()
  const isMobile = useIsMobile()

  const [view, setView] = useState<ViewKey>(api.prefs.defaultView)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | Category>('all')
  const [sort, setSort] = useState<SortKey>('manual')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [prefill, setPrefill] = useState<string>('')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  /* ---------- Toasts ---------- */
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])
  const push = useCallback(
    (type: ToastItem['type'], message: string) => {
      const id = nanoid()
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => dismiss(id), 3500)
    },
    [dismiss],
  )
  const toastCtx = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss])
  const cursorCtx = useMemo(() => ({ setMode: dispatchMode }), [])

  /* ---------- Streak celebration ---------- */
  useEffect(() => {
    api.onAllTodayDone.current = () => {
      if (!reduce) {
        confetti({ particleCount: 120, spread: 80, colors: ['#C8F135', '#ffffff', '#090909'], origin: { y: 0.6 } })
      }
      push('streak', 'All done for today — streak extended! 🔥')
      if (api.prefs.soundEnabled) sound.streakUp()
    }
  }, [api.onAllTodayDone, api.prefs.soundEnabled, push, reduce])

  /* ---------- Task actions (with sound) ---------- */
  const handleToggle = useCallback(
    (id: string) => {
      const t = api.tasks.find((x) => x.id === id)
      if (api.prefs.soundEnabled && t && !t.done) sound.taskComplete()
      api.toggleTask(id)
    },
    [api],
  )

  const handleDelete = useCallback(
    (id: string) => {
      if (api.prefs.soundEnabled) sound.taskDelete()
      api.deleteTask(id)
      push('info', 'Task deleted')
    },
    [api, push],
  )

  const openNew = useCallback(
    (text = '') => {
      setEditing(null)
      setPrefill(text)
      setModalOpen(true)
      if (api.prefs.soundEnabled) sound.modalOpen()
    },
    [api.prefs.soundEnabled],
  )

  const openEdit = useCallback((task: Task) => {
    setEditing(task)
    setPrefill('')
    setModalOpen(true)
  }, [])

  const handleSave = useCallback(
    (input: NewTaskInput, id?: string) => {
      if (id) {
        api.updateTask(id, input)
        push('success', 'Task updated')
      } else {
        api.addTask(input)
        push('success', 'Task created')
      }
    },
    [api, push],
  )

  /* ---------- Derived task lists ---------- */
  const viewTasks = useMemo(() => {
    let list = api.tasks
    if (view === 'today') {
      list = list.filter((t) => isDueToday(t.dueDate) || isOverdue(t.dueDate, t.done))
    } else if (view === 'upcoming') {
      list = list.filter((t) => t.dueDate && isAfter(parseDay(t.dueDate), startOfDay(new Date())))
    }
    if (filter !== 'all') list = list.filter((t) => t.category === filter)

    const sorted = [...list]
    switch (sort) {
      case 'priority':
        sorted.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
        break
      case 'dueDate':
        sorted.sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
        break
      case 'created':
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        break
      case 'alpha':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        sorted.sort((a, b) => a.order - b.order)
    }
    if (sort === 'manual' || sort === 'priority') {
      sorted.sort((a, b) => Number(a.done) - Number(b.done))
    }
    return sorted
  }, [api.tasks, view, filter, sort])

  const completion = useMemo(() => {
    if (api.todaysTasks.length === 0) return 0
    return Math.round((api.todaysTasks.filter((t) => t.done).length / api.todaysTasks.length) * 100)
  }, [api.todaysTasks])

  /* ---------- Keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      if (e.key === 'Escape') {
        setModalOpen(false)
        setPaletteOpen(false)
        setShortcutsOpen(false)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
        return
      }
      if (typing || modalOpen || paletteOpen) return

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        openNew()
      } else if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === '?') {
        setShortcutsOpen((o) => !o)
      } else if (e.key === '1') setView('today')
      else if (e.key === '2') setView('upcoming')
      else if (e.key === '3') setView('all')
      else if (e.key === '4') setView('stats')
      else if (e.key.toLowerCase() === 'd') {
        const first = viewTasks.find((t) => !t.done)
        if (first) handleToggle(first.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, paletteOpen, openNew, viewTasks, handleToggle])

  return (
    <ToastContext.Provider value={toastCtx}>
      <CursorContext.Provider value={cursorCtx}>
        {/* VANGUARD cinematic background — looping video, darkened for legibility */}
        <div className="fixed inset-0 z-0">
          <video
            className="h-full w-full object-cover"
            src={VIDEO_URL}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-base/90 via-base/80 to-base/95" />
          <div className="absolute inset-0 bg-base/40" />
        </div>

        {/* DAILY motion — floating 3D shapes over the video */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-0 mix-blend-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1.2 }}
        >
          <ErrorBoundary silent>
            <Suspense fallback={null}>
              <Background3D embedded />
            </Suspense>
          </ErrorBoundary>
        </motion.div>

        <div className="grain-overlay" />
        <div className="scanline-overlay" />

        <div className="relative z-10 flex h-screen overflow-hidden">
          {!isMobile && (
            <motion.div
              initial={reduce ? false : { x: -260 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 120, damping: 20 }}
            >
              <Sidebar
                view={view}
                setView={setView}
                onAddTask={() => openNew()}
                streak={api.streak}
                soundEnabled={api.prefs.soundEnabled}
                toggleSound={() => api.updatePrefs({ soundEnabled: !api.prefs.soundEnabled })}
              />
            </motion.div>
          )}

          <div className="flex flex-1 flex-col overflow-hidden">
            <motion.div
              initial={reduce ? false : { y: -60 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 150, damping: 25 }}
            >
              <Header
                ref={searchRef}
                view={view}
                query={query}
                setQuery={setQuery}
                filter={filter}
                setFilter={setFilter}
                sort={sort}
                setSort={setSort}
                completion={completion}
              />
            </motion.div>

            <main className="flex-1 overflow-y-auto px-6 py-6">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mx-auto max-w-3xl"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={view}
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    {view === 'stats' ? (
                      <StatsPanel tasks={api.tasks} streak={api.streak} />
                    ) : (
                      <TaskList
                        tasks={viewTasks}
                        query={query}
                        isMobile={isMobile}
                        onToggle={handleToggle}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onInlineSave={(id, title) => api.updateTask(id, { title })}
                        onReorder={api.reorderTasks}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </main>
          </div>

          {isMobile && <MobileNav view={view} setView={setView} onAddTask={() => openNew()} />}
        </div>

        <TaskModal
          open={modalOpen}
          initial={editing}
          prefill={prefill}
          defaultCategory={api.prefs.defaultCategory}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          tasks={api.tasks}
          onCreate={(text) => openNew(text)}
          onToggle={handleToggle}
          onGoto={setView}
          onClearCompleted={() => {
            api.clearCompleted()
            push('info', 'Cleared completed tasks')
          }}
        />
        <ShortcutsPanel open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

        <ToastContainer />
      </CursorContext.Provider>
    </ToastContext.Provider>
  )
}
