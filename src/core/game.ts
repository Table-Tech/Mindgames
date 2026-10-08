export type GameId = 'sudoku' | 'wordle' | 'mahjong';

/** How a game was started: today's shared daily puzzle or unlimited practice. */
export type PlayMode = { kind: 'random' } | { kind: 'daily' };
export type PlayModeKind = PlayMode['kind'];

/** Haptic + sound cues a game can request after a move. */
export type FeedbackCue = 'tap' | 'correct' | 'wrong' | 'win' | 'lose' | 'select';
