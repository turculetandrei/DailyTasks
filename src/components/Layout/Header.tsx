import { forwardRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import MagneticButton from '../MagneticButton'
import type { Category, SortKey, ViewKey } from '../../types'

const VIEW_TITLE: Record<ViewKey, string> = {
  today: 'Today',
  upcoming: 'Upcoming',
  all: 'All Tasks',
  stats: 'Statistics',
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'manual', label: 'Manual' },
  { key: 'priority', label: 'Priority' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'created', label: 'Recently added' },
  { key: 'alpha', label: 'Alphabetical' },
]

const FILTERS: { key: 'all' | Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'personal', label: 'Personal' },
  { key: 'work', label: 'Work' },
  { key: 'health', label: 'Health' },
  { key: 'study', label: 'Study' },
]

function ProgressRing({ percent }: { percent: number }) {
  const reduce = useReducedMotion()
  const r = 13
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="relative grid h-8 w-8 place-items-center" title={`${percent}% done today`}>
      <svg width={32} height={32} className="-rotate-90">
        <circle cx={16} cy={16} r={r} stroke="#1A1A1A" strokeWidth={3} fill="none" />
        <motion.circle
          cx={16}
          cy={16}
          r={r}
          stroke="#C8F135"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-[8px] font-semibold text-warm">{percent}</span>
    </div>
  )
}

interface Props {
  view: ViewKey
  query: string
  setQuery: (q: string) => void
  filter: 'all' | Category
  setFilter: (f: 'all' | Category) => void
  sort: SortKey
  setSort: (s: SortKey) => void
  completion: number
}

const Header = forwardRef<HTMLInputElement, Props>(function Header(
  { view, query, setQuery, filter, setFilter, sort, setSort, completion },
  searchRef,
) {
  const reduce = useReducedMotion()
  const [focused, setFocused] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const showFilters = view !== 'stats'

  return (
    <header
      className="z-20 flex h-16 shrink-0 items-center gap-4 border-b border-white/[0.05] px-6"
      style={{ background: 'rgba(9,9,9,0.9)', backdropFilter: 'blur(8px)' }}
    >
      <AnimatePresence mode="wait">
        <motion.h2
          key={view}
          initial={reduce ? false : { y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: -8, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-w-[120px] font-podium text-xl font-700 text-warm"
        >
          {VIEW_TITLE[view]}
        </motion.h2>
      </AnimatePresence>

      {/* Search */}
      <motion.div
        className="relative flex h-9 items-center gap-2 rounded-full border bg-surface px-4"
        animate={{
          borderColor: focused ? '#C8F135' : 'rgba(255,255,255,0.07)',
          boxShadow: focused ? '0 0 0 3px rgba(200,241,53,0.12)' : '0 0 0 0px rgba(200,241,53,0)',
        }}
        transition={{ duration: 0.2 }}
      >
        <Search size={14} className="text-muted" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search tasks…"
          data-cursor="text"
          className="w-40 bg-transparent text-sm text-warm outline-none placeholder:text-muted md:w-52"
        />
        {!focused && !query && (
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-muted">⌘K</kbd>
        )}
      </motion.div>

      {/* Filter pills */}
      {showFilters && (
        <div className="hidden items-center gap-1.5 lg:flex">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <MagneticButton
                key={f.key}
                radius={40}
                strength={0.2}
                onClick={() => setFilter(f.key)}
                className="relative rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{ color: active ? '#090909' : 'rgba(240,238,230,0.55)' }}
              >
                {active && (
                  <motion.span
                    layoutId="pill-bg"
                    className="absolute inset-0 rounded-full bg-acid"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </MagneticButton>
            )
          })}
        </div>
      )}

      <div className="ml-auto flex items-center gap-4">
        {/* Sort dropdown */}
        {showFilters && (
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:text-warm"
              data-cursor="hover"
            >
              {SORTS.find((s) => s.key === sort)?.label}
              <ChevronDown size={13} className={sortOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                  <motion.div
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.15 }}
                    style={{ transformOrigin: 'top right' }}
                    className="absolute right-0 z-40 mt-2 w-40 overflow-hidden rounded-xl border border-white/[0.08] bg-surface p-1 shadow-2xl"
                  >
                    {SORTS.map((s, i) => (
                      <motion.button
                        key={s.key}
                        initial={reduce ? false : { opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => {
                          setSort(s.key)
                          setSortOpen(false)
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-surface-hover"
                        style={{ color: sort === s.key ? '#C8F135' : 'rgba(240,238,230,0.7)' }}
                        data-cursor="hover"
                      >
                        {s.label}
                        {sort === s.key && <span className="h-1.5 w-1.5 rounded-full bg-acid" />}
                      </motion.button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        <ProgressRing percent={completion} />
      </div>
    </header>
  )
})

export default Header
