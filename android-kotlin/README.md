# 🚀 Neon Void - Android Kotlin Port

Native Android implementation of the Neon Void space shooter game built with Kotlin, Jetpack Compose, and modern Android architecture.

This is a **native Android port** of the original React Native game, delivering high-performance gameplay with 100% Kotlin and Jetpack Compose UI.

## 🎮 Game Features

This Android port includes all the core gameplay features from the original:

- **Classic Asteroids-style gameplay** with touch controls
- **AI enemy fighters** with intelligent tracking and shooting
- **Wave-based progression** with increasing difficulty
- **Smooth 60fps physics** and collision detection
- **Beautiful neon vector graphics** rendered with Jetpack Compose Canvas
- **Boss battles** with multiple phases
- **Power-up system** (Shield, Rapid Fire, Spread Shot, Magnet)
- **Ship variety** - 4 playable ships with unique abilities
- **Theme system** - 6 customizable neon themes
- **Achievement tracking** and statistics
- **High scores leaderboard** with encrypted local storage
- **Weapon upgrades** - Purchase upgrades with earned credits

For complete game features and mechanics, see the [main project README](../README.md).

## 📋 Build Requirements

### Required Software

- **Android Studio**: Ladybug 2024.2.1 or later
- **JDK**: Version 17 (Amazon Corretto or OpenJDK recommended)
- **Android SDK**: API Level 35 (Android 15)
- **Gradle**: 8.9 (via wrapper - no manual installation needed)
- **Android Gradle Plugin (AGP)**: 8.7.3
- **Kotlin**: 2.0.21 (managed by Gradle)

### SDK Components

Install these via Android Studio SDK Manager:

```
Android SDK Platform 35
Android SDK Build-Tools 35.0.0
Android Emulator
Intel x86 Emulator Accelerator (HAXM) - for Intel CPUs
Google Play Services
```

### Environment Setup

1. **Install JDK 17**:
   ```bash
   # macOS (via Homebrew)
   brew install openjdk@17

   # Verify installation
   java -version  # Should show version 17
   ```

2. **Set JAVA_HOME** (if not already set):
   ```bash
   # macOS/Linux - Add to ~/.zshrc or ~/.bashrc
   export JAVA_HOME=$(/usr/libexec/java_home -v 17)

   # Windows - Set in System Environment Variables
   JAVA_HOME=C:\Program Files\Java\jdk-17
   ```

3. **Verify Gradle**:
   ```bash
   cd android-kotlin
   ./gradlew --version  # Should show Gradle 8.9
   ```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd android-kotlin

# Gradle will auto-download dependencies
./gradlew build
```

### 2. Open in Android Studio

1. Launch Android Studio
2. **File → Open** → Select the `android-kotlin` folder
3. Wait for Gradle sync to complete
4. SDK components will auto-install if missing

### 3. Run on Device/Emulator

#### Option A: Using Android Studio
1. Select a device/emulator from the device dropdown
2. Click the green ▶ **Run** button (or press `Ctrl+R`)

#### Option B: Using Command Line
```bash
# List available devices
./gradlew installDebug

# Run on connected device
adb shell am start -n com.spaceshooter/.MainActivity

