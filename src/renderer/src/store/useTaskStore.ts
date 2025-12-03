import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Task {
  _id?: string
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
  isLoading: boolean
  
  fetchTasks: () => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'enabled'>) => Promise<void>
  removeTask: (id: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  
  setAlwaysOnTop: (value: boolean) => void
  setTtsEnabled: (value: boolean) => void
  setSoundSettings: (settings: SoundSettings) => void
  setThemeSettings: (settings: ThemeSettings) => void
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isAlwaysOnTop: false,
      ttsEnabled: false,
      soundSettings: {
        type: 'default',
        customSoundUrl: null,
        customSoundName: null
      },
      themeSettings: {
        mode: 'dark',
        primaryColor: 'default'
      },
      isLoading: false,

      fetchTasks: async () => {
        set({ isLoading: true })
        try {
          const dbTasks = await window.api.getTasks()
          
          // Migration Logic: If DB is empty but we have tasks in local storage (hydrated by persist),
          // save them to DB.
          const localTasks = get().tasks
          if (dbTasks.length === 0 && localTasks.length > 0) {
            console.log('Migrating tasks from localStorage to DB...', localTasks)
            for (const task of localTasks) {
              // Ensure we don't duplicate if something is weird, but DB is empty so it's fine
              // We might need to strip _id if it exists from previous DB usage, 
              // but local tasks usually just have 'id'
              const taskToSave = { ...task }
              // If it has an _id from a previous NeDB instance that was saved to localstorage, 
              // we might want to remove it to let new DB assign one, or keep it. 
              // NeDB treats _id as primary key.
              await window.api.createTask(taskToSave)
            }
            // After migration, the tasks are now in DB. 
            // We don't need to set tasks because they are already in state (localTasks),
            // but to be safe and get any DB-generated fields:
            const refreshedDbTasks = await window.api.getTasks()
            set({ tasks: refreshedDbTasks as Task[], isLoading: false })
          } else {
             // Normal case: Sync state with DB
             set({ tasks: dbTasks as Task[], isLoading: false })
          }
        } catch (error) {
          console.error('Failed to fetch tasks:', error)
          set({ isLoading: false })
        }
      },

      addTask: async (taskData) => {
        const newTask = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          enabled: true
        }
        
        // Optimistic update
        set((state) => ({ tasks: [newTask, ...state.tasks] }))

        try {
          await window.api.createTask(newTask)
          // Re-fetch to get the true DB state (like _id) if needed, or just trust optimistic
          await get().fetchTasks() 
        } catch (error) {
          console.error('Failed to add task:', error)
          // Rollback
          set((state) => ({ tasks: state.tasks.filter(t => t.id !== newTask.id) }))
        }
      },

      removeTask: async (id) => {
        // Store previous state for rollback
        const previousTasks = get().tasks
        
        // Optimistic update
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))

        try {
          // Try to find the _id from the task list first, as NeDB uses _id
          const task = previousTasks.find(t => t.id === id)
          const dbId = task?._id || id 
          
          // If we can't find the _id (maybe legacy data), we might fail to delete from DB if we use `id`
          // But our setup in DBService uses `_id`. 
          // Let's try to delete by whatever ID we have.
          // NOTE: DatabaseService.deleteTask uses `_id`. 
          // If we inserted with a custom `id` field, NeDB still generates `_id`.
          // We should query by `id` if we want to use our UUID, or `_id` if we use NeDB's.
          // For simplicity, let's assume we might need to delete by our UUID `id` if `_id` is missing, 
          // BUT DatabaseService currently expects `_id`.
          // Let's update DatabaseService to be more flexible or just use _id.
          
          // Actually, let's rely on `fetchTasks` to give us `_id` populated tasks.
          await window.api.deleteTask(dbId)
        } catch (error) {
          console.error('Failed to remove task:', error)
          set({ tasks: previousTasks })
        }
      },

      toggleTask: async (id) => {
        const previousTasks = get().tasks
        const task = previousTasks.find(t => t.id === id)
        if (!task) return

        const newEnabled = !task.enabled

        // Optimistic
        set((state) => ({
          tasks: state.tasks.map((t) => 
            t.id === id ? { ...t, enabled: newEnabled } : t
          )
        }))

        try {
          const dbId = task._id || id
          await window.api.updateTask(dbId, { enabled: newEnabled })
        } catch (error) {
          console.error('Failed to toggle task:', error)
          set({ tasks: previousTasks })
        }
      },

      setAlwaysOnTop: (value) => set({ isAlwaysOnTop: value }),
      setTtsEnabled: (value) => set({ ttsEnabled: value }),
      setSoundSettings: (settings) => set({ soundSettings: settings }),
      setThemeSettings: (settings) => set({ themeSettings: settings }),
    }),
    {
      name: 'k-line-waker-storage',
      partialize: (state) => ({ 
        // Only persist settings locally, tasks are now in DB
        // We can still persist tasks locally for offline/faster load if we want, 
        // but let's rely on DB for the "truth" as requested.
        // However, keeping them here avoids flash of empty content.
        // Let's keep everything persisted for now for best UX.
        tasks: state.tasks, 
        isAlwaysOnTop: state.isAlwaysOnTop,
        ttsEnabled: state.ttsEnabled,
        soundSettings: state.soundSettings,
        themeSettings: state.themeSettings
      }),
    }
  )
)
