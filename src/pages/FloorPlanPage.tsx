import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { generateInitialLayout, reconcileRooms, normalizeFloorPlan } from '../utils/floorPlan';
import type { FloorPlanData } from '../types/floorPlan';
import type { ThemeStep, StepDetail, PassMapViewMode } from '../features/passmap/types/passmap';

import FloorPlanCanvas from '../components/floor-plan/FloorPlanCanvas';
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

type Tab = 'passmap';
type FloorViewMode = 'map' | 'flow';

export default function FloorPlanPage() {
  const navigate = useNavigate();
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
  } = useProject();

  const [activeTab, setActiveTab] = useState<Tab>('passmap');
  const [isEditing, setIsEditing] = useState(false);
  const [floorViewMode, setFloorViewMode] = useState<FloorViewMode>('map');

  // PassMap state (when linked)
  const [pmSteps, setPmSteps] = useState<ThemeStep[]>([]);
  const [pmDetails, setPmDetails] = useState<StepDetail[]>([]);
  const [pmViewMode, setPmViewMode] = useState<PassMapViewMode>('map');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // ── Auto-generate layout ONLY if missing (first time) ──────────────────────
  const layoutInitializedRef = useRef(false);
  useEffect(() => {
    if (!gameFlowDesign || layoutInitializedRef.current) return;
    layoutInitializedRef.current = true;
    if (!floorPlanData) {
      const initial = generateInitialLayout(gameFlowDesign.rooms);
      setFloorPlanData(normalizeFloorPlan(initial));
    }
  }, [gameFlowDesign]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-sync to PassMap when branchCode + floorPlan are ready ──────────────
  useEffect(() => {
    if (!branchCode || !gameFlowDesign || !floorPlanData) return;
    // Already linked → just load data
    if (passmapLink) {
      const steps = getStepsByTheme(passmapLink.themeId);
      setPmSteps(steps);
      setPmDetails(getDetailsByStepIds(steps.map((s) => s.id)));
      return;
    }
    // Auto-sync: check for existing or create new
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

  // When linked, default to passmap view
  useEffect(() => {
    if (passmapLink) setActiveTab('passmap');
  }, [passmapLink]);

  const handleUpdateFloorPlan = (data: FloorPlanData) => {
    setFloorPlanData(data);
  };

  // ── Room rename (propagates to GameFlow, FloorPlan, PassMap) ────────────────

  const handleRenameRoom = useCallback((oldName: string, newName: string) => {
    if (!gameFlowDesign) return;

    // 1. Update GameFlowPlan: rooms array + step.room references
    const updatedPlan = {
      ...gameFlowDesign,
      rooms: gameFlowDesign.rooms.map((r) => (r === oldName ? newName : r)),
      steps: gameFlowDesign.steps.map((s) =>
        s.room === oldName ? { ...s, room: newName } : s,
      ),
    };
    setGameFlowDesign(updatedPlan);

    // 2. Update FloorPlanData: room layout names
    if (floorPlanData) {
      setFloorPlanData({
        ...floorPlanData,
        rooms: floorPlanData.rooms.map((r) =>
          r.roomName === oldName ? { ...r, roomName: newName } : r,
        ),
      });
    }

    // 3. Update PassMap store: step zones + theme rooms
    if (passmapLink) {
      // Update step zones
      const updatedSteps = pmSteps.map((s) =>
        s.zone === oldName ? { ...s, zone: newName } : s,
      );
      setPmSteps(updatedSteps);
      saveStepsForTheme(passmapLink.themeId, updatedSteps);

      // Update theme rooms
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
            onClick={() => navigate('/puzzle-flow')}
            className="text-white/30 hover:text-white/60 transition-colors text-subhead"
          >
            ← Game Flow
          </button>
          <span className="h-3.5 w-px bg-white/10" />
          <h1 className="text-body font-semibold text-white/85">{projectName}</h1>
          <span className="h-3.5 w-px bg-white/10" />
          <span className="text-footnote text-white/35 font-medium tracking-wide">
            Pass Map
          </span>
        </div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2">
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
            onClick={() => navigate('/draft')}
            className="text-footnote text-white/35 hover:text-white/50 transition-colors"
          >
            Draft 보기 →
          </button>
        </div>
      </div>

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
              {(['map', 'flow', 'editor'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    if (m === 'map' || m === 'flow') {
                      setFloorViewMode(m === 'map' ? 'map' : 'flow');
                      setPmViewMode(m);
                    } else {
                      setPmViewMode(m);
                    }
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

          {/* Editor toolbar */}
          {pmViewMode === 'editor' && (
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
            /* MAP & EDITOR view */
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-4 flex-1 min-h-0">
              <div className="bg-white/[0.02] rounded-xl border border-white/10 p-3 max-h-[600px] overflow-hidden">
                <StepListPanel steps={pmSteps} selectedStepId={selectedStepId} onSelectStep={handleSelectStep} />
              </div>
              <div className="min-h-[500px]">
                {floorViewMode === 'map' && (
                  <MiniMapCanvas
                    steps={pmSteps}
                    selectedStepId={selectedStepId}
                    onSelectStep={handleSelectStep}
                    rooms={theme?.rooms || []}
                    editable={pmViewMode === 'editor'}
                    onStepMove={pmViewMode === 'editor' ? handleStepMove : undefined}
                  />
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

// ── Tab button ────────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1 rounded-full text-footnote font-medium transition-all duration-150',
        active ? 'bg-white text-black' : 'text-white/40 hover:text-white/65',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
