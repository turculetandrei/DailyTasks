import { memo, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertCircle, GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { Task } from '../../types'
import { CATEGORY_META, PRIORITY_META } from '../../types'
import { isOverdue, prettyDate } from '../../utils/date'
import { use3DTilt } from '../../hooks/use3DTilt'

const cardVariants: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: -60, scale: 0.93, filter: 'blur(4px)' },
}

const PARTICLES = Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2)

interface Props {
  task: Task
  dimmed?: boolean
  isMobile: boolean
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onInlineSave: (id: string, title: string) => void
}

function Checkbox({ done, onToggle }: { done: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion()
  return (
    <motion.button
      onClick={onToggle}
      className="relative grid h-6 w-6 shrink-0 place-items-center rounded-full"
      whileHover={reduce ? undefined : { scale: 1.1 }}
      data-cursor="hover"
      aria-label={done ? 'Mark not done' : 'Mark done'}
    >
      <motion.span
        className="absolute inset-0 rounded-full border-[1.5px]"
        animate={{
          borderColor: done ? '#C8F135' : 'rgba(255,255,255,0.2)',
          backgroundColor: done ? '#C8F135' : 'rgba(0,0,0,0)',
          scale: done && !reduce ? [0.8, 1.3, 1] : 1,
        }}
        transition={{ duration: 0.4, times: [0, 0.5, 1] }}
        style={{ clipPath: done ? 'circle(150% at 50% 50%)' : 'circle(50% at 50% 50%)' }}
      />
      <svg viewBox="0 0 24 24" className="relative h-3.5 w-3.5" fill="none">
        <motion.path
          d="M5 12.5l4 4 10-10"
          stroke="#090909"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: done ? 0.15 : 0 }}
        />
      </svg>
    </motion.button>
  )
}

function TaskCardInner({ task, dimmed, isMobile, onToggle, onEdit, onDelete, onInlineSave }: Props) {
  const reduce = useReducedMotion()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const tilt = use3DTilt({ max: 12 })
  const [hovered, setHovered] = useState(false)
  const [burst, setBurst] = useState(0)
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(task.title)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const overdue = isOverdue(task.dueDate, task.done)
  const prio = PRIORITY_META[task.priority]
  const cat = CATEGORY_META[task.category]

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const handleToggle = () => {
    if (!task.done) setBurst((b) => b + 1)
    onToggle(task.id)
  }

  const startPress = () => {
    pressTimer.current = setTimeout(() => {
      setDraftTitle(task.title)
      setEditing(true)
    }, 500)
  }
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

  const commitInline = () => {
    if (draftTitle.trim()) onInlineSave(task.id, draftTitle.trim())
    setEditing(false)
  }

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={sortableStyle}
      layout
      variants={reduce ? undefined : cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      drag={isMobile ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.6, right: 0 }}
      onDragEnd={(_, info) => {
        if (isMobile && info.offset.x < -120) onDelete(task.id)
      }}
    >
      <div
        ref={tilt.ref}
        {...tilt.handlers}
        style={{ ...tilt.style, opacity: dimmed ? 0.2 : task.done ? 0.45 : 1, filter: dimmed ? 'blur(1px)' : undefined }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false)
          cancelPress()
        }}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        data-cursor="hover"
        className="shimmer-sweep group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 backdrop-blur-sm"
      >
        <div style={tilt.glareStyle} />
        {/* overdue left border */}
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-0.5"
          style={{ background: overdue ? '#FF4D4D' : 'transparent' }}
        />
        <span
          className="pointer-events-none absolute inset-0 -z-10 rounded-xl border"
          style={{
            background: 'rgba(17,17,17,0.8)',
            borderColor: overdue ? 'rgba(255,77,77,0.3)' : 'rgba(255,255,255,0.06)',
          }}
        />

        {/* Drag handle (desktop) */}
        {!isMobile && (
          <AnimatePresence>
            {hovered && !editing && (
              <motion.button
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="cursor-grab text-muted active:cursor-grabbing"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
              >
                <GripVertical size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        )}

        <Checkbox done={task.done} onToggle={handleToggle} />

        {/* particle burst */}
        <AnimatePresence>
          {burst > 0 && !reduce && (
            <span key={burst} className="pointer-events-none absolute left-[34px] top-1/2 -z-0">
              {PARTICLES.map((angle, i) => (
                <motion.span
                  key={i}
                  className="absolute h-1 w-1 rounded-full bg-acid"
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: Math.cos(angle) * 24,
                    y: Math.sin(angle) * 24 - 20,
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  onAnimationComplete={() => i === 0 && setBurst(0)}
                />
              ))}
            </span>
          )}
        </AnimatePresence>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitInline}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitInline()
                if (e.key === 'Escape') setEditing(false)
              }}
              data-cursor="text"
              className="w-full border-b border-acid bg-transparent text-sm text-warm outline-none"
            />
          ) : (
            <div className="relative inline-block max-w-full">
              <span className={`block truncate text-sm ${task.done ? 'text-muted' : 'text-warm'}`}>
                {task.title}
              </span>
              {task.done && (
                <motion.span
                  className="absolute left-0 top-1/2 h-px w-full bg-muted"
                  initial={reduce ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  style={{ originX: 0 }}
                  transition={{ duration: 0.25 }}
                />
              )}
            </div>
          )}

          <div className="mt-1 flex items-center gap-2 text-[11px]">
            {!task.done && (
              <span
                className="rounded-full px-1.5 py-0.5 font-medium"
                style={{ background: `${prio.color}1A`, color: prio.color, boxShadow: `0 0 8px ${prio.color}22` }}
              >
                {prio.label}
              </span>
            )}
            <span className="flex items-center gap-1 text-muted">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
              {cat.label}
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-1" style={{ color: overdue ? '#FF4D4D' : 'rgba(240,238,230,0.4)' }}>
                {overdue && <AlertCircle size={11} />}
                {prettyDate(task.dueDate)}
              </span>
            )}
            {task.recurring && <span className="text-acid/60">↻ {task.recurring}</span>}
          </div>
        </div>

        {/* Hover actions */}
        <AnimatePresence>
          {hovered && !editing && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="flex items-center gap-1"
            >
              <button
                onClick={() => onEdit(task)}
                className="grid h-7 w-7 place-items-center rounded-md bg-surface-hover text-muted transition-colors hover:text-warm"
                data-cursor="hover"
                aria-label="Edit"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="grid h-7 w-7 place-items-center rounded-md bg-surface-hover text-muted transition-colors hover:text-urgent"
                data-cursor="hover"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const TaskCard = memo(TaskCardInner)
export default TaskCard
