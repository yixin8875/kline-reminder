import { useTaskStore } from '../store/useTaskStore'

const playDefaultBeep = (): void => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
  oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1)
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.1)
}

export const playBeep = (): void => {
  const { soundSettings } = useTaskStore.getState()

  if (soundSettings.type === 'custom' && soundSettings.customSoundUrl) {
    try {
      const audio = new Audio(soundSettings.customSoundUrl)
      audio.volume = 1.0
      audio.play().catch(err => {
        console.error("Failed to play custom sound, falling back to beep", err)
        playDefaultBeep()
      })
      return
    } catch (e) {
      console.error("Error creating audio", e)
    }
  }

  playDefaultBeep()
}

export const sendNotification = (title: string, body: string): void => {
  new Notification(title, {
    body,
    silent: true, // We play our own sound
  })
}

export const speakAlert = (symbol: string, periodMinutes: number, seconds: number): void => {
  const { ttsEnabled } = useTaskStore.getState()
  if (!ttsEnabled || !window.speechSynthesis) return

  // Format timeframe for speech (e.g., "15 Minute", "1 Hour", "4 Hour")
  let timeframe = ""
  if (periodMinutes >= 60) {
    const hours = periodMinutes / 60
    timeframe = `${hours} Hour${hours > 1 ? 's' : ''}`
  } else {
    timeframe = `${periodMinutes} Minute${periodMinutes > 1 ? 's' : ''}`
  }

  const text = `Attention. ${symbol} ${timeframe} is closing in ${seconds} seconds.`
  
  // Cancel any pending speech to avoid queue buildup
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  // Set English voice if possible, or default
  // Ideally we might want to allow language selection for TTS, but requirement implies English message.
  // "Attention. BTC 15 Minute is closing in 30 seconds"
  
  utterance.lang = 'en-US' 
  window.speechSynthesis.speak(utterance)
}
