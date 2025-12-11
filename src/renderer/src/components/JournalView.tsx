import { useEffect, useState } from 'react'
import { useJournalStore } from '../store/useJournalStore'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import { Dialog, DialogContent } from './ui/dialog'
import { AddTradeModal } from './AddTradeModal'
import { Plus, Trash2, Camera, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { EditTradeModal } from './EditTradeModal'
import { useAccountStore } from '../store/useAccountStore'

export function JournalView(): JSX.Element {
  const { t } = useTranslation()
  const { logs, fetchLogs, deleteLog, getLogImage, isLoading } = useJournalStore()
  const { accounts, fetchAccounts } = useAccountStore()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
    fetchAccounts()
  }, [])

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id)
    setIsDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    await deleteLog(deleteTargetId)
    setIsDeleteConfirmOpen(false)
    setDeleteTargetId(null)
  }

  const handleViewImages = async (filenames: string[]) => {
    try {
      const arr: string[] = []
      for (const fn of filenames) {
        const base64 = await getLogImage(fn)
        arr.push(base64)
      }
      setPreviewImages(arr)
      setPreviewIndex(0)
      setIsPreviewOpen(true)
    } catch (error) {
      console.error('Failed to load image', error)
    }
  }

  // Stats Calculation
  const totalTrades = logs.length
  const winCount = logs.filter(l => l.status === 'Win').length
  const winRate = totalTrades > 0 ? ((winCount / totalTrades) * 100).toFixed(1) : '0.0'
  const totalPnL = logs.reduce((acc, curr) => acc + (curr.pnl || 0), 0)

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">{t('journal.totalTrades')}</div>
          <div className="text-2xl font-bold">{totalTrades}</div>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">{t('journal.winRate')}</div>
          <div className={cn("text-2xl font-bold", Number(winRate) >= 50 ? "text-green-500" : "text-red-500")}> 
            {winRate}%
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">{t('journal.netPnl')}</div>
          <div className={cn("text-2xl font-bold", totalPnL >= 0 ? "text-green-500" : "text-red-500")}> 
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> {t('journal.newLog')}
          </Button>
        </div>
      </div>

      <div className="flex-1 border rounded-md bg-card overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">{t('journal.table.date')}</TableHead>
              <TableHead>{t('journal.table.symbol')}</TableHead>
              <TableHead>{t('account.table.account')}</TableHead>
              <TableHead>{t('journal.table.direction')}</TableHead>
              <TableHead>{t('journal.table.entryExit')}</TableHead>
              <TableHead>{t('journal.table.pnl')}</TableHead>
              <TableHead>{t('journal.table.rrr')}</TableHead>
              <TableHead>{t('journal.table.status')}</TableHead>
              <TableHead className="text-right">{t('journal.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {t('journal.empty')}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id || log._id}>
                  <TableCell className="font-medium">
                    {new Date(log.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{log.symbol}</TableCell>
                  <TableCell>{accounts.find(a => (a.id || a._id) === log.accountId)?.name || '-'}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      log.direction === 'Long' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {log.direction === 'Long' ? t('journal.direction.long') : t('journal.direction.short')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>{t('journal.in')}: {log.entryPrice}</span>
                      {log.exitPrice && <span>{t('journal.out')}: {log.exitPrice}</span>}
                    </div>
                  </TableCell>
                  <TableCell className={cn(
                    "font-medium",
                    (log.pnl || 0) >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {log.pnl ? (log.pnl > 0 ? `+${log.pnl}` : log.pnl) : '-'}
                    {typeof log.usdPnl === 'number' && (
                      <div className="text-xs text-muted-foreground">
                        {log.usdPnl >= 0 ? `+$${log.usdPnl.toFixed(2)}` : `-$${Math.abs(log.usdPnl).toFixed(2)}`}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {typeof log.riskReward === 'number' ? log.riskReward.toFixed(2) : '-'}
                  </TableCell>
                  <TableCell>
                     <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium border",
                      log.status === 'Win' && "border-green-500 text-green-500",
                      log.status === 'Loss' && "border-red-500 text-red-500",
                      (log.status === 'Open' || log.status === 'Closed') && "border-muted-foreground text-muted-foreground"
                    )}>
                      {log.status === 'Open' ? t('journal.status.open') : log.status === 'Closed' ? t('journal.status.closed') : log.status === 'Win' ? t('journal.status.win') : t('journal.status.loss')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setSelectedLog(log); setIsEditModalOpen(true) }}
                        title={t('journal.edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {((log as any).imageFileNames && (log as any).imageFileNames.length > 0) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewImages((log as any).imageFileNames)}
                          title={t('journal.viewScreenshot')}
                        >
                          <Camera className="w-4 h-4 text-blue-400" />
                        </Button>
                      )}
                      {log.imageFileName && !((log as any).imageFileNames && (log as any).imageFileNames.length > 0) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewImages([log.imageFileName!])}
                          title={t('journal.viewScreenshot')}
                        >
                          <Camera className="w-4 h-4 text-blue-400" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteClick(log.id || log._id!)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddTradeModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      <EditTradeModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} log={selectedLog} />

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl w-auto p-4 bg-card border-border">
           {previewImages.length > 0 && (
             <div className="flex flex-col gap-3">
               <div className="relative flex items-center justify-center">
                 <Button variant="ghost" size="icon" onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))} className="absolute left-2">
                   <ChevronLeft className="w-5 h-5" />
                 </Button>
                 <img 
                   src={previewImages[previewIndex]} 
                   alt={t('journal.screenshotAlt')} 
                   className="max-w-[70vw] max-h-[70vh] rounded-lg shadow-2xl border border-border"
                 />
                 <Button variant="ghost" size="icon" onClick={() => setPreviewIndex((i) => Math.min(previewImages.length - 1, i + 1))} className="absolute right-2">
                   <ChevronRight className="w-5 h-5" />
                 </Button>
               </div>
               <div className="grid grid-cols-6 gap-2">
                 {previewImages.map((img, idx) => (
                   <button key={idx} onClick={() => setPreviewIndex(idx)} className={cn("border rounded", idx === previewIndex ? "border-primary" : "border-border")}> 
                     <img src={img} alt={t('journal.previewAlt')} className="h-[70px] w-full object-cover rounded" />
                   </button>
                 ))}
               </div>
             </div>
           )}
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div className="text-sm">{t('journal.confirmDelete')}</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>{t('settings.cancel')}</Button>
              <Button variant="destructive" onClick={confirmDelete}>{t('confirm.confirmDelete')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
