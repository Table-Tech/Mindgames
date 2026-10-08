import { elapsedMs, pressKey, type KeyRules } from '../session';
import type { WordleState } from '../types';

const rules: KeyRules = { hardMode: false, isValidWord: () => true, now: 5_000 };

function game(over: Partial<WordleState> = {}): WordleState {
  return {
    answer: 'crane',
    guesses: [],
    current: '',
    startedAt: 1_000,
    finishedAt: null,
    outcome: 'playing',
    ...over,
  };
}

const type = (s: WordleState, word: string) =>
  word.split('').reduce((acc, k) => pressKey(acc, k, rules)?.state ?? acc, s);

describe('wordle session', () => {
  it('types letters up to the word length and deletes with BACK', () => {
    const s = type(game(), 'cranes');
    expect(s.current).toBe('crane');
    expect(pressKey(s, 'BACK', rules)?.state.current).toBe('cran');
  });

  it('rejects short and unknown words with a toast', () => {
    expect(pressKey(type(game(), 'cra'), 'ENTER', rules)?.toast).toBe('Not enough letters');
    const strict = { ...rules, isValidWord: () => false };
    expect(pressKey(type(game(), 'zzzzz'), 'ENTER', strict)?.toast).toBe('Not in word list');
  });

  it('wins on the right word and records the finish time', () => {
    const res = pressKey(type(game(), 'crane'), 'ENTER', rules)!;
    expect(res.state.outcome).toBe('won');
    expect(res.state.finishedAt).toBe(5_000);
    expect(res.cues).toEqual(['win']);
    expect(elapsedMs(res.state, 99_999)).toBe(4_000);
  });

  it('loses after the last guess', () => {
    const five = Array.from({ length: 5 }, () => ({
      word: 'slate',
      states: ['absent', 'absent', 'present', 'absent', 'correct'] as const,
    })).map(g => ({ ...g, states: [...g.states] }));
    const res = pressKey(type(game({ guesses: five }), 'slate'), 'ENTER', rules)!;
    expect(res.state.outcome).toBe('lost');
    expect(res.cues).toEqual(['lose']);
  });

  it('ignores keys once the game is over', () => {
    expect(pressKey(game({ outcome: 'won' }), 'a', rules)).toBeNull();
  });
});
