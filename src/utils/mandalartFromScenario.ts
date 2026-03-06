import type { MandalartCellData, MandalartTheme } from '../types/mandalart';
import type { ScenarioFormState } from '../types/scenario';
import {
  motives, crimeTypes, clues, investigationMethods,
} from '../data/investigationReference';

// ── Sub-goal block config ───────────────────────────────────────────────────
// Same 8-block layout as the AI analysis flow (aiAnalysis.ts)

interface BlockConfig {
  label: string;
  br: number;
  bc: number;
  theme: MandalartTheme;
  subRow: number;
  subCol: number;
}

const BLOCKS: BlockConfig[] = [
  { label: '범행동기', br: 0, bc: 0, theme: 'rose',  subRow: 3, subCol: 3 },
  { label: '범행방법', br: 0, bc: 1, theme: 'amber', subRow: 3, subCol: 4 },
  { label: '수사단서', br: 0, bc: 2, theme: 'amber', subRow: 3, subCol: 5 },
  { label: '인물',     br: 1, bc: 0, theme: 'rose',  subRow: 4, subCol: 3 },
  // (1,1) = center
  { label: '수사기법', br: 1, bc: 2, theme: 'sky',   subRow: 4, subCol: 5 },
  { label: '연출요소', br: 2, bc: 0, theme: 'sky',   subRow: 5, subCol: 3 },
  { label: '공간구성', br: 2, bc: 1, theme: 'rose',  subRow: 5, subCol: 4 },
  { label: '반전설계', br: 2, bc: 2, theme: 'rose',  subRow: 5, subCol: 5 },
];

/** Get 8 action cell positions in a 3×3 block (excluding center) */
function getActionPositions(br: number, bc: number): [number, number][] {
  const positions: [number, number][] = [];
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      if (dr === 1 && dc === 1) continue;
      positions.push([br * 3 + dr, bc * 3 + dc]);
    }
  }
  return positions;
}

/** 같은 카테고리의 관련 항목 가져오기 (선택 항목 제외) */
function getRelatedItems(catMap: Record<string, string[]>, category: string, selected: string, max: number): string[] {
  const items = catMap[category] ?? [];
  return items.filter((i) => i !== selected).slice(0, max);
}

// ── Main function ───────────────────────────────────────────────────────────

export function populateMandalartFromScenario(form: ScenarioFormState): MandalartCellData[] {
  // Create blank 9×9 grid
  const cells: MandalartCellData[] = Array.from({ length: 81 }, (_, i) => {
    const row = Math.floor(i / 9);
    const col = i % 9;
    return {
      id: `cell-${row}-${col}`,
      row,
      col,
      text: '',
      theme: null,
      isCenter: row === 4 && col === 4,
      isSubGoal: row >= 3 && row <= 5 && col >= 3 && col <= 5 && !(row === 4 && col === 4),
    };
  });

  const setCell = (row: number, col: number, text: string, theme: MandalartTheme = null) => {
    const cell = cells.find((c) => c.row === row && c.col === col);
    if (cell) { cell.text = text; cell.theme = theme; }
  };

  // Center cell = scenario title
  const firstOffender = form.characters.find(c => c.role === '가해자' && c.name.trim());
  const title = firstOffender?.name
    ? `${firstOffender.name}의 사건`
    : form.crimeType.item
      ? `${form.crimeType.item} 사건`
      : '사건 시나리오';
  setCell(4, 4, title);

  // Fill each block
  for (const block of BLOCKS) {
    // Sub-goal in center block
    setCell(block.subRow, block.subCol, block.label, block.theme);
    // Expansion center (mirror)
    setCell(block.br * 3 + 1, block.bc * 3 + 1, block.label, block.theme);

    // Extract keywords for action cells
    const keywords = extractBlockKeywords(form, block.label);
    const positions = getActionPositions(block.br, block.bc);
    for (let i = 0; i < positions.length; i++) {
      const [r, c] = positions[i];
      if (keywords[i]) {
        setCell(r, c, keywords[i], block.theme);
      }
    }
  }

  return cells;
}

// ── Keyword extraction per block ────────────────────────────────────────────

function extractBlockKeywords(form: ScenarioFormState, label: string): string[] {
  const { characters, location, motive, crimeType, clue, method } = form;

  switch (label) {
    case '범행동기': {
      const items: string[] = [];
      if (motive.item) items.push(motive.item);
      if (motive.category) items.push(motive.category);
      // 같은 카테고리 관련 항목으로 채우기
      if (motive.category) {
        items.push(...getRelatedItems(motives, motive.category, motive.item, 6));
      }
      return items.slice(0, 8);
    }

    case '범행방법': {
      const items: string[] = [];
      if (crimeType.item) items.push(crimeType.item);
      if (crimeType.category) items.push(crimeType.category);
      if (crimeType.category) {
        items.push(...getRelatedItems(crimeTypes, crimeType.category, crimeType.item, 6));
      }
      return items.slice(0, 8);
    }

    case '수사단서': {
      const items: string[] = [];
      if (clue.item) items.push(clue.item);
      if (clue.category) items.push(clue.category);
      if (clue.category) {
        items.push(...getRelatedItems(clues, clue.category, clue.item, 6));
      }
      return items.slice(0, 8);
    }

    case '인물': {
      const items: string[] = [];
      // 모든 등장인물을 역할별로 추가
      for (const c of characters) {
        if (c.name.trim()) items.push(`${c.role}: ${c.name.trim()}`);
      }
      if (motive.item) items.push(`동기: ${motive.item}`);
      if (location) items.push(`장소: ${location}`);
      return items.slice(0, 8);
    }

    case '수사기법': {
      const items: string[] = [];
      if (method.item) items.push(method.item);
      if (method.category) items.push(method.category);
      if (method.category) {
        items.push(...getRelatedItems(investigationMethods, method.category, method.item, 6));
      }
      return items.slice(0, 8);
    }

    case '연출요소':
      // 사용자가 만다라트에서 직접 채울 영역
      return [];

    case '공간구성': {
      const items: string[] = [];
      if (location) items.push(location);
      return items.slice(0, 8);
    }

    case '반전설계':
      // 사용자가 만다라트에서 직접 채울 영역
      return [];

    default:
      return [];
  }
}
