/// <reference types="vite/client" />

import { TradeLog, CreateTradeLogDTO } from './types/journal'

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
      
      createTask: (task: any) => Promise<any>
      getTasks: () => Promise<any[]>
      updateTask: (id: string, update: any) => Promise<number>
      deleteTask: (id: string) => Promise<number>

      resizeWindow: (width: number, height: number) => void
    }
  }
}
