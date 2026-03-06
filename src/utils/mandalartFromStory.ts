import type { MandalartCellData, MandalartTheme } from '../types/mandalart';
import type { StoryProposal } from '../types/story';

// ── Sub-goal → expansion block mapping ────────────────────────────────────────

interface BlockConfig {
  label: string;
  br: number;   // block row (0-2)
  bc: number;   // block col (0-2)
  theme: MandalartTheme;
  subRow: number;  // center-block sub-goal row (3-5)
  subCol: number;  // center-block sub-goal col (3-5)
}

const BLOCKS: BlockConfig[] = [
  { label: '분위기', br: 0, bc: 0, theme: 'rose',  subRow: 3, subCol: 3 },
  { label: '스토리', br: 0, bc: 1, theme: 'rose',  subRow: 3, subCol: 4 },
  { label: '퍼즐',   br: 0, bc: 2, theme: 'sky',   subRow: 3, subCol: 5 },
  { label: '인물',   br: 1, bc: 0, theme: 'rose',  subRow: 4, subCol: 3 },
  // (1,1) = center block — skipped
  { label: '단서',   br: 1, bc: 2, theme: 'amber', subRow: 4, subCol: 5 },
  { label: '장치',   br: 2, bc: 0, theme: 'sky',   subRow: 5, subCol: 3 },
  { label: '공간',   br: 2, bc: 1, theme: 'rose',  subRow: 5, subCol: 4 },
  { label: '반전',   br: 2, bc: 2, theme: 'amber', subRow: 5, subCol: 5 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Take a short phrase from text (first ~maxChars worth of complete Korean words) */
function shortPhrase(text: string, maxChars: number = 10): string {
  const words = text.split(/\s+/);
  let result = '';
  for (const word of words) {
    if (result.length + word.length + 1 > maxChars && result.length > 0) break;
    result += (result ? ' ' : '') + word;
  }
  return result || text.slice(0, maxChars);
}

/** Split tone string like "긴박 · 어두움" into individual words */
function splitTone(tone: string): string[] {
  return tone.split(/[·,、/]+/).map(t => t.trim()).filter(Boolean);
}

/** Split a sentence into phrases by punctuation */
function splitPhrases(text: string): string[] {
  return text
    .split(/[,，.。!！?？\-—;；:：]+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);
}

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

// ── Keyword extraction per block ─────────────────────────────────────────────

function extractBlockKeywords(story: StoryProposal, label: string): string[] {
  const inv = story.investigation;
  const beats = story.beats ?? [];
  const findBeat = (l: string) => beats.find(b => b.label === l);

  switch (label) {
    case '분위기': {
      const items: string[] = [story.genre, ...splitTone(story.tone)];
      items.push(story.meta.playtime, story.meta.playerCount);
      items.push(
        story.meta.twistIntensity === 'high' ? '강한 반전'
          : story.meta.twistIntensity === 'medium' ? '중간 반전' : '가벼운 반전',
      );
      if (story.logline) items.push(shortPhrase(story.logline, 10));
      return items.filter(Boolean).slice(0, 8);
    }

    case '스토리': {
      const items: string[] = beats.map(
        b => `[${b.label}] ${shortPhrase(b.description, 8)}`,
      );
      if (story.logline) items.push(shortPhrase(story.logline, 12));
      return items.filter(Boolean).slice(0, 8);
    }

    case '퍼즐': {
      const items: string[] = [];
      if (inv?.technique) items.push(shortPhrase(inv.technique, 10));
      if (inv?.method) items.push(shortPhrase(inv.method, 10));
      // From 승 beat (discovery/investigation phase)
      const beat = findBeat('승');
      if (beat) {
        for (const p of splitPhrases(beat.description).slice(0, 4)) {
          items.push(shortPhrase(p, 10));
        }
      }
      return items.slice(0, 8);
    }

    case '인물': {
      const items: string[] = [];
      if (inv) {
        if (inv.perpetrator) items.push(inv.perpetrator);
        if (inv.victim) items.push(inv.victim);
        if (inv.motive) items.push(shortPhrase(inv.motive, 10));
      }
      // From 전 beat (revelation — usually about characters)
      const beat = findBeat('전');
      if (beat) {
        for (const p of splitPhrases(beat.description).slice(0, 4)) {
          items.push(shortPhrase(p, 10));
        }
      }
      return items.slice(0, 8);
    }

    case '단서': {
      const items: string[] = [];
      if (inv?.clue) items.push(shortPhrase(inv.clue, 12));
      if (inv?.formula) items.push(shortPhrase(inv.formula, 12));
      // From 기 beat (opening — initial clues)
      const beat = findBeat('기');
      if (beat) {
        for (const p of splitPhrases(beat.description).slice(0, 4)) {
          items.push(shortPhrase(p, 10));
        }
      }
      return items.slice(0, 8);
    }

    case '장치': {
      const items: string[] = [];
      if (inv?.method) items.push(shortPhrase(inv.method, 10));
      // From 결 beat (resolution — mechanisms used)
      const beat = findBeat('결');
      if (beat) {
        for (const p of splitPhrases(beat.description).slice(0, 4)) {
          items.push(shortPhrase(p, 10));
        }
      }
      return items.slice(0, 8);
    }

    case '공간': {
      const items: string[] = [];
      if (inv?.scene) items.push(inv.scene);
      // From synopsis (usually describes the setting)
      if (story.synopsis) {
        for (const p of splitPhrases(story.synopsis).slice(0, 5)) {
          items.push(shortPhrase(p, 10));
        }
      }
      return items.slice(0, 8);
    }

    case '반전': {
      const items: string[] = [];
      const twistBeat = findBeat('반전');
      if (twistBeat) {
        for (const p of splitPhrases(twistBeat.description).slice(0, 4)) {
          items.push(shortPhrase(p, 12));
        }
      }
      items.push(
        story.meta.twistIntensity === 'high' ? '충격적 반전'
          : story.meta.twistIntensity === 'medium' ? '적절한 반전' : '가벼운 반전',
      );
      return items.slice(0, 8);
    }

    default:
      return [];
  }
}

// ── Main function ────────────────────────────────────────────────────────────

export function populateMandalartFromStory(story: StoryProposal): MandalartCellData[] {
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
      isSubGoal:
        row >= 3 && row <= 5 && col >= 3 && col <= 5 && !(row === 4 && col === 4),
    };
  });

  // Helper to set a cell's text and theme
  const setCell = (row: number, col: number, text: string, theme: MandalartTheme = null) => {
    const cell = cells.find(c => c.row === row && c.col === col);
    if (cell) {
      cell.text = text;
      cell.theme = theme;
    }
  };

  // Center cell = story title
  setCell(4, 4, story.title);

  // Fill each sub-goal block
  for (const block of BLOCKS) {
    // Sub-goal cell in center block
    setCell(block.subRow, block.subCol, block.label, block.theme);

    // Expansion block center (mirrors sub-goal)
    setCell(block.br * 3 + 1, block.bc * 3 + 1, block.label, block.theme);

    // Extract keywords and fill action cells
    const keywords = extractBlockKeywords(story, block.label);
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
