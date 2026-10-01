import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Flame, Info, X } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import type { ToastItem } from '../types'

const BORDER: Record<ToastItem['type'], string> = {
  success: 'rgba(76,217,123,0.5)',
  error: 'rgba(255,77,77,0.5)',
  info: 'rgba(91,141,246,0.5)',
  streak: 'rgba(200,241,53,0.6)',
}

const ICON: Record<ToastItem['type'], typeof Info> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
  streak: Flame,
}

const ICON_COLOR: Record<ToastItem['type'], string> = {
  success: '#4CD97B',
  error: '#FF4D4D',
  info: '#5B8DF6',
  streak: '#C8F135',
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToast()
  const reduce = useReducedMotion()

  return (
    <div className="fixed bottom-0 right-0 z-[9997] flex flex-col gap-2 p-4">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICON[t.type]
          return (
            <motion.div
              key={t.id}
              layout
              initial={reduce ? { opacity: 0 } : { x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { x: 60, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-72 overflow-hidden rounded-xl border bg-surface px-4 py-3 backdrop-blur-sm"
              style={{ borderColor: BORDER[t.type] }}
              data-cursor="hover"
            >
              <div className="flex items-start gap-3">
                <Icon size={18} style={{ color: ICON_COLOR[t.type] }} className="mt-0.5 shrink-0" />
                <p className="flex-1 text-sm text-warm">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-muted transition-colors hover:text-warm"
                  data-cursor="hover"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-acid"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3.5, ease: 'linear' }}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
