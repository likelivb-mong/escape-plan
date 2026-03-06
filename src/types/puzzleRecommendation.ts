// ── Puzzle Type ───────────────────────────────────────────────────────────────

export type PuzzleType =
  | 'text'        // 텍스트 / 암호 해독
  | 'image'       // 이미지 / 시각 단서
  | 'uv'          // UV / 블랙라이트
  | 'audio'       // 음향 / 청각
  | 'device'      // 장치 / 기계 조작
  | 'spatial'     // 공간 / 물리 탐색
  | 'cooperative';// 협력 / 분업

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';

export type PuzzleRecommendationStatus =
  | 'suggested'   // AI 추천 (기본)
  | 'adopted'     // 채택됨
  | 'edited'      // 수정됨 (채택 + 수정)
  | 'discarded';  // 제외됨

// ── Core entities ─────────────────────────────────────────────────────────────

export interface PuzzleRecommendation {
  id: string;
  stageId: string;
  stageKey: string;
  stageLabel: '기' | '승' | '전' | '반전' | '결';
  title: string;
  type: PuzzleType;
  difficulty: PuzzleDifficulty;
  estimatedMinutes: number;
  description: string;
  recommendedBecause: string;
  clueUsage: string[];        // 단서 키워드 활용
  deviceUsage: string[];      // 연출 / 장치 활용
  expectedOutput: string;     // 플레이어가 얻는 것
  status: PuzzleRecommendationStatus;
}

export interface PuzzleRecommendationGroup {
  stageId: string;
  stageKey: string;
  stageLabel: '기' | '승' | '전' | '반전' | '결';
  stageTitle: string;
  recommendations: PuzzleRecommendation[];
}

// ── Filter state ──────────────────────────────────────────────────────────────

export interface PuzzleFilterState {
  stage: string;                       // 'all' | stageKey
  type: 'all' | PuzzleType;
  difficulty: 'all' | PuzzleDifficulty;
  showAdoptedOnly: boolean;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface RecommendationStats {
  totalPuzzles: number;
  adoptedCount: number;
  discardedCount: number;
  varietyScore: number;     // 0-100: type 다양성
  consistencyScore: number; // 0-100: 스토리 키워드 연계율
  difficultyBalance: {
    easy: number;
    medium: number;
    hard: number;
  };
}
