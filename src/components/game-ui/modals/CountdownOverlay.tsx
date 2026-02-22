import React, { useEffect, useState } from 'react'
import { View, Text, Modal } from 'react-native'
import { ThemeColors } from '../../../theme/types'

export interface CountdownOverlayProps {
  visible: boolean
  onComplete: () => void
  colors: ThemeColors
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  visible,
  onComplete,
  colors,
}) => {
  const [countdown, setCountdown] = useState<number | 'GO'>(3)

  useEffect(() => {
    if (!visible) {
      // Reset countdown when overlay becomes hidden
      setCountdown(3)
      return
    }

    // Start countdown sequence: 3 → 2 → 1 → GO → complete
    if (countdown === 3 || countdown === 2 || countdown === 1) {
      const timer = setTimeout(() => {
        if (countdown === 1) {
          setCountdown('GO')
        } else {
          setCountdown(countdown - 1)
        }
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 'GO') {
      // Show 'GO' for 0.5 seconds then trigger onComplete
      const timer = setTimeout(() => {
        onComplete()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [visible, countdown, onComplete])

  if (!visible) return null

  return (
    <Modal visible={true} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.modalOverlay,
        }}
      >
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 120,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {countdown}
        </Text>
      </View>
    </Modal>
  )
}
