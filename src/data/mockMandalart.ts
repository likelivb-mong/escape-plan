import type { MandalartCellData } from '../types/mandalart';

// ── Center block sub-goals (소목표) — ring around center cell (4,4) ──────────
// These 8 cells form the sub-goals in the center 3×3 block.
// Pattern: row∈[3,5], col∈[3,5], excluding center (4,4)
const SUBGOAL_TEXT: Record<string, string> = {
  '3-3': '분위기',  '3-4': '스토리',  '3-5': '퍼즐',
  '4-3': '인물',                      '4-5': '단서',
  '5-3': '장치',    '5-4': '공간',    '5-5': '반전',
};

// ── Expansion block center cells — mirror matching sub-goal ──────────────────
// For expansion block (br, bc), its center cell is at (br*3+1, bc*3+1).
// It mirrors center block's sub-goal at (3+br, 3+bc).
const EXPANSION_CENTER: Record<string, string> = {
  '1-1': '분위기',  '1-4': '스토리',  '1-7': '퍼즐',
  '4-1': '인물',                      '4-7': '단서',
  '7-1': '장치',    '7-4': '공간',    '7-7': '반전',
};

// ── Sample action items in expansion blocks (실행방안) ───────────────────────
const ACTION_TEXT: Record<string, string> = {
  // 분위기 block (br=0, bc=0) — cells at rows 0-2, cols 0-2, excluding (1,1)
  '0-0': 'missing case',   '0-1': '조명 연출',      '0-2': 'hidden room',
  '1-0': '사운드 디자인',                             '1-2': 'eerie music',
  '2-0': '세트 소품',      '2-1': '안개 머신',      '2-2': '긴장 분위기',

  // 스토리 block (br=0, bc=1) — rows 0-2, cols 3-5, excluding (1,4)
  '0-3': '사건 발단',      '0-4': '배경 설정',      '0-5': '증거 흐름',
  '1-3': '서브플롯',                                  '1-5': '복선 배치',
  '2-3': '서사 마무리',    '2-4': '진실 공개',      '2-5': '엔딩 설계',

  // 퍼즐 block (br=0, bc=2) — rows 0-2, cols 6-8, excluding (1,7)
  '0-6': 'old letter',     '0-7': 'cipher key',     '0-8': 'UV clue',
  '1-6': '암호 해독',                                 '1-8': 'red herring',
  '2-6': '잠금장치',       '2-7': '순서 퍼즐',      '2-8': '숨겨진 열쇠',

  // 인물 block (br=1, bc=0) — rows 3-5, cols 0-2, excluding (4,1)
  '3-0': 'detective',      '3-1': '범인 프로필',    '3-2': '공범',
                                                       '4-2': '목격자',
  '5-0': 'last witness',   '5-1': '피해자',         '5-2': '조력자',

  // 단서 block (br=1, bc=2) — rows 3-5, cols 6-8, excluding (4,7)
  '3-6': 'locked safe',    '3-7': '혈흔',           '3-8': '유품',
                                                       '4-8': 'broken clock',
  '5-6': '비밀편지',       '5-7': '지문',           '5-8': 'cryptic code',

  // 장치 block (br=2, bc=0) — rows 6-8, cols 0-2, excluding (7,1)
  '6-0': 'secret door',    '6-1': '비밀 스위치',    '6-2': '잠금 메커니즘',
                                                       '7-2': '전자 장치',
  '8-0': '기계식 자물쇠',  '8-1': '음향 장치',     '8-2': '조명 제어',

  // 공간 block (br=2, bc=1) — rows 6-8, cols 3-5, excluding (7,4)
  '6-3': '금지 구역',      '6-4': '비밀 통로',      '6-5': 'forbidden room',
                                                       '7-5': '지하 공간',
  '8-3': '다중 방 구조',   '8-4': '전망대',         '8-5': '탈출 동선',

  // 반전 block (br=2, bc=2) — rows 6-8, cols 6-8, excluding (7,7)
  '6-6': '범인 반전',      '6-7': '목격자 거짓말',  '6-8': '숨겨진 공범',
                                                       '7-8': '결말 트위스트',
  '8-6': '이중 잠금',      '8-7': '마지막 단서',    '8-8': 'last witness',
};

