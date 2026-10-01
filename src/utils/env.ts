export function isTouch(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.maxTouchPoints > 0 || 'ontouchstart' in window
}
