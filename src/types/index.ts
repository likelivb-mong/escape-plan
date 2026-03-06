// Investigation keyword selection (from 수사 백과사전)
export interface InvestigationSelection {
  motives: string[];
  methods: string[];
  clues: string[];
  techniques: string[];
}

// Unified project brief (YouTube or manual)
export interface ProjectBrief {
  source: 'youtube' | 'manual' | 'scenario';
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
}

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
