import { useCallback, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

interface TiltOptions {
  max?: number // max degrees
}

export function use3DTilt({ max = 16 }: TiltOptions = {}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduce = useReducedMotion()
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.4s ease',
  })
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'transparent',
    transition: 'opacity 0.3s ease',
    opacity: 0,
  })

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduce) return
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const offsetY = e.clientY - rect.top
      const rotateX = (offsetY / rect.height - 0.5) * -max
      const rotateY = (offsetX / rect.width - 0.5) * max
      setStyle({
        transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease',
        willChange: 'transform',
      })
      setGlareStyle({
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(circle at ${offsetX}px ${offsetY}px, rgba(200,241,53,0.12), transparent 60%)`,
        transition: 'opacity 0.2s ease',
        opacity: 1,
      })
    },
    [max, reduce],
  )

  const onMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)',
      transformStyle: 'preserve-3d',
      transition: 'transform 0.4s ease',
    })
    setGlareStyle((s) => ({ ...s, opacity: 0 }))
  }, [])

  return { ref, style, glareStyle, handlers: { onMouseMove, onMouseLeave } }
}
