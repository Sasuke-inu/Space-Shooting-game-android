import { useEffect, useRef } from 'react'
import { Audio } from 'expo-av'

/**
 * Custom hook to manage background music playback
 * Handles audio setup, playback, and volume control
 */
export function useBackgroundMusic(musicVolume: number) {
  const soundRef = useRef<Audio.Sound | null>(null)

  // Setup and play background music
  useEffect(() => {
    let isMounted = true

    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        })

        const { sound } = await Audio.Sound.createAsync(
          require('../../../assets/music-1762534655955.mp3'),
          { isLooping: true, volume: musicVolume }
        )

        if (isMounted) {
          soundRef.current = sound
          await sound.playAsync()
        }
      } catch (error) {
        console.warn('Failed to load background music:', error)
      }
    }

    setupAudio()

    return () => {
      isMounted = false
      if (soundRef.current) {
        soundRef.current.unloadAsync()
      }
    }
  }, [])

  // Update music volume when changed
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setVolumeAsync(musicVolume)
    }
  }, [musicVolume])
}
