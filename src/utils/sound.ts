// Tiny Web Audio synth — no external library.
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function ping(freq: number, start: number, duration: number, gainValue: number, type: OscillatorType = 'sine') {
  const audio = getCtx()
  if (!audio) return
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = audio.currentTime + start
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(gainValue, t0 + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

const C5 = 523.25
const E5 = 659.25
const G5 = 783.99
const C6 = 1046.5

export const sound = {
  taskComplete() {
    ping(C5, 0, 0.08, 0.06, 'sine')
    ping(G5, 0.08, 0.08, 0.06, 'sine')
  },
  taskDelete() {
    ping(220, 0, 0.1, 0.04, 'sawtooth')
    ping(160, 0.04, 0.1, 0.04, 'sawtooth')
  },
  modalOpen() {
    ping(1320, 0, 0.05, 0.03, 'sine')
  },
  streakUp() {
    ping(C5, 0, 0.06, 0.05, 'triangle')
    ping(E5, 0.06, 0.06, 0.05, 'triangle')
    ping(G5, 0.12, 0.06, 0.05, 'triangle')
    ping(C6, 0.18, 0.08, 0.05, 'triangle')
  },
}
