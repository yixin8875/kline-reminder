import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useAccountStore } from '../store/useAccountStore'
import { useTranslation } from 'react-i18next'

interface AccountManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountManagerModal({ open, onOpenChange }: AccountManagerModalProps): JSX.Element {
  const { t } = useTranslation()
  const { accounts, fetchAccounts, addAccount, updateAccount, deleteAccount } = useAccountStore()
  const [newName, setNewName] = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchAccounts()
      setErrorMsg(null)
      setEditingId(null)
      setEditName('')
      setEditBalance('')
      setNewName('')
      setNewBalance('')
    }
  }, [open, fetchAccounts])

  const handleAdd = async () => {
    if (!newName || !newBalance) return
    try {
      await addAccount({ name: newName.trim(), balance: Number(newBalance) })
      setNewName('')
      setNewBalance('')
    } catch (e: any) {
      setErrorMsg(String(e?.message || ''))
    }
  }

  const startEdit = (id: string, name: string, balance: number) => {
    setEditingId(id)
    setEditName(name)
    setEditBalance(String(balance))
    setErrorMsg(null)
  }

  const handleUpdate = async () => {
    if (!editingId) return
    if (!editName || !editBalance) return
    try {
      await updateAccount(editingId, { name: editName.trim(), balance: Number(editBalance) })
      setEditingId(null)
      setEditName('')
      setEditBalance('')
    } catch (e: any) {
      setErrorMsg(String(e?.message || ''))
    }
  }

  const handleDelete = async (id: string) => {
    setErrorMsg(null)
    try {
      await deleteAccount(id)
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg === 'ACCOUNT_IN_USE') {
        setErrorMsg(t('account.cannotDeleteInUse'))
      } else {
        setErrorMsg(msg)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>{t('account.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {errorMsg && <div className="text-destructive text-sm">{errorMsg}</div>}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('account.name')}</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('account.namePlaceholder')} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('account.balance')}</label>
                <Input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <Button onClick={handleAdd}>{t('account.add')}</Button>
          </div>

          <div className="h-[1px] bg-border" />

          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div>{t('account.name')}</div>
              <div>{t('account.balance')}</div>
              <div className="text-right">{t('journal.table.actions')}</div>
            </div>
            <div className="space-y-2">
              {accounts.map((acc) => (
                <div key={acc.id || acc._id} className="grid grid-cols-3 gap-2 items-center">
                  <div>
                    {editingId === (acc.id || acc._id) ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : (
                      <span className="font-medium">{acc.name}</span>
                    )}
                  </div>
                  <div>
                    {editingId === (acc.id || acc._id) ? (
                      <Input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} />
                    ) : (
                      <span>{acc.balance.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="text-right">
                    {editingId === (acc.id || acc._id) ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setEditName(''); setEditBalance('') }}>{t('settings.cancel')}</Button>
                        <Button size="sm" onClick={handleUpdate}>{t('journal.update')}</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(acc.id || acc._id!, acc.name, acc.balance)}>{t('account.edit')}</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(acc.id || acc._id!)}>{t('account.delete')}</Button>
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