# Or use the run task
./gradlew installDebug && adb shell am start -n com.spaceshooter/.MainActivity
```

### 4. First Launch

On first launch, the app will:
- Initialize game state
- Load default settings
- Set up encrypted storage for high scores
- Display the main game screen with tutorial

## 🛠 Tech Stack

### Core Framework
- **Kotlin** 2.0.21 - Modern, type-safe language
- **Jetpack Compose** - Declarative UI framework
- **Coroutines** 1.9.0 - Asynchronous programming
- **Material3** - Latest Material Design components

### Architecture Components
- **Hilt** 2.53.1 - Dependency injection
- **ViewModel** - UI state management
- **Lifecycle** 2.8.7 - Lifecycle-aware components
- **Room** 2.6.1 - Local database (future: persistent stats)
- **DataStore** 1.1.1 - Encrypted preferences storage

### Build Tools
- **Android Gradle Plugin** 8.7.3
- **KSP** 2.0.21-1.0.28 - Kotlin Symbol Processing
- **Gradle Version Catalog** - Centralized dependency management

## 🏗 Architecture Overview

This project follows **Clean Architecture** principles with **MVVM** pattern:

```
┌─────────────────────────────────────────┐
│           Presentation Layer             │
│  (Compose UI + ViewModels + Navigation) │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            Domain Layer                  │
│   (Use Cases + Entities + Interfaces)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              Data Layer                  │
│   (Repositories + DataStore + Room)     │
└─────────────────────────────────────────┘
```

### Dependency Injection

Using **Hilt** for compile-time DI:
- `@HiltAndroidApp` on Application class
- `@AndroidEntryPoint` on Activities/Fragments
- `@HiltViewModel` for ViewModels
- `@Module` + `@InstallIn` for dependency providers

### State Management

- **Unidirectional data flow** via ViewModels
- **Compose State** for reactive UI updates
- **StateFlow** for exposing state to UI
- **Immutable data classes** for game entities

## 📁 Project Structure

```
android-kotlin/
├── app/
│   ├── build.gradle.kts              # App module configuration
│   ├── proguard-rules.pro            # Code obfuscation rules
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml    # App configuration
│           ├── java/com/spaceshooter/
│           │   ├── SpaceShooterApp.kt      # Application class (Hilt)
│           │   ├── MainActivity.kt         # Main entry point
│           │   │
│           │   ├── di/                     # Dependency Injection
│           │   │   └── AppModule.kt        # Hilt modules
│           │   │
│           │   ├── core/                   # Core game logic
│           │   │   ├── constants/
│           │   │   │   └── GameConstants.kt  # Game tuning values
│           │   │   ├── math/
│           │   │   │   └── Vec2.kt          # 2D vector math
│           │   │   └── engine/
│           │   │       ├── GameEngine.kt     # Core game loop
│           │   │       ├── GameState.kt      # Game state data
│           │   │       ├── CollisionSystem.kt # Collision detection
│           │   │       └── SpawnSystem.kt    # Entity spawning
│           │   │
│           │   ├── domain/                  # Business logic
│           │   │   ├── entity/
│           │   │   │   └── Entities.kt       # Game entities
│           │   │   └── model/
│           │   │       └── GameModels.kt     # Data models
│           │   │
│           │   ├── presentation/            # UI layer
│           │   │   ├── game/
│           │   │   │   ├── GameScreen.kt     # Main game screen
│           │   │   │   ├── GameViewModel.kt  # Game state logic
│           │   │   │   └── GameCanvasView.kt # Canvas rendering
│           │   │   └── control/
│           │   │       └── VirtualJoystick.kt # Touch controls
│           │   │
│           │   └── theme/                   # UI theme
│           │       ├── SpaceShooterTheme.kt  # App theme
│           │       └── ThemeColors.kt        # Color schemes
│           │
│           └── res/                         # Android resources
│               ├── values/
│               │   ├── strings.xml          # Localized strings
│               │   └── themes.xml           # Material themes
│               └── drawable/                # Icons and images
│
├── gradle/
│   └── libs.versions.toml          # Version catalog
├── build.gradle.kts                # Root build configuration
├── settings.gradle.kts             # Project settings
├── gradle.properties               # Gradle properties
└── gradlew                         # Gradle wrapper (Unix)
```

## 🔨 Build Commands

### Development Builds

```bash
# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK (unsigned)
./gradlew assembleRelease

# Install debug on connected device
./gradlew installDebug

# Run all checks (lint + tests)
./gradlew check
```

### Code Quality

```bash
# Run Kotlin linter
./gradlew ktlintCheck

# Auto-fix lint issues
./gradlew ktlintFormat

# Run unit tests
./gradlew test

# Run instrumented tests (requires device/emulator)
./gradlew connectedAndroidTest

# Generate test coverage report
./gradlew jacocoTestReport
```

### Build Variants

```bash
# Debug build (default)
./gradlew assembleDebug

# Release build (minified + obfuscated)
./gradlew assembleRelease

# Build all variants
./gradlew assemble
```

### Performance Profiling

```bash
# Build with R8 code shrinker
./gradlew assembleRelease

# Generate build size report
./gradlew :app:buildSizeReport

# Check method count
./gradlew :app:countDebugDexMethods
```

## 🎯 Game Constants

Key tunable values in `GameConstants.kt`:

```kotlin
// Player
PLAYER_ACCEL = 180f           // Ship acceleration
PLAYER_TURN_SPEED = 5.5f      // Rotation speed
PLAYER_MAX_SPEED = 300f       // Maximum velocity

// Weapons
BULLET_SPEED_PLAYER = 420f    // Player bullet velocity
FIRE_COOLDOWN_PLAYER = 0.16f  // Fire rate (seconds)

// Asteroids
ASTEROID_LARGE_RADIUS = 80f   // Large asteroid size
ASTEROID_MEDIUM_RADIUS = 50f  // Medium asteroid size
ASTEROID_SMALL_RADIUS = 30f   // Small asteroid size

// Controls
JOY_DEADZONE = 0.1f           // Joystick sensitivity
JOY_MAX_RADIUS = 60f          // Joystick range
```

## 🎨 Customization

### Adding New Themes

Edit `ThemeColors.kt`:

```kotlin
object NeonThemes {
    val CyberpunkTheme = ThemeColors(
        primary = Color(0xFF00FFFF),      // Cyan
        secondary = Color(0xFFFF00FF),    // Magenta
        background = Color(0xFF0A0E27),   // Dark blue
        // ... more colors
    )
}
```

### Modifying Game Mechanics

Core game logic is in:
- `GameEngine.kt` - Main game loop and update logic
- `CollisionSystem.kt` - Hit detection algorithms
- `SpawnSystem.kt` - Enemy and asteroid spawning
- `GameConstants.kt` - All numeric tuning values

## 🧪 Testing

### Unit Tests

Located in `app/src/test/`:
```bash
# Run all unit tests
./gradlew test

