import { create } from 'zustand'
import { TradeLog, CreateTradeLogDTO } from '../types/journal'

interface JournalState {
  logs: TradeLog[]
  isLoading: boolean
  error: string | null
  
  fetchLogs: () => Promise<void>
  addLog: (log: CreateTradeLogDTO) => Promise<void>
  deleteLog: (id: string) => Promise<void>
  getLogImage: (filename: string) => Promise<string>
}

export const useJournalStore = create<JournalState>((set, get) => ({
  logs: [],
  isLoading: false,
  error: null,

  fetchLogs: async () => {
    set({ isLoading: true, error: null })
    try {
      const logs = await window.api.getJournalLogs()
      // Map _id to id if needed, though NeDB uses _id by default
      const formattedLogs = logs.map(log => ({
        ...log,
        id: log._id || log.id
      }))
      set({ logs: formattedLogs, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      set({ error: 'Failed to fetch logs', isLoading: false })
    }
  },

  addLog: async (logData) => {
    set({ isLoading: true, error: null })
    try {
      const newLog = await window.api.createJournalLog(logData)
      set((state) => ({
        logs: [{ ...newLog, id: newLog._id || newLog.id }, ...state.logs],
        isLoading: false
      }))
    } catch (error) {
      console.error('Failed to add log:', error)
      set({ error: 'Failed to add log', isLoading: false })
      throw error
    }
  },

  deleteLog: async (id) => {
    try {
      await window.api.deleteJournalLog(id)
      set((state) => ({
        logs: state.logs.filter((log) => log.id !== id && log._id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete log:', error)
      // Optimistic update failure handling could go here
      throw error
    }
  },

  getLogImage: async (filename) => {
    return await window.api.getJournalImage(filename)
  }
}))
