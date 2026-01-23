import React from "react"
import { Canvas, Circle, vec } from "@shopify/react-native-skia"
import type { ThemeColors } from "../theme/types"

interface AnimatedStarBackgroundProps {
  width: number
  height: number
  colors: ThemeColors
  time?: number
  starCount?: number
  speed?: number
}

export const AnimatedStarBackground: React.FC<AnimatedStarBackgroundProps> = ({
  width,
  height,
  colors,
  time = 0,
  starCount = 50,
  speed = 8,
}) => {
  // Generate animated stars
  const stars = React.useMemo(() => {
    const starArray = []
    for (let i = 0; i < starCount; i++) {
      starArray.push({
        x: (i * 97) % width,
        y: ((i * 57 + time * speed) % height),
        size: 1 + (i % 3) * 0.5, // Varying star sizes (1, 1.5, 2)
        opacity: 0.3 + (i % 5) * 0.15, // Varying opacity (0.3 to 0.9)
      })
    }
    return starArray
  }, [width, height, time, starCount, speed])

  return (
    <Canvas style={{ width, height }}>
      {/* Background */}
      <Circle
        cx={width / 2}
        cy={height / 2}
        r={Math.max(width, height)}
        color={colors.background}
      />

      {/* Animated stars */}
      {stars.map((star, i) => (
        <Circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.size}
          color={colors.stars}
          opacity={star.opacity}
        />
      ))}
    </Canvas>
  )
}
