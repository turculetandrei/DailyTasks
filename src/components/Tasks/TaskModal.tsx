import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Calendar as CalIcon, X } from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
} from 'date-fns'
import {
  CATEGORY_META,
  PRIORITY_META,
  type Category,
  type Priority,
  type Recurring,
  type Task,
} from '../../types'
import { ISO_DAY } from '../../utils/date'
import { use3DTilt } from '../../hooks/use3DTilt'
import MagneticButton from '../MagneticButton'
import type { NewTaskInput } from '../../hooks/useTasks'

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']
const CATEGORIES: Category[] = ['personal', 'work', 'health', 'study']
const RECUR: Recurring[] = [null, 'daily', 'weekly', 'monthly']
const MAX_TITLE = 80

interface Props {
  open: boolean
  initial?: Task | null
  prefill?: string
  defaultCategory: Category
  onClose: () => void
  onSave: (input: NewTaskInput, id?: string) => void
}

function MiniCalendar({ value, onPick }: { value: string | null; onPick: (iso: string) => void }) {
  const reduce = useReducedMotion()
  const [month, setMonth] = useState(() => (value ? new Date(value) : new Date()))
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-2 rounded-lg border border-white/[0.08] bg-surface p-3"
    >
      <div className="mb-2 flex items-center justify-between text-xs text-warm">
        <button onClick={() => setMonth((m) => subMonths(m, 1))} data-cursor="hover" className="px-2 text-muted hover:text-warm">
          ‹
        </button>
        <span className="font-medium">{format(month, 'MMMM yyyy')}</span>
        <button onClick={() => setMonth((m) => addMonths(m, 1))} data-cursor="hover" className="px-2 text-muted hover:text-warm">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-muted">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const iso = format(d, ISO_DAY)
          const selected = value && isSameDay(d, new Date(value))
          const inMonth = isSameMonth(d, month)
          return (
            <button
              key={iso}
              onClick={() => onPick(iso)}
              data-cursor="hover"
              className="grid h-7 place-items-center rounded-md text-[11px] transition-colors"
              style={{
                background: selected ? '#C8F135' : 'transparent',
                color: selected ? '#090909' : inMonth ? '#F0EEE6' : 'rgba(240,238,230,0.25)',
              }}
            >
              {format(d, 'd')}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function TaskModal({ open, initial, prefill, defaultCategory, onClose, onSave }: Props) {
  const reduce = useReducedMotion()
  const tilt = use3DTilt({ max: 6 })
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [category, setCategory] = useState<Category>(defaultCategory)
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [recurring, setRecurring] = useState<Recurring>(null)
  const [notes, setNotes] = useState('')
  const [calOpen, setCalOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setTitle(initial.title)
      setPriority(initial.priority)
      setCategory(initial.category)
      setDueDate(initial.dueDate)
      setRecurring(initial.recurring)
      setNotes(initial.notes)
    } else {
      setTitle(prefill ?? '')
      setPriority('medium')
      setCategory(defaultCategory)
      setDueDate(null)
      setRecurring(null)
      setNotes('')
    }
    setCalOpen(false)
    setSaved(false)
  }, [open, initial, prefill, defaultCategory])

  const handleSave = () => {
    if (!title.trim()) return
    setSaved(true)
    onSave(
      { title: title.slice(0, MAX_TITLE), priority, category, dueDate, recurring, notes },
      initial?.id,
    )
    setTimeout(onClose, 180)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9000] grid place-items-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            ref={tilt.ref}
            {...tilt.handlers}
            onClick={(e) => e.stopPropagation()}
            style={tilt.style}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.93, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0, ...(saved && !reduce ? {} : {}) }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08]"
          >
            <div style={tilt.glareStyle} />
            <div className="relative rounded-2xl p-6" style={{ background: 'rgba(15,15,15,0.97)' }}>
              {/* Top accent */}
              <motion.div
                className="absolute left-0 top-0 h-0.5"
                style={{ background: 'linear-gradient(90deg,#C8F135,transparent)' }}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5 }}
              />

              <div className="flex items-start justify-between">
                <h3 className="font-podium text-lg font-700 text-warm">
                  {initial ? 'Edit task' : 'New task'}
                </h3>
                <button onClick={onClose} data-cursor="hover" className="text-muted hover:text-warm" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              {/* Title */}
              <div className="relative mt-4">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
                  }}
                  placeholder="What needs doing?"
                  data-cursor="text"
                  className="w-full border-b border-white/10 bg-transparent pb-2 font-podium text-2xl text-warm outline-none transition-colors placeholder:text-muted focus:border-acid"
                />
                <span className="absolute right-0 top-1 text-[10px] text-muted">
                  {title.length}/{MAX_TITLE}
                </span>
              </div>

              {/* Priority */}
              <Label>Priority</Label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => {
                  const active = priority === p
                  const c = PRIORITY_META[p].color
                  return (
                    <MagneticButton
                      key={p}
                      radius={36}
                      strength={0.2}
                      onClick={() => setPriority(p)}
                      animate={{ scale: active ? 1.06 : 1 }}
                      className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        background: active ? `${c}22` : '#1A1A1A',
                        color: active ? c : 'rgba(240,238,230,0.55)',
                        boxShadow: active ? `0 0 12px ${c}44` : 'none',
                      }}
                    >
                      {PRIORITY_META[p].label}
                    </MagneticButton>
                  )
                })}
              </div>

              {/* Category */}
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cKey) => {
                  const active = category === cKey
                  const meta = CATEGORY_META[cKey]
                  return (
                    <button
                      key={cKey}
                      onClick={() => setCategory(cKey)}
                      data-cursor="hover"
                      className="relative flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{ color: active ? '#F0EEE6' : 'rgba(240,238,230,0.55)' }}
                    >
                      {active && (
                        <motion.span layoutId="cat-bg" className="absolute inset-0 rounded-full bg-surface-hover" />
                      )}
                      <span className="relative z-10 h-2 w-2 rounded-full" style={{ background: meta.color }} />
                      <span className="relative z-10">{meta.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Due date */}
              <Label>Due date</Label>
              <button
                onClick={() => setCalOpen((o) => !o)}
                data-cursor="hover"
                className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-surface-hover px-3 py-2 text-sm text-warm"
              >
                <CalIcon size={14} className="text-acid" />
                {dueDate ? format(new Date(dueDate), 'EEE, MMM d') : 'Pick a date'}
                {dueDate && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      setDueDate(null)
                    }}
                    className="ml-1 text-muted hover:text-urgent"
                  >
                    <X size={12} />
                  </span>
                )}
              </button>
              <AnimatePresence>
                {calOpen && (
                  <MiniCalendar
                    value={dueDate}
                    onPick={(iso) => {
                      setDueDate(iso)
                      setCalOpen(false)
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Recurring */}
              <Label>Repeat</Label>
              <div className="flex gap-1 rounded-lg bg-surface-hover p-1">
                {RECUR.map((r) => {
                  const active = recurring === r
                  const label = r ? r[0].toUpperCase() + r.slice(1) : 'None'
                  return (
                    <button
                      key={String(r)}
                      onClick={() => setRecurring(r)}
                      data-cursor="hover"
                      className="relative flex-1 rounded-md px-2 py-1.5 text-xs font-medium"
                      style={{ color: active ? '#090909' : 'rgba(240,238,230,0.55)' }}
                    >
                      {active && <motion.span layoutId="recur-bg" className="absolute inset-0 rounded-md bg-acid" />}
                      <span className="relative z-10">{label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Notes */}
              <Label>Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optional details…"
                data-cursor="text"
                className="w-full resize-none rounded-lg border border-white/[0.06] bg-surface-hover p-3 text-sm text-warm outline-none transition-shadow placeholder:text-muted focus:shadow-[0_0_0_3px_rgba(200,241,53,0.12)]"
              />

              {/* Footer */}
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  data-cursor="hover"
                  className="rounded-lg px-4 py-2 text-sm text-muted transition-colors hover:text-urgent"
                >
                  Cancel
                </button>
                <MagneticButton
                  onClick={handleSave}
                  whileTap={reduce ? undefined : { scale: 0.95, y: 2 }}
                  animate={saved ? { backgroundColor: '#ffffff' } : { backgroundColor: '#C8F135' }}
                  className="btn-shimmer rounded-lg px-5 py-2 text-sm font-semibold"
                  style={{ color: '#090909' }}
                  disabled={!title.trim()}
                >
                  {initial ? 'Save changes' : 'Create task'}
                </MagneticButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 mt-5 text-[10px] uppercase tracking-[0.2em] text-muted">{children}</p>
}
