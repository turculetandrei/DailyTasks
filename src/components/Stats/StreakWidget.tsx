import { useEffect, useMemo, useState } from 'react'
import { animate, motion, useReducedMotion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { use3DTilt } from '../../hooks/use3DTilt'
import type { StreakState } from '../../types'
import { ISO_DAY } from '../../utils/date'
import { format, subDays } from 'date-fns'

function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)
  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration: 1,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, reduce])
  return <>{display}</>
}

export default function StreakWidget({ streak }: { streak: StreakState }) {
  const { ref, style, glareStyle, handlers } = use3DTilt({ max: 12 })
  const reduce = useReducedMotion()

  const last7 = useMemo(() => {
    const days: { key: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const key = format(subDays(new Date(), i), ISO_DAY)
      days.push({ key, count: streak.dailyHistory[key] ?? 0 })
    }
    const max = Math.max(1, ...days.map((d) => d.count))
    return days.map((d) => ({ ...d, ratio: d.count / max }))
  }, [streak.dailyHistory])

  return (
    <div
      ref={ref}
      {...handlers}
      style={style}
      className="relative overflow-hidden rounded-xl border border-acid/15 bg-surface p-4 animate-pulse-glow"
      data-cursor="hover"
    >
      <div style={glareStyle} />
      <div className="flex items-center gap-2">
        <Flame size={20} className="text-acid" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">streak</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-podium text-4xl font-800 leading-none text-warm">
          <CountUp value={streak.streak} />
        </span>
        <span className="text-xs text-muted">day{streak.streak === 1 ? '' : 's'}</span>
      </div>

      <div className="mt-4 flex h-10 items-end gap-1">
        {last7.map((d, i) => (
          <motion.div
            key={d.key}
            className="flex-1 rounded-sm"
            style={{ background: d.count > 0 ? '#C8F135' : '#1A1A1A' }}
            initial={reduce ? false : { height: 2 }}
            animate={{ height: `${Math.max(8, d.ratio * 100)}%` }}
            transition={{ delay: 0.3 + i * 0.05, type: 'spring', stiffness: 200, damping: 18 }}
            title={`${d.count} done`}
          />
        ))}
      </div>
    </div>
  )
}
