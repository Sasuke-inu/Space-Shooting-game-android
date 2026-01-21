# Split GameScreen.tsx into focused component modules

## Overview

GameScreen.tsx is 1054 lines - nearly triple the recommended size for a React component. It contains the entire game loop, gesture handling, audio setup, and 7+ inline component definitions (ThemeSelector, ShipSelector, StatsDisplay, StatRow, Slider, Toggle), plus 4 different modal UIs. This monolithic structure makes the file difficult to navigate, test, and maintain.

## Rationale

Components over 400 lines significantly increase cognitive load and make code reviews difficult. Each inline component (ThemeSelector, ShipSelector, etc.) should be its own reusable module. The modal UIs are especially good extraction candidates as they're self-contained UI blocks.

---
*This spec was created from ideation and is pending detailed specification.*
