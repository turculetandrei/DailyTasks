import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import confetti from 'canvas-confetti'
import type { Task } from '../../types'
import { CATEGORY_META, PRIORITY_META } from '../../types'
import { isOverdue, isDueToday, prettyDate } from '../../utils/date'
import TaskCard from './TaskCard'
import { useCursor } from '../../context/CursorContext'

type Section = 'Overdue' | 'Today' | 'Upcoming' | 'No date'

function sectionOf(t: Task): Section {
  if (isOverdue(t.dueDate, t.done)) return 'Overdue'
  if (isDueToday(t.dueDate)) return 'Today'
  if (t.dueDate) return 'Upcoming'
  return 'No date'
}

const SECTION_ORDER: Section[] = ['Overdue', 'Today', 'Upcoming', 'No date']

interface Props {
  tasks: Task[]
  query: string
  isMobile: boolean
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onInlineSave: (id: string, title: string) => void
  onReorder: (ordered: Task[]) => void
}

export default function TaskList({
  tasks,
  query,
  isMobile,
  onToggle,
  onEdit,
  onDelete,
  onInlineSave,
  onReorder,
}: Props) {
  const reduce = useReducedMotion()
  const { setMode } = useCursor()
  const [activeId, setActiveId] = useState<string | null>(null)
  const firstEmpty = useRef(true)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const q = query.trim().toLowerCase()

  const grouped = useMemo(() => {
    const map: Record<Section, Task[]> = { Overdue: [], Today: [], Upcoming: [], 'No date': [] }
    for (const t of tasks) map[sectionOf(t)].push(t)
    return map
  }, [tasks])

  const isEmpty = tasks.length === 0

  // Confetti when reaching empty state for the first time this session
  useEffect(() => {
    if (isEmpty && firstEmpty.current) {
      firstEmpty.current = false
      if (!reduce) {
        confetti({ particleCount: 120, spread: 80, colors: ['#C8F135', '#ffffff', '#090909'], origin: { y: 0.6 } })
      }
    }
    if (!isEmpty) firstEmpty.current = true
  }, [isEmpty, reduce])

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
    setMode('drag')
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    setMode('default')
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = tasks.findIndex((t) => t.id === active.id)
    const newIndex = tasks.findIndex((t) => t.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(arrayMove(tasks, oldIndex, newIndex))
  }

  if (isEmpty) {
    return (
      <div className="relative grid min-h-[60vh] place-items-center">
        <span className="pointer-events-none absolute select-none font-podium text-[14vw] font-800 uppercase tracking-tight text-warm opacity-[0.04]">
          All Clear
        </span>
        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          <CheckCircle size={48} className="animate-float text-acid" />
          <p className="text-sm text-muted">Nothing to do.</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null)
        setMode('default')
      }}
    >
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-6 pb-24">
          {SECTION_ORDER.map((section) => {
            const items = grouped[section]
            if (items.length === 0) return null
            return (
              <div key={section} className="flex flex-col gap-2">
                <motion.h3
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                    section === 'Overdue' ? 'animate-overdue-blink text-urgent' : 'text-muted'
                  }`}
                  style={section === 'Overdue' ? { animationIterationCount: 'infinite', animationDuration: '3s' } : undefined}
                >
                  {section} · {items.length}
                </motion.h3>
                <AnimatePresence mode="popLayout">
                  {items.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      isMobile={isMobile}
                      dimmed={q.length > 0 && !t.title.toLowerCase().includes(q)}
                      onToggle={onToggle}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onInlineSave={onInlineSave}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeTask && (
          <div
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface px-4 py-3"
            style={{ transform: 'scale(1.05) rotate(-2deg)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
          >
            <span className="h-6 w-6 shrink-0 rounded-full border-[1.5px] border-acid/40" />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm text-warm">{activeTask.title}</span>
              <div className="mt-1 flex items-center gap-2 text-[11px]">
                <span style={{ color: PRIORITY_META[activeTask.priority].color }}>
                  {PRIORITY_META[activeTask.priority].label}
                </span>
                <span className="flex items-center gap-1 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_META[activeTask.category].color }} />
                  {prettyDate(activeTask.dueDate)}
                </span>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
