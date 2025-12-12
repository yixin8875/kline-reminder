import { create } from 'zustand'
import type { Strategy } from '../types/strategy'

interface StrategyState {
  strategies: Strategy[]
  isLoading: boolean
  error: string | null
  fetchStrategies: () => Promise<void>
  addStrategy: (s: { name: string; description: string }) => Promise<void>
  updateStrategy: (id: string, update: Partial<Strategy>) => Promise<void>
  deleteStrategy: (id: string) => Promise<void>
}

export const useStrategyStore = create<StrategyState>((set) => ({
  strategies: [],
  isLoading: false,
  error: null,
  fetchStrategies: async () => {
    set({ isLoading: true, error: null })
    try {
      const list = await window.api.getStrategies()
      const formatted = list.map((s: any) => ({ ...s, id: s._id || s.id }))
      set({ strategies: formatted, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch strategies', isLoading: false })
    }
  },
  addStrategy: async (s) => {
    set({ isLoading: true, error: null })
    try {
      const created = await window.api.createStrategy(s)
      set((state) => ({
        strategies: [{ ...created, id: created._id || created.id }, ...state.strategies],
        isLoading: false
      }))
    } catch (error) {
      set({ error: 'Failed to add strategy', isLoading: false })
      throw error
    }
  },
  updateStrategy: async (id, update) => {
    try {
      await window.api.updateStrategy(id, update)
      const list = await window.api.getStrategies()
      const formatted = list.map((s: any) => ({ ...s, id: s._id || s.id }))
      set({ strategies: formatted })
    } catch (error) {
      set({ error: 'Failed to update strategy' })
      throw error
    }
  },
  deleteStrategy: async (id) => {
    try {
      await window.api.deleteStrategy(id)
      set((state) => ({
        strategies: state.strategies.filter((s) => s.id !== id && s._id !== id)
      }))
    } catch (error) {
      throw error
    }
  }
}))
