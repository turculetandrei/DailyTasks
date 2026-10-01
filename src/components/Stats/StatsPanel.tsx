import { useEffect, useMemo, useState } from 'react'
import { animate, motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Flame, ListTodo, Target } from 'lucide-react'
import type { StreakState, Task } from '../../types'
import { CATEGORY_META, type Category } from '../../types'
import { use3DTilt } from '../../hooks/use3DTilt'
import { ISO_DAY } from '../../utils/date'
import { format, isToday, subDays } from 'date-fns'

function useCountUp(value: number, duration = 1) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? value : 0)
  useEffect(() => {
    if (reduce) {
      setN(value)
      return
    }
    const c = animate(0, value, { duration, ease: [0.23, 1, 0.32, 1], onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [value, duration, reduce])
  return n
}

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  index,
}: {
  icon: typeof Target
  label: string
  value: number
  suffix?: string
  index: number
}) {
  const tilt = use3DTilt({ max: 12 })
  const reduce = useReducedMotion()
  const display = useCountUp(value)
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
    >
      <div
        ref={tilt.ref}
        {...tilt.handlers}
        style={tilt.style}
        data-cursor="hover"
        className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-surface p-5 transition-shadow hover:animate-pulse-glow"
      >
        <div style={tilt.glareStyle} />
        <Icon size={18} className="text-acid" />
        <div className="mt-3 font-podium text-4xl font-800 text-warm">
          {display}
          {suffix}
        </div>
        <div className="mt-1 text-xs text-muted">{label}</div>
      </div>
    </motion.div>
  )
}

function CompletionRing({ percent }: { percent: number }) {
  const reduce = useReducedMotion()
  const display = useCountUp(percent, 1.5)
  const r = 70
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="relative grid h-[160px] w-[160px] place-items-center">
      <svg width={160} height={160} className="-rotate-90">
        <circle cx={80} cy={80} r={r} stroke="#1A1A1A" strokeWidth={10} fill="none" />
        <motion.circle
          cx={80}
          cy={80}
          r={r}
          stroke="#C8F135"
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-podium text-4xl font-800 text-warm">{display}%</div>
        <div className="text-[10px] uppercase tracking-widest text-muted">complete</div>
      </div>
    </div>
  )
}

interface Props {
  tasks: Task[]
  streak: StreakState
}

export default function StatsPanel({ tasks, streak }: Props) {
  const reduce = useReducedMotion()
  const total = tasks.length
  const done = tasks.filter((t) => t.done).length
  const completion = total === 0 ? 0 : Math.round((done / total) * 100)
  const tasksToday = useMemo(
    () => tasks.filter((t) => t.done && t.completedAt && isToday(new Date(t.completedAt))).length,
    [tasks],
  )

  const score = Math.min(100, Math.round(streak.streak * 2 + completion * 0.5 + tasksToday * 3))
  const scoreColor = score < 40 ? '#FF4D4D' : score <= 70 ? '#FF8C42' : '#C8F135'

  const categoryStats = useMemo(() => {
    const cats: Category[] = ['personal', 'work', 'health', 'study']
    return cats.map((c) => {
      const inCat = tasks.filter((t) => t.category === c)
      const pct = inCat.length === 0 ? 0 : Math.round((inCat.filter((t) => t.done).length / inCat.length) * 100)
      return { c, pct, count: inCat.length }
    })
  }, [tasks])

  const heatmap = useMemo(() => {
    const cells: { key: string; count: number }[] = []
    for (let i = 27; i >= 0; i--) {
      const key = format(subDays(new Date(), i), ISO_DAY)
      cells.push({ key, count: streak.dailyHistory[key] ?? 0 })
    }
    return cells
  }, [streak.dailyHistory])

  const scoreDisplay = useCountUp(score, 1.2)

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={ListTodo} label="Total tasks" value={total} index={0} />
        <MetricCard icon={CheckCircle2} label="Completed" value={done} index={1} />
        <MetricCard icon={Flame} label="Day streak" value={streak.streak} index={2} />
        <MetricCard icon={Target} label="Done today" value={tasksToday} index={3} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Completion ring */}
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.06] bg-surface p-8">
          <CompletionRing percent={completion} />
          <p className="text-xs text-muted">
            {done} of {total} tasks done
          </p>
        </div>

        {/* Category bars */}
        <div className="flex flex-col justify-center gap-4 rounded-2xl border border-white/[0.06] bg-surface p-8">
          <h4 className="font-podium text-sm font-700 text-warm">By category</h4>
          {categoryStats.map(({ c, pct, count }, i) => (
            <div key={c}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-warm">
                  <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[c].color }} />
                  {CATEGORY_META[c].label}
                  <span className="text-muted">({count})</span>
                </span>
                <span className="text-muted">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: CATEGORY_META[c].color }}
                  initial={reduce ? false : { width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Heatmap */}
        <div className="rounded-2xl border border-white/[0.06] bg-surface p-8">
          <h4 className="mb-4 font-podium text-sm font-700 text-warm">Last 28 days</h4>
          <div className="grid w-fit grid-flow-col grid-rows-7 gap-1">
            {heatmap.map((cell, i) => {
              const level = cell.count === 0 ? '#1A1A1A' : cell.count < 3 ? 'rgba(200,241,53,0.3)' : '#C8F135'
              return (
                <motion.div
                  key={cell.key}
                  className="h-3 w-3 rounded-sm"
                  style={{ background: level }}
                  initial={reduce ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.015, type: 'spring', stiffness: 300, damping: 20 }}
                  whileHover={{ scale: 1.4 }}
                  title={`${cell.key}: ${cell.count} done`}
                />
              )
            })}
          </div>
        </div>

        {/* Productivity score */}
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-surface p-8">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Productivity score</span>
          <div className="font-podium text-7xl font-800" style={{ color: scoreColor }}>
            {scoreDisplay}
          </div>
          <p className="text-xs text-muted">
            {score > 70 ? 'On fire 🔥' : score >= 40 ? 'Keep going' : 'Just getting started'}
          </p>
        </div>
      </div>
    </div>
  )
}
