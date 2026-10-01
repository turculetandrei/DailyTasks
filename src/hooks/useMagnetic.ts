import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'
import { isTouch } from '../utils/env'

interface MagneticOptions {
  strength?: number
  radius?: number
}

export function useMagnetic({ strength = 0.35, radius = 60 }: MagneticOptions = {}) {
  const ref = useRef<HTMLElement | null>(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 150, damping: 15 })
  const y = useSpring(rawY, { stiffness: 150, damping: 15 })

  useEffect(() => {
    if (isTouch()) return
    const el = ref.current
    if (!el) return

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      if (dist < radius + Math.max(rect.width, rect.height) / 2) {
        rawX.set(dx * strength)
        rawY.set(dy * strength)
      } else {
        rawX.set(0)
        rawY.set(0)
      }
    }
    const handleLeave = () => {
      rawX.set(0)
      rawY.set(0)
    }

    window.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [radius, strength, rawX, rawY])

  return { ref, x, y }
}
