import { useState, useEffect, ClipboardEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useJournalStore } from '../store/useJournalStore'
import { TradeDirection, TradeStatus } from '../types/journal'
import { ImagePlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useInstrumentStore } from '../store/useInstrumentStore'
import { InstrumentManagerModal } from './InstrumentManagerModal'
import { useAccountStore } from '../store/useAccountStore'
import { AccountManagerModal } from './AccountManagerModal'

interface AddTradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTradeModal({ open, onOpenChange }: AddTradeModalProps): JSX.Element {
  const { addLog } = useJournalStore()
  const { t } = useTranslation()
  const { instruments, fetchInstruments } = useInstrumentStore()
  const { accounts, fetchAccounts } = useAccountStore()
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
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
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)

  // Auto-calculate PnL if Entry, Exit, and Direction are set
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
    if (open) {
      fetchInstruments()
      fetchAccounts()
    }
  }, [open, fetchInstruments, fetchAccounts])

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile()
        if (blob) {
          const reader = new FileReader()
          reader.onload = (event) => {
            if (event.target?.result) {
              setImages((prev) => [...prev, event.target!.result as string])
            }
          }
          reader.readAsDataURL(blob)
        }
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const arr = Array.from(files)
    arr.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async () => {
    if (!selectedInstrumentId || !selectedAccountId || !entryPrice) return

    setIsSubmitting(true)
    try {
      const inst = instruments.find((i) => (i.id || i._id) === selectedInstrumentId)
      await addLog({
        date: new Date(date).getTime(),
        symbol: inst ? inst.name.toUpperCase() : '',
        instrumentId: selectedInstrumentId,
        accountId: selectedAccountId,
        direction,
        entryPrice: Number(entryPrice),
        exitPrice: exitPrice ? Number(exitPrice) : undefined,
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        status,
        pnl: pnl ? Number(pnl) : undefined,
        riskReward: riskReward ? Number(riskReward) : undefined,
        notes,
        images: images.length > 0 ? images : undefined
      })
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0])
    setSelectedInstrumentId('')
    setSelectedAccountId('')
    setDirection('Long')
    setEntryPrice('')
    setExitPrice('')
    setStopLoss('')
    setStatus('Closed')
    setPnl('')
    setRiskReward('')
    setNotes('')
    setImages([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground" onPaste={handlePaste}>
        <DialogHeader>
          <DialogTitle>{t('journal.addTitle')}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.date')}</label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
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
              <Input 
                type="number" 
                placeholder="0.00" 
                value={entryPrice} 
                onChange={(e) => setEntryPrice(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.exitPrice')}</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={exitPrice} 
                onChange={(e) => setExitPrice(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.pnl')}</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={pnl} 
                onChange={(e) => setPnl(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.stopLoss')}</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={stopLoss} 
                onChange={(e) => setStopLoss(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('journal.form.rrr')}</label>
              <Input 
                type="number" 
                placeholder="-" 
                value={riskReward} 
                disabled 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('journal.form.notes')}</label>
            <Textarea 
              placeholder={t('journal.form.notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex justify-between">
              <span>{t('journal.form.screenshots')}</span>
              <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" id="file-input" />
              <Button variant="outline" size="sm" onClick={() => document.getElementById('file-input')?.click()}>
                {t('journal.form.uploadScreenshots')}
              </Button>
            </label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center justify-center min-h-[100px] bg-muted/50 w-full">
              {images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 w-full">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={t('journal.previewAlt')} className="h-[100px] w-full object-cover rounded" />
                      <button className="absolute top-1 right-1 bg-destructive/80 text-white rounded p-1" onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
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
            {isSubmitting ? t('journal.saving') : t('journal.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
      <InstrumentManagerModal open={isInstrumentModalOpen} onOpenChange={setIsInstrumentModalOpen} />
      <AccountManagerModal open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen} />
    </Dialog>
  )
}
