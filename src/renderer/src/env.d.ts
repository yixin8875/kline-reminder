/// <reference types="vite/client" />

import { TradeLog, CreateTradeLogDTO } from './types/journal'
import { Instrument } from './types/instrument'
import { Account } from './types/account'

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send(channel: string, ...args: unknown[]): void
        sendMessage(channel: string, args: unknown[]): void
        invoke(channel: string, ...args: unknown[]): Promise<any>
        on(channel: string, func: (...args: unknown[]) => void): (() => void) | undefined
        once(channel: string, func: (...args: unknown[]) => void): void
      }
    }
    api: {
      setAlwaysOnTop: (flag: boolean) => void
      createJournalLog: (entry: CreateTradeLogDTO) => Promise<TradeLog>
      getJournalLogs: () => Promise<TradeLog[]>
      deleteJournalLog: (id: string) => Promise<number>
      getJournalImage: (filename: string) => Promise<string>
      updateJournalLog: (id: string, update: Partial<TradeLog>) => Promise<number>
      
      createTask: (task: any) => Promise<any>
      getTasks: () => Promise<any[]>
      updateTask: (id: string, update: any) => Promise<number>
      deleteTask: (id: string) => Promise<number>

      createInstrument: (inst: { name: string; pointValueUSD: number }) => Promise<Instrument>
      getInstruments: () => Promise<Instrument[]>
      updateInstrument: (id: string, update: Partial<Instrument>) => Promise<number>
      deleteInstrument: (id: string) => Promise<number>

      createAccount: (acc: { name: string; balance: number }) => Promise<Account>
      getAccounts: () => Promise<Account[]>
      updateAccount: (id: string, update: Partial<Account>) => Promise<number>
      deleteAccount: (id: string) => Promise<number>

      resizeWindow: (width: number, height: number) => void
    }
    events: {
      onWindowResized: (callback: (payload: { width: number; height: number }) => void) => void
      offWindowResized: () => void
    }
    updates: {
      checkForUpdates: () => Promise<boolean>
      installUpdate: () => Promise<boolean>
      onAvailable: (cb: () => void) => void
      onDownloaded: (cb: () => void) => void
      onProgress: (cb: (progress: any) => void) => void
      offAll: () => void
    }
  }
}
