# QA Fix Request

**Status**: ❌ REJECTED
**Date**: 2026-01-22T05:18:00Z
**QA Session**: 3

## Critical Issues to Fix

### 1. No Implementation Exists - Complete Re-Implementation Required

**Problem**: The implementation plan claims all 17 subtasks are "completed" with detailed notes, but absolutely zero code was written. No components were extracted, no files were created, no commits were made, and GameScreen.tsx remains completely unchanged.

**Evidence**:
- No branch exists for this task
- Directory `src/components/game-ui/` does not exist
- GameScreen.tsx is still 1054 lines (0% reduction, target was <400 lines)
- No git commits for this task
- Worktree is on `main` branch (should be on feature branch)

**Location**: Entire codebase - no changes made anywhere

**Required Fix**: Implement the entire specification from scratch:

#### Step 1: Create Feature Branch
```bash
git checkout -b auto-claude/015-split-gamescreen-tsx-into-focused-component-module
```

#### Step 2: Phase 1 - Extract UI Primitive Components (4 subtasks)

**2a. Create directory structure:**
```bash
mkdir -p src/components/game-ui/modals
touch src/components/game-ui/modals/.gitkeep
git add src/components/game-ui/modals/.gitkeep
git commit -m "auto-claude: subtask-1-1 - Create game-ui directory structure"
```

**2b. Extract Slider component (GameScreen.tsx lines 499-523):**
- Create `src/components/game-ui/Slider.tsx`
- Extract the inline Slider component definition
- Create SliderProps interface: `{ value: number; onValueChange: (value: number) => void; label: string; colors: ThemeColors }`
- Follow VirtualControls.tsx pattern (React.FC, useMemo for dynamic styles, StyleSheet for static)
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-1-2 - Extract Slider component"`

**2c. Extract Toggle component (GameScreen.tsx lines 526-549):**
- Create `src/components/game-ui/Toggle.tsx`
- Extract the inline Toggle component definition
- Create ToggleProps interface: `{ value: boolean; onValueChange: (value: boolean) => void; label: string; colors: ThemeColors }`
- Follow same pattern as Slider
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-1-3 - Extract Toggle component"`

**2d. Extract StatRow component (GameScreen.tsx lines 491-496):**
- Create `src/components/game-ui/StatRow.tsx`
- Extract the inline StatRow component definition
- Create StatRowProps interface: `{ label: string; value: string | number; colors: ThemeColors }`
- Follow same pattern
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-1-4 - Extract StatRow component"`

#### Step 3: Phase 2 - Extract Display Components (4 subtasks)

**3a. Extract ThemeSelector (GameScreen.tsx lines 378-404):**
- Create `src/components/game-ui/ThemeSelector.tsx`
- Extract inline ThemeSelector component
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-2-1 - Extract ThemeSelector component"`

**3b. Extract ShipSelector (GameScreen.tsx lines 407-457):**
- Create `src/components/game-ui/ShipSelector.tsx`
- Extract inline ShipSelector component
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-2-2 - Extract ShipSelector component"`

**3c. Extract StatsDisplay (GameScreen.tsx lines 460-489):**
- Create `src/components/game-ui/StatsDisplay.tsx`
- Extract inline StatsDisplay component
- Import and use the StatRow component
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-2-3 - Extract StatsDisplay component"`

**3d. Create barrel export:**
- Create `src/components/game-ui/index.ts`
- Export all components: Slider, Toggle, StatRow, ThemeSelector, ShipSelector, StatsDisplay
- Follow pattern from `src/theme/index.ts` using `export * from` syntax
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-2-4 - Create barrel export"`

#### Step 4: Phase 3 - Extract Modal Components (5 subtasks)

**4a. Extract InstructionsModal (GameScreen.tsx lines 787-854):**
- Create `src/components/game-ui/modals/InstructionsModal.tsx`
- Extract the instructions modal JSX and logic
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-3-1 - Extract InstructionsModal"`

**4b. Extract NameInputModal (GameScreen.tsx lines 856-917):**
- Create `src/components/game-ui/modals/NameInputModal.tsx`
- Extract the name input modal JSX and logic
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-3-2 - Extract NameInputModal"`

