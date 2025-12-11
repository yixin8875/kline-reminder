import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  setAlwaysOnTop: (flag: boolean): void => ipcRenderer.send('set-always-on-top', flag),
  
  // Journal API
  createJournalLog: (entry: any): Promise<any> => ipcRenderer.invoke('journal:create', entry),
  getJournalLogs: (): Promise<any[]> => ipcRenderer.invoke('journal:list'),
  deleteJournalLog: (id: string): Promise<number> => ipcRenderer.invoke('journal:delete', id),
  getJournalImage: (filename: string): Promise<string> => ipcRenderer.invoke('journal:get-image', filename),
  updateJournalLog: (id: string, update: any): Promise<number> => ipcRenderer.invoke('journal:update', id, update),
  
  // Task API
  createTask: (task: any): Promise<any> => ipcRenderer.invoke('task:create', task),
  getTasks: (): Promise<any[]> => ipcRenderer.invoke('task:list'),
  updateTask: (id: string, update: any): Promise<number> => ipcRenderer.invoke('task:update', id, update),
  deleteTask: (id: string): Promise<number> => ipcRenderer.invoke('task:delete', id),

  // Instrument API
  createInstrument: (inst: any): Promise<any> => ipcRenderer.invoke('instrument:create', inst),
  getInstruments: (): Promise<any[]> => ipcRenderer.invoke('instrument:list'),
  updateInstrument: (id: string, update: any): Promise<number> => ipcRenderer.invoke('instrument:update', id, update),
  deleteInstrument: (id: string): Promise<number> => ipcRenderer.invoke('instrument:delete', id),

  // Account API
  createAccount: (acc: any): Promise<any> => ipcRenderer.invoke('account:create', acc),
  getAccounts: (): Promise<any[]> => ipcRenderer.invoke('account:list'),
  updateAccount: (id: string, update: any): Promise<number> => ipcRenderer.invoke('account:update', id, update),
  deleteAccount: (id: string): Promise<number> => ipcRenderer.invoke('account:delete', id),

  resizeWindow: (width: number, height: number): void => ipcRenderer.send('resize-window', width, height)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
