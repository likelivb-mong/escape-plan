import type { TwistIntensity } from './story';

// ── Core label types ──────────────────────────────────────────────────────────

export type StageLabel = '기' | '승' | '전' | '반전' | '결';

// ── Draft document building blocks ────────────────────────────────────────────

export interface DraftBeat {
  label: StageLabel;
  title: string;
  description: string;
  estimatedMinutes: number;
  objective: string;
}

export interface DraftAdoptedPuzzle {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  estimatedMinutes: number;
  description: string;
  recommendedBecause: string;
  clueUsage: string[];
  deviceUsage: string[];
  expectedOutput: string;
}

export interface DraftAdoptedPuzzlesByStage {
  stageKey: string;
  stageLabel: StageLabel;
  stageTitle: string;
  puzzles: DraftAdoptedPuzzle[];
}

// ── Main document type ────────────────────────────────────────────────────────
// Designed for easy JSON serialisation → Supabase / Notion / PDF export

export interface DraftDocument {
  // Project meta
  projectName: string;
  mainTheme: string;             // center cell text, or story title fallback
  generatedAt: string;           // ISO timestamp

  // Story info
  storyTitle: string;
  logline: string;
  synopsis: string;
  genre: string;
  tone: string;
  playTime: number;              // minutes
  playerCount: string;
  twistIntensity: TwistIntensity;

  // Mandalart keywords
  conceptKeywords: string[];     // rose theme
  effectsKeywords: string[];     // sky theme
  clueKeywords: string[];        // amber theme

  // Puzzle flow structure
  beats: DraftBeat[];
  totalPlayTime: number;

  // Adopted puzzles
  adoptedPuzzlesByStage: DraftAdoptedPuzzlesByStage[];
  totalAdoptedCount: number;
}

// ── Status / analytics ────────────────────────────────────────────────────────

export interface DraftStatus {
  hasStory: boolean;
  hasFlow: boolean;
  adoptedCount: number;
  conceptKeywordCount: number;
  clueCount: number;
  deviceCount: number;
  completenessScore: number;     // 0-100
}

// ── Export ────────────────────────────────────────────────────────────────────
// Placeholder for future integrations

export type DraftExportFormat = 'pdf' | 'notion' | 'supabase';

export interface DraftExportOptions {
  format: DraftExportFormat;
  includeKeywords: boolean;
  includeFlow: boolean;
  includePuzzles: boolean;
}
