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

  // "Arcade sticker" look: thick ink outlines + hard drop shadows.
  ink: string; // outlines and hard shadows
  onInk: string; // text/icons on an ink fill
  gridLine: string; // thin lines inside a Sudoku box
  wrongCell: string;
  sudoku: string; // per-game signature colors
  wordle: string;
  mahjong: string;
  pink: string;
  sunflower: string;
  tileFace: string; // Mahjong tile face
  tileEdge: string; // Mahjong tile thickness
  wordleCorrect: string;
  wordlePresent: string;
  wordleAbsent: string;
}

// Signature colors are shared by both themes so each game keeps its identity.
const brand = {
  sudoku: '#3D5AF1',
  wordle: '#FFC530',
  mahjong: '#34C38F',
  pink: '#FF7AA2',
  sunflower: '#FFD84D',
  wordleCorrect: '#3D5AF1',
  wordlePresent: '#FFC530',
};

export const lightTheme: ThemeColors = {
  ...brand,
  background: '#F3F0FF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEBFA',
  border: '#1D1A33',
  text: '#1D1A33',
  textMuted: '#5B5677',
  accent: '#3D5AF1',
  accentMuted: '#C3CCFF',
  error: '#C81E45',
  given: '#FFFFFF',
  selection: '#FFD84D',
  highlight: '#E9E6FF',
  sameNumber: '#C3CCFF',
  ink: '#1D1A33',
  onInk: '#FFFFFF',
  gridLine: '#C9C3E6',
  wrongCell: '#FFD9E3',
  tileFace: '#FFFDF6',
  tileEdge: '#E5D9BC',
  wordleAbsent: '#B9B4D0',
};

export const darkTheme: ThemeColors = {
  ...brand,
  background: '#16132B',
  surface: '#26214A',
  surfaceAlt: '#1E1A3B',
  border: '#07060F',
  text: '#F4F1FF',
  textMuted: '#B3ADD6',
  accent: '#7C8FFF',
  accentMuted: '#38407A',
  error: '#FF6B8B',
  given: '#26214A',
  selection: '#8A7420',
  highlight: '#332D5E',
  sameNumber: '#3B4589',
  ink: '#07060F',
  onInk: '#F4F1FF',
  gridLine: '#3A3466',
  wrongCell: '#5A2238',
  tileFace: '#FFFDF6',
  tileEdge: '#BFB396',
  wordleAbsent: '#4A4470',
};
