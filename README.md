# DAILY

A dark, maximalist-motion daily task app. **React + Vite + TypeScript + Tailwind**, localStorage only, no backend.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
npm run preview  # preview the build
```

## Features

- **Motion everywhere** — Framer Motion page orchestration, animated checkbox/strikethrough/particles, shared-layout pills & nav indicator.
- **Custom cursor** — acid dot (instant) + lerped ring with hover / drag / text states (auto-disabled on touch).
- **Three.js background** — 80 instanced icosahedrons (30 on mobile) with mouse parallax, single draw call per material.
- **3D tilt + magnetic buttons** — on task cards, stat cards, the streak widget, and all primary buttons.
- **Drag & drop** reordering (`@dnd-kit`) with a floating drag overlay; swipe-to-delete on mobile.
- **Views** — Today / Upcoming / All / Stats, with category filter pills and sort dropdown.
- **Task modal** — priority & category selectors, inline mini-calendar, recurring segmented control, notes.
- **Stats** — count-up metrics, completion ring, category bars, 28-day heatmap, productivity score.
- **Streak system** — confetti + toast + sound when all of today's tasks are done.
- **Command palette** (`⌘/Ctrl + K`), keyboard shortcuts, and a `?` shortcuts panel.
- **Recurring tasks** auto-respawn on load for the next period.
- **Sound effects** (Web Audio, opt-in via the sidebar speaker toggle).
- **Reduced-motion aware** — all animations gate on `useReducedMotion()`.
- **Lenis** smooth scroll, grain + scanline overlays, custom scrollbar.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `N` | New task |
| `⌘/Ctrl + K` | Command palette |
| `/` | Focus search |
| `1` `2` `3` `4` | Today / Upcoming / All / Stats |
| `D` | Toggle the first open task |
| `?` | Toggle shortcuts panel |
| `Esc` | Close modal / palette / panel |

## localStorage keys

- `daily_tasks_v2` — `Task[]`
- `daily_streak_v2` — streak + daily history
- `daily_prefs_v2` — default view/category, sound flag

All writes are debounced 300 ms; reads are validated with safe fallbacks.

## Notes / spec deviations

- The spec listed `⌘K` for **both** "focus search" and "open command palette." Resolved as: `⌘/Ctrl + K` opens the command palette (itself a search), and `/` focuses the header search field.
- List virtualization (`@tanstack/react-virtual`, only specced for > 100 tasks) is not wired in; the list renders directly with `AnimatePresence`. Drop it in if you expect very large task counts.
- Three.js is lazy-loaded so it lands in a separate chunk and doesn't block first paint.
