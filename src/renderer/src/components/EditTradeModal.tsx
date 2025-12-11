import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useJournalStore } from '../store/useJournalStore'
import { TradeDirection, TradeStatus, TradeLog } from '../types/journal'
import { useTranslation } from 'react-i18next'
import { ImagePlus, X } from 'lucide-react'
import { useInstrumentStore } from '../store/useInstrumentStore'
import { InstrumentManagerModal } from './InstrumentManagerModal'
import { useAccountStore } from '../store/useAccountStore'
import { AccountManagerModal } from './AccountManagerModal'

interface EditTradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: TradeLog | null
}

export function EditTradeModal({ open, onOpenChange, log }: EditTradeModalProps): JSX.Element {
  const { updateLog, getLogImage } = useJournalStore()
  const { t } = useTranslation()
  const { instruments, fetchInstruments } = useInstrumentStore()
  const { accounts, fetchAccounts } = useAccountStore()

  const [date, setDate] = useState('')
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>('')
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [direction, setDirection] = useState<TradeDirection>('Long')
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [status, setStatus] = useState<TradeStatus>('Closed')
  const [pnl, setPnl] = useState('')
  const [riskReward, setRiskReward] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingFiles, setExistingFiles] = useState<string[]>([])
  const [existingPreviews, setExistingPreviews] = useState<Record<string, string>>({})
  const [removedFiles, setRemovedFiles] = useState<string[]>([])
  const [newImages, setNewImages] = useState<string[]>([])
  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)

  useEffect(() => {
    if (log) {
      setDate(new Date(log.date).toISOString().split('T')[0])
      setSelectedInstrumentId(log.instrumentId || '')
      setSelectedAccountId(log.accountId || '')
      setDirection(log.direction)
      setEntryPrice(String(log.entryPrice))
      setExitPrice(log.exitPrice != null ? String(log.exitPrice) : '')
      setStopLoss(log.stopLoss != null ? String(log.stopLoss) : '')
      setStatus(log.status)
      setPnl(log.pnl != null ? String(log.pnl) : '')
      setRiskReward(log.riskReward != null ? String(log.riskReward) : '')
      setNotes(log.notes || '')
      const names = (log as any).imageFileNames && (log as any).imageFileNames.length > 0
        ? (log as any).imageFileNames
        : (log as any).imageFileName ? [(log as any).imageFileName] : []
      setExistingFiles(names)
      setRemovedFiles([])
      setNewImages([])
    }
  }, [log])

  useEffect(() => {
    if (open) {
      fetchInstruments()
      fetchAccounts()
    }
  }, [open, fetchInstruments, fetchAccounts])

  useEffect(() => {
    if (entryPrice && exitPrice && !isNaN(Number(entryPrice)) && !isNaN(Number(exitPrice))) {
      const entry = Number(entryPrice)
      const exit = Number(exitPrice)
      let calculatedPnl = 0
      if (direction === 'Long') {
        calculatedPnl = exit - entry
      } else {
        calculatedPnl = entry - exit
      }
      setPnl(calculatedPnl.toFixed(2))
    }
  }, [entryPrice, exitPrice, direction])

  useEffect(() => {
    if (entryPrice && exitPrice && stopLoss && !isNaN(Number(entryPrice)) && !isNaN(Number(exitPrice)) && !isNaN(Number(stopLoss))) {
      const entry = Number(entryPrice)
      const exit = Number(exitPrice)
      const sl = Number(stopLoss)
      const profit = Math.abs(exit - entry)
      const risk = Math.abs(entry - sl)
      if (risk > 0) {
        setRiskReward((profit / risk).toFixed(2))
      }
    }
  }, [entryPrice, exitPrice, stopLoss])

  useEffect(() => {
    const load = async () => {
      const map: Record<string, string> = {}
      for (const fn of existingFiles) {
        try {
          const data = await getLogImage(fn)
          map[fn] = data
        } catch {}
      }
      setExistingPreviews(map)
    }
    if (existingFiles.length > 0) {
      load()
    } else {
      setExistingPreviews({})
    }
  }, [existingFiles, getLogImage])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewImages((prev) => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeExisting = (fn: string) => {
    setExistingFiles((prev) => prev.filter((x) => x !== fn))
    setRemovedFiles((prev) => [...prev, fn])
  }

  const removeNew = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (): Promise<void> => {
    if (!log) return
    setIsSubmitting(true)
    try {
      const id = log.id || log._id!
      const inst = instruments.find((i) => (i.id || i._id) === (selectedInstrumentId || log.instrumentId))
      await updateLog(id, {
        date: new Date(date).getTime(),
        symbol: inst ? inst.name.toUpperCase() : log.symbol,
        instrumentId: selectedInstrumentId || log.instrumentId,
        accountId: selectedAccountId || log.accountId,
        direction,
        entryPrice: Number(entryPrice),
        exitPrice: exitPrice ? Number(exitPrice) : undefined,
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        status,
        pnl: pnl ? Number(pnl) : undefined,
        riskReward: riskReward ? Number(riskReward) : undefined,
        notes,
        images: newImages.length > 0 ? newImages : undefined,
        removeImageFileNames: removedFiles.length > 0 ? removedFiles : undefined
      })
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>{t('journal.editTitle')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.date')}</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                <span>{t('instrument.select')}</span>
                <Button variant="outline" size="sm" onClick={() => setIsInstrumentModalOpen(true)}>
                  {t('instrument.manage')}
                </Button>
              </label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedInstrumentId}
                onChange={(e) => setSelectedInstrumentId(e.target.value)}
              >
                <option value="">{t('journal.form.symbolPlaceholder')}</option>
                {instruments.map((inst) => (
                  <option key={inst.id || inst._id} value={inst.id || inst._id!}>
                    {inst.name} ({inst.pointValueUSD})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                <span>{t('account.select')}</span>
                <Button variant="outline" size="sm" onClick={() => setIsAccountModalOpen(true)}>
                  {t('account.manage')}
                </Button>
              </label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                <option value="">{t('account.selectPlaceholder')}</option>
                {accounts.map((acc) => (
                  <option key={acc.id || acc._id} value={acc.id || acc._id!}>
                    {acc.name} (${acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.direction')}</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={direction}
                onChange={(e) => setDirection(e.target.value as TradeDirection)}
              >
                <option value="Long">{t('journal.direction.long')} 🟢</option>
                <option value="Short">{t('journal.direction.short')} 🔴</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.status')}</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={status}
                onChange={(e) => setStatus(e.target.value as TradeStatus)}
              >
                <option value="Open">{t('journal.status.open')}</option>
                <option value="Closed">{t('journal.status.closed')}</option>
                <option value="Win">{t('journal.status.win')} 🏆</option>
                <option value="Loss">{t('journal.status.loss')} 💀</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.entryPrice')}</label>
              <Input type="number" placeholder="0.00" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.exitPrice')}</label>
              <Input type="number" placeholder="0.00" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.pnl')}</label>
              <Input type="number" placeholder="0.00" value={pnl} onChange={(e) => setPnl(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.stopLoss')}</label>
              <Input type="number" placeholder="0.00" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.rrr')}</label>
              <Input type="number" placeholder="-" value={riskReward} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('journal.form.notes')}</label>
            <Textarea placeholder={t('journal.form.notesPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex justify-between">
              <span>{t('journal.form.screenshots')}</span>
              <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" id="edit-file-input" />
              <Button variant="outline" size="sm" onClick={() => document.getElementById('edit-file-input')?.click()}>
                {t('journal.form.uploadScreenshots')}
              </Button>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {existingFiles.map((fn) => (
                <div key={fn} className="relative">
                  {existingPreviews[fn] ? (
                    <img src={existingPreviews[fn]} alt={t('journal.previewAlt')} className="h-[100px] w-full object-cover rounded" />
                  ) : (
                    <div className="h-[100px] w-full bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                      {fn}
                    </div>
                  )}
                  <button className="absolute top-1 right-1 bg-destructive/80 text-white rounded p-1" onClick={() => removeExisting(fn)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newImages.map((img, idx) => (
                <div key={`new-${idx}`} className="relative">
                  <img src={img} alt={t('journal.previewAlt')} className="h-[100px] w-full object-cover rounded" />
                  <button className="absolute top-1 right-1 bg-destructive/80 text-white rounded p-1" onClick={() => removeNew(idx)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {existingFiles.length === 0 && newImages.length === 0 && (
                <div className="flex flex-col items-center text-muted-foreground text-xs">
                  <ImagePlus className="w-8 h-8 mb-2 opacity-50" />
                  <span>{t('journal.form.pasteHint')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('settings.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t('journal.updating') : t('journal.update')}
          </Button>
        </DialogFooter>
      </DialogContent>
      <InstrumentManagerModal open={isInstrumentModalOpen} onOpenChange={setIsInstrumentModalOpen} />
      <AccountManagerModal open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen} />
    </Dialog>
  )
}
