import { evaluate, violatesHardMode } from '../engine';
import type { Guess } from '../types';

describe('Wordle evaluate', () => {
  it('marks all positions correct for the answer', () => {
    expect(evaluate('crane', 'crane')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  it('marks absent letters grey', () => {
    expect(evaluate('zzzzz', 'crane')).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
  });

  it('handles duplicate letters correctly when only one exists in answer', () => {
    // Answer has one L. Guess has two Ls; only the first L should be yellow.
    const result = evaluate('llama', 'pilot');
    expect(result[0]).toBe('present'); // first L matches the L in pilot
    expect(result[1]).toBe('absent'); // second L has no remaining L
  });

  it('prioritises correct (green) over present (yellow)', () => {
    // The second S in "sassy" is in the correct position for "essay";
    // the first S should NOT also be marked yellow.
    // essay = e s s a y; sassy = s a s s y
    // pos 2: s vs s -> correct (claims essay[2] first)
    // pos 0: s -> the remaining s at essay[1] -> present
    // pos 1: a -> a at essay[3] -> present
    // pos 3: s -> both s's already claimed -> absent
    // pos 4: y vs y -> correct
    const result = evaluate('sassy', 'essay');
    expect(result).toEqual(['present', 'present', 'correct', 'absent', 'correct']);
  });
});

describe('Wordle hard mode', () => {
  const greenHistory: Guess[] = [
    { word: 'crane', states: ['correct', 'absent', 'absent', 'absent', 'absent'] },
  ];

  it('rejects guesses that drop a green letter', () => {
    expect(violatesHardMode('plums', greenHistory)).not.toBeNull();
  });

  it('accepts guesses that keep the green letter in place', () => {
    expect(violatesHardMode('chump', greenHistory)).toBeNull();
  });

  const yellowHistory: Guess[] = [
    { word: 'crane', states: ['absent', 'absent', 'present', 'absent', 'absent'] },
  ];

  it('rejects guesses that drop a yellow letter', () => {
    expect(violatesHardMode('plumb', yellowHistory)).not.toBeNull();
  });

  it('accepts guesses that reuse the yellow letter', () => {
    expect(violatesHardMode('plant', yellowHistory)).toBeNull();
  });
});
