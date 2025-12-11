import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AppView = 'reminders' | 'journal' | 'stats'

interface WindowSize {
  width: number
  height: number
}

interface WindowSizeState {
  sizes: Record<AppView, WindowSize>
  setSize: (view: AppView, size: WindowSize) => void
  getSize: (view: AppView) => WindowSize
}

export const useWindowSizeStore = create<WindowSizeState>()(
  persist(
    (set, get) => ({
      sizes: {
        reminders: { width: 350, height: 600 },
        journal: { width: 1000, height: 700 },
        stats: { width: 900, height: 700 }
      },
      setSize: (view, size) => {
        set((state) => ({
          sizes: { ...state.sizes, [view]: { width: size.width, height: size.height } }
        }))
      },
      getSize: (view) => {
        const s = get().sizes[view]
        return { width: s.width, height: s.height }
      }
    }),
    {
      name: 'window-sizes'
    }
  )
)
