# Mindgames

Cross-platform mobile puzzle app (iOS + Android) built with Expo + React Native + TypeScript.
Three games — **Sudoku**, **Wordle**, **Mahjong Solitaire** — each with daily challenges, local
leaderboard, stats, streaks, and a polished UI layer (themes, haptics, sounds, confetti,
onboarding, notifications, share-results, save-and-resume, settings).

## Quick start

```bash
npm install
npx expo start
```

Then press `i` for the iOS simulator, `a` for the Android emulator, or scan the QR with Expo Go.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier --write
npm test            # jest
```

## What's in the box

### Games

| Game | Highlights |
|---|---|
| **Sudoku** | 6 difficulties (Easy → Extreme), unique-solution generator, notes mode with peer cleanup, auto-pencil, undo, 3-mistake game-over, hint (3/game), score, pause, save & resume. |
| **Wordle** | 5 letters / 6 guesses, ~1.5 k bundled words, green/yellow/grey scoring with correct duplicate-letter logic, on-screen QWERTY with live key states, optional hard mode, emoji-grid share, save & resume. |
| **Mahjong** | Solvable 144-tile pyramid (5 layers), 36 match groups incl. flowers / seasons, free-tile detection, hint, solvable-shuffle (reverse-build), undo, score, save & resume. |

### Cross-cutting

- **Daily challenges** for all three games, seeded by today's UTC date so every player worldwide
  gets the same puzzle.
- **Local leaderboard** keyed by date; the daily score automatically mirrors to a cloud
  leaderboard once Firebase is wired up.
- **Statistics screen** with played / win-rate / best / avg time, current and best daily streaks
  per game, Wordle guess-distribution histogram, and a Sudoku-by-difficulty breakdown.
- **Home** surfaces today's daily status (new / in-progress / done), per-game streak chips, and a
  Resume pill on practice cards when there's an unfinished game.
- **Theme**: system / light / dark, configurable in settings.
- **Feedback**: haptic feedback per event (correct, wrong, win, lose, tap) and a sound service
  that loads short SFX from `assets/sounds/` on demand. Both are user-toggleable.
- **Onboarding**: one-time three-step tutorial per game.
- **Confetti** win celebration.
- **Result modal** for every game end with stats and a built-in Share button (Wordle uses the
  classic emoji-grid; Sudoku and Mahjong show difficulty / time / score).
- **Custom name input modal** so daily scores can be entered consistently on both iOS and Android.
- **Daily reminder** via `expo-notifications` with an in-app time stepper.
- **Save & resume** for every game; daily state is keyed by date, practice mode by a single slot.
- **Settings** with all of the above plus profile name, clear-stats, and clear-all-data actions.

## Things you still need to wire up

Stubs are in place so the swap is a single-file change. Each is documented at the top of its file.

### 1. AdMob (`react-native-google-mobile-ads`)

`src/ads/AdBanner.tsx` (banner slot) and `src/ads/interstitial.ts` (cadence: every 3 finishes).
After install + EAS config:

- Replace the `<View>` placeholder with `<BannerAd unitId={…} size={BannerAdSize.ADAPTIVE_BANNER}/>`.
- Replace `maybeShowInterstitial`'s TODO with a real `InterstitialAd` load + show.

### 2. RevenueCat (`react-native-purchases`)

`src/iap/EntitlementsProvider.tsx` already mirrors the RevenueCat shape (`configure`,
`getCustomerInfo`, `purchasePackage`, `restorePurchases`). Fill in the four TODO blocks with the
real SDK calls. Product id is `remove_ads`, entitlement id is `no_ads`.

### 3. Firebase (`@react-native-firebase/*`)

`src/cloud/firebase.ts` defines `initFirebase`, `getOrCreateUser`, `submitLeaderboardScore`,
`fetchDailyLeaderboard`, `syncStatsTotals`. Each function is a typed no-op with the real
Firestore call commented in-place. Suggested layout:

```
/leaderboards/{game}/days/{yyyy-mm-dd}/scores/{uid}
    { name, timeMs, guesses?, score?, createdAt: serverTimestamp() }
/users/{uid}
    { name, totals: { sudoku: {...}, wordle: {...}, mahjong: {...} } }
```

### 4. Icons + splash + sound assets

- Drop `icon.png` (1024×1024), `adaptive-icon.png` (Android), `splash.png`, and `favicon.png`
  into `assets/` and add the references back to `app.json`.
- Drop short SFX into `assets/sounds/` (`tap.mp3`, `correct.mp3`, `wrong.mp3`, `win.mp3`,
  `lose.mp3`) and uncomment the `require()` lines in `src/feedback/sounds.ts`.

### 5. EAS Build for distribution

`npx eas build:configure` and follow Expo's instructions to produce signed iOS/Android binaries.

## Project layout

```
src/
├── ads/              # AdMob banner + interstitial stubs
├── cloud/            # Firebase scaffold
├── components/       # Confetti, NameInputModal, Onboarding, ResultModal
├── feedback/         # Haptic + sound services, useFeedback hook
├── games/
│   ├── sudoku/       # Generator, solver, notes, auto-pencil, board, conflicts
│   ├── wordle/       # Engine (incl. hard mode), word list, grid, keyboard
│   └── mahjong/      # Tiles, layout, engine (incl. solvable shuffle), board
├── home/             # Status-derivation for Home (daily / resume / streak)
├── iap/              # Entitlements provider (RevenueCat shape)
├── leaderboard/      # Local daily leaderboard + cloud-mirror hook
├── navigation/       # React Navigation stack + types
├── notifications/    # Daily reminder scheduling
├── onboarding/       # Step lists + useOnboarding hook
├── prefs/            # PreferencesProvider (theme, sound, haptics, …)
├── screens/          # Home, Sudoku, Wordle, Mahjong, Leaderboard, Stats, Settings
├── share/            # Share-text builder (Wordle emoji grid etc.)
├── stats/            # Records store + computeStats + per-difficulty Sudoku stats
├── storage/          # Tiny AsyncStorage wrapper
└── theme/            # Light/dark tokens + ThemeProvider (honours pref)
```

## Architecture notes

- **PRNG**: every generator (Sudoku, Mahjong) plus the daily-seed derivation uses a stable
  `mulberry32` so the same input always produces the same puzzle. Daily seeds hash today's UTC
  date with FNV-1a so every device in the world sees the same daily.
- **Persistence**: every game has its own `persistence.ts` that stores a JSON-safe snapshot
  (sets serialised as arrays). Daily state is keyed by date and is therefore self-expiring.
- **Theming**: a single token file (`src/theme/colors.ts`) with light + dark palettes, consumed
  via `useTheme()`. ThemeProvider honours the user's override or falls back to the system scheme.
- **Feedback**: `useFeedback()` is the single component-facing hook; it reads the preference
  flags so callers don't have to thread them through every call site.
