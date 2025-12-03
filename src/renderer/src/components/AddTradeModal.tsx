import { useState, useEffect, ClipboardEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useJournalStore } from '../store/useJournalStore'
import { TradeDirection, TradeStatus } from '../types/journal'
import { ImagePlus, X } from 'lucide-react'

interface AddTradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTradeModal({ open, onOpenChange }: AddTradeModalProps): JSX.Element {
  const { addLog } = useJournalStore()
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [symbol, setSymbol] = useState('')
  const [direction, setDirection] = useState<TradeDirection>('Long')
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [status, setStatus] = useState<TradeStatus>('Closed')
  const [pnl, setPnl] = useState('')
  const [notes, setNotes] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile()
        if (blob) {
          const reader = new FileReader()
          reader.onload = (event) => {
            if (event.target?.result) {
              setImage(event.target.result as string)
            }
          }
          reader.readAsDataURL(blob)
        }
      }
    }
  }

  const handleSubmit = async () => {
    if (!symbol || !entryPrice) return

    setIsSubmitting(true)
    try {
      await addLog({
        date: new Date(date).getTime(),
        symbol: symbol.toUpperCase(),
        direction,
        entryPrice: Number(entryPrice),
        exitPrice: exitPrice ? Number(exitPrice) : undefined,
        status,
        pnl: pnl ? Number(pnl) : undefined,
        notes,
        image: image || undefined
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
    setSymbol('')
    setDirection('Long')
    setEntryPrice('')
    setExitPrice('')
    setStatus('Closed')
    setPnl('')
    setNotes('')
    setImage(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground" onPaste={handlePaste}>
        <DialogHeader>
          <DialogTitle>Add Trade Log</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Symbol</label>
              <Input 
                placeholder="BTC/USDT" 
                value={symbol} 
                onChange={(e) => setSymbol(e.target.value)} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Direction</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={direction}
                onChange={(e) => setDirection(e.target.value as TradeDirection)}
              >
                <option value="Long">Long 🟢</option>
                <option value="Short">Short 🔴</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={status}
                onChange={(e) => setStatus(e.target.value as TradeStatus)}
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Win">Win 🏆</option>
                <option value="Loss">Loss 💀</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Entry Price</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={entryPrice} 
                onChange={(e) => setEntryPrice(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Exit Price</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={exitPrice} 
                onChange={(e) => setExitPrice(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PnL</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={pnl} 
                onChange={(e) => setPnl(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea 
              placeholder="Strategy, feelings, mistakes..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex justify-between">
              <span>Screenshot (Paste anywhere to upload)</span>
              {image && (
                <Button variant="ghost" size="sm" onClick={() => setImage(null)} className="h-4 w-4 p-0 text-destructive">
                  <X className="w-3 h-3" />
                </Button>
              )}
            </label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center justify-center min-h-[100px] bg-muted/50">
              {image ? (
                <img src={image} alt="Preview" className="max-h-[200px] rounded object-contain" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground text-xs">
                  <ImagePlus className="w-8 h-8 mb-2 opacity-50" />
                  <span>Paste (Ctrl+V) image here</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Log'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
