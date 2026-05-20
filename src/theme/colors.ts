export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  error: string;
  given: string; // background for given (immutable) Sudoku cells
  selection: string; // selected cell
  highlight: string; // same row/col/box highlight
  sameNumber: string; // cells with the same number as selected
}

export const lightTheme: ThemeColors = {
  background: '#fafafa',
  surface: '#ffffff',
  surfaceAlt: '#f1f1f3',
  border: '#d8d8de',
  text: '#1a1a1f',
  textMuted: '#6b6b73',
  accent: '#3478f6',
  accentMuted: '#cfddf9',
  error: '#d64545',
  given: '#eef0f4',
  selection: '#bcd0f5',
  highlight: '#e6edf9',
  sameNumber: '#d3def7',
};

export const darkTheme: ThemeColors = {
  background: '#0f1115',
  surface: '#171a21',
  surfaceAlt: '#1f232c',
  border: '#2a2f3a',
  text: '#f0f1f5',
  textMuted: '#9ba0ac',
  accent: '#6ea0ff',
  accentMuted: '#27375c',
  error: '#ff6b6b',
  given: '#1c2029',
  selection: '#3a527e',
  highlight: '#222a3a',
  sameNumber: '#2e3e5e',
};
