import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Pin, PinOff, Plus, Settings, Clock, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../utils/cn'

interface SidebarProps {
  onAddTask: () => void
  onOpenSettings: () => void
  isAlwaysOnTop: boolean
  toggleAlwaysOnTop: () => void
  currentView: 'reminders' | 'journal'
  onViewChange: (view: 'reminders' | 'journal') => void
}

export function Sidebar({ 
  onAddTask, 
  onOpenSettings, 
  isAlwaysOnTop, 
  toggleAlwaysOnTop,
  currentView,
  onViewChange
}: SidebarProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* View Switcher */}
        <div className="flex bg-secondary/50 rounded-lg p-1 gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 px-3", currentView === 'reminders' && "bg-background shadow-sm")}
            onClick={() => {
              onViewChange('reminders')
            }}
            title={t('sidebar.reminders')}
          >
            <Clock className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('sidebar.reminders')}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 px-3", currentView === 'journal' && "bg-background shadow-sm")}
            onClick={() => {
              onViewChange('journal')
            }}
            title={t('sidebar.journal')}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('sidebar.journal')}</span>
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-2" title={t('sidebar.alwaysOnTop')}>
          <Switch 
            checked={isAlwaysOnTop} 
            onChange={toggleAlwaysOnTop} 
          />
          {isAlwaysOnTop ? <Pin className="w-4 h-4 text-primary" /> : <PinOff className="w-4 h-4 text-muted-foreground" />}
        </div>

        <Button variant="ghost" size="icon" onClick={onOpenSettings} title={t('sidebar.settings')}>
          <Settings className="w-5 h-5" />
        </Button>

        {currentView === 'reminders' && (
          <Button variant="default" size="icon" onClick={onAddTask} title={t('sidebar.addReminder')}>
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
