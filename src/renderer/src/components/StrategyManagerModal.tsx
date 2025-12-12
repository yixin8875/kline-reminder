import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useStrategyStore } from '../store/useStrategyStore'
import { useTranslation } from 'react-i18next'

interface StrategyManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StrategyManagerModal({ open, onOpenChange }: StrategyManagerModalProps): JSX.Element {
  const { t } = useTranslation()
  const { strategies, fetchStrategies, addStrategy, updateStrategy, deleteStrategy } = useStrategyStore()
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchStrategies()
      setErrorMsg(null)
      setEditingId(null)
      setEditName('')
      setEditDesc('')
      setNewName('')
      setNewDesc('')
    }
  }, [open, fetchStrategies])

  const handleAdd = async (): Promise<void> => {
    if (!newName) return
    try {
      await addStrategy({ name: newName.trim(), description: newDesc.trim() })
      setNewName('')
      setNewDesc('')
    } catch (e: any) {
      setErrorMsg(String(e?.message || ''))
    }
  }

  const handleUpdate = async (): Promise<void> => {
    if (!editingId) return
    if (!editName) return
    try {
      await updateStrategy(editingId, { name: editName.trim(), description: editDesc.trim() })
      setEditingId(null)
      setEditName('')
      setEditDesc('')
    } catch (e: any) {
      setErrorMsg(String(e?.message || ''))
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    setErrorMsg(null)
    try {
      await deleteStrategy(id)
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg === 'STRATEGY_IN_USE') {
        setErrorMsg(t('strategy.cannotDeleteInUse'))
      } else {
        setErrorMsg(msg)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>{t('strategy.title')}</DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="text-destructive text-sm mb-2">{errorMsg}</div>
        )}

        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">{t('strategy.add')}</div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder={t('strategy.name') as string} value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder={t('strategy.description') as string} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
            <Button size="sm" onClick={handleAdd}>{t('strategy.add')}</Button>
          </div>

          <div className="h-[1px] bg-border" />

          <div className="space-y-2">
            <div className="text-sm font-medium">{t('strategy.edit')}</div>
            <div className="grid gap-2">
              {strategies.map((s) => (
                <div key={s.id || s._id} className="grid grid-cols-5 gap-2 items-center">
                  <Input
                    className="col-span-2"
                    value={editingId === (s.id || s._id) ? editName : s.name}
                    onChange={(e) => {
                      setEditingId(s.id || s._id!)
                      setEditName(e.target.value)
                      setEditDesc(editDesc)
                    }}
                  />
                  <Input
                    className="col-span-2"
                    value={editingId === (s.id || s._id) ? editDesc : s.description || ''}
                    onChange={(e) => {
                      setEditingId(s.id || s._id!)
                      setEditDesc(e.target.value)
                    }}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={handleUpdate}>{t('strategy.edit')}</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id || s._id!)}>{t('strategy.delete')}</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('settings.cancel')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
