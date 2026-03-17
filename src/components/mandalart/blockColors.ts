/**
 * 8 distinct colors for the 8 sub-goal positions in the mandalart.
 *
 * Block position mapping (br, bc) → colorIndex:
 *   (0,0)=0  (0,1)=1  (0,2)=2
 *   (1,0)=3  center   (1,2)=4
 *   (2,0)=5  (2,1)=6  (2,2)=7
 *
 * Sub-goal cell in center block mapping:
 *   (3,3)=0  (3,4)=1  (3,5)=2
 *   (4,3)=3  center   (4,5)=4
 *   (5,3)=5  (5,4)=6  (5,5)=7
 */

export interface BlockColorPalette {
  /** Sub-goal / linked cell background */
  bg: string;
  /** Sub-goal / linked cell border */
  border: string;
  /** Block-level subtle background tint */
  blockBg: string;
  /** Block-level border tint */
  blockBorder: string;
  /** Selection ring */
  ring: string;
  /** Text color for sub-goal label */
  text: string;
}

// 8 visually distinct colors optimized for dark backgrounds
export const BLOCK_COLORS: BlockColorPalette[] = [
  // 0: orange (분위기)
  {
    bg: 'rgba(251,146,60,0.15)',
    border: 'rgba(251,146,60,0.45)',
    blockBg: 'rgba(251,146,60,0.04)',
    blockBorder: 'rgba(251,146,60,0.12)',
    ring: 'rgba(251,146,60,0.5)',
    text: 'rgba(251,176,100,0.9)',
  },
  // 1: blue (스토리)
  {
    bg: 'rgba(96,165,250,0.15)',
    border: 'rgba(96,165,250,0.45)',
    blockBg: 'rgba(96,165,250,0.04)',
    blockBorder: 'rgba(96,165,250,0.12)',
    ring: 'rgba(96,165,250,0.5)',
    text: 'rgba(130,185,255,0.9)',
  },
  // 2: teal (퍼즐)
  {
    bg: 'rgba(45,212,191,0.15)',
    border: 'rgba(45,212,191,0.45)',
    blockBg: 'rgba(45,212,191,0.04)',
    blockBorder: 'rgba(45,212,191,0.12)',
    ring: 'rgba(45,212,191,0.5)',
    text: 'rgba(90,225,205,0.9)',
  },
  // 3: green (인물)
  {
    bg: 'rgba(74,222,128,0.15)',
    border: 'rgba(74,222,128,0.45)',
    blockBg: 'rgba(74,222,128,0.04)',
    blockBorder: 'rgba(74,222,128,0.12)',
    ring: 'rgba(74,222,128,0.5)',
    text: 'rgba(110,235,155,0.9)',
  },
  // 4: pink (단서)
  {
    bg: 'rgba(244,114,182,0.15)',
    border: 'rgba(244,114,182,0.45)',
    blockBg: 'rgba(244,114,182,0.04)',
    blockBorder: 'rgba(244,114,182,0.12)',
    ring: 'rgba(244,114,182,0.5)',
    text: 'rgba(250,145,200,0.9)',
  },
  // 5: yellow (장치)
  {
    bg: 'rgba(250,204,21,0.13)',
    border: 'rgba(250,204,21,0.40)',
    blockBg: 'rgba(250,204,21,0.035)',
    blockBorder: 'rgba(250,204,21,0.10)',
    ring: 'rgba(250,204,21,0.5)',
    text: 'rgba(252,215,80,0.9)',
  },
  // 6: indigo (공간)
  {
    bg: 'rgba(129,140,248,0.15)',
    border: 'rgba(129,140,248,0.45)',
    blockBg: 'rgba(129,140,248,0.04)',
    blockBorder: 'rgba(129,140,248,0.12)',
    ring: 'rgba(129,140,248,0.5)',
    text: 'rgba(160,168,255,0.9)',
  },
  // 7: red (반전)
  {
    bg: 'rgba(248,113,113,0.15)',
    border: 'rgba(248,113,113,0.45)',
    blockBg: 'rgba(248,113,113,0.04)',
    blockBorder: 'rgba(248,113,113,0.12)',
    ring: 'rgba(248,113,113,0.5)',
    text: 'rgba(252,145,145,0.9)',
  },
];

/**
 * Map (br, bc) block position to color index (0-7).
 * Center block (1,1) returns -1.
 */
export function getBlockColorIndex(br: number, bc: number): number {
  if (br === 1 && bc === 1) return -1; // center block
  // Positions ordered: top-left→top-right, mid-left, mid-right, bot-left→bot-right
  const map: Record<string, number> = {
    '0-0': 0, '0-1': 1, '0-2': 2,
    '1-0': 3,            '1-2': 4,
    '2-0': 5, '2-1': 6, '2-2': 7,
  };
  return map[`${br}-${bc}`] ?? -1;
}

/**
 * Map a sub-goal cell position in the center block to its color index.
 * Center cell (4,4) returns -1.
 */
export function getSubGoalColorIndex(row: number, col: number): number {
  if (row === 4 && col === 4) return -1;
  if (row < 3 || row > 5 || col < 3 || col > 5) return -1;
  const br = row - 3;
  const bc = col - 3;
  return getBlockColorIndex(br, bc);
}
