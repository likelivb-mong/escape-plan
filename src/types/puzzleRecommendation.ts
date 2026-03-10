// ── Puzzle Type ───────────────────────────────────────────────────────────────

export type PuzzleType =
  | 'text'        // 텍스트 / 암호 해독
  | 'image'       // 이미지 / 시각 단서
  | 'uv'          // UV / 블랙라이트
  | 'audio'       // 음향 / 청각
  | 'device'      // 장치 / 기계 조작
  | 'spatial'     // 공간 / 물리 탐색
  | 'cooperative';// 협력 / 분업

export type PuzzleDesignType = 'clue' | 'device' | 'clue+device';
export type LockType = 'key' | 'number3' | 'number4' | 'alphabet5' | 'keypad' | 'xkit';
export type PlayerEngagement = 'cognitive' | 'physical' | 'collaborative' | 'sensory' | 'mixed';
export type StoryPhase = '기' | '승' | '전' | '반전' | '결';

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';

export type PuzzleRecommendationStatus =
  | 'suggested'   // AI 추천 (기본)
  | 'adopted'     // 채택됨
  | 'edited'      // 수정됨 (채택 + 수정)
  | 'discarded';  // 제외됨

// ── AI-Generated Puzzle Design ─────────────────────────────────────────────────

export interface PuzzleDesign {
  id: string;
  title: string;
  description: string;
  phase: StoryPhase;
  narrativeRole: string;
  linkedStoryElement: string;
  linkedEmotion: string;
  storyKeywords: string[];
  whyThisWorksInStory: string;
  puzzleType: PuzzleDesignType;
  lockType: LockType;
  deviceName: string;
  playerAction: string;
  answerFormat: string;
  answer: string;
  answerHint?: string;
  reward: string;
  nextConnection: string;
  predecessorPuzzleId?: string;
  successorPuzzleId?: string;
  setupDescription: string;
  spaceHint: string;
  productionNote: string;
  installabilityNotes: string;
  estimatedDifficulty: 1 | 2 | 3 | 4 | 5;
  estimatedTime: number;
  difficultyProgression: number;
  playerEngagement: PlayerEngagement;
  variant: number;
  status: PuzzleRecommendationStatus;
  adoptedAt?: string;
  generatedAt: string;
}

export interface PuzzleDesignResponse {
  projectSummary: {
    themeTitle: string;
    genre: string;
    tone: string;
    recommendedPuzzleCount: number;
    flowSummary: string;
    designWarnings: string[];
    spaceNotes: string[];
  };
  puzzles: PuzzleDesign[];
}

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
