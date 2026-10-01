import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  CalendarDays,
  ListChecks,
  Plus,
  Sparkles,
  BarChart3,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { StreakState, ViewKey } from '../../types'
import StreakWidget from '../Stats/StreakWidget'
import MagneticButton from '../MagneticButton'

const NAV: { key: ViewKey; label: string; icon: typeof CalendarDays }[] = [
  { key: 'today', label: 'Today', icon: CalendarDays },
  { key: 'upcoming', label: 'Upcoming', icon: Sparkles },
  { key: 'all', label: 'All Tasks', icon: ListChecks },
  { key: 'stats', label: 'Stats', icon: BarChart3 },
]

const BRAND = 'DAILY'.split('')

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
}

interface Props {
  view: ViewKey
  setView: (v: ViewKey) => void
  onAddTask: () => void
  streak: StreakState
  soundEnabled: boolean
  toggleSound: () => void
}

export default function Sidebar({ view, setView, onAddTask, streak, soundEnabled, toggleSound }: Props) {
  const reduce = useReducedMotion()

  return (
    <aside
      className="flex h-screen w-[260px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-white/[0.06] p-5"
      style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)' }}
    >
      {/* Brand */}
      <div>
        <h1 className="font-podium text-2xl font-800 uppercase tracking-[0.3em] text-warm">
          {BRAND.map((letter, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={reduce ? false : { y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 18 }}
            >
              {letter}
            </motion.span>
          ))}
        </h1>
        <motion.div
          className="mt-2 h-px bg-white/10"
          initial={reduce ? false : { width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        {/* Ticker */}
        <div className="mt-2 overflow-hidden">
          <div className="animate-ticker whitespace-nowrap text-[9px] uppercase tracking-[0.2em] text-acid/25">
            {'FOCUS · EXECUTE · REPEAT · '.repeat(6)}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV.map(({ key, label, icon: Icon }) => {
          const active = view === key
          return (
            <motion.button
              key={key}
              onClick={() => setView(key)}
              whileHover={reduce ? undefined : { x: 6 }}
              className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
              style={{
                background: active ? 'rgba(200,241,53,0.05)' : 'transparent',
                color: active ? '#F0EEE6' : 'rgba(240,238,230,0.55)',
              }}
              data-cursor="hover"
            >
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-acid"
                />
              )}
              <motion.span whileHover={reduce ? undefined : { scale: 1.15 }} className="flex">
                <Icon size={17} />
              </motion.span>
              <span className="font-medium">{label}</span>
            </motion.button>
          )
        })}
      </nav>

      <StreakWidget streak={streak} />

      {/* Add Task */}
      <MagneticButton
        onClick={onAddTask}
        whileHover={reduce ? undefined : { scale: 1.02 }}
        whileTap={reduce ? undefined : { scale: 0.95, y: 1 }}
        className="btn-shimmer flex w-full items-center justify-center gap-2 rounded-xl bg-acid py-3 font-semibold text-base font-sans"
        style={{ color: '#090909' }}
      >
        <Plus size={18} />
        Add task
      </MagneticButton>

      {/* Bottom */}
      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span>v1.0</span>
          <span className="text-white/20">·</span>
          <Clock />
        </div>
        <button
          onClick={toggleSound}
          className="text-muted transition-colors hover:text-acid"
          data-cursor="hover"
          aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </div>
    </aside>
  )
}

export function MobileNav({
  view,
  setView,
  onAddTask,
}: {
  view: ViewKey
  setView: (v: ViewKey) => void
  onAddTask: () => void
}) {
  const items: { key: ViewKey | 'add'; label: string; icon: typeof CalendarDays }[] = [
    { key: 'today', label: 'Today', icon: CalendarDays },
    { key: 'all', label: 'All', icon: ListChecks },
    { key: 'stats', label: 'Stats', icon: BarChart3 },
    { key: 'add', label: 'Add', icon: Plus },
  ]
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-white/[0.06]"
      style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)' }}
    >
      {items.map(({ key, label, icon: Icon }) => {
        const active = key !== 'add' && view === key
        return (
          <button
            key={key}
            onClick={() => (key === 'add' ? onAddTask() : setView(key as ViewKey))}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px]"
            style={{ color: active ? '#C8F135' : 'rgba(240,238,230,0.55)' }}
          >
            <Icon size={20} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
