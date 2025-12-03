import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Pin, PinOff, Plus, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SidebarProps {
  onAddTask: () => void
  onOpenSettings: () => void
  isAlwaysOnTop: boolean
  toggleAlwaysOnTop: () => void
}

export function Sidebar({ onAddTask, onOpenSettings, isAlwaysOnTop, toggleAlwaysOnTop }: SidebarProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur sticky top-0 z-10">
      <h1 className="text-xl font-bold text-primary tracking-tight">{t('app.title')}</h1>
      
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

        <Button variant="default" size="icon" onClick={onAddTask} title={t('sidebar.addReminder')}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