# Run specific test class
./gradlew test --tests "com.spaceshooter.core.math.Vec2Test"
```

### Instrumented Tests

Located in `app/src/androidTest/`:
```bash
# Run all instrumented tests
./gradlew connectedAndroidTest

# Run on specific device
./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.spaceshooter.GameEngineTest
```

## 📦 APK Sizes

| Build Type | Size | Notes |
|------------|------|-------|
| **Debug** | ~15 MB | Includes debug symbols |
| **Release** | ~8 MB | R8 minified + obfuscated |
| **Release (split APKs)** | ~5 MB per ABI | x86, arm64-v8a, armeabi-v7a |

## 🚀 Release Builds

### Generating Signed APK

1. **Create keystore** (first time only):
   ```bash
   keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias spaceshooter
   ```

2. **Configure signing** in `app/build.gradle.kts`:
   ```kotlin
   android {
       signingConfigs {
           create("release") {
               storeFile = file("../release-key.jks")
               storePassword = System.getenv("KEYSTORE_PASSWORD")
               keyAlias = "spaceshooter"
               keyPassword = System.getenv("KEY_PASSWORD")
           }
       }
       buildTypes {
           release {
               signingConfig = signingConfigs.getByName("release")
           }
       }
   }
   ```

3. **Build signed APK**:
   ```bash
   export KEYSTORE_PASSWORD="your_password"
   export KEY_PASSWORD="your_password"
   ./gradlew assembleRelease
   ```

Output: `app/build/outputs/apk/release/app-release.apk`

## 🔧 Troubleshooting

### Build Fails with "SDK Platform 35 not found"

```bash
# Open Android Studio SDK Manager
# Install: Android SDK Platform 35

# Or via command line (if sdkmanager is in PATH)
sdkmanager "platforms;android-35"
```

### Gradle Sync Fails

```bash
# Clear Gradle cache
./gradlew clean
rm -rf ~/.gradle/caches

# Re-sync
./gradlew build --refresh-dependencies
```

### App Crashes on Launch

Check Logcat in Android Studio:
```bash
# View logs via command line
adb logcat | grep "com.spaceshooter"
```

### Performance Issues

1. Enable **R8 full mode** in `gradle.properties`:
   ```properties
   android.enableR8.fullMode=true
   ```

2. Check **ProGuard rules** in `proguard-rules.pro`

3. Profile with Android Studio **Profiler**:
   - CPU Profiler for frame drops
   - Memory Profiler for leaks

## 🔐 Security

### Encrypted Storage

High scores and sensitive data use:
- **EncryptedSharedPreferences** for key-value storage
- **Hardware-backed keystore** on supported devices
- **AES-256 encryption** for data at rest

Implementation in `DataStore` with encrypted preferences.

## 📱 Device Compatibility

| Category | Minimum | Recommended |
|----------|---------|-------------|
| **Android Version** | 8.0 (API 26) | 12.0+ (API 31+) |
| **RAM** | 2 GB | 4 GB+ |
| **CPU** | Dual-core 1.5 GHz | Quad-core 2.0 GHz+ |
| **GPU** | OpenGL ES 3.0 | OpenGL ES 3.2+ |
| **Storage** | 100 MB free | 200 MB+ free |

### Tested Devices
- ✅ Google Pixel 6/7/8 (Android 14)
- ✅ Samsung Galaxy S21/S22 (Android 13+)
- ✅ OnePlus 9/10 (Android 12+)
- ✅ Xiaomi Mi 11 (Android 12+)

## 🛣 Roadmap

- [ ] Implement Room database for statistics persistence
- [ ] Add multiplayer via WebSocket
- [ ] Integrate Google Play Games leaderboards
- [ ] Add haptic feedback via Vibrator API
- [ ] Implement daily challenges
- [ ] Add cloud save via Firebase
- [ ] Support landscape orientation
- [ ] Add gamepad controller support

## 📚 Resources

### Official Documentation
- [Android Developer Guide](https://developer.android.com/guide)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)
- [Hilt Dependency Injection](https://developer.android.com/training/dependency-injection/hilt-android)

### Project References
- [Main Project README](../README.md) - Full game features and mechanics
- [CLAUDE.md](../CLAUDE.md) - Development guidelines and architecture

## 📄 License

This is a port of the original Neon Void game. See the main project for license details.

---

Built with ❤️ using Kotlin and Jetpack Compose
