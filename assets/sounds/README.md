# Sound Effects

## Current Status
⚠️ **These are temporary placeholder files** copied from the existing sound effect asset. They are valid MP3 files that will allow the game to run without errors, but they should be replaced with proper, context-appropriate sound effects for the best game experience.

## Required Sound Effects

### 1. shoot_player.mp3
- **Type:** Laser/weapon firing sound
- **Description:** Clean, sharp laser sound for player weapon
- **Duration:** 0.2-0.5 seconds
- **Suggested characteristics:** High-pitched, energetic, satisfying "pew" or "zap"

### 2. shoot_enemy.mp3
- **Type:** Enemy weapon firing sound
- **Description:** Different from player to distinguish threats
- **Duration:** 0.2-0.5 seconds
- **Suggested characteristics:** Lower-pitched, more menacing than player shot

### 3. explosion_small.mp3
- **Type:** Small explosion (asteroids)
- **Description:** Impact sound for asteroid destruction
- **Duration:** 0.3-0.8 seconds
- **Suggested characteristics:** Sharp crack with some rumble

### 4. explosion_large.mp3
- **Type:** Large explosion (enemies, bosses)
- **Description:** Bigger, more dramatic explosion
- **Duration:** 0.5-1.5 seconds
- **Suggested characteristics:** Deep boom, satisfying impact

### 5. powerup_pickup.mp3
- **Type:** Power-up collection
- **Description:** Positive feedback for collecting power-ups
- **Duration:** 0.3-0.7 seconds
- **Suggested characteristics:** Bright, pleasant chime or "ding"

### 6. boss_warning.mp3
- **Type:** Boss warning alert
- **Description:** Dramatic warning before boss appearance
- **Duration:** 1-2 seconds
- **Suggested characteristics:** Ominous siren, alarm, or dramatic sting

### 7. combo.mp3
- **Type:** Combo milestone notification
- **Description:** Reward sound for achieving combo multiplier
- **Duration:** 0.3-0.8 seconds
- **Suggested characteristics:** Exciting, uplifting notification sound

## Where to Source Sound Effects

### Free Sound Libraries (Recommended)
1. **OpenGameArt.org** - https://opengameart.org/
   - Search for "laser", "explosion", "power-up"
   - Filter by license (CC0 or CC-BY recommended)
   - Download MP3 or WAV files

2. **Freesound.org** - https://freesound.org/
   - Requires free account
   - Excellent quality and variety
   - Check license (CC0 or CC-BY recommended)

3. **Zapsplat.com** - https://www.zapsplat.com/
   - Free for game development
   - Good sci-fi sound section

### Sound Generation Tools
1. **BFXR** - https://www.bfxr.net/
   - Browser-based retro sound generator
   - Great for arcade-style sounds
   - Export as WAV, convert to MP3

2. **ChipTone** - https://sfbgames.itch.io/chiptone
   - Desktop app for chiptune sounds
   - Perfect for retro game feel

3. **jfxr** - https://jfxr.frozenfractal.com/
   - Modern fork of BFXR
   - More features and better UI

## File Requirements
- **Format:** MP3 or WAV
- **Size:** Keep under 100KB each for optimal performance
- **Sample Rate:** 44.1kHz recommended
- **Bit Rate:** 128kbps or lower for MP3 (good balance of quality/size)

## Converting Audio Files
If you have WAV files that need to be converted to MP3:

```bash
# Using ffmpeg (install via: brew install ffmpeg)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k output.mp3

# Batch convert all WAV files
for f in *.wav; do ffmpeg -i "$f" -codec:a libmp3lame -b:a 128k "${f%.wav}.mp3"; done
```

## Testing Sound Effects
After replacing the placeholder files:
1. Run `npm start` to launch the game
2. Test each sound effect:
   - Fire weapon → shoot_player.mp3
   - Enemy fires → shoot_enemy.mp3
   - Destroy asteroid → explosion_small.mp3
   - Destroy enemy → explosion_large.mp3
   - Collect power-up → powerup_pickup.mp3
   - Reach wave 5 → boss_warning.mp3
   - Get 3+ combo → combo.mp3

## License Considerations
- Ensure you have the right to use sound effects in your game
- CC0 (Public Domain) is safest - no attribution required
- CC-BY requires attribution in your game credits
- Check each sound's specific license terms
