# 🚀 Neon Void - Space Dogfight Game

A neon-styled 2D space shooter game built with React Native and Expo, featuring:

- **Classic Asteroids-style gameplay** with modern touch controls
- **AI enemy fighters** that track and shoot at the player
- **Wave-based progression** with increasing difficulty
- **Smooth physics** and collision detection
- **Beautiful neon vector graphics** rendered with react-native-skia
- **Immersive background music** that plays throughout gameplay

## Game Features

### Gameplay
- Pilot a spaceship through waves of asteroids
- Combat AI-controlled enemy fighters
- Asteroids split into smaller pieces when destroyed
- Score points by destroying asteroids and enemies
- Track your lives, hull integrity, and wave progression
- **Interactive tutorial** - Instructions modal appears at game start to teach new players how to play

### Controls
- **Center Joystick**: Steer and thrust your ship (improved responsiveness and precision)
- **Tap Screen**: Fire at enemies and asteroids
- **Swipe Gesture**: Swipe anywhere on the screen to quickly move your ship in that direction
- **Top Bar**: Pause and restart controls
- **Tutorial Modal**: Shows at game start with detailed instructions for new players

The ship controls have been optimized for easier aiming with:
- Faster turning speed for precise target tracking
- Reduced joystick deadzone for more responsive control
- Smoother angle transitions for fluid movement

### Scoring
- Small asteroid (tier 1): 20 points
- Medium asteroid (tier 2): 40 points
- Large asteroid (tier 3): 60 points
- Enemy fighter: 150 points

### High Scores Leaderboard
- Top 5 scores are saved locally on your device
- When you achieve a top 5 score, you will be prompted to enter your name
- View the leaderboard on the game over screen
- Compete against yourself to beat your best scores!

## Technical Architecture

### State Management
- **Zustand** for game state (player, enemies, bullets, asteroids, particles)
- **Zustand with AsyncStorage** for persistent high scores leaderboard
- Efficient updates using individual selectors

### Rendering
- **@shopify/react-native-skia** for high-performance 2D canvas rendering
- Vector-based neon graphics
- Real-time particle effects for explosions
- Custom ship and asteroid rendering
- Background music using expo-av

### Physics Engine
- Custom vector math utilities for 2D physics
- Toroidal world wrapping (objects wrap at screen edges)
- Collision detection using distance calculations
- Smooth movement with velocity and acceleration

### Components Structure
```
src/
├── components/
│   ├── GameCanvas.tsx        # Skia canvas renderer
│   └── VirtualControls.tsx   # Touch joystick and fire button
├── screens/
│   └── GameScreen.tsx        # Main game screen with loop
├── state/
│   ├── gameStore.ts          # Zustand game state
│   └── highScoresStore.ts    # Persistent high scores with AsyncStorage
├── types/
│   └── game.ts               # TypeScript interfaces
└── utils/
    ├── vectorMath.ts         # 2D vector operations
    └── gameEngine.ts         # Game loop and physics logic
```

## Game Tuning Constants

Adjust these values in `src/state/gameStore.ts` to modify gameplay:

- `PLAYER_ACCEL`: Ship acceleration speed (180)
- `PLAYER_TURN_SPEED`: Ship rotation speed (5.5 - increased for better aiming)
- `BULLET_SPEED_PLAYER`: Bullet velocity
- `ASTEROID_BASE_RADIUS`: Starting asteroid size
- `JOY_DEADZONE`: Joystick sensitivity threshold (0.1 - reduced for more precise control)

## Development

The game uses:
- **Expo SDK 53** with React Native 0.76.7
- **TypeScript** for type safety
- **Nativewind** for styling (Tailwind for React Native)
- **react-native-reanimated** for smooth animations
- **react-native-gesture-handler** for touch gestures

## Future Enhancement Ideas

- [ ] Power-ups (shields, multi-shot, speed boost)
- [ ] Boss battles every 5 waves
- [x] Persistent high score system with top 5 leaderboard
- [ ] Sound effects for shooting, explosions, and impacts
- [ ] Different ship types with unique abilities
- [ ] Multiplayer co-op mode
- [ ] More enemy types with varied behaviors
- [ ] Background parallax scrolling effect
- [ ] Global leaderboard (would require backend)

---

Built with ❤️ using Vibecode AI App Builder
