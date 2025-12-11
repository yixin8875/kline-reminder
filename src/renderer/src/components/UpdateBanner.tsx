import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { useTranslation } from 'react-i18next'

export function UpdateBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const [available, setAvailable] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [progress, setProgress] = useState<{ percent?: number } | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const onAvail = () => setAvailable(true)
    const onDown = () => { setDownloaded(true); setChecking(false) }
    const onProg = (p: any) => setProgress({ percent: p?.percent })
    window.updates.onAvailable(onAvail)
    window.updates.onDownloaded(onDown)
    window.updates.onProgress(onProg)
    return () => {
      window.updates.offAll()
    }
  }, [])

  const checkNow = async () => {
    setChecking(true)
    const ok = await window.updates.checkForUpdates()
    if (!ok) setChecking(false)
  }

  const installNow = async () => {
    await window.updates.installUpdate()
  }

  if (!available && !checking) return null

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 text-blue-500 px-3 py-2 flex items-center justify-between">
      <div className="text-sm">
        {checking && t('updates.checking')}
        {!checking && available && !downloaded && (
          <span>
            {t('updates.downloading')}
            {progress?.percent != null && (
              <span className="ml-2">{progress.percent!.toFixed(0)}%</span>
            )}
          </span>
        )}
        {!checking && available && downloaded && t('updates.downloaded')}
      </div>
      <div className="flex items-center gap-2">
        {!available && (
          <Button variant="outline" size="sm" onClick={checkNow}>{t('updates.checkNow')}</Button>
        )}
        {available && downloaded && (
          <Button size="sm" onClick={installNow}>{t('updates.installNow')}</Button>
        )}
      </div>
    </div>
  )
}
