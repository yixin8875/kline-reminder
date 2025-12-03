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