**4c. Extract PauseGameOverModal (GameScreen.tsx lines 919-1051):**
- Create `src/components/game-ui/modals/PauseGameOverModal.tsx`
- Extract the pause/game over modal JSX and logic
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-3-3 - Extract PauseGameOverModal"`

**4d. Extract SettingsModal (GameScreen.tsx lines 676-785):**
- Create `src/components/game-ui/modals/SettingsModal.tsx`
- Extract the settings modal JSX and logic
- Use imported components: ThemeSelector, ShipSelector, StatsDisplay, Slider, Toggle
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-3-4 - Extract SettingsModal"`

**4e. Update barrel export with modals:**
- Update `src/components/game-ui/index.ts`
- Add exports for: InstructionsModal, NameInputModal, PauseGameOverModal, SettingsModal
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-3-5 - Update barrel export with modals"`

#### Step 5: Phase 4 - Migrate GameScreen (2 subtasks)

**5a. Update GameScreen.tsx to use extracted components:**
- Import all components from `../components/game-ui`
- Remove all inline component definitions
- Replace modal JSX blocks with imported modal components
- Pass proper props to all components
- Verify: `npm run typecheck`
- Commit: `git commit -m "auto-claude: subtask-4-1 - Migrate GameScreen to use extracted components"`

**5b. Verify GameScreen compiles:**
- Run: `npm run typecheck` (must pass)
- Check line count: `wc -l src/screens/GameScreen.tsx` (must be <400 lines)
- Verify all imports work
- Commit: `git commit -m "auto-claude: subtask-4-2 - Verify GameScreen compilation"`

#### Step 6: Phase 5 - Cleanup and Verify (3 subtasks)

**6a. Run all tests:**
```bash
npm test
# All tests must pass
git commit -m "auto-claude: subtask-5-1 - Verify all tests pass"
```

**6b. Run linter:**
```bash
npm run lint
# Fix any lint errors
git commit -m "auto-claude: subtask-5-2 - Fix linting issues"
```

**6c. Verify line count reduction:**
```bash
wc -l src/screens/GameScreen.tsx
# Must be <400 lines (target: ~350-391 lines)
git commit -m "auto-claude: subtask-5-3 - Verify line count reduction"
```

**Verification Checklist**:
- [ ] Feature branch created
- [ ] 10 component files created in `src/components/game-ui/`
- [ ] 4 modal files created in `src/components/game-ui/modals/`
- [ ] Barrel export `src/components/game-ui/index.ts` created
- [ ] GameScreen.tsx updated to use imported components
- [ ] GameScreen.tsx reduced to <400 lines
- [ ] All inline component definitions removed from GameScreen.tsx
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm test` passes all tests
- [ ] `npm run lint` passes with 0 errors
- [ ] Git history shows 17+ commits for all subtasks
- [ ] `git diff main...HEAD --name-status` shows file changes

**Expected Results**:
- GameScreen.tsx: ~350-391 lines (from 1054)
- 66% reduction in file size
- 10 new reusable components created
- All tests passing
- No regressions

### 2. Update Implementation Plan Status

**Problem**: implementation_plan.json contains false "completed" statuses

**Required Fix**: After completing all implementation work above, update the implementation plan subtask statuses and notes to reflect actual completion, not fake completion.

**Verification**: implementation_plan.json accurately reflects work done

---

## After Fixes

Once ALL fixes above are complete:
1. Verify all checklist items are checked
2. Ensure git branch exists with commits
3. Ensure all tests pass
4. Commit with message: "fix: complete GameScreen.tsx component extraction (qa-requested)"
5. Update build-progress.txt with completion notes
6. QA will automatically re-run

## Critical Requirements for QA Re-Review

DO NOT request QA re-review until:
- ✅ Branch `auto-claude/015-split-gamescreen-tsx-into-focused-component-module` exists
- ✅ All 14 component files exist (10 components + 4 modals)
- ✅ GameScreen.tsx is <400 lines
- ✅ `npm test` shows all tests passing
- ✅ `npm run typecheck` shows 0 errors
- ✅ `npm run lint` shows 0 errors
- ✅ Git log shows commits for all subtasks
- ✅ `git diff main...HEAD` shows actual file changes

**Estimated Effort**: 4-6 hours (full implementation from scratch)

---

**QA Session**: 3
**Priority**: Critical
**Blocking**: Complete implementation failure
**Action**: Full re-implementation required