// ── Helper: is this cell one of the 8 sub-goal cells in the center block? ──
function isSubGoalCell(row: number, col: number): boolean {
  return (
    row >= 3 && row <= 5 &&
    col >= 3 && col <= 5 &&
    !(row === 4 && col === 4)
  );
}

// ── Example: "저택의 비밀" 완성 예시 ─────────────────────────────────────────
// text: 각 칸의 키워드 / theme: rose=컨셉 sky=연출·장치 amber=단서·소품

type ExampleCell = { text: string; theme: MandalartCellData['theme'] };

const EXAMPLE_DATA: Record<string, ExampleCell> = {
  // ── 메인 테마 ──────────────────────────────────────────────────────────────
  '4-4': { text: '저택의 비밀', theme: null },

  // ── 중앙 세부목표 8칸 ─────────────────────────────────────────────────────
  '3-3': { text: '분위기',   theme: 'rose'  },
  '3-4': { text: '스토리',   theme: 'rose'  },
  '3-5': { text: '퍼즐',     theme: 'sky'   },
  '4-3': { text: '인물',     theme: 'rose'  },
  '4-5': { text: '단서',     theme: 'amber' },
  '5-3': { text: '장치',     theme: 'sky'   },
  '5-4': { text: '공간',     theme: 'rose'  },
  '5-5': { text: '반전',     theme: 'amber' },

  // ── 확장 블록 중앙(연동) ──────────────────────────────────────────────────
  '1-1': { text: '분위기',   theme: 'rose'  },
  '1-4': { text: '스토리',   theme: 'rose'  },
  '1-7': { text: '퍼즐',     theme: 'sky'   },
  '4-1': { text: '인물',     theme: 'rose'  },
  '4-7': { text: '단서',     theme: 'amber' },
  '7-1': { text: '장치',     theme: 'sky'   },
  '7-4': { text: '공간',     theme: 'rose'  },
  '7-7': { text: '반전',     theme: 'amber' },

  // ── 분위기 블록 (br=0, bc=0) ─────────────────────────────────────────────
  '0-0': { text: '공포 연출',    theme: 'rose'  },
  '0-1': { text: '조명 연출',    theme: 'sky'   },
  '0-2': { text: '음산한 소품',  theme: 'amber' },
  '1-0': { text: '사운드 디자인',theme: 'sky'   },
  '1-2': { text: '배경 음악',    theme: 'sky'   },
  '2-0': { text: '세트 소품',    theme: 'amber' },
  '2-1': { text: '안개 머신',    theme: 'sky'   },
  '2-2': { text: '긴장감',       theme: 'rose'  },

  // ── 스토리 블록 (br=0, bc=1) ─────────────────────────────────────────────
  '0-3': { text: '사건 발단',    theme: 'rose'  },
  '0-4': { text: '배경 설정',    theme: 'rose'  },
  '0-5': { text: '증거 흐름',    theme: 'amber' },
  '1-3': { text: '서브플롯',     theme: 'rose'  },
  '1-5': { text: '복선 배치',    theme: 'rose'  },
  '2-3': { text: '서사 마무리',  theme: 'rose'  },
  '2-4': { text: '진실 공개',    theme: 'amber' },
  '2-5': { text: '엔딩 설계',    theme: 'rose'  },

  // ── 퍼즐 블록 (br=0, bc=2) ───────────────────────────────────────────────
  '0-6': { text: '오래된 편지',  theme: 'amber' },
  '0-7': { text: '암호 열쇠',    theme: 'sky'   },
  '0-8': { text: '자외선 단서',  theme: 'amber' },
  '1-6': { text: '암호 해독',    theme: 'sky'   },
  '1-8': { text: '교란 단서',    theme: 'amber' },
  '2-6': { text: '잠금장치',     theme: 'sky'   },
  '2-7': { text: '순서 퍼즐',    theme: 'sky'   },
  '2-8': { text: '숨겨진 열쇠',  theme: 'amber' },

  // ── 인물 블록 (br=1, bc=0) ───────────────────────────────────────────────
  '3-0': { text: '탐정',         theme: 'rose'  },
  '3-1': { text: '범인 프로필',  theme: 'rose'  },
  '3-2': { text: '공범',         theme: 'rose'  },
  '4-2': { text: '목격자',       theme: 'rose'  },
  '5-0': { text: '마지막 증인',  theme: 'rose'  },
  '5-1': { text: '피해자',       theme: 'rose'  },
  '5-2': { text: '조력자',       theme: 'rose'  },

  // ── 단서 블록 (br=1, bc=2) ───────────────────────────────────────────────
  '3-6': { text: '잠긴 금고',    theme: 'amber' },
  '3-7': { text: '혈흔',         theme: 'amber' },
  '3-8': { text: '유품',         theme: 'amber' },
  '4-8': { text: '부서진 시계',  theme: 'amber' },
  '5-6': { text: '비밀편지',     theme: 'amber' },
  '5-7': { text: '지문',         theme: 'amber' },
  '5-8': { text: '암호 문서',    theme: 'amber' },

  // ── 장치 블록 (br=2, bc=0) ───────────────────────────────────────────────
  '6-0': { text: '비밀 문',      theme: 'sky'   },
  '6-1': { text: '비밀 스위치',  theme: 'sky'   },
  '6-2': { text: '잠금 메커니즘',theme: 'sky'   },
  '7-2': { text: '전자 장치',    theme: 'sky'   },
  '8-0': { text: '기계식 자물쇠',theme: 'sky'   },
  '8-1': { text: '음향 장치',    theme: 'sky'   },
  '8-2': { text: '조명 제어',    theme: 'sky'   },

  // ── 공간 블록 (br=2, bc=1) ───────────────────────────────────────────────
  '6-3': { text: '금지 구역',    theme: 'rose'  },
  '6-4': { text: '비밀 통로',    theme: 'rose'  },
  '6-5': { text: '지하실',       theme: 'rose'  },
  '7-5': { text: '지하 공간',    theme: 'rose'  },
  '8-3': { text: '다중 방 구조', theme: 'rose'  },
  '8-4': { text: '전망대',       theme: 'rose'  },
  '8-5': { text: '탈출 동선',    theme: 'rose'  },

  // ── 반전 블록 (br=2, bc=2) ───────────────────────────────────────────────
  '6-6': { text: '범인 반전',    theme: 'amber' },
  '6-7': { text: '목격자 거짓말',theme: 'amber' },
  '6-8': { text: '숨겨진 공범',  theme: 'amber' },
  '7-8': { text: '결말 트위스트',theme: 'amber' },
  '8-6': { text: '이중 잠금',    theme: 'sky'   },
  '8-7': { text: '마지막 단서',  theme: 'amber' },
  '8-8': { text: '또 다른 피해자',theme: 'amber'},
};

export const EXAMPLE_PROJECT_NAME = '저택의 비밀';

export function createExampleCells(): MandalartCellData[] {
  return Array.from({ length: 81 }, (_, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const key = `${row}-${col}`;
    const isCenter = row === 4 && col === 4;
    const isSubGoal = isSubGoalCell(row, col);
    const example = EXAMPLE_DATA[key];
    return {
      id: `cell-${row}-${col}`,
      row,
      col,
      text: example?.text ?? '',
      theme: example?.theme ?? null,
      isCenter,
      isSubGoal,
    };
  });
}

// ── Factory ───────────────────────────────────────────────────────────────────
export function createInitialCells(): MandalartCellData[] {
  return Array.from({ length: 81 }, (_, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const key = `${row}-${col}`;
    const isCenter = row === 4 && col === 4;
    const isSubGoal = isSubGoalCell(row, col);

    const text = isCenter
      ? 'Untitled Theme'
      : SUBGOAL_TEXT[key]
      ?? EXPANSION_CENTER[key]
      ?? ACTION_TEXT[key]
      ?? '';

    return {
      id: `cell-${row}-${col}`,
      row,
      col,
      text,
      theme: null,
      isCenter,
      isSubGoal,
    };
  });
}
