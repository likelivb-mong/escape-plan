import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MandalartCellData } from '../types/mandalart';
import type { StoryProposal } from '../types/story';
import type { ProjectBrief } from '../types';
import type { PuzzleFlowPlan } from '../types/puzzleFlow';
import type { PuzzleRecommendationGroup } from '../types/puzzleRecommendation';
import type { GameFlowPlan } from '../types/gameFlow';
import type { FloorPlanData } from '../types/floorPlan';
import type { ManualOverrides } from '../types/manual';
import type { MarkdownImportMeta, OptionalSectionsMap } from '../types/optionalSections';
import { createInitialCells } from '../data/mockMandalart';
import { normalizeFloorPlan } from '../utils/floorPlan';
import {
  upsertProject,
  deleteProjectById,
  loadProjectById,
  loadProjectByIdFromSupabase,
  moveToTrash as moveToTrashById,
  deriveCompletionLevel,
  type SavedProject,
} from '../utils/projectStorage';
import { saveVersionSnapshot, type HistoryPage } from '../utils/projectHistory';

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

  // Branch assignment (set at project creation)
  branchCode: string | null;
  setBranchCode: (code: string | null) => void;

  // PassMap link (branchCode + themeId once synced)
  passmapLink: { branchCode: string; themeId: string } | null;
  setPassmapLink: (link: { branchCode: string; themeId: string } | null) => void;

  // Project brief (set from YouTube or manual flow)
  projectBrief: ProjectBrief | null;
  setProjectBrief: (brief: ProjectBrief | null) => void;
  optionalSections: OptionalSectionsMap;
  setOptionalSections: (sections: OptionalSectionsMap) => void;
  importMeta: MarkdownImportMeta | null;
  setImportMeta: (meta: MarkdownImportMeta | null) => void;
  manualOverrides: ManualOverrides;
  setManualOverrides: (overrides: ManualOverrides) => void;

  // Persistence helpers
  resetForNewProject: () => void;
  forkAsNewProject: () => void;
  persistProject: () => string;                    // silent save (no history)
  saveVersion: (page: HistoryPage) => number;      // explicit save → creates version, returns version number
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
  const [branchCode, setBranchCode] = useState<string | null>(null);
  const [passmapLink, setPassmapLink] = useState<{ branchCode: string; themeId: string } | null>(null);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);
  const [optionalSections, setOptionalSections] = useState<OptionalSectionsMap>({});
  const [importMeta, setImportMeta] = useState<MarkdownImportMeta | null>(null);
  const [manualOverrides, setManualOverrides] = useState<ManualOverrides>({
    flowManualByStepId: {},
    passMapManualByStepId: {},
  });

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
    setBranchCode(null);
    setPassmapLink(null);
    setAiStoryProposals(null);
    setProjectBrief(null);
    setOptionalSections({});
    setImportMeta(null);
    setManualOverrides({ flowManualByStepId: {}, passMapManualByStepId: {} });
    setCells(createInitialCells());
    setProjectName('Untitled Theme Project');
  }, []);

  /** Build the current project object for persistence */
  const buildProject = useCallback((): SavedProject => {
    const id = currentProjectId ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const existing = currentProjectId ? loadProjectById(currentProjectId) : null;
    const validatedFloorPlan = floorPlanData ? normalizeFloorPlan(floorPlanData) : null;

    return {
      id,
      name: projectName,
      savedAt: existing?.savedAt ?? now,
      updatedAt: now,
      storyTitle: selectedStory?.title,
      genres: projectBrief?.genres,
      playTimes: projectBrief?.playTimes,
      synopsis: projectBrief?.synopsis ?? selectedStory?.logline,
      completionLevel: deriveCompletionLevel(selectedStory, puzzleFlowPlan, gameFlowDesign),
      branchCode,
      projectBrief,
      cells,
      selectedStory,
      puzzleFlowPlan,
      puzzleRecommendationGroups,
      gameFlowDesign,
      floorPlanData: validatedFloorPlan,
      passmapLink,
      optionalSections,
      importMeta,
      manualOverrides,
    };
  }, [
    currentProjectId, projectName, selectedStory, puzzleFlowPlan,
    gameFlowDesign, projectBrief, cells, puzzleRecommendationGroups, floorPlanData, branchCode, passmapLink,
    optionalSections, importMeta, manualOverrides,
  ]);

  /** Silent persist — saves to localStorage but does NOT create a version in history */
  const persistProject = useCallback((): string => {
    const project = buildProject();
    upsertProject(project);
    setCurrentProjectId(project.id);
    return project.id;
  }, [buildProject]);

  /** Explicit save — persists AND creates a numbered version in history */
  const saveVersion = useCallback((page: HistoryPage): number => {
    const project = buildProject();
    upsertProject(project);
    setCurrentProjectId(project.id);
    return saveVersionSnapshot(project, page);
  }, [buildProject]);

  const applyProject = useCallback((saved: SavedProject) => {
    setProjectName(saved.name);
    setCurrentProjectId(saved.id);
    setCells(saved.cells);
    setAiStoryProposals(null);
    setSelectedStory(saved.selectedStory);
    setPuzzleFlowPlan(saved.puzzleFlowPlan);
    setPuzzleRecommendationGroups(saved.puzzleRecommendationGroups);
    setGameFlowDesign(saved.gameFlowDesign);
    setFloorPlanData(saved.floorPlanData ? normalizeFloorPlan(saved.floorPlanData) : null);
    setBranchCode(saved.branchCode ?? null);
    setPassmapLink(saved.passmapLink ?? null);
    setProjectBrief(saved.projectBrief);
    setOptionalSections(saved.optionalSections ?? {});
    setImportMeta(saved.importMeta ?? null);
    setManualOverrides(saved.manualOverrides ?? { flowManualByStepId: {}, passMapManualByStepId: {} });
  }, []);

  const loadProject = useCallback((id: string): boolean => {
    // Show local cache instantly
    const saved = loadProjectById(id);
    if (saved) {
      applyProject(saved);
    }

    // Always fetch latest from Supabase (cross-device sync)
    loadProjectByIdFromSupabase(id).then((remote) => {
      if (remote) {
        // Apply if newer than local or if local didn't exist
        if (!saved || remote.updatedAt > saved.updatedAt) {
          applyProject(remote);
        }
      }
    }).catch((err) => {
      console.error('Failed to sync project from Supabase:', err);
    });

    return !!saved;
  }, [applyProject]);

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
        branchCode, setBranchCode,
        passmapLink, setPassmapLink,
        projectBrief, setProjectBrief,
        optionalSections, setOptionalSections,
        importMeta, setImportMeta,
        manualOverrides, setManualOverrides,
        resetForNewProject,
        forkAsNewProject,
        persistProject,
        saveVersion,
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
