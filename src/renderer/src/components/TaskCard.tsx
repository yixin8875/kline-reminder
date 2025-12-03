import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCountdown } from '../hooks/useCountdown'
import { calculateNextCloseTime } from '../utils/timeCalculator'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Trash2, Clock, BellRing } from 'lucide-react'
import { cn } from '../utils/cn'
import { playBeep, sendNotification } from '../utils/notifier'

interface Task {
  id: string
  name: string
  period: number // minutes
  notifyBefore: number // seconds
  enabled: boolean
}

interface TaskCardProps {
  task: Task
  onDelete: (id: string) => void
}

export function TaskCard({ task, onDelete }: TaskCardProps): JSX.Element {
  const { t } = useTranslation()
  // Calculate target time based on period
  const targetTime = calculateNextCloseTime(task.period)
  
  const handleNotify = useCallback(() => {
    if (!task.enabled) return
    
    playBeep()
    sendNotification(
      t('task.alertTitle', { name: task.name }),
      t('task.alertMessage', { period: task.period, notifyBefore: task.notifyBefore })
    )
  }, [task.name, task.period, task.notifyBefore, task.enabled, t])

  const { formattedTime, secondsLeft, isUrgent } = useCountdown({
    targetDate: targetTime,
    onNotify: handleNotify,
    notifyBefore: task.notifyBefore
  })

  // Calculate progress for visual bar (0 to 100%)
  const periodSeconds = task.period * 60
  const progress = Math.max(0, Math.min(100, ((periodSeconds - secondsLeft) / periodSeconds) * 100))
  
  const isNotifying = secondsLeft <= task.notifyBefore && secondsLeft > 0

  return (
    <Card className={cn(
      "transition-all duration-500 relative overflow-hidden",
      isUrgent ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "border-border",
      isNotifying && "animate-pulse bg-secondary/30"
    )}>
      {/* Progress Bar Background */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-1000"
        style={{ width: `${progress}%` }}
      />

      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-bold text-primary">{task.name}</CardTitle>
          <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
            {task.period >= 60 ? `${task.period / 60}h` : `${task.period}m`}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className={cn(
            "text-4xl font-mono font-bold tracking-tighter",
            isUrgent ? "text-red-500" : "text-foreground"
          )}>
            {formattedTime}
          </div>
          
          <div className="flex flex-col items-end text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <BellRing className="w-3 h-3" />
              -{task.notifyBefore}s
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
