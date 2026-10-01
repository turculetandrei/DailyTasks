import { createContext, useContext } from 'react'

export type CursorMode = 'default' | 'hover' | 'drag' | 'text'

interface CursorCtx {
  setMode: (mode: CursorMode) => void
}

export const CURSOR_EVENT = 'daily:cursor-mode'

function dispatchMode(mode: CursorMode) {
  window.dispatchEvent(new CustomEvent<CursorMode>(CURSOR_EVENT, { detail: mode }))
}

export const CursorContext = createContext<CursorCtx>({ setMode: dispatchMode })

export function useCursor(): CursorCtx {
  return useContext(CursorContext)
}

export { dispatchMode }
