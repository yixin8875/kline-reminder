import { useEffect, useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { useTaskStore, ThemeMode } from '../store/useTaskStore'
import { Volume2, Upload, Moon, Sun, Monitor, Globe, Mic } from 'lucide-react'
import { cn } from '../utils/cn'
import { useTranslation } from 'react-i18next'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const THEME_COLORS = [
  { key: 'default', value: 'default', color: 'hsl(var(--primary))' },
  { key: 'blue', value: '221.2 83.2% 53.3%', color: 'hsl(221.2, 83.2%, 53.3%)' },
  { key: 'green', value: '142.1 76.2% 36.3%', color: 'hsl(142.1, 76.2%, 36.3%)' },
  { key: 'orange', value: '20.5 90.2% 48.2%', color: 'hsl(20.5, 90.2%, 48.2%)' },
  { key: 'red', value: '0 72.2% 50.6%', color: 'hsl(0, 72.2%, 50.6%)' },
  { key: 'violet', value: '262.1 83.3% 57.8%', color: 'hsl(262.1, 83.3%, 57.8%)' },
]

export function SettingsModal({ open, onOpenChange }: SettingsModalProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { soundSettings, setSoundSettings, themeSettings, setThemeSettings, ttsEnabled, setTtsEnabled } = useTaskStore()
  
  // Sound State
  const [soundType, setSoundType] = useState<'default' | 'custom'>(soundSettings.type)
  const [customSoundUrl, setCustomSoundUrl] = useState<string | null>(soundSettings.customSoundUrl)
  const [customSoundName, setCustomSoundName] = useState<string | null>(soundSettings.customSoundName)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Theme State
  const [mode, setMode] = useState<ThemeMode>(themeSettings.mode)
  const [primaryColor, setPrimaryColor] = useState<string>(themeSettings.primaryColor)

  // Sync with store when opening
  useEffect(() => {
    if (open) {
      setSoundType(soundSettings.type)
      setCustomSoundUrl(soundSettings.customSoundUrl)
      setCustomSoundName(soundSettings.customSoundName)
      
      setMode(themeSettings.mode)
      setPrimaryColor(themeSettings.primaryColor)
    }
  }, [open, soundSettings, themeSettings])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert(t('settings.fileTooLarge'))
        return
      }

      const reader = new FileReader()
      reader.onload = (event): void => {
        if (event.target?.result) {
          setCustomSoundUrl(event.target.result as string)
          setCustomSoundName(file.name)
          setSoundType('custom')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = (): void => {
    setSoundSettings({
      type: soundType,
      customSoundUrl,
      customSoundName
    })
    setThemeSettings({
      mode,
      primaryColor
    })
    onOpenChange(false)
  }

  const handleTestSound = (): void => {
    if (soundType === 'custom' && customSoundUrl) {
       const audio = new Audio(customSoundUrl)
       audio.play().catch(e => console.error("Play error", e))
    } else {
       const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
       const oscillator = audioContext.createOscillator()
       const gainNode = audioContext.createGain()
       oscillator.connect(gainNode)
       gainNode.connect(audioContext.destination)
       oscillator.type = 'sine'
       oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
       oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1)
       gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
       gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
       oscillator.start()
       oscillator.stop(audioContext.currentTime + 0.1)
    }
  }

  const toggleLanguage = (): void => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh'
    i18n.changeLanguage(newLang)
  }

  return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
         <DialogHeader>
           <DialogTitle>{t('settings.title')}</DialogTitle>
         </DialogHeader>
         
         <div className="grid gap-6 py-4">
            {/* Language Settings */}
            <div className="space-y-3">
             <h3 className="text-sm font-medium text-muted-foreground">{t('settings.language')}</h3>
             <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" onClick={toggleLanguage} className="w-full flex items-center justify-center gap-2">
                 <Globe className="w-4 h-4" />
                 {i18n.language === 'zh' ? 'English' : '中文'}
               </Button>
             </div>
           </div>

           <div className="h-[1px] bg-border" />

           {/* Voice Alert Settings */}
           <div className="space-y-3">
             <h3 className="text-sm font-medium text-muted-foreground">{t('settings.voiceAlert')}</h3>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Mic className="w-4 h-4 text-muted-foreground" />
                 <span className="text-sm">{t('settings.enableVoiceAlert')}</span>
               </div>
               <Switch 
                 checked={ttsEnabled} 
                 onChange={(e) => setTtsEnabled(e.target.checked)} 
               />
             </div>
           </div>

           <div className="h-[1px] bg-border" />

           {/* Sound Settings */}
           <div className="space-y-3">
             <h3 className="text-sm font-medium text-muted-foreground">{t('settings.sound')}</h3>
             <div className="space-y-3 pl-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="default-sound"
                    value="default"
                    checked={soundType === 'default'}
                    onChange={() => setSoundType('default')}
                    className="w-4 h-4 text-primary bg-background border-input focus:ring-ring"
                  />
                  <label htmlFor="default-sound" className="text-sm font-medium cursor-pointer">{t('settings.defaultBeep')}</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="custom-sound"
                    value="custom"
                    checked={soundType === 'custom'}
                    onChange={() => setSoundType('custom')}
                    className="w-4 h-4 text-primary bg-background border-input focus:ring-ring"
                  />
                  <label htmlFor="custom-sound" className="text-sm font-medium cursor-pointer">{t('settings.customSound')}</label>
                </div>

                {soundType === 'custom' && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-2" />
                          {t('settings.uploadFile')}
                        </Button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          accept="audio/*" 
                          className="hidden" 
                          onChange={handleFileChange} 
                        />
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={customSoundName || ""}>
                          {customSoundName || t('settings.noFileSelected')}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{t('settings.supportedFormats')}</p>
                    </div>
                )}
             </div>
             <Button type="button" variant="secondary" size="sm" onClick={handleTestSound} className="w-full flex items-center gap-1 mt-2">
                <Volume2 className="w-4 h-4" /> {t('settings.testSound')}
             </Button>
           </div>

           <div className="h-[1px] bg-border" />

           {/* Theme Settings */}
           <div className="space-y-3">
             <h3 className="text-sm font-medium text-muted-foreground">{t('settings.appearance')}</h3>
             
             {/* Mode Selector */}
             <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={mode === 'light' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setMode('light')}
                  className="flex items-center gap-2"
                >
                  <Sun className="w-4 h-4" /> {t('settings.light')}
                </Button>
                <Button 
                  variant={mode === 'dark' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setMode('dark')}
                  className="flex items-center gap-2"
                >
                  <Moon className="w-4 h-4" /> {t('settings.dark')}
                </Button>
                <Button 
                  variant={mode === 'system' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setMode('system')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="w-4 h-4" /> {t('settings.system')}
                </Button>
             </div>

             {/* Color Selector */}
             <div className="space-y-2">
               <label className="text-sm font-medium">{t('settings.accentColor')}</label>
               <div className="flex flex-wrap gap-3">
                 {THEME_COLORS.map((color) => (
                   <button
                     key={color.key}
                     onClick={() => setPrimaryColor(color.value)}
                     className={cn(
                       "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                       primaryColor === color.value ? "border-foreground" : "border-transparent hover:border-muted-foreground/50"
                     )}
                     title={t(`settings.colors.${color.key}`)}
                   >
                     <div 
                        className="w-6 h-6 rounded-full border border-black/10"
                        style={{ backgroundColor: color.color }}
                     />
                   </button>
                 ))}
               </div>
             </div>
           </div>
         </div>

         <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('settings.cancel')}</Button>
            <Button onClick={handleSave}>{t('settings.save')}</Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
  )
}
