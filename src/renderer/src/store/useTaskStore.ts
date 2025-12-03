import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Task {
  id: string
  name: string
  period: number // minutes
  notifyBefore: number // seconds
  enabled: boolean
  createdAt: number
}

export interface SoundSettings {
  type: 'default' | 'custom'
  customSoundUrl: string | null // Base64 data URL
  customSoundName: string | null
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeSettings {
  mode: ThemeMode
  primaryColor: string // 'default' or HSL string
}

interface TaskState {
  tasks: Task[]
  isAlwaysOnTop: boolean
  ttsEnabled: boolean
  soundSettings: SoundSettings
  themeSettings: ThemeSettings
  
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'enabled'>) => void
  removeTask: (id: string) => void
  toggleTask: (id: string) => void
  setAlwaysOnTop: (value: boolean) => void
  setTtsEnabled: (value: boolean) => void
  setSoundSettings: (settings: SoundSettings) => void
  setThemeSettings: (settings: ThemeSettings) => void
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      isAlwaysOnTop: false,
      ttsEnabled: false,
      soundSettings: {
        type: 'default',
        customSoundUrl: null,
        customSoundName: null
      },
      themeSettings: {
        mode: 'dark', // Default to dark as before
        primaryColor: 'default' // Default to standard theme behavior
      },

      addTask: (taskData) => set((state) => ({
        tasks: [
          ...state.tasks,
          {
            ...taskData,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            enabled: true
          }
        ]
      })),

      removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      })),

      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map((t) => 
          t.id === id ? { ...t, enabled: !t.enabled } : t
        )
      })),

      setAlwaysOnTop: (value) => set({ isAlwaysOnTop: value }),
      
      setTtsEnabled: (value) => set({ ttsEnabled: value }),

      setSoundSettings: (settings) => set({ soundSettings: settings }),

      setThemeSettings: (settings) => set({ themeSettings: settings }),
    }),
    {
      name: 'k-line-waker-storage',
    }
  )
)
