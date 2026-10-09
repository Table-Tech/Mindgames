import { buildShareText, friendlyDate } from '../share';

describe('buildShareText', () => {
  it('formats a won daily Sudoku as a card', () => {
    expect(
      buildShareText({
        game: 'sudoku',
        difficulty: 'hard',
        score: 1420,
        mistakes: 1,
        maxMistakes: 3,
        hintsUsed: 1,
        timeMs: 125_000,
        won: true,
        dayLabel: '2026-10-09',
        streak: 4,
      }),
    ).toBe(
      [
        '🔢 Puzzaro · Daily Sudoku',
        '📅 Fri 9 Oct · Hard',
        '',
        '✅ Solved in 2:05',
        '⭐ 1,420 pts · 💡 1 hint',
        '❤️❤️🤍',
        '',
        '🔥 4-day streak',
        'Can you beat me? 🧩',
      ].join('\n'),
    );
  });

  it('formats a lost free-play Mahjong without a streak', () => {
    expect(
      buildShareText({
        game: 'mahjong',
        score: 6900,
        tilesLeft: 12,
        hintsUsed: 0,
        shufflesUsed: 2,
        timeMs: 0,
        won: false,
      }),
    ).toBe(
      [
        '🀄 Puzzaro · Mahjong',
        '📅 Free play',
        '',
        '❌ Stuck with 12 tiles left',
        '⭐ 6,900 pts · 💡 0 hints · 🔀 2 shuffles',
        '',
        'Think you can do better? 🧩',
      ].join('\n'),
    );
  });

  it('renders the word game grid with the in-app colors', () => {
    const text = buildShareText({
      game: 'wordle',
      maxGuesses: 6,
      timeMs: 0,
      won: true,
      dayLabel: '2026-10-09',
      streak: 1,
      wordleGuesses: [
        { word: 'crane', states: ['correct', 'present', 'absent', 'absent', 'correct'] },
        { word: 'caret', states: ['correct', 'correct', 'correct', 'correct', 'correct'] },
      ],
    });
    expect(text).toBe(
      [
        '🔤 Puzzaro · Daily Word Guess 2/6',
        '📅 Fri 9 Oct',
        '',
        '🟦🟨⬛⬛🟦',
        '🟦🟦🟦🟦🟦',
        '',
        'Can you beat me? 🧩',
      ].join('\n'),
    );
  });

  it('formats ISO dates as short UTC calendar days', () => {
    expect(friendlyDate('2026-01-01')).toBe('Thu 1 Jan');
  });
});
