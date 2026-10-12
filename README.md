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
- Top 5 scores are saved locally on your device with encryption
- When you achieve a top 5 score, you will be prompted to enter your name
- View the leaderboard on the game over screen
- Compete against yourself to beat your best scores!
- Scores protected by hardware-backed encryption (Keychain/Keystore)

## Technical Architecture

### State Management
- **Zustand** for game state (player, enemies, bullets, asteroids, particles)
- **Zustand with Expo SecureStore** for encrypted persistent storage (high scores, credits, achievements, settings)
- Efficient updates using individual selectors
- Hardware-backed encryption protects sensitive game data

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
│   └── highScoresStore.ts    # Persistent high scores with SecureStore
├── types/
│   └── game.ts               # TypeScript interfaces
└── utils/
    ├── vectorMath.ts         # 2D vector operations
    └── gameEngine.ts         # Game loop and physics logic
```

## CI/CD Pipeline

This project includes automated continuous integration and deployment via GitHub Actions:

### 🔄 Continuous Integration
- **Automated Testing**: Runs lint, type check, and unit tests on every PR
- **Quality Gates**: Prevents merging broken code into main branch
- **Fast Feedback**: Get results within minutes of pushing code

### 🚀 Continuous Deployment
- **Automated Builds**: iOS and Android builds on every push to main
- **TestFlight/Play Store**: Automatic submission for internal testing
- **Manual Triggers**: Deploy specific platforms on-demand from GitHub Actions UI

### 📚 Documentation
For detailed CI/CD setup instructions, required secrets, and troubleshooting, see:
- **[CI/CD Workflows Guide](.github/workflows/README.md)** - Complete setup and configuration guide

### Quick Setup
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Generate CI token
eas token:create --description "GitHub Actions"

# 4. Add secrets to GitHub repository settings
# - EXPO_TOKEN
# - APPLE_APP_STORE_CONNECT_API_KEY
# - GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
```

## Game Tuning Constants

Adjust these values in `src/state/gameStore.ts` to modify gameplay:

- `PLAYER_ACCEL`: Ship acceleration speed (180)
- `PLAYER_TURN_SPEED`: Ship rotation speed (5.5 - increased for better aiming)
- `BULLET_SPEED_PLAYER`: Bullet velocity
- `ASTEROID_BASE_RADIUS`: Starting asteroid size
- `JOY_DEADZONE`: Joystick sensitivity threshold (0.1 - reduced for more precise control)

## Performance Optimizations

The game has been extensively optimized for smooth 60fps gameplay on mid-range devices:

### Performance Monitoring
- **FPS Counter**: Real-time frame rate display in debug mode (shows current and average FPS)
- **Memory Tracking**: Built-in memory usage monitoring
- **Performance Stats Toggle**: Enable/disable performance overlay in settings

### Object Pooling
To reduce garbage collection pressure and improve frame rates:
- **Particle Pool**: Pre-allocated pool of 500 particle objects (eliminates per-frame allocations)
- **Bullet Pool**: Pre-allocated pool of 300 bullet objects (reduces GC during bullet-heavy scenes)
- **Benefits**: Significantly reduced memory allocations during gameplay, smoother frame times

### Rendering Optimizations
- **Component Memoization**: GameCanvas and VirtualControls wrapped with React.memo to prevent unnecessary re-renders
- **Skia Path Caching**: Ship, boss, and asteroid paths cached to avoid recreation every frame
- **Optimized State Selectors**: Shallow equality checks on game state to minimize React re-renders
- **Reduced Re-render Frequency**: Only update when actual values change, not object references

### Quality Settings
Three quality presets to match device capabilities:

| Quality | Particles | Glow Effects | Target FPS | Target Devices |
|---------|-----------|--------------|------------|----------------|
| **Low** | 25% | Disabled | 45-60 fps | Low-end (2GB RAM) |
| **Medium** | 50% | Enabled | 60 fps | Mid-range (4GB RAM) |
| **High** | 100% | Enabled | 60 fps | High-end (6GB+) |

Adjust quality in **Settings → General → Graphics Quality**

### Performance Benchmarks

#### Low-End Devices (2GB RAM, dual-core)
- **Target**: 45-60 fps on low quality
- **Memory**: < 200MB peak usage
- **Stability**: Zero crashes in 30-minute sessions
- **Settings**: Low quality (25% particles, no glow)

#### Mid-Range Devices (4GB RAM, quad-core)
- **Target**: 60 fps on medium quality
- **Memory**: < 200MB peak, < 10MB growth over 20 minutes
- **Stability**: Zero crashes during extended gameplay
- **Settings**: Medium quality (50% particles, glow enabled)

#### High-End Devices (6GB+ RAM, octa-core)
- **Target**: Consistent 60 fps on high quality
- **Memory**: < 200MB peak
- **Visual Quality**: Full particle effects and glow
- **Settings**: High quality (100% particles, all effects)

### Testing Results
For detailed performance test results and methodologies, see:
- `.auto-claude/specs/011-performance-optimization/PERFORMANCE_TEST_RESULTS.md`
- `.auto-claude/specs/011-performance-optimization/MID_RANGE_TEST_RESULTS.md`
- `.auto-claude/specs/011-performance-optimization/TESTING_GUIDE.md`

### Performance Tips
- Lower **Graphics Quality** if experiencing frame drops
- Disable **Performance Stats** in production for cleaner UI
- Object pooling automatically manages memory - no configuration needed
- Quality settings persist across app restarts

## Development

The game uses:
- **Expo SDK 53** with React Native 0.79
- **TypeScript** for type safety
- **Nativewind** for styling (Tailwind for React Native)
- **react-native-reanimated** for smooth animations
- **react-native-gesture-handler** for touch gestures

Run the same checks as CI before opening a PR:

```bash
npm ci
npm run lint        # must report 0 errors (react-hooks/rules-of-hooks is enforced)
npm run typecheck
npm test
```

Note: `collisionPerformance.test.ts` and `spatialGrid.test.ts` contain wall-clock timing assertions and can fail intermittently on a heavily loaded machine; re-run them before assuming a regression.

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
