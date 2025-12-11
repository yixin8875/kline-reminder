import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { dbService } from './services/DatabaseService'
const autoUpdater = (require as any)('electron-updater').autoUpdater

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createTray(window: BrowserWindow): void {
  const iconPath = process.platform === 'win32' ? icon : icon
  const trayImage = nativeImage.createFromPath(iconPath)
  
  tray = new Tray(trayImage)
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show App', 
      click: (): void => {
        window.show()
      } 
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: (): void => {
        isQuitting = true
        app.quit()
      } 
    }
  ])
  
  tray.setToolTip('K-Line Waker')
  tray.setContextMenu(contextMenu)
  
  tray.on('double-click', () => {
    window.show()
  })
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 350, // Narrow window as requested
    height: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon: join(__dirname, '../../build/icon.png') } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('resize', () => {
    const size = mainWindow!.getSize()
    mainWindow!.webContents.send('window:resized', { width: size[0], height: size[1] })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  
  // Intercept close event to hide instead of quit
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow!.hide()
    }
    return false
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  
  createTray(mainWindow)
  if (!is.dev) {
    try {
      autoUpdater.autoDownload = true
      autoUpdater.checkForUpdates()
    } catch {}
  }
}

// IPC for Always on Top
ipcMain.on('set-always-on-top', (event, flag) => {
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  if (win) {
    win.setAlwaysOnTop(flag, 'floating')
  }
})

// IPC for Journal
ipcMain.handle('journal:create', (_, entry) => dbService.createJournalEntry(entry))
ipcMain.handle('journal:list', () => dbService.getJournalEntries())
ipcMain.handle('journal:delete', (_, id) => dbService.deleteJournalEntry(id))
ipcMain.handle('journal:get-image', (_, filename) => dbService.getImage(filename))
ipcMain.handle('journal:update', async (_, id, update) => dbService.updateJournalEntry(id, update))

// IPC for Tasks
ipcMain.handle('task:create', (_, task) => dbService.createTask(task))
ipcMain.handle('task:list', () => dbService.getTasks())
ipcMain.handle('task:update', (_, id, update) => dbService.updateTask(id, update))
ipcMain.handle('task:delete', (_, id) => dbService.deleteTask(id))

// IPC for Instruments
ipcMain.handle('instrument:create', (_, inst) => dbService.createInstrument(inst))
ipcMain.handle('instrument:list', () => dbService.getInstruments())
ipcMain.handle('instrument:update', (_, id, update) => dbService.updateInstrument(id, update))
ipcMain.handle('instrument:delete', (_, id) => dbService.deleteInstrument(id))

// IPC for Accounts
ipcMain.handle('account:create', (_, acc) => dbService.createAccount(acc))
ipcMain.handle('account:list', () => dbService.getAccounts())
ipcMain.handle('account:update', (_, id, update) => dbService.updateAccount(id, update))
ipcMain.handle('account:delete', (_, id) => dbService.deleteAccount(id))

// IPC for Window Resizing
ipcMain.on('resize-window', (event, width, height) => {
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  if (win) {
    // Ensure we can resize
    win.setResizable(true)
    win.setSize(width, height, true) // animate = true
    
    // Center only when expanding to large journal view to prevent going off-screen
    if (width > 800) {
      win.center()
    }
  }
})

// Auto Update IPC and events
ipcMain.handle('update:check', async () => {
  if (!is.dev) {
    try {
      await autoUpdater.checkForUpdates()
      return true
    } catch (e) {
      return false
    }
  }
  return false
})

ipcMain.handle('update:install', async () => {
  try {
    autoUpdater.quitAndInstall()
    return true
  } catch {
    return false
  }
})

try {
  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update:available')
  })
  autoUpdater.on('download-progress', (progress: any) => {
    mainWindow?.webContents.send('update:progress', progress)
  })
  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update:downloaded')
  })
} catch {}

// Export Journal to Excel
ipcMain.handle('journal:export-excel', async (_evt, payload: { accountId?: string; start?: number; end?: number }) => {
  const ExcelJS = require('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Trades')

  ws.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Symbol', key: 'symbol', width: 12 },
    { header: 'Direction', key: 'direction', width: 10 },
    { header: 'Entry', key: 'entryPrice', width: 10 },
    { header: 'Exit', key: 'exitPrice', width: 10 },
    { header: 'Stop Loss', key: 'stopLoss', width: 10 },
    { header: 'Position', key: 'positionSize', width: 10 },
    { header: 'PnL (pts)', key: 'pnl', width: 10 },
    { header: 'PnL (USD)', key: 'usdPnl', width: 12 },
    { header: 'R/R', key: 'riskReward', width: 8 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Notes', key: 'notes', width: 30 }
  ]

  const { accountId, start, end } = payload || {}
  const account = accountId ? await dbService.getAccountById(accountId) : null
  const logs = await dbService.getJournalEntriesByAccountAndRange(accountId, start, end)

  let rowIndex = 2
  for (const log of logs) {
    ws.addRow({
      date: new Date(log.date).toLocaleString(),
      symbol: log.symbol,
      direction: log.direction,
      entryPrice: log.entryPrice,
      exitPrice: log.exitPrice ?? '',
      stopLoss: log.stopLoss ?? '',
      positionSize: log.positionSize ?? '',
      pnl: log.pnl ?? '',
      usdPnl: typeof log.usdPnl === 'number' ? Number(log.usdPnl).toFixed(2) : '',
      riskReward: typeof log.riskReward === 'number' ? Number(log.riskReward).toFixed(2) : '',
      status: log.status,
      notes: log.notes || ''
    })

    const images: string[] = log.imageFileNames || (log.imageFileName ? [log.imageFileName] : [])
    let imageCol = 13
    for (const fn of images) {
      try {
        const dataUrl = await dbService.getImage(fn)
        const base64 = String(dataUrl).replace(/^data:image\/[a-zA-Z]+;base64,/, '')
        const imgId = wb.addImage({ base64, extension: 'png' })
        ws.addImage(imgId, {
          tl: { col: imageCol, row: rowIndex - 1 },
          ext: { width: 240, height: 160 }
        })
        imageCol += 6
      } catch (e) {
        console.error('Embed image failed', e)
      }
    }
    rowIndex++
  }

  const defaultNameParts = [
    'trades',
    account?.name ? account.name.replace(/\s+/g, '_') : 'all',
    start ? new Date(start).toISOString().split('T')[0] : 'start',
    end ? new Date(end).toISOString().split('T')[0] : 'end'
  ]
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Export Trades',
    defaultPath: `${defaultNameParts.filter(Boolean).join('-')}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  })
  if (canceled || !filePath) return { success: false }
  await wb.xlsx.writeFile(filePath)
  return { success: true, path: filePath }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  
  // Handle explicit quit
  app.on('before-quit', () => {
    isQuitting = true
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
