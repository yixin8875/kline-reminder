import Datastore from 'nedb-promises'
import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'

class DatabaseService {
  private tasksDb: Datastore<any>
  private journalDb: Datastore<any>
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
    return await this.journalDb.insert(entry)
  }

  async getJournalEntries() {
    // Sort by date descending
    return await this.journalDb.find({}).sort({ date: -1 })
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

    return await this.journalDb.update({ _id: id }, { $set }, {})
  }
}

export const dbService = new DatabaseService()
