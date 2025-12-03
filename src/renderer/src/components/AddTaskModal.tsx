import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { useTaskStore } from '../store/useTaskStore'

interface AddTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PERIOD_PRESETS = [
  { key: '1m', value: 1 },
  { key: '3m', value: 3 },
  { key: '5m', value: 5 },
  { key: '15m', value: 15 },
  { key: '30m', value: 30 },
  { key: '1h', value: 60 },
  { key: '4h', value: 240 },
  { key: '1d', value: 1440 },
]

export function AddTaskModal({ open, onOpenChange }: AddTaskModalProps): JSX.Element {
  const { t } = useTranslation()
  const addTask = useTaskStore((state) => state.addTask)
  
  const [name, setName] = useState('')
  const [period, setPeriod] = useState<number>(15)
  const [customPeriod, setCustomPeriod] = useState('')
  const [notifyBefore, setNotifyBefore] = useState('30')
  
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    
    // Use custom period if set, otherwise preset
    // Ensure customPeriod is treated as number only if it has value
    const finalPeriod = customPeriod ? parseInt(customPeriod) : period
    
    if (!name.trim()) {
      // TODO: Show error
      return
    }

    if (!finalPeriod || finalPeriod <= 0) {
      return
    }

    addTask({
      name,
      period: finalPeriod,
      notifyBefore: parseInt(notifyBefore) || 30,
    })

    // Reset and close
    setName('')
    setPeriod(15)
    setCustomPeriod('')
    setNotifyBefore('30')
    onOpenChange(false)
  }

  const isValid = name.trim().length > 0 && (customPeriod ? parseInt(customPeriod) > 0 : period > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('addTask.title')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              {t('addTask.nameLabel')}
            </label>
            <Input
              id="name"
              placeholder={t('addTask.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">{t('addTask.periodLabel')}</label>
            <div className="grid grid-cols-4 gap-2">
              {PERIOD_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={period === preset.value && !customPeriod ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setPeriod(preset.value)
                    setCustomPeriod('')
                  }}
                >
                  {t(`addTask.presets.${preset.key}`)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{t('addTask.customPeriodLabel')}</span>
              <Input
                type="number"
                min="1"
                placeholder={t('addTask.customPeriodPlaceholder')}
                value={customPeriod}
                onChange={(e) => setCustomPeriod(e.target.value)}
                className="h-8"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="notifyBefore" className="text-sm font-medium">
              {t('addTask.notifyBeforeLabel')}
            </label>
            <Input
              id="notifyBefore"
              type="number"
              min="5"
              value={notifyBefore}
              onChange={(e) => setNotifyBefore(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!isValid}>{t('addTask.add')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
