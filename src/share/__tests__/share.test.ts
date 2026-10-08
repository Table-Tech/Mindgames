import { buildShareText } from '../share';

describe('buildShareText', () => {
  it('uses the per-game summary for sudoku and mahjong', () => {
    expect(
      buildShareText({
        game: 'sudoku',
        difficulty: 'hard',
        score: 420,
        timeMs: 125_000,
        won: true,
        dayLabel: '2026-10-08',
      }),
    ).toBe('Puzzaro Sudoku 2026-10-08 · Difficulty: hard · Solved in 02:05 · Score: 420');
    expect(buildShareText({ game: 'mahjong', score: 0, timeMs: 0, won: false })).toBe(
      'Puzzaro Mahjong · Did not solve · Score: 0',
    );
  });

  it('renders the wordle grid with the in-app colors', () => {
    const text = buildShareText({
      game: 'wordle',
      maxGuesses: 6,
      timeMs: 0,
      won: true,
      dayLabel: 'D',
      wordleGuesses: [
        { word: 'crane', states: ['correct', 'present', 'absent', 'absent', 'correct'] },
        { word: 'caret', states: ['correct', 'correct', 'correct', 'correct', 'correct'] },
      ],
    });
    expect(text).toBe('Puzzaro Wordle D 2/6\n\n🟦🟨⬛⬛🟦\n🟦🟦🟦🟦🟦');
  });
});
