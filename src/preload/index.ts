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
  
  // Task API
  createTask: (task: any): Promise<any> => ipcRenderer.invoke('task:create', task),
  getTasks: (): Promise<any[]> => ipcRenderer.invoke('task:list'),
  updateTask: (id: string, update: any): Promise<number> => ipcRenderer.invoke('task:update', id, update),
  deleteTask: (id: string): Promise<number> => ipcRenderer.invoke('task:delete', id),

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
