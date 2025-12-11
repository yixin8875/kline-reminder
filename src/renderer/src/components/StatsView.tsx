import { useEffect, useMemo, useState } from 'react'
import { useJournalStore } from '../store/useJournalStore'
import { useAccountStore } from '../store/useAccountStore'
import { useTranslation } from 'react-i18next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { cn } from '../utils/cn'

export function StatsView(): JSX.Element {
  const { t } = useTranslation()
  const { logs, fetchLogs, isLoading } = useJournalStore()
  const { accounts, fetchAccounts } = useAccountStore()
  const [accountId, setAccountId] = useState<string>('')

  useEffect(() => {
    fetchLogs()
    fetchAccounts()
  }, [])

  const filtered = useMemo(() => {
    return accountId ? logs.filter((l) => l.accountId === accountId) : logs
  }, [logs, accountId])

  const winLoss = filtered.filter((l) => l.status === 'Win' || l.status === 'Loss')
  const wins = winLoss.filter((l) => l.status === 'Win').length
  const losses = winLoss.filter((l) => l.status === 'Loss').length
  const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0'
  const netPoints = winLoss.reduce((acc, l) => acc + (l.pnl || 0), 0)
  const netUsd = winLoss.reduce((acc, l) => acc + (l.usdPnl || 0), 0)
  const avgRR = (() => {
    const arr = winLoss.map((l) => l.riskReward).filter((x) => typeof x === 'number') as number[]
    if (arr.length === 0) return '-'
    const v = arr.reduce((a, b) => a + b, 0) / arr.length
    return v.toFixed(2)
  })()

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">{t('stats.selectAccount')}</label>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">{t('stats.allAccounts')}</option>
            {accounts.map((acc) => (
              <option key={acc.id || acc._id} value={acc.id || acc._id!}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">{t('stats.totalTrades')}</div>
          <div className="text-2xl font-bold">{filtered.length}</div>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">{t('stats.winRate')}</div>
          <div className={cn('text-2xl font-bold', Number(winRate) >= 50 ? 'text-green-500' : 'text-red-500')}>{winRate}%</div>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">{t('stats.netPoints')}</div>
          <div className={cn('text-2xl font-bold', netPoints >= 0 ? 'text-green-500' : 'text-red-500')}>{netPoints >= 0 ? `+${netPoints.toFixed(2)}` : netPoints.toFixed(2)}</div>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="text-xs text-muted-foreground font-medium">{t('stats.netUsd')}</div>
          <div className={cn('text-2xl font-bold', netUsd >= 0 ? 'text-green-500' : 'text-red-500')}>{netUsd >= 0 ? `+$${netUsd.toFixed(2)}` : `-$${Math.abs(netUsd).toFixed(2)}`}</div>
        </div>
      </div>

      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <div className="text-xs text-muted-foreground font-medium mb-2">{t('stats.avgRR')}</div>
        <div className="text-xl font-bold">{avgRR}</div>
      </div>

      <div className="border rounded-md bg-card overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('journal.table.date')}</TableHead>
              <TableHead>{t('journal.table.symbol')}</TableHead>
              <TableHead>{t('journal.table.direction')}</TableHead>
              <TableHead>{t('journal.table.entryExit')}</TableHead>
              <TableHead>{t('journal.table.pnl')}</TableHead>
              <TableHead>{t('journal.table.rrr')}</TableHead>
              <TableHead>{t('journal.table.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7}>{t('journal.loading')}</TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.map((log) => (
              <TableRow key={log.id || log._id}>
                <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                <TableCell>{log.symbol}</TableCell>
                <TableCell>{log.direction}</TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs">
                    <span>{t('journal.in')}: {log.entryPrice}</span>
                    {log.exitPrice && <span>{t('journal.out')}: {log.exitPrice}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={cn('font-medium', (log.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {log.pnl ? (log.pnl > 0 ? `+${log.pnl}` : log.pnl) : '-'}
                  </div>
                  {typeof log.usdPnl === 'number' && (
                    <div className="text-xs text-muted-foreground">
                      {log.usdPnl >= 0 ? `+$${log.usdPnl.toFixed(2)}` : `-$${Math.abs(log.usdPnl).toFixed(2)}`}
                    </div>
                  )}
                </TableCell>
                <TableCell>{typeof log.riskReward === 'number' ? log.riskReward.toFixed(2) : '-'}</TableCell>
                <TableCell>{t(`journal.status.${log.status.toLowerCase()}`)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
