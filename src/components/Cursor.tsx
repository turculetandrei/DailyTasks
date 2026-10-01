import { useEffect, useRef, useState } from 'react'
import { CURSOR_EVENT, type CursorMode } from '../context/CursorContext'
import { isTouch } from '../utils/env'

const EASE = 'transform 200ms cubic-bezier(0.23,1,0.32,1), width 200ms cubic-bezier(0.23,1,0.32,1), height 200ms cubic-bezier(0.23,1,0.32,1), opacity 200ms cubic-bezier(0.23,1,0.32,1), background 200ms ease, border 200ms ease'

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: -100, y: -100 })
  const ring = useRef({ x: -100, y: -100 })
  const [mode, setMode] = useState<CursorMode>('default')
  const [clicking, setClicking] = useState(false)
  const [enabled] = useState(() => !isTouch())

  useEffect(() => {
    if (!enabled) return
    document.body.setAttribute('data-custom-cursor', 'true')

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
      }
    }

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-cursor]') as HTMLElement | null
      if (target) {
        const value = target.getAttribute('data-cursor')
        if (value === 'text') setMode('text')
        else setMode('hover')
      } else {
        setMode((m) => (m === 'drag' ? m : 'default'))
      }
    }

    const onDown = () => setClicking(true)
    const onUp = () => setClicking(false)

    const onModeEvent = (e: Event) => {
      const detail = (e as CustomEvent<CursorMode>).detail
      setMode(detail)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    window.addEventListener(CURSOR_EVENT, onModeEvent)

    let raf = 0
    const loop = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.1
      ring.current.y += (mouse.current.y - ring.current.y) * 0.1
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener(CURSOR_EVENT, onModeEvent)
      document.body.removeAttribute('data-custom-cursor')
    }
  }, [enabled])

  if (!enabled) return null

  // Ring geometry per mode
  let ringW = 36
  let ringH = 36
  let ringOpacity = 1
  let ringBg = 'transparent'
  let ringBorder = '1.5px solid rgba(200,241,53,0.5)'
  let dotScale = clicking ? 2 : 1
  let radius = '9999px'

  if (mode === 'hover') {
    ringW = 56
    ringH = 56
    ringOpacity = 0.8
    dotScale = 0
  } else if (mode === 'drag') {
    ringW = 20
    ringH = 20
    ringBg = 'rgba(200,241,53,0.2)'
    ringBorder = '1.5px solid rgba(200,241,53,0.6)'
  } else if (mode === 'text') {
    ringW = 3
    ringH = 28
    radius = '2px'
    ringBorder = '1.5px solid rgba(200,241,53,0.6)'
  }

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '9999px',
          background: '#C8F135',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-100px,-100px)',
          transition: `transform ${clicking ? '80ms' : '200ms'} cubic-bezier(0.23,1,0.32,1), scale 200ms cubic-bezier(0.23,1,0.32,1)`,
          scale: String(dotScale),
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: ringW,
          height: ringH,
          borderRadius: radius,
          border: ringBorder,
          background: ringBg,
          mixBlendMode: 'difference',
          opacity: ringOpacity,
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-100px,-100px)',
          transition: EASE,
        }}
      />
    </>
  )
}
