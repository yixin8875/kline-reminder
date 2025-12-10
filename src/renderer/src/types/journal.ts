export type TradeDirection = 'Long' | 'Short'
export type TradeStatus = 'Open' | 'Closed' | 'Win' | 'Loss'

export interface TradeLog {
  _id?: string // NeDB uses _id
  id?: string // For compatibility if we map it
  date: number // Timestamp
  symbol: string
  direction: TradeDirection
  entryPrice: number
  exitPrice?: number
  status: TradeStatus
  pnl?: number
  notes?: string
  imageFileName?: string
  imageFileNames?: string[]
}

export interface CreateTradeLogDTO {
  date: number
  symbol: string
  direction: TradeDirection
  entryPrice: number
  exitPrice?: number
  status: TradeStatus
  pnl?: number
  notes?: string
  image?: string // Base64 string for creation only
  images?: string[]
}
