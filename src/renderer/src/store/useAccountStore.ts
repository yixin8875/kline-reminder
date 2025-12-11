import { create } from 'zustand'
import type { Account } from '../types/account'

interface AccountState {
  accounts: Account[]
  isLoading: boolean
  error: string | null
  fetchAccounts: () => Promise<void>
  addAccount: (acc: { name: string; balance: number }) => Promise<void>
  updateAccount: (id: string, update: Partial<Account>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  isLoading: false,
  error: null,
  fetchAccounts: async () => {
    set({ isLoading: true, error: null })
    try {
      const list = await window.api.getAccounts()
      const formatted = list.map((a: any) => ({ ...a, id: a._id || a.id }))
      set({ accounts: formatted, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch accounts', isLoading: false })
    }
  },
  addAccount: async (acc) => {
    set({ isLoading: true, error: null })
    try {
      const created = await window.api.createAccount(acc)
      set((state) => ({
        accounts: [{ ...created, id: created._id || created.id }, ...state.accounts],
        isLoading: false
      }))
    } catch (error) {
      set({ error: 'Failed to add account', isLoading: false })
      throw error
    }
  },
  updateAccount: async (id, update) => {
    try {
      await window.api.updateAccount(id, update)
      const list = await window.api.getAccounts()
      const formatted = list.map((a: any) => ({ ...a, id: a._id || a.id }))
      set({ accounts: formatted })
    } catch (error) {
      set({ error: 'Failed to update account' })
      throw error
    }
  },
  deleteAccount: async (id) => {
    try {
      await window.api.deleteAccount(id)
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id && a._id !== id)
      }))
    } catch (error) {
      throw error
    }
  }
}))
