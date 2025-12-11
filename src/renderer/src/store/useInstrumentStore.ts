import { create } from 'zustand'
import type { Instrument } from '../types/instrument'

interface InstrumentState {
  instruments: Instrument[]
  isLoading: boolean
  error: string | null
  fetchInstruments: () => Promise<void>
  addInstrument: (inst: { name: string; pointValueUSD: number }) => Promise<void>
  updateInstrument: (id: string, update: Partial<Instrument>) => Promise<void>
  deleteInstrument: (id: string) => Promise<void>
}

export const useInstrumentStore = create<InstrumentState>((set) => ({
  instruments: [],
  isLoading: false,
  error: null,
  fetchInstruments: async () => {
    set({ isLoading: true, error: null })
    try {
      const list = await window.api.getInstruments()
      const formatted = list.map((i: any) => ({ ...i, id: i._id || i.id }))
      set({ instruments: formatted, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch instruments', isLoading: false })
    }
  },
  addInstrument: async (inst) => {
    set({ isLoading: true, error: null })
    try {
      const created = await window.api.createInstrument(inst)
      set((state) => ({
        instruments: [{ ...created, id: created._id || created.id }, ...state.instruments],
        isLoading: false
      }))
    } catch (error) {
      set({ error: 'Failed to add instrument', isLoading: false })
      throw error
    }
  },
  updateInstrument: async (id, update) => {
    try {
      await window.api.updateInstrument(id, update)
      const list = await window.api.getInstruments()
      const formatted = list.map((i: any) => ({ ...i, id: i._id || i.id }))
      set({ instruments: formatted })
    } catch (error) {
      set({ error: 'Failed to update instrument' })
      throw error
    }
  },
  deleteInstrument: async (id) => {
    try {
      await window.api.deleteInstrument(id)
      set((state) => ({
        instruments: state.instruments.filter((i) => i.id !== id && i._id !== id)
      }))
    } catch (error) {
      throw error
    }
  }
}))
