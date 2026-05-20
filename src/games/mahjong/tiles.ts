// Mahjong tile set: 36 match-groups, 4 tiles each = 144 total.
// In standard groups all 4 tiles look identical. In the flowers and seasons
// groups the 4 tiles have distinct glyphs but share a group-id, so any flower
// matches any flower (and likewise for seasons).

export interface TileGroup {
  id: number;
  // The 4 glyphs that appear on the actual tiles. For standard groups, all
  // four entries are the same character.
  glyphs: [string, string, string, string];
}

function uniform(glyph: string): [string, string, string, string] {
  return [glyph, glyph, glyph, glyph];
}

const CHARACTERS = [
  '\u{1F007}',
  '\u{1F008}',
  '\u{1F009}',
  '\u{1F00A}',
  '\u{1F00B}',
  '\u{1F00C}',
  '\u{1F00D}',
  '\u{1F00E}',
  '\u{1F00F}',
];
const BAMBOO = [
  '\u{1F010}',
  '\u{1F011}',
  '\u{1F012}',
  '\u{1F013}',
  '\u{1F014}',
  '\u{1F015}',
  '\u{1F016}',
  '\u{1F017}',
  '\u{1F018}',
];
const DOTS = [
  '\u{1F019}',
  '\u{1F01A}',
  '\u{1F01B}',
  '\u{1F01C}',
  '\u{1F01D}',
  '\u{1F01E}',
  '\u{1F01F}',
  '\u{1F020}',
  '\u{1F021}',
];
const WINDS = ['\u{1F000}', '\u{1F001}', '\u{1F002}', '\u{1F003}'];
const DRAGONS = ['\u{1F004}', '\u{1F005}', '\u{1F006}'];
const FLOWERS: [string, string, string, string] = [
  '\u{1F022}',
  '\u{1F023}',
  '\u{1F024}',
  '\u{1F025}',
];
const SEASONS: [string, string, string, string] = [
  '\u{1F026}',
  '\u{1F027}',
  '\u{1F028}',
  '\u{1F029}',
];

export const TILE_GROUPS: TileGroup[] = (() => {
  const groups: TileGroup[] = [];
  let id = 0;
  for (const g of [...CHARACTERS, ...BAMBOO, ...DOTS, ...WINDS, ...DRAGONS]) {
    groups.push({ id: id++, glyphs: uniform(g) });
  }
  groups.push({ id: id++, glyphs: FLOWERS });
  groups.push({ id: id++, glyphs: SEASONS });
  return groups;
})();

// 9 + 9 + 9 + 4 + 3 + 1 + 1 = 36 groups. Sanity check at module load.
if (TILE_GROUPS.length !== 36) {
  throw new Error(`Expected 36 tile groups, got ${TILE_GROUPS.length}`);
}
