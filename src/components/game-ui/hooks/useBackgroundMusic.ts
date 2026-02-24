import { useEffect } from 'react'
import { useAudioPlayer } from 'expo-audio'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bgMusicSource = require('../../../assets/background-music.mp3')

/**
 * Custom hook to manage background music playback
 * Uses expo-audio (replaces deprecated expo-av)
 */
export function useBackgroundMusic(musicVolume: number) {
  const player = useAudioPlayer(bgMusicSource)

  // Setup and play background music
  useEffect(() => {
    if (!player) return

    try {
      player.loop = true
      player.volume = musicVolume
      player.play()
    } catch (error) {
      console.warn('Failed to play background music:', error)
    }

    return () => {
      try {
        player.pause()
      } catch {
        // Silently fail on cleanup
      }
    }
  }, [player])

  // Update music volume when changed
  useEffect(() => {
    if (player) {
      player.volume = musicVolume
    }
  }, [player, musicVolume])
}
