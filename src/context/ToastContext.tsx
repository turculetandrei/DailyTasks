import { createContext, useContext } from 'react'
import type { ToastItem } from '../types'

interface ToastCtx {
  toasts: ToastItem[]
  push: (type: ToastItem['type'], message: string) => void
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastCtx>({
  toasts: [],
  push: () => {},
  dismiss: () => {},
})

export function useToast(): ToastCtx {
  return useContext(ToastContext)
}
