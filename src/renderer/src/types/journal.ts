export type TradeDirection = 'Long' | 'Short'
export type TradeStatus = 'Open' | 'Closed' | 'Win' | 'Loss'

export interface TradeLog {
  _id?: string
  id?: string
  date: number
  symbol: string
  instrumentId?: string
  accountId?: string
  strategyId?: string
  direction: TradeDirection
  entryPrice: number
  exitPrice?: number
  stopLoss?: number
  positionSize?: number
  status: TradeStatus
  pnl?: number
  usdPnl?: number
  riskReward?: number
  notes?: string
  imageFileName?: string
  imageFileNames?: string[]
}

export interface CreateTradeLogDTO {
  date: number
  symbol: string
  instrumentId?: string
  accountId?: string
  strategyId?: string
  direction: TradeDirection
  entryPrice: number
  exitPrice?: number
  stopLoss?: number
  positionSize?: number
  status: TradeStatus
  pnl?: number
  usdPnl?: number
  riskReward?: number
  notes?: string
  image?: string
  images?: string[]
}
