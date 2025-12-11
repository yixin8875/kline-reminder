import Datastore from 'nedb-promises'
import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'

class DatabaseService {
  private tasksDb: Datastore<any>
  private journalDb: Datastore<any>
  private instrumentsDb: Datastore<any>
  private accountsDb: Datastore<any>
  private imagesDir: string

  constructor() {
    const userDataPath = app.getPath('userData')
    this.imagesDir = path.join(userDataPath, 'trade_images')
    
    this.tasksDb = Datastore.create({
      filename: path.join(userDataPath, 'tasks.db'),
      autoload: true,
      timestampData: true
    })

    this.journalDb = Datastore.create({
      filename: path.join(userDataPath, 'journal.db'),
      autoload: true,
      timestampData: true
    })

    this.instrumentsDb = Datastore.create({
      filename: path.join(userDataPath, 'instruments.db'),
      autoload: true,
      timestampData: true
    })

    this.accountsDb = Datastore.create({
      filename: path.join(userDataPath, 'accounts.db'),
      autoload: true,
      timestampData: true
    })

    this.ensureImagesDir()
  }

  // --- Task Operations ---

  async createTask(task: any) {
    return await this.tasksDb.insert(task)
  }

  async getTasks() {
    // Sort by createdAt descending
    return await this.tasksDb.find({}).sort({ createdAt: -1 })
  }

  async updateTask(id: string, update: any) {
    return await this.tasksDb.update({ _id: id }, { $set: update }, {})
  }

  async deleteTask(id: string) {
    return await this.tasksDb.remove({ _id: id }, {})
  }

  private async ensureImagesDir() {
    try {
      await fs.access(this.imagesDir)
    } catch {
      await fs.mkdir(this.imagesDir, { recursive: true })
    }
  }

  async saveImageToDisk(base64String: string): Promise<string> {
    // Strip header if present (e.g., data:image/png;base64,...)
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    let buffer: Buffer

    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64')
    } else {
      buffer = Buffer.from(base64String, 'base64')
    }

    const filename = `img_${randomUUID()}_${Date.now()}.png`
    const filePath = path.join(this.imagesDir, filename)
    
