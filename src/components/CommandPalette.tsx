import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, BarChart3, CalendarDays, CheckSquare, Plus, Trash2 } from 'lucide-react'
import type { Task, ViewKey } from '../types'

interface Command {
  id: string
  label: string
  hint: string
  icon: typeof Plus
  run: () => void
}

interface Props {
  open: boolean
  onClose: () => void
  tasks: Task[]
  onCreate: (text: string) => void
  onToggle: (id: string) => void
  onGoto: (v: ViewKey) => void
  onClearCompleted: () => void
}

export default function CommandPalette({ open, onClose, tasks, onCreate, onToggle, onGoto, onClearCompleted }: Props) {
  const reduce = useReducedMotion()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = []
    const trimmed = q.trim()
    if (trimmed) {
      list.push({
        id: 'new',
        label: `New task: "${trimmed}"`,
        hint: '↵ create',
        icon: Plus,
        run: () => {
          onCreate(trimmed)
          onClose()
        },
      })
    }
    const matches = tasks
      .filter((t) => (trimmed ? t.title.toLowerCase().includes(trimmed.toLowerCase()) : !t.done))
      .slice(0, 5)
    for (const t of matches) {
      list.push({
        id: `task-${t.id}`,
        label: `${t.done ? 'Mark undone' : 'Complete'}: ${t.title}`,
        hint: '↵ toggle',
        icon: CheckSquare,
        run: () => {
          onToggle(t.id)
          onClose()
        },
      })
    }
    list.push({
      id: 'goto-today',
      label: 'Go to Today',
      hint: '↵ open',
      icon: CalendarDays,
      run: () => {
        onGoto('today')
        onClose()
      },
    })
    list.push({
      id: 'goto-stats',
      label: 'Go to Stats',
      hint: '↵ open',
      icon: BarChart3,
      run: () => {
        onGoto('stats')
        onClose()
      },
    })
    list.push({
      id: 'clear',
      label: 'Clear completed tasks',
      hint: '↵ run',
      icon: Trash2,
      run: () => {
        onClearCompleted()
        onClose()
      },
    })
    return list
  }, [q, tasks, onCreate, onToggle, onGoto, onClearCompleted, onClose])

  useEffect(() => {
    if (active >= commands.length) setActive(Math.max(0, commands.length - 1))
  }, [commands.length, active])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % commands.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + commands.length) % commands.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commands[active]?.run()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9100] flex items-start justify-center p-4 pt-[12vh]"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.08]"
            style={{ background: 'rgba(15,15,15,0.97)' }}
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a command or search…"
              data-cursor="text"
              className="w-full border-b border-white/10 bg-transparent px-5 py-4 font-podium text-lg text-warm outline-none placeholder:text-muted"
            />
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {commands.map((cmd, i) => {
                const Icon = cmd.icon
                const isActive = i === active
                return (
                  <button
                    key={cmd.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={cmd.run}
                    data-cursor="hover"
                    className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
                    style={{ background: isActive ? '#1A1A1A' : 'transparent' }}
                  >
                    {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-acid" />}
                    <Icon size={15} className={isActive ? 'text-acid' : 'text-muted'} />
                    <span className="flex-1 truncate text-warm">{cmd.label}</span>
                    <span className="flex items-center gap-1 text-[10px] text-muted">
                      {cmd.hint}
                      <ArrowRight size={11} />
                    </span>
                  </button>
                )
              })}
              {commands.length === 0 && <p className="px-3 py-4 text-sm text-muted">No results.</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
