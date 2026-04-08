import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { generateInitialLayout, normalizeFloorPlan } from '../utils/floorPlan';
import type { FloorPlanData } from '../types/floorPlan';
import type { ThemeStep, StepDetail, PassMapViewMode, ThemeRoom } from '../features/passmap/types/passmap';

import WorkflowStepBar from '../components/layout/WorkflowStepBar';
import MiniMapCanvas from '../features/passmap/components/MiniMapCanvas';
import StepListPanel from '../features/passmap/components/StepListPanel';
import StepDetailCard from '../features/passmap/components/StepDetailCard';
import FlowPanel from '../features/passmap/components/FlowPanel';
import EditorToolbar from '../features/passmap/components/EditorToolbar';

import {
  getThemeById,
  getStepsByTheme,
  getDetailsByStepIds,
  getDetailByStepId,
  saveStepsForTheme,
  saveDetailsForTheme,
  updateTheme,
} from '../features/passmap/utils/passmap-store';
import { MOCK_BRANCHES } from '../features/passmap/mock/branches';
import { syncFloorPlanToPassMap, findMatchingTheme } from '../features/passmap/utils/floorplan-sync';

type FloorViewMode = 'map' | 'flow';

export default function SettingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    projectName,
    gameFlowDesign,
    setGameFlowDesign,
    floorPlanData,
    setFloorPlanData,
    branchCode,
    setBranchCode,
    passmapLink,
    setPassmapLink,
    persistProject,
    saveVersion,
  } = useProject();

  const [isEditing, setIsEditing] = useState(false);
  const [floorViewMode, setFloorViewMode] = useState<FloorViewMode>('map');

  // PassMap state (when linked)
  const [pmSteps, setPmSteps] = useState<ThemeStep[]>([]);
  const [pmDetails, setPmDetails] = useState<StepDetail[]>([]);
  const [pmViewMode, setPmViewMode] = useState<PassMapViewMode>('map');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // ── Generate layout: on first mount if missing, or when applyFromPrev ─────
  const layoutInitializedRef = useRef(false);
  useEffect(() => {
    if (!gameFlowDesign) return;
    const applyFromPrev = (location.state as { applyFromPrev?: boolean } | null)?.applyFromPrev;

    if (applyFromPrev) {
      window.history.replaceState({}, '');
      const initial = generateInitialLayout(gameFlowDesign.rooms);
      setFloorPlanData(normalizeFloorPlan(initial));
      layoutInitializedRef.current = true;
      return;
    }

    if (layoutInitializedRef.current) return;
    layoutInitializedRef.current = true;
    if (!floorPlanData) {
      const initial = generateInitialLayout(gameFlowDesign.rooms);
      setFloorPlanData(normalizeFloorPlan(initial));
    }
  }, [gameFlowDesign]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-sync to PassMap ONCE when branchCode + floorPlan are ready ────────
  const syncDoneRef = useRef(false);
  useEffect(() => {
    if (!branchCode || !gameFlowDesign || !floorPlanData) return;

    // Already linked → just load data
    if (passmapLink) {
      if (!syncDoneRef.current) {
        const steps = getStepsByTheme(passmapLink.themeId);
        setPmSteps(steps);
        setPmDetails(getDetailsByStepIds(steps.map((s) => s.id)));
        syncDoneRef.current = true;
      }
      return;
    }

    // Auto-sync: check for existing or create new (only once)
    if (syncDoneRef.current) return;
    syncDoneRef.current = true;

    const existing = findMatchingTheme(branchCode, gameFlowDesign.title);
    const result = syncFloorPlanToPassMap(
      gameFlowDesign,
      floorPlanData,
      branchCode,
      existing?.id,
    );
    setPassmapLink({ branchCode, themeId: result.themeId });
    const steps = getStepsByTheme(result.themeId);
    setPmSteps(steps);
    setPmDetails(getDetailsByStepIds(steps.map((s) => s.id)));
  }, [branchCode, gameFlowDesign, floorPlanData, passmapLink, setPassmapLink]);

  // ── Room update (shape/size change via tile editing) ──────────────────────
  // RULE: When a room changes, all steps in that room stay clamped inside
  const handleUpdateRoom = useCallback((roomName: string, updates: Partial<ThemeRoom>) => {
    if (!passmapLink) return;
    const theme = getThemeById(passmapLink.themeId);
    if (!theme?.rooms) return;

    const updatedRooms = theme.rooms.map((r) =>
      r.name === roomName ? { ...r, ...updates } : r
    );
    updateTheme(passmapLink.themeId, { rooms: updatedRooms });

    // Clamp steps to new room bounds
    const updatedRoom = updatedRooms.find(r => r.name === roomName);
    if (updatedRoom) {
      const bounds = getRoomBounds(updatedRoom);
      const pad = 2;
      const updatedSteps = pmSteps.map(s => {
        if (s.zone !== roomName) return s;
        return {
          ...s,
          x: Math.max(bounds.x + pad, Math.min(bounds.x + bounds.w - pad, s.x)),
          y: Math.max(bounds.y + pad, Math.min(bounds.y + bounds.h - pad, s.y)),
        };
      });
      setPmSteps(updatedSteps);
      saveStepsForTheme(passmapLink.themeId, updatedSteps);
    }
  }, [passmapLink, pmSteps]);

  // ── Room move (drag entire room + steps together) ─────────────────────────
  const handleRoomMove = useCallback((roomName: string, deltaX: number, deltaY: number) => {
    if (!passmapLink) return;
    const theme = getThemeById(passmapLink.themeId);
    if (!theme?.rooms) return;

    // Update room position
    const updatedRooms = theme.rooms.map((r) =>
      r.name === roomName ? { ...r, x: r.x + deltaX, y: r.y + deltaY } : r
    );
    updateTheme(passmapLink.themeId, { rooms: updatedRooms });

    // Move all steps in that zone by same delta
    const updatedSteps = pmSteps.map((s) =>
      s.zone === roomName ? { ...s, x: s.x + deltaX, y: s.y + deltaY } : s
    );
    setPmSteps(updatedSteps);
    saveStepsForTheme(passmapLink.themeId, updatedSteps);
  }, [passmapLink, pmSteps]);

  // ── Room rename (propagates to GameFlow, FloorPlan, PassMap) ────────────────
  const handleRenameRoom = useCallback((oldName: string, newName: string) => {
    if (!gameFlowDesign) return;

    // 1. Update GameFlowPlan
    const updatedPlan = {
      ...gameFlowDesign,
      rooms: gameFlowDesign.rooms.map((r) => (r === oldName ? newName : r)),
      steps: gameFlowDesign.steps.map((s) =>
        s.room === oldName ? { ...s, room: newName } : s,
      ),
    };
    setGameFlowDesign(updatedPlan);

    // 2. Update FloorPlanData
    if (floorPlanData) {
      setFloorPlanData({
        ...floorPlanData,
        rooms: floorPlanData.rooms.map((r) =>
          r.roomName === oldName ? { ...r, roomName: newName } : r,
        ),
      });
    }

    // 3. Update PassMap store
    if (passmapLink) {
      const updatedSteps = pmSteps.map((s) =>
        s.zone === oldName ? { ...s, zone: newName } : s,
      );
      setPmSteps(updatedSteps);
      saveStepsForTheme(passmapLink.themeId, updatedSteps);

      const theme = getThemeById(passmapLink.themeId);
      if (theme?.rooms) {
        updateTheme(passmapLink.themeId, {
          rooms: theme.rooms.map((r) =>
            r.name === oldName ? { ...r, name: newName } : r,
          ),
        });
      }
    }
  }, [gameFlowDesign, floorPlanData, passmapLink, pmSteps, setGameFlowDesign, setFloorPlanData]);

  // ── PassMap interactions ─────────────────────────────────────────────────────

  const selectedStep = pmSteps.find((s) => s.id === selectedStepId) || null;
  const selectedDetail = selectedStep
    ? pmDetails.find((d) => d.stepId === selectedStep.id) || getDetailByStepId(selectedStep.id)
    : undefined;

  const handleSelectStep = useCallback((step: ThemeStep) => {
    setSelectedStepId(step.id);
  }, []);

  const handleStatusChange = useCallback((stepId: string, status: ThemeStep['status']) => {
    setPmSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, status } : s)));
  }, []);

  const handleStepMove = useCallback((stepId: string, x: number, y: number) => {
    setPmSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, x, y } : s)));
  }, []);

  const handleAddStep = useCallback((type: ThemeStep['type']) => {
    const maxNum = pmSteps.reduce((m, s) => Math.max(m, s.stepNumber), 0);
    const newStep: ThemeStep = {
      id: `new-${Date.now()}`,
      themeId: passmapLink?.themeId || '',
      stepNumber: maxNum + 1,
      type,
      label: `New ${type}`,
      zone: '',
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      status: 'unchecked',
    };
    const newDetail: StepDetail = {
      stepId: newStep.id,
      answer: '', input: '', output: '', resetMethod: '', memo: '',
    };
    setPmSteps((prev) => [...prev, newStep]);
    setPmDetails((prev) => [...prev, newDetail]);
    setSelectedStepId(newStep.id);
  }, [pmSteps, passmapLink]);

  const handleDeleteStep = useCallback(() => {
    if (!selectedStepId) return;
    setPmSteps((prev) => prev.filter((s) => s.id !== selectedStepId));
    setPmDetails((prev) => prev.filter((d) => d.stepId !== selectedStepId));
    setSelectedStepId(null);
  }, [selectedStepId]);

  const handleSave = useCallback(() => {
    if (!passmapLink) return;
    setIsSaving(true);
    saveStepsForTheme(passmapLink.themeId, pmSteps);
    saveDetailsForTheme(passmapLink.themeId, pmDetails);
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('저장 완료');
      setTimeout(() => setSaveMessage(null), 2000);
    }, 300);
  }, [passmapLink, pmSteps, pmDetails]);

  const theme = passmapLink ? getThemeById(passmapLink.themeId) : undefined;
  const linkedBranch = passmapLink ? MOCK_BRANCHES.find((b) => b.code === passmapLink.branchCode) : null;

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!gameFlowDesign) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4 px-6">
        <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-title2">
          📐
        </div>
        <div className="text-center">
          <p className="text-body font-semibold text-white/70 mb-1">게임 플로우가 없습니다.</p>
          <p className="text-subhead text-white/35 leading-relaxed">
            Game Flow 탭에서 먼저 게임 플로우를 설계해 주세요.
          </p>
        </div>
        <button
          onClick={() => navigate('/puzzle-flow')}
          className="mt-2 px-4 py-2 rounded-full border border-white/[0.12] text-subhead text-white/50 hover:border-white/25 hover:text-white/70 transition-all"
        >
          ← Game Flow로
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] print:h-auto print:overflow-visible">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.07] flex-shrink-0 print:hidden">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/game-flow')}
            className="text-white/30 hover:text-white/60 transition-colors text-subhead"
          >
            ← Game Flow
          </button>
          <span className="h-3.5 w-px bg-white/10" />
          <h1 className="text-body font-semibold text-white/85">{projectName}</h1>
          <span className="h-3.5 w-px bg-white/10" />
          <span className="text-footnote text-white/35 font-medium tracking-wide">
            Setting
          </span>
        </div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/passmap-manual')}
            className="px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote font-medium text-white/45 hover:border-white/25 hover:text-white/70 transition-all duration-150"
          >
            Manual
          </button>
          {passmapLink && floorViewMode === 'map' && (
            <button
              onClick={() => setIsEditing(prev => !prev)}
              className={`px-3 py-1.5 rounded-full border text-footnote font-medium transition-all duration-150 ${
                isEditing
                  ? 'bg-white text-black border-transparent'
                  : 'border-white/[0.12] text-white/45 hover:border-white/25 hover:text-white/70'
              }`}
            >
              {isEditing ? '✓ 수정 완료' : '✏ 편집'}
            </button>
          )}
          <button
            onClick={() => { const v = saveVersion('setting'); setSaveMessage(`v${v} 저장됨`); setTimeout(() => setSaveMessage(null), 2000); }}
            disabled={!isEditing}
            className={`px-3 py-1.5 rounded-lg border text-footnote font-medium transition-all ${
              isEditing
                ? 'border-white/[0.10] text-white/45 hover:border-white/20 hover:text-white/70'
                : 'border-white/[0.08] text-white/20 bg-white/[0.02] cursor-not-allowed'
            }`}
          >
            {isEditing ? '저장' : '저장됨'}
          </button>
        </div>
      </div>

      {/* Workflow step bar */}
      <WorkflowStepBar onBeforeNavigate={persistProject} />

      {/* ── Content ── */}
      {passmapLink ? (
        <div className="flex flex-col flex-1 min-h-0 px-4 sm:px-6 py-4">
          {/* PassMap view mode tabs */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-caption text-white/30">
                {linkedBranch?.name} · {theme?.name}
              </span>
              {saveMessage && (
                <span className="text-caption text-emerald-400/80">{saveMessage}</span>
              )}
            </div>
            <div className="flex gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
              {(['map', 'flow'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setFloorViewMode(m);
                    setPmViewMode(m);
                    setIsEditing(false);
                  }}
                  className={`px-4 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all ${
                    pmViewMode === m ? 'bg-white/[0.10] text-white' : 'text-white/30 hover:text-white/55'
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Editor toolbar (visible when editing on MAP view) */}
          {pmViewMode === 'map' && isEditing && (
            <div className="mb-4">
              <EditorToolbar
                onAddStep={handleAddStep}
                onDeleteStep={handleDeleteStep}
                onSave={handleSave}
                hasSelection={!!selectedStepId}
                isSaving={isSaving}
              />
            </div>
          )}

          {/* FLOW view */}
          {pmViewMode === 'flow' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
              <div className="lg:col-span-2 bg-white/[0.02] rounded-xl border border-white/10 p-4 overflow-y-auto">
                <FlowPanel
                  steps={pmSteps}
                  selectedStepId={selectedStepId}
                  onSelectStep={handleSelectStep}
                />
                {selectedStepId && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <button
                      onClick={() => setPmViewMode('map')}
                      className="text-caption text-sky-400/60 hover:text-sky-400 transition-colors"
                    >
                      → MAP에서 보기
                    </button>
                  </div>
                )}
              </div>
              <div>
                {selectedStep ? (
                  <StepDetailCard step={selectedStep} detail={selectedDetail} onStatusChange={handleStatusChange} />
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/30 text-center text-sm">
                    Step을 선택하세요
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* MAP view */
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-4 flex-1 min-h-0">
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-3 max-h-[600px] overflow-hidden">
                <StepListPanel steps={pmSteps} selectedStepId={selectedStepId} onSelectStep={handleSelectStep} />
              </div>
              <div className="min-h-[500px]">
                <MiniMapCanvas
                  steps={pmSteps}
                  selectedStepId={selectedStepId}
                  onSelectStep={handleSelectStep}
                  rooms={theme?.rooms || []}
                  editable={isEditing}
                  onStepMove={isEditing ? handleStepMove : undefined}
                  onRoomUpdate={isEditing ? handleUpdateRoom : undefined}
                  onRoomMove={isEditing ? handleRoomMove : undefined}
                  details={pmDetails}
                />
              </div>
              <div>
                {selectedStep ? (
                  <StepDetailCard step={selectedStep} detail={selectedDetail} onStatusChange={handleStatusChange} />
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/30 text-center text-sm">
                    Step을 선택하세요
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-body text-white/50">PassMap 연동을 위해 지점을 선택하세요</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {MOCK_BRANCHES.map((b) => (
              <button
                key={b.code}
                onClick={() => setBranchCode(b.code)}
                className="px-3 py-1.5 rounded-full text-subhead font-mono font-medium border border-white/10 text-white/40 hover:border-white/30 hover:text-white/60 transition-all"
              >
                {b.code}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

function getRoomBounds(room: ThemeRoom) {
  if (room.tiles && room.tiles.length > 0) {
    const rows = room.tiles.map(t => t.row);
    const cols = room.tiles.map(t => t.col);
    const minRow = Math.min(...rows), maxRow = Math.max(...rows);
    const minCol = Math.min(...cols), maxCol = Math.max(...cols);
    const CELL = 5;
    return {
      x: minCol * CELL,
      y: minRow * CELL,
      w: (maxCol - minCol + 1) * CELL,
      h: (maxRow - minRow + 1) * CELL,
    };
  }
  return { x: room.x, y: room.y, w: room.width, h: room.height };
}
