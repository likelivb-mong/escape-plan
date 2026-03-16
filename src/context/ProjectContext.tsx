import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MandalartCellData } from '../types/mandalart';
import type { StoryProposal } from '../types/story';
import type { ProjectBrief } from '../types';
import type { PuzzleFlowPlan } from '../types/puzzleFlow';
import type { PuzzleRecommendationGroup } from '../types/puzzleRecommendation';
import type { GameFlowPlan } from '../types/gameFlow';
import type { FloorPlanData } from '../types/floorPlan';
import { createInitialCells } from '../data/mockMandalart';
import {
  upsertProject,
  deleteProjectById,
  loadProjectById,
  moveToTrash as moveToTrashById,
  deriveCompletionLevel,
  type SavedProject,
} from '../utils/projectStorage';

// ── Context value type ────────────────────────────────────────────────────────

interface ProjectContextValue {
  // Project meta
  projectName: string;
  setProjectName: (name: string) => void;

  // Current saved project id (null = unsaved / new)
  currentProjectId: string | null;

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

  // PassMap link (branchCode + themeId once synced)
  passmapLink: { branchCode: string; themeId: string } | null;
  setPassmapLink: (link: { branchCode: string; themeId: string } | null) => void;

  // Project brief (set from YouTube or manual flow)
  projectBrief: ProjectBrief | null;
  setProjectBrief: (brief: ProjectBrief | null) => void;

  // Persistence helpers
  resetForNewProject: () => void; // clear currentProjectId so next save creates a NEW project
  forkAsNewProject: () => void;   // nullify currentProjectId only (keep all other state) so next save creates a NEW project
  saveCurrentProject: () => string; // returns saved project id
  loadProject: (id: string) => boolean;
  deleteProject: (id: string) => void;
  moveToTrash: (id: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ProjectContext = createContext<ProjectContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectName, setProjectName]         = useState('Untitled Theme Project');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [cells, setCells]                     = useState<MandalartCellData[]>(createInitialCells);
  const [aiStoryProposals, setAiStoryProposals] = useState<StoryProposal[] | null>(null);
  const [selectedStory, setSelectedStory]     = useState<StoryProposal | null>(null);
  const [puzzleFlowPlan, setPuzzleFlowPlan]   = useState<PuzzleFlowPlan | null>(null);
  const [puzzleRecommendationGroups, setPuzzleRecommendationGroups] =
    useState<PuzzleRecommendationGroup[]>([]);
  const [gameFlowDesign, setGameFlowDesign] = useState<GameFlowPlan | null>(null);
  const [floorPlanData, setFloorPlanData] = useState<FloorPlanData | null>(null);
  const [passmapLink, setPassmapLink] = useState<{ branchCode: string; themeId: string } | null>(null);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);

  const forkAsNewProject = useCallback(() => {
    setCurrentProjectId(null);
  }, []);

  const resetForNewProject = useCallback(() => {
    setCurrentProjectId(null);
    setSelectedStory(null);
    setPuzzleFlowPlan(null);
    setPuzzleRecommendationGroups([]);
    setGameFlowDesign(null);
    setFloorPlanData(null);
    setPassmapLink(null);
    setAiStoryProposals(null);
    setProjectBrief(null);
    setCells(createInitialCells());
    setProjectName('Untitled Theme Project');
  }, []);

  const saveCurrentProject = useCallback((): string => {
    const id = currentProjectId ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const existing = currentProjectId ? loadProjectById(currentProjectId) : null;

    const project: SavedProject = {
      id,
      name: projectName,
      savedAt: existing?.savedAt ?? now,
      updatedAt: now,
      storyTitle: selectedStory?.title,
      genres: projectBrief?.genres,
      playTimes: projectBrief?.playTimes,
      synopsis: projectBrief?.synopsis ?? selectedStory?.logline,
      completionLevel: deriveCompletionLevel(selectedStory, puzzleFlowPlan, gameFlowDesign),
      projectBrief,
      cells,
      selectedStory,
      puzzleFlowPlan,
      puzzleRecommendationGroups,
      gameFlowDesign,
      floorPlanData,
      passmapLink,
    };

    upsertProject(project);
    setCurrentProjectId(id);
    return id;
  }, [
    currentProjectId, projectName, selectedStory, puzzleFlowPlan,
    gameFlowDesign, projectBrief, cells, puzzleRecommendationGroups, floorPlanData, passmapLink,
  ]);

  const loadProject = useCallback((id: string): boolean => {
    const saved = loadProjectById(id);
    if (!saved) return false;

    setProjectName(saved.name);
    setCurrentProjectId(saved.id);
    setCells(saved.cells);
    setAiStoryProposals(null);
    setSelectedStory(saved.selectedStory);
    setPuzzleFlowPlan(saved.puzzleFlowPlan);
    setPuzzleRecommendationGroups(saved.puzzleRecommendationGroups);
    setGameFlowDesign(saved.gameFlowDesign);
    setFloorPlanData(saved.floorPlanData);
    setPassmapLink(saved.passmapLink ?? null);
    setProjectBrief(saved.projectBrief);
    return true;
  }, []);

  const deleteProject = useCallback((id: string): void => {
    deleteProjectById(id);
    if (currentProjectId === id) setCurrentProjectId(null);
  }, [currentProjectId]);

  const moveToTrash = useCallback((id: string): void => {
    moveToTrashById(id);
    if (currentProjectId === id) setCurrentProjectId(null);
  }, [currentProjectId]);

  return (
    <ProjectContext.Provider
      value={{
        projectName, setProjectName,
        currentProjectId,
        cells, setCells,
        aiStoryProposals, setAiStoryProposals,
        selectedStory, setSelectedStory,
        puzzleFlowPlan, setPuzzleFlowPlan,
        puzzleRecommendationGroups, setPuzzleRecommendationGroups,
        gameFlowDesign, setGameFlowDesign,
        floorPlanData, setFloorPlanData,
        passmapLink, setPassmapLink,
        projectBrief, setProjectBrief,
        resetForNewProject,
        forkAsNewProject,
        saveCurrentProject,
        loadProject,
        deleteProject,
        moveToTrash,
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
