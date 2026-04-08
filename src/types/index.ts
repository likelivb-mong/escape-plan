// Investigation keyword selection (from 수사 백과사전)
export interface InvestigationSelection {
  motives: string[];
  methods: string[];
  clues: string[];
  techniques: string[];
}

// Unified project brief (YouTube or manual)
export interface ProjectBrief {
  source: 'youtube' | 'manual' | 'scenario' | 'markdown';
  // YouTube only
  videoId: string | null;
  videoTitle: string | null;
  videoChannel: string | null;
  // Common
  synopsis: string;
  beats: { label: '기' | '승' | '전' | '반전' | '결'; description: string }[];
  // Manual only
  genres: Genre[];
  playTimes: PlayTime[];
  investigation: InvestigationSelection;
  puzzleTypes?: PuzzleType[];
  clueFormats?: ClueFormat[];
}

// QD 문제유형 분류 (클루제작과 문제유형 파악을 위한 퀘스트 백과사전/다이어그램)
export type PuzzleType = '추리' | '관찰' | '수리' | '협동' | '활동' | '오감';
export type ClueFormat = '평면' | '입체' | '공간' | '감각';

// Project types
export type PlayTime = 60 | 70 | 80 | 90;

export type Genre =
  | 'horror'
  | 'mystery'
  | 'adventure'
  | 'thriller'
  | 'fantasy'
  | 'sci-fi'
  | 'romance'
  | 'comedy';

export interface Project {
  id: string;
  name: string;
  playTime: PlayTime;
  genre: Genre;
  synopsis: string;
  createdAt: string;
  youtubeUrl?: string;
}

// Mandalart types
export type CellColor = 'rose' | 'sky' | 'amber' | null;

export interface MandalartCell {
  id: string;
  text: string;
  color: CellColor;
  row: number;
  col: number;
}

export interface MandalartBoard {
  projectId: string;
  cells: MandalartCell[];
}

// Story Proposal types
export interface StoryAct {
  label: '기' | '승' | '전' | '반전' | '결';
  description: string;
}

export interface StoryProposal {
  id: string;
  title: string;
  logline: string;
  description: string;
  acts: StoryAct[];
}
