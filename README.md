# Mindgames

Cross-platform mobile puzzle game (iOS + Android) built with Expo + React Native + TypeScript.

## Status

This is the initial skeleton:

- Sudoku game with procedural generation, four difficulty levels (Easy/Medium/Hard/Expert).
- **Daily challenge**: seeded by today's UTC date, so every player worldwide gets the same puzzle.
- **Local leaderboard** (AsyncStorage) — backend (Firebase/Supabase) can be added later.
- Light/dark theming that follows the system setting.
- Stubs for **AdMob banner + interstitial** and **one-time "Remove ads" IAP** (~€2.99).

## Run it

```bash
npm install
npx expo start
```

Then press `i` (iOS simulator), `a` (Android emulator), or scan the QR code with the Expo Go app on your phone.

## Project layout

```
src/
├── games/sudoku/   # Generator (unique-solution guaranteed), solver, board UI
├── screens/        # Home, Sudoku, Leaderboard, Settings
├── navigation/     # React Navigation stack
├── theme/          # Light/dark color tokens
├── storage/        # AsyncStorage helpers
├── leaderboard/    # Local daily leaderboard
├── ads/            # AdMob banner + interstitial cadence (stubbed)
└── iap/            # Entitlements provider for "Remove ads" (stubbed)
```

## Next steps to ship

1. **Wire up AdMob**
   - `npm install react-native-google-mobile-ads`
   - Add AdMob app IDs to `app.json` plugins.
   - Replace stubs in `src/ads/`.
2. **Wire up IAP**
   - `npm install react-native-iap` (or RevenueCat for easier cross-store receipts).
   - Configure `remove_ads` SKU in App Store Connect and Google Play Console.
   - Replace stub in `src/iap/EntitlementsProvider.tsx`.
3. **Cloud leaderboard** (optional but recommended for engagement)
   - Add Firebase (Auth anonymous + Firestore) and write `submitScore` to a `daily/{yyyy-mm-dd}` collection.
4. **App icon + splash** in `assets/`.
5. **EAS Build** for signed iOS/Android binaries (`npx eas build`).

## Adding new games

Each game lives in `src/games/<name>/` and exports its own generator/solver and a screen-ready component. Add it as a stack screen and a card on the Home screen.
