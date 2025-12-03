import { useEffect, useState } from 'react'
import { useJournalStore } from '../store/useJournalStore'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import { Dialog, DialogContent } from './ui/dialog'
import { AddTradeModal } from './AddTradeModal'
import { Plus, Trash2, Camera, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { cn } from '../utils/cn'

export function JournalView(): JSX.Element {
  const { logs, fetchLogs, deleteLog, getLogImage, isLoading } = useJournalStore()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this log?')) {
      await deleteLog(id)
    }
  }

  const handleViewImage = async (filename: string) => {
    try {
      const base64 = await getLogImage(filename)
      setPreviewImage(base64)
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
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">Total Trades</div>
          <div className="text-2xl font-bold">{totalTrades}</div>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">Win Rate</div>
          <div className={cn("text-2xl font-bold", Number(winRate) >= 50 ? "text-green-500" : "text-red-500")}>
            {winRate}%
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">Net PnL</div>
          <div className={cn("text-2xl font-bold", totalPnL >= 0 ? "text-green-500" : "text-red-500")}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Log
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 border rounded-md bg-card overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Entry / Exit</TableHead>
              <TableHead>PnL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No trade logs found. Start journaling!
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id || log._id}>
                  <TableCell className="font-medium">
                    {new Date(log.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{log.symbol}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      log.direction === 'Long' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {log.direction}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>In: {log.entryPrice}</span>
                      {log.exitPrice && <span>Out: {log.exitPrice}</span>}
                    </div>
                  </TableCell>
                  <TableCell className={cn(
                    "font-medium",
                    (log.pnl || 0) >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {log.pnl ? (log.pnl > 0 ? `+${log.pnl}` : log.pnl) : '-'}
                  </TableCell>
                  <TableCell>
                     <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium border",
                      log.status === 'Win' && "border-green-500 text-green-500",
                      log.status === 'Loss' && "border-red-500 text-red-500",
                      (log.status === 'Open' || log.status === 'Closed') && "border-muted-foreground text-muted-foreground"
                    )}>
                      {log.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {log.imageFileName && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewImage(log.imageFileName!)}
                          title="View Screenshot"
                        >
                          <Camera className="w-4 h-4 text-blue-400" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(log.id || log._id!)}
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

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl w-auto p-1 bg-transparent border-none shadow-none">
           {previewImage && (
             <img 
              src={previewImage} 
              alt="Trade Screenshot" 
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-border"
            />
           )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
