import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useInstrumentStore } from '../store/useInstrumentStore'
import { useTranslation } from 'react-i18next'

interface InstrumentManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InstrumentManagerModal({ open, onOpenChange }: InstrumentManagerModalProps): JSX.Element {
  const { t } = useTranslation()
  const { instruments, fetchInstruments, addInstrument, updateInstrument, deleteInstrument } = useInstrumentStore()
  const [newName, setNewName] = useState('')
  const [newPoint, setNewPoint] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPoint, setEditPoint] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchInstruments()
      setErrorMsg(null)
      setEditingId(null)
      setEditName('')
      setEditPoint('')
      setNewName('')
      setNewPoint('')
    }
  }, [open, fetchInstruments])

  const handleAdd = async () => {
    if (!newName || !newPoint) return
    try {
      await addInstrument({ name: newName.trim(), pointValueUSD: Number(newPoint) })
      setNewName('')
      setNewPoint('')
    } catch (e: any) {
      setErrorMsg(String(e?.message || ''))
    }
  }

  const startEdit = (id: string, name: string, pointValueUSD: number) => {
    setEditingId(id)
    setEditName(name)
    setEditPoint(String(pointValueUSD))
    setErrorMsg(null)
  }

  const handleUpdate = async () => {
    if (!editingId) return
    if (!editName || !editPoint) return
    try {
      await updateInstrument(editingId, { name: editName.trim(), pointValueUSD: Number(editPoint) })
      setEditingId(null)
      setEditName('')
      setEditPoint('')
    } catch (e: any) {
      setErrorMsg(String(e?.message || ''))
    }
  }

  const handleDelete = async (id: string) => {
    setErrorMsg(null)
    try {
      await deleteInstrument(id)
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg === 'INSTRUMENT_IN_USE') {
        setErrorMsg(t('instrument.cannotDeleteInUse'))
      } else {
        setErrorMsg(msg)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>{t('instrument.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {errorMsg && <div className="text-destructive text-sm">{errorMsg}</div>}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('instrument.name')}</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('journal.form.symbolPlaceholder')} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('instrument.pointValue')}</label>
                <Input type="number" value={newPoint} onChange={(e) => setNewPoint(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <Button onClick={handleAdd}>{t('instrument.add')}</Button>
          </div>

          <div className="h-[1px] bg-border" />

          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div>{t('instrument.name')}</div>
              <div>{t('instrument.pointValue')}</div>
              <div className="text-right">{t('journal.table.actions')}</div>
            </div>
            <div className="space-y-2">
              {instruments.map((inst) => (
                <div key={inst.id || inst._id} className="grid grid-cols-3 gap-2 items-center">
                  <div>
                    {editingId === (inst.id || inst._id) ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      <span className="font-medium">{inst.name}</span>
                    )}
                  </div>
                  <div>
                    {editingId === (inst.id || inst._id) ? (
                      <Input type="number" value={editPoint} onChange={(e) => setEditPoint(e.target.value)} />
                    ) : (
                      <span>{inst.pointValueUSD}</span>
                    )}
                  </div>
                  <div className="text-right">
                    {editingId === (inst.id || inst._id) ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setEditName(''); setEditPoint('') }}>{t('settings.cancel')}</Button>
                        <Button size="sm" onClick={handleUpdate}>{t('journal.update')}</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(inst.id || inst._id!, inst.name, inst.pointValueUSD)}>{t('instrument.edit')}</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(inst.id || inst._id!)}>{t('instrument.delete')}</Button>
                      </div>
                    )}
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
