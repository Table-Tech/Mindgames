import type { OnboardingStep } from '@/components/Onboarding';

// One-time onboarding flow per game. The seen-flag is keyed by the id so each
// game can have its own walkthrough that fires the first time it's opened.

export const SUDOKU_ONBOARDING: OnboardingStep[] = [
  {
    icon: 'grid-outline',
    title: 'Fill the 9×9 grid',
    body: 'Every row, column, and 3×3 box must contain each digit 1–9 exactly once.',
  },
  {
    icon: 'pencil',
    title: 'Use Notes',
    body: 'Tap the Notes button to pencil in candidates. They auto-clear from peers when you place a value.',
  },
  {
    icon: 'bulb-outline',
    title: 'Three hints per puzzle',
    body: 'Stuck? A hint reveals one correct digit in the selected cell. Three mistakes ends the game.',
  },
];

export const WORDLE_ONBOARDING: OnboardingStep[] = [
  {
    icon: 'text-outline',
    title: 'Guess the 5-letter word',
    body: 'You have six tries. Tap letters and Enter to submit; backspace to delete.',
  },
  {
    icon: 'color-palette-outline',
    title: 'Color feedback',
    body: 'Green = right letter in the right spot. Yellow = right letter, wrong spot. Grey = not in the word.',
  },
  {
    icon: 'share-outline',
    title: 'Share your daily',
    body: 'A new daily word appears every day. After you solve it, share the grid with friends.',
  },
];

export const MAHJONG_ONBOARDING: OnboardingStep[] = [
  {
    icon: 'apps-outline',
    title: 'Match pairs to clear the board',
    body: 'Tap two identical free tiles to remove them. Any flower matches any flower; same for seasons.',
  },
  {
    icon: 'layers-outline',
    title: 'Free tiles only',
    body: 'A tile is free when nothing sits on top of it and at least one side (left or right) is empty.',
  },
  {
    icon: 'bulb-outline',
    title: 'Hint & shuffle',
    body: 'Stuck? Use a hint to spot a matching pair, or shuffle the remaining tiles. Limited uses per game.',
  },
];
