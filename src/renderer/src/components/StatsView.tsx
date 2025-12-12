import { useEffect, useMemo, useState } from 'react'
import { useJournalStore } from '../store/useJournalStore'
import { useAccountStore } from '../store/useAccountStore'
import { useTranslation } from 'react-i18next'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '../utils/cn'
import { useStrategyStore } from '../store/useStrategyStore'

export function StatsView(): JSX.Element {
  const { t } = useTranslation()
  const { logs, fetchLogs, isLoading } = useJournalStore()
  const { accounts, fetchAccounts } = useAccountStore()
  const { strategies, fetchStrategies } = useStrategyStore()
  const [accountId, setAccountId] = useState<string>('')
  const [rangeMode, setRangeMode] = useState<'week' | 'month' | 'year' | 'custom'>('week')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  useEffect(() => {
    fetchLogs()
    fetchAccounts()
    fetchStrategies()
  }, [])

  const dateRange = useMemo(() => {
    const now = new Date()
    if (rangeMode === 'week') {
      const d = now.getDay() || 7
      const start = new Date(now)
      start.setDate(now.getDate() - (d - 1))
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return { start: start.getTime(), end: end.getTime() }
    }
    if (rangeMode === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return { start: start.getTime(), end: end.getTime() }
    }
    if (rangeMode === 'year') {
      const start = new Date(now.getFullYear(), 0, 1)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return { start: start.getTime(), end: end.getTime() }
    }
    if (rangeMode === 'custom') {
      if (fromDate && toDate) {
        const start = new Date(fromDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(toDate)
        end.setHours(23, 59, 59, 999)
        return { start: start.getTime(), end: end.getTime() }
      }
    }
    return { start: 0, end: Number.MAX_SAFE_INTEGER }
  }, [rangeMode, fromDate, toDate])

  const filtered = useMemo(() => {
    const base = accountId ? logs.filter((l) => l.accountId === accountId) : logs
    return base.filter((l) => l.date >= dateRange.start && l.date <= dateRange.end)
  }, [logs, accountId, dateRange])

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

  const stratWinRates = useMemo(() => {
    const groups: Record<string, { name: string; wins: number; losses: number; total: number }> = {}
    for (const log of winLoss) {
      const sid = (log as any).strategyId || ''
      const sName = sid ? (strategies.find((s) => (s.id || s._id) === sid)?.name || sid) : t('strategy.selectPlaceholder')
      const g = groups[sid] || { name: sName, wins: 0, losses: 0, total: 0 }
      if (log.status === 'Win') g.wins += 1
      if (log.status === 'Loss') g.losses += 1
      g.total += 1
      groups[sid] = g
    }
    const arr = Object.values(groups)
    return arr.map((g) => ({
      name: g.name,
      winRate: g.total > 0 ? (g.wins / g.total) * 100 : 0,
      total: g.total
    })).sort((a, b) => b.winRate - a.winRate)
  }, [winLoss, strategies, t])

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-end gap-4 flex-wrap">
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

        <div className="space-y-1">
          <label className="text-sm font-medium">{t('stats.range')}</label>
          <div className="flex items-center gap-2">
            <Button variant={rangeMode === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setRangeMode('week')}>{t('stats.thisWeek')}</Button>
            <Button variant={rangeMode === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setRangeMode('month')}>{t('stats.thisMonth')}</Button>
            <Button variant={rangeMode === 'year' ? 'default' : 'outline'} size="sm" onClick={() => setRangeMode('year')}>{t('stats.thisYear')}</Button>
            <Button variant={rangeMode === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setRangeMode('custom')}>{t('stats.custom')}</Button>
          </div>
        </div>

        {rangeMode === 'custom' && (
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('stats.from')}</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('stats.to')}</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        )}

        <div className="ml-auto mb-1">
          <Button
            variant="outline"
            onClick={async () => {
              const payload: { accountId?: string; start?: number; end?: number } = {}
              if (accountId) payload.accountId = accountId
              if (rangeMode === 'custom' && fromDate && toDate) {
                const start = new Date(fromDate); start.setHours(0,0,0,0)
                const end = new Date(toDate); end.setHours(23,59,59,999)
                payload.start = start.getTime()
                payload.end = end.getTime()
              } else {
                payload.start = dateRange.start
                payload.end = dateRange.end
              }
              const res = await window.exports.exportJournalExcel(payload)
              if (res?.success) {
                // simple notification
                new Notification(t('stats.exportSuccess'), { body: res.path || '' })
              } else {
                new Notification(t('stats.exportFailed'))
              }
            }}
          >{t('stats.exportExcel')}</Button>
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

      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <div className="text-xs text-muted-foreground font-medium mb-3">{t('stats.strategyWinRates')}</div>
        <div className="space-y-2">
          {stratWinRates.length === 0 && (
            <div className="text-xs text-muted-foreground">{t('stats.noData')}</div>
          )}
          {stratWinRates.map((s) => (
            <div key={s.name} className="grid grid-cols-5 gap-2 items-center">
              <div className="col-span-1 text-xs">{s.name}</div>
              <div className="col-span-3 h-3 bg-muted rounded overflow-hidden">
                <div
                  className={cn('h-full rounded bg-green-500')}
                  style={{ width: `${Math.min(100, Math.max(0, s.winRate))}%` }}
                />
              </div>
              <div className={cn('col-span-1 text-xs text-right', s.winRate >= 50 ? 'text-green-600' : 'text-red-600')}>
                {s.winRate.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
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