    await fs.writeFile(filePath, buffer)
    return filename
  }

  async deleteImageFromDisk(filename: string): Promise<void> {
    if (!filename) return
    const filePath = path.join(this.imagesDir, filename)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.error(`Failed to delete image ${filename}:`, error)
    }
  }

  // --- Journal Operations ---

  private computeUsdPnl(entry: any, instrument: any): number {
    if (!instrument) return 0
    const pv = Number(instrument.pointValueUSD || 0)
    const size = Number(entry.positionSize || 1)
    let points = 0
    if (typeof entry.pnl === 'number') {
      points = Number(entry.pnl || 0)
    } else if (typeof entry.entryPrice === 'number' && typeof entry.exitPrice === 'number') {
      const entryPrice = Number(entry.entryPrice)
      const exitPrice = Number(entry.exitPrice)
      points = entry.direction === 'Long' ? (exitPrice - entryPrice) : (entryPrice - exitPrice)
    }
    const usd = points * pv * (Number.isFinite(size) ? size : 1)
    return Number.isFinite(usd) ? Number(usd.toFixed(2)) : 0
  }

  private async adjustAccountBalance(accountId: string, delta: number): Promise<void> {
    if (!accountId || !Number.isFinite(delta)) return
    const acc = await this.accountsDb.findOne({ _id: accountId })
    if (!acc) return
    const newBal = Number((Number(acc.balance || 0) + delta).toFixed(2))
    await this.accountsDb.update({ _id: accountId }, { $set: { balance: newBal } }, {})
  }

  private computeRiskReward(entry: any): number | undefined {
    if (
      typeof entry.entryPrice === 'number' &&
      typeof entry.exitPrice === 'number' &&
      typeof entry.stopLoss === 'number'
    ) {
      const entryPrice = Number(entry.entryPrice)
      const exitPrice = Number(entry.exitPrice)
      const stopLoss = Number(entry.stopLoss)
      const profit = Math.abs(exitPrice - entryPrice)
      const risk = Math.abs(entryPrice - stopLoss)
      if (risk > 0) {
        const r = profit / risk
        return Number(r.toFixed(2))
      }
    }
    return undefined
  }

  async createJournalEntry(entry: any) {
    if (entry.images && Array.isArray(entry.images) && entry.images.length > 0) {
      const filenames: string[] = []
      for (const img of entry.images) {
        const filename = await this.saveImageToDisk(img)
        filenames.push(filename)
      }
      entry.imageFileNames = filenames
      delete entry.images
    } else if (entry.image) {
      const filename = await this.saveImageToDisk(entry.image)
      entry.imageFileName = filename
      delete entry.image
    }
    let instrument: any = null
    if (entry.instrumentId) {
      instrument = await this.instrumentsDb.findOne({ _id: entry.instrumentId })
    }
    const usdPnl = this.computeUsdPnl(entry, instrument)
    entry.usdPnl = usdPnl
    const riskReward = this.computeRiskReward(entry)
    if (typeof riskReward === 'number') {
      entry.riskReward = riskReward
    }
    const created = await this.journalDb.insert(entry)
    if (entry.accountId && entry.exitPrice != null) {
      const shouldAdjust = entry.status && ['Closed', 'Win', 'Loss'].includes(entry.status)
      if (shouldAdjust) {
        await this.adjustAccountBalance(entry.accountId, usdPnl)
      }
    }
    return created
  }

  async getJournalEntries() {
    // Sort by date descending
    return await this.journalDb.find({}).sort({ date: -1 })
  }

  async getJournalEntriesByAccountAndRange(accountId?: string, start?: number, end?: number) {
    const query: any = {}
    if (accountId) query.accountId = accountId
    if (typeof start === 'number' || typeof end === 'number') {
      query.date = {}
      if (typeof start === 'number') query.date.$gte = start
      if (typeof end === 'number') query.date.$lte = end
    }
    return await this.journalDb.find(query).sort({ date: 1 })
  }

  async getAccountById(id: string) {
    return await this.accountsDb.findOne({ _id: id })
  }

  async deleteJournalEntry(id: string) {
    const entry: any = await this.journalDb.findOne({ _id: id })
    if (entry) {
      if (entry.imageFileNames && Array.isArray(entry.imageFileNames)) {
        for (const fn of entry.imageFileNames) {
          await this.deleteImageFromDisk(fn)
        }
      } else if (entry.imageFileName) {
        await this.deleteImageFromDisk(entry.imageFileName)
      }
      if (entry.accountId && entry.exitPrice != null) {
        const shouldAdjust = entry.status && ['Closed', 'Win', 'Loss'].includes(entry.status)
        if (shouldAdjust) {
          const instrument = entry.instrumentId ? await this.instrumentsDb.findOne({ _id: entry.instrumentId }) : null
          const usdPnl = typeof entry.usdPnl === 'number' ? entry.usdPnl : this.computeUsdPnl(entry, instrument)
          await this.adjustAccountBalance(entry.accountId, -usdPnl)
        }
      }
    }
    return await this.journalDb.remove({ _id: id }, {})
  }

  async getImage(filename: string): Promise<string> {
    const filePath = path.join(this.imagesDir, filename)
    try {
      const buffer = await fs.readFile(filePath)
      return `data:image/png;base64,${buffer.toString('base64')}`
    } catch (error) {
      console.error(`Failed to read image ${filename}:`, error)
      throw error
    }
  }

  async updateJournalEntry(id: string, update: any) {
    const existing: any = await this.journalDb.findOne({ _id: id })
    if (!existing) return 0

    let baseList: string[] = existing.imageFileNames || (existing.imageFileName ? [existing.imageFileName] : [])
    let newImageFileNames: string[] | undefined

    if (update && update.removeImageFileNames && Array.isArray(update.removeImageFileNames) && update.removeImageFileNames.length > 0) {
      const toRemove: string[] = update.removeImageFileNames
      for (const fn of toRemove) {
        await this.deleteImageFromDisk(fn)
      }
      baseList = baseList.filter((fn) => !toRemove.includes(fn))
      delete update.removeImageFileNames
    }

    if (update && update.images && Array.isArray(update.images) && update.images.length > 0) {
      const filenames: string[] = []
      for (const img of update.images) {
        const filename = await this.saveImageToDisk(img)
        filenames.push(filename)
      }
      newImageFileNames = [...baseList, ...filenames]
      delete update.images
    } else {
      newImageFileNames = baseList
    }

    const $set: any = { ...update }
    if (newImageFileNames) {
      $set.imageFileNames = newImageFileNames
      $set.imageFileName = undefined
    }

    let newUsdPnl = existing.usdPnl || 0
    let oldUsdPnl = existing.usdPnl || 0
    const newInstrumentId = $set.instrumentId != null ? $set.instrumentId : existing.instrumentId
    const instrument = newInstrumentId ? await this.instrumentsDb.findOne({ _id: newInstrumentId }) : null
    const merged = { ...existing, ...$set }
    newUsdPnl = this.computeUsdPnl(merged, instrument)
    $set.usdPnl = newUsdPnl
    const rr = this.computeRiskReward(merged)
    $set.riskReward = rr

    const res = await this.journalDb.update({ _id: id }, { $set }, {})

    const oldAccountId = existing.accountId
    const newAccountId = merged.accountId
    const hadExit = existing.exitPrice != null && existing.status && ['Closed', 'Win', 'Loss'].includes(existing.status)
    const hasExit = merged.exitPrice != null && merged.status && ['Closed', 'Win', 'Loss'].includes(merged.status)
    if (hadExit) {
      if (oldAccountId) {
        await this.adjustAccountBalance(oldAccountId, -oldUsdPnl)
      }
    }
    if (hasExit) {
      if (newAccountId) {
        await this.adjustAccountBalance(newAccountId, newUsdPnl)
      }
    }

    return res
  }

  async createInstrument(inst: any) {
    return await this.instrumentsDb.insert(inst)
  }

  async getInstruments() {
    return await this.instrumentsDb.find({}).sort({ name: 1 })
  }

  async updateInstrument(id: string, update: any) {
    return await this.instrumentsDb.update({ _id: id }, { $set: update }, {})
  }

  async deleteInstrument(id: string) {
    const usedCount = await this.journalDb.count({ instrumentId: id })
    if (usedCount > 0) {
      throw new Error('INSTRUMENT_IN_USE')
    }
    return await this.instrumentsDb.remove({ _id: id }, {})
  }

  async createAccount(acc: any) {
    return await this.accountsDb.insert(acc)
  }

  async getAccounts() {
    return await this.accountsDb.find({}).sort({ name: 1 })
  }

  async updateAccount(id: string, update: any) {
    return await this.accountsDb.update({ _id: id }, { $set: update }, {})
  }

  async deleteAccount(id: string) {
    const usedCount = await this.journalDb.count({ accountId: id })
    if (usedCount > 0) {
      throw new Error('ACCOUNT_IN_USE')
    }
    return await this.accountsDb.remove({ _id: id }, {})
  }
}

export const dbService = new DatabaseService()
