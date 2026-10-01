import { AnimatePresence, motion } from 'framer-motion'

const SHORTCUTS: [string, string][] = [
  ['N', 'New task'],
  ['⌘ K', 'Command palette'],
  ['1 – 4', 'Switch views'],
  ['D', 'Toggle done (last task)'],
  ['?', 'Toggle this panel'],
  ['Esc', 'Close modal / palette'],
]

export default function ShortcutsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-[9200]" onClick={onClose} />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-4 left-4 z-[9201] w-64 rounded-xl border border-white/[0.08] bg-surface p-4 backdrop-blur-sm"
          >
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted">Keyboard shortcuts</p>
            <div className="flex flex-col gap-2">
              {SHORTCUTS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-warm">{label}</span>
                  <kbd className="rounded border border-white/10 bg-base px-2 py-0.5 text-[10px] text-muted">{key}</kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
