export const calculateNextCloseTime = (periodMinutes: number, now: Date = new Date()): Date => {
  const periodMs = periodMinutes * 60 * 1000
  
  // Strategy: Calculate offset from the start of the current local day
  // This ensures alignment with local clock time (00:00, 00:15, etc.)
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  
  const timeSinceStartOfDay = now.getTime() - startOfDay.getTime()
  
  // Calculate next slot
  let nextSlotMs = Math.ceil(timeSinceStartOfDay / periodMs) * periodMs
  
  // If currently exactly on the boundary (e.g. 10:15:00.000), move to next
  if (nextSlotMs <= timeSinceStartOfDay) {
    nextSlotMs += periodMs
  }
  
  return new Date(startOfDay.getTime() + nextSlotMs)
}

export const formatTimeLeft = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
