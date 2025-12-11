export type TradeDirection = 'Long' | 'Short'
export type TradeStatus = 'Open' | 'Closed' | 'Win' | 'Loss'

export interface TradeLog {
  _id?: string
  id?: string
  date: number
  symbol: string
  instrumentId?: string
  accountId?: string
  direction: TradeDirection
  entryPrice: number
  exitPrice?: number
  status: TradeStatus
  pnl?: number
  usdPnl?: number
  notes?: string
  imageFileName?: string
  imageFileNames?: string[]
}

export interface CreateTradeLogDTO {
  date: number
  symbol: string
  instrumentId?: string
  accountId?: string
  direction: TradeDirection
  entryPrice: number
  exitPrice?: number
  status: TradeStatus
  pnl?: number
  usdPnl?: number
  notes?: string
  image?: string
  images?: string[]
}
