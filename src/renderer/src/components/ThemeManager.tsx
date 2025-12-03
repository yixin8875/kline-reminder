import { useEffect } from 'react'
import { useTaskStore } from '../store/useTaskStore'

export function ThemeManager(): null {
  const { themeSettings } = useTaskStore()

  // Handle Dark/Light Mode
  useEffect(() => {
    const root = window.document.documentElement

    const applyTheme = (isDark: boolean): void => {
      root.classList.remove('light', 'dark')
      root.classList.add(isDark ? 'dark' : 'light')
    }

    if (themeSettings.mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(systemTheme.matches)

      const listener = (e: MediaQueryListEvent): void => {
        applyTheme(e.matches)
      }

      systemTheme.addEventListener('change', listener)
      return (): void => systemTheme.removeEventListener('change', listener)
    } else {
      applyTheme(themeSettings.mode === 'dark')
    }
    return
  }, [themeSettings.mode])

  // Handle Primary Color
  useEffect(() => {
    const root = window.document.documentElement
    
    if (themeSettings.primaryColor === 'default') {
      root.style.removeProperty('--primary')
      root.style.removeProperty('--primary-foreground')
      root.style.removeProperty('--ring')
    } else {
      root.style.setProperty('--primary', themeSettings.primaryColor)
      root.style.setProperty('--primary-foreground', '0 0% 100%') // Always white text for custom colors
      root.style.setProperty('--ring', themeSettings.primaryColor) // Match ring color
    }
  }, [themeSettings.primaryColor])

  return null
}
