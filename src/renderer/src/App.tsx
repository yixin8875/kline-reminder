import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sidebar } from './components/Sidebar'
import { TaskCard } from './components/TaskCard'
import { AddTaskModal } from './components/AddTaskModal'
import { SettingsModal } from './components/SettingsModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ThemeManager } from './components/ThemeManager'
import { UpdateBanner } from './components/UpdateBanner'
import { JournalView } from './components/JournalView'
import { StatsView } from './components/StatsView'
import { useTaskStore } from './store/useTaskStore'
import { useWindowSizeStore } from './store/useWindowSizeStore'

function App(): JSX.Element {
  const { t } = useTranslation()
  const [currentView, setCurrentView] = useState<'reminders' | 'journal' | 'stats'>('reminders')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // Delete Confirmation State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  
  const tasks = useTaskStore((state) => state.tasks)
  const fetchTasks = useTaskStore((state) => state.fetchTasks)
  const removeTask = useTaskStore((state) => state.removeTask)
  const isAlwaysOnTop = useTaskStore((state) => state.isAlwaysOnTop)
  const setAlwaysOnTop = useTaskStore((state) => state.setAlwaysOnTop)
  const getSize = useWindowSizeStore((state) => state.getSize)
  const setSize = useWindowSizeStore((state) => state.setSize)

  // Initial Fetch
  useEffect(() => {
    fetchTasks()
  }, [])

  // Sync Always on Top state with Electron main process
  useEffect(() => {
    window.api.setAlwaysOnTop(isAlwaysOnTop)
  }, [isAlwaysOnTop])

  useEffect(() => {
    const s = getSize('reminders')
    window.api.resizeWindow(s.width, s.height)
  }, [])

  useEffect(() => {
    window.events.onWindowResized(({ width, height }) => {
      setSize(currentView, { width, height })
    })
    return () => {
      window.events.offWindowResized()
    }
  }, [currentView, setSize])

  // Handle Window Resizing based on View
  const handleViewChange = (view: 'reminders' | 'journal' | 'stats') => {
    setCurrentView(view)
    const s = getSize(view)
    window.api.resizeWindow(s.width, s.height)
  }

  const handleDeleteClick = (id: string): void => {
    setTaskToDelete(id)
    setIsDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = (): void => {
    if (taskToDelete) {
      removeTask(taskToDelete)
      setTaskToDelete(null)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground select-none transition-colors duration-300">
      <ThemeManager />
      <UpdateBanner />
      <Sidebar 
        onAddTask={() => setIsAddModalOpen(true)} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        isAlwaysOnTop={isAlwaysOnTop} 
        toggleAlwaysOnTop={() => setAlwaysOnTop(!isAlwaysOnTop)} 
        currentView={currentView}
        onViewChange={handleViewChange}
      />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {currentView === 'reminders' ? (
          <div className="p-4 space-y-3">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onDelete={handleDeleteClick} 
              />
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <p>{t('app.noReminders')}</p>
                <p className="text-xs mt-1">{t('app.addReminderHint')}</p>
              </div>
            )}
          </div>
        ) : currentView === 'journal' ? (
          <JournalView />
        ) : (
          <StatsView />
        )}
      </div>

      <AddTaskModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
      />

      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title={t('confirm.deleteTitle')}
        description={t('confirm.deleteDescription')}
        confirmText={t('task.delete')}
        variant="destructive"
      />
    </div>
  )
}

export default App
