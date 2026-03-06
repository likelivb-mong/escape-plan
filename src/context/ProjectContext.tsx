import { createContext, useContext, useState, type ReactNode } from 'react';
import type { MandalartCellData } from '../types/mandalart';
import type { StoryProposal } from '../types/story';
import type { ProjectBrief } from '../types';
import type { PuzzleFlowPlan } from '../types/puzzleFlow';
import type { PuzzleRecommendationGroup } from '../types/puzzleRecommendation';
import type { GameFlowPlan } from '../types/gameFlow';
import type { FloorPlanData } from '../types/floorPlan';
import { createInitialCells } from '../data/mockMandalart';

// ── Context value type ────────────────────────────────────────────────────────
// All project state lives here so it's serialisable to Supabase in one payload.

interface ProjectContextValue {
  // Project meta
  projectName: string;
  setProjectName: (name: string) => void;

  // Mandalart
  cells: MandalartCellData[];
  setCells: React.Dispatch<React.SetStateAction<MandalartCellData[]>>;

  // AI-generated story proposals (from YouTube analysis; null = use mock)
  aiStoryProposals: StoryProposal[] | null;
  setAiStoryProposals: (proposals: StoryProposal[] | null) => void;

  // Story selection (/story → /puzzle-flow)
  selectedStory: StoryProposal | null;
  setSelectedStory: (story: StoryProposal | null) => void;

  // Puzzle flow plan (/puzzle-flow → /puzzle-recommendations)
  puzzleFlowPlan: PuzzleFlowPlan | null;
  setPuzzleFlowPlan: (plan: PuzzleFlowPlan | null) => void;

  // Puzzle recommendation groups (/puzzle-recommendations → /draft)
  puzzleRecommendationGroups: PuzzleRecommendationGroup[];
  setPuzzleRecommendationGroups: (groups: PuzzleRecommendationGroup[]) => void;

  // Game flow design (/puzzle-flow Game Flow tab → /draft)
  gameFlowDesign: GameFlowPlan | null;
  setGameFlowDesign: (plan: GameFlowPlan | null) => void;

  // Floor plan layout (/floor-plan)
  floorPlanData: FloorPlanData | null;
  setFloorPlanData: (data: FloorPlanData | null) => void;

  // Project brief (set from YouTube or manual flow)
  projectBrief: ProjectBrief | null;
  setProjectBrief: (brief: ProjectBrief | null) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ProjectContext = createContext<ProjectContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectName, setProjectName]         = useState('Untitled Theme Project');
  const [cells, setCells]                     = useState<MandalartCellData[]>(createInitialCells);
  const [aiStoryProposals, setAiStoryProposals] = useState<StoryProposal[] | null>(null);
  const [selectedStory, setSelectedStory]     = useState<StoryProposal | null>(null);
  const [puzzleFlowPlan, setPuzzleFlowPlan]   = useState<PuzzleFlowPlan | null>(null);
  const [puzzleRecommendationGroups, setPuzzleRecommendationGroups] =
    useState<PuzzleRecommendationGroup[]>([]);
  const [gameFlowDesign, setGameFlowDesign] = useState<GameFlowPlan | null>(null);
  const [floorPlanData, setFloorPlanData] = useState<FloorPlanData | null>(null);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);

  return (
    <ProjectContext.Provider
      value={{
        projectName, setProjectName,
        cells, setCells,
        aiStoryProposals, setAiStoryProposals,
        selectedStory, setSelectedStory,
        puzzleFlowPlan, setPuzzleFlowPlan,
        puzzleRecommendationGroups, setPuzzleRecommendationGroups,
        gameFlowDesign, setGameFlowDesign,
        floorPlanData, setFloorPlanData,
        projectBrief, setProjectBrief,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within <ProjectProvider>');
  return ctx;
}
