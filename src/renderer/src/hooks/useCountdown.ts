import { useState, useEffect, useRef } from 'react'

interface UseCountdownReturn {
  secondsLeft: number
  formattedTime: string
  isUrgent: boolean // < 10 seconds (or configurable)
}

interface UseCountdownProps {
  targetDate: Date
  onNotify?: () => void
  notifyBefore?: number // seconds
}

export const useCountdown = ({ targetDate, onNotify, notifyBefore = 0 }: UseCountdownProps): UseCountdownReturn => {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const hasNotifiedRef = useRef(false) // Prevent double notification in same cycle
  const lastTargetRef = useRef(targetDate.getTime())
  
  // Use ref to track the interval to clear it properly
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Reset notification flag if target changes
    if (lastTargetRef.current !== targetDate.getTime()) {
      hasNotifiedRef.current = false
      lastTargetRef.current = targetDate.getTime()
    }

    const tick = (): void => {
      const now = new Date()
      const diff = targetDate.getTime() - now.getTime()
      const sec = Math.max(0, Math.ceil(diff / 1000))
      
      setSecondsLeft(sec)

      // Check for notification trigger
      // Condition: Time is within notify window AND hasn't notified yet AND notify callback exists
      if (onNotify && sec <= notifyBefore && sec > 0 && !hasNotifiedRef.current) {
        onNotify()
        hasNotifiedRef.current = true
      }
    }

    // Initial call
    tick()

    // Set interval
    intervalRef.current = setInterval(tick, 1000)

    return (): void => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [targetDate, notifyBefore, onNotify]) // Re-run if dependencies change

  const formatTime = (totalSeconds: number): string => {

    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return {
    secondsLeft,
    formattedTime: formatTime(secondsLeft),
    isUrgent: secondsLeft > 0 && secondsLeft <= 10
  }
}
