// ── Puzzle Flow types ─────────────────────────────────────────────────────────

export type PuzzleFlowStageKey =
  | 'intro'
  | 'development'
  | 'expansion'
  | 'twist'
  | 'ending';

export interface PuzzleFlowStage {
  id: string;
  key: PuzzleFlowStageKey;
  /** Korean narrative label */
  label: '기' | '승' | '전' | '반전' | '결';
  /** Short English/mixed title, e.g. "Opening · 사건의 발단" */
  title: string;
  /** Description derived from the story beat */
  description: string;
  estimatedMinutes: number;
  /** What the player should accomplish in this stage */
  objective: string;
  /** How many puzzle slots are recommended */
  suggestedPuzzleSlots: number;
  /** Production/atmosphere notes for each stage */
  effectsNotes: string[];
  /** Mandalart keywords most relevant to this stage */
  relatedKeywords: string[];
}

export interface PuzzleFlowPlan {
  /** ID of the source StoryProposal */
  storyId: string;
  totalPlayTime: number;
  totalSuggestedPuzzleCount: number;
  stages: PuzzleFlowStage[];
}
