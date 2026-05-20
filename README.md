# Mindgames

Cross-platform mobile puzzle app (iOS + Android) built with Expo + React Native + TypeScript.
Three games — **Sudoku**, **Wordle**, **Mahjong Solitaire** — each with daily challenges, local
leaderboard, stats, streaks, and a polished UI layer (themes, haptics, sounds, confetti,
onboarding, notifications, share-results, save-and-resume, settings).

## Quick start

The app uses native modules (`@react-native-firebase/*`, RevenueCat, static iOS frameworks), so
**Expo Go is not supported** — you need a dev client. The day-to-day loop after the first build:

```bash
npm install
npx expo start --dev-client    # scan the QR with the Mindgames dev client app
```

For the first install on each platform, see the platform sections below.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier --write
npm test            # jest
```

### Android (Windows or Mac)

Requires Android Studio with SDK Platform 36 + NDK installed, plus `JAVA_HOME` and `ANDROID_HOME`
env vars set.

```bash
npx expo run:android   # builds + installs the dev client on emulator or USB device
```

After the first build, day-to-day you only need `npx expo start --dev-client` and the app picks
up reload over the network.

### iOS (Mac only — Windows can't sign or compile iOS)

Requires macOS with Xcode (latest) and CocoaPods. The repo already has the Firebase config plugin
wired up; you only need to drop the two secret files in the project root once (they are in
`.gitignore`, so you must transfer them manually via 1Password / iCloud Drive / AirDrop — **never
commit them**):

```
./GoogleService-Info.plist     # iOS Firebase config
./google-services.json         # Android Firebase config (only used for Android builds)
```

Then on the Mac:

```bash
git clone <repo>
cd Mindgames
npm install
# Drop GoogleService-Info.plist in project root here
npx expo prebuild --platform ios --clean    # generates ios/ folder
npx expo run:ios                            # simulator (no Apple ID needed, free, no expiry)
```

For a real iPhone with a **free Apple ID** (7-day app expiry, no push/IAP):

```bash
npx expo prebuild --platform ios --clean
open ios/Mindgames.xcworkspace
# In Xcode: select the Mindgames target → Signing & Capabilities
# → set Team to your personal Apple ID → plug in iPhone over USB → press ▶
```

For a real iPhone with a **paid Apple Developer account** ($99/year — push + IAP + TestFlight):
use `eas build --profile development --platform ios` instead.

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

### 3. Firebase (`@react-native-firebase/*`) — wired

`src/cloud/firebase.ts` uses the modular `@react-native-firebase` SDK (Auth + Firestore).
Anonymous sign-in is lazy: the first `submitLeaderboardScore` or `syncStatsTotals` call triggers
`signInAnonymously` with an in-flight dedupe so concurrent callers share one sign-in.

Firestore layout:

```
/leaderboards/{game}/days/{yyyy-mm-dd}/scores/{uid}
    { name, timeMs, guesses?, score?, createdAt: serverTimestamp() }
/users/{uid}
    { totals: { sudoku: {...}, wordle: {...}, mahjong: {...} } }
```

Security rules live in `firestore.rules` (paste into Firebase Console → Firestore → Rules, or
`firebase deploy --only firestore:rules` if you set up the Firebase CLI). They allow:

- signed-in reads of leaderboard scores
- owner-only writes with shape validation (`timeMs` is a positive int < 24 h, `name` is a non-empty
  string ≤ 32 chars)
- owner-only read/write on `/users/{uid}`
- default deny everywhere else

To set up a Firebase project from scratch:

1. Create project at https://console.firebase.google.com.
2. Authentication → Sign-in method → enable **Anonymous**.
3. Firestore Database → create in `eur3 (europe-west)` production mode → paste `firestore.rules`.
4. Add Android app with package `com.mindgames.app` → download `google-services.json` to project root.
5. Add iOS app with bundle id `com.mindgames.app` → download `GoogleService-Info.plist` to project root.
6. Rebuild the dev client (`npx expo prebuild --clean && expo run:android` / `expo run:ios`).

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
