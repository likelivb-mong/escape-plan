import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ThemeStep, StepType, StepDetail, PassMapViewMode } from '../types/passmap';
import { MOCK_BRANCHES } from '../mock/branches';
import {
  getThemeById,
  getStepsByTheme,
  getDetailsByStepIds,
  getDetailByStepId,
  saveStepsForTheme,
  saveDetailsForTheme,
  deleteTheme,
} from '../utils/passmap-store';
import StepListPanel from '../components/StepListPanel';
import MiniMapCanvas from '../components/MiniMapCanvas';
import StepDetailCard from '../components/StepDetailCard';
import FlowPanel from '../components/FlowPanel';
import EditorToolbar from '../components/EditorToolbar';

const VIEW_TABS: { key: PassMapViewMode; label: string }[] = [
  { key: 'map', label: 'MAP' },
  { key: 'flow', label: 'FLOW' },
  { key: 'editor', label: 'EDITOR' },
];

// ── Coordinate normalization ────────────────────────────────────────────────
// Old mock data uses pixel values (80-700). Detect and convert to 0-100%.

const CANVAS_REFERENCE_WIDTH = 800;
const CANVAS_REFERENCE_HEIGHT = 550;

function normalizeStepCoordinates(steps: ThemeStep[]): ThemeStep[] {
  if (steps.length === 0) return steps;

  // Check if any coordinates exceed 100 — likely pixel-based
  const hasPixelCoords = steps.some((s) => s.x > 100 || s.y > 100);

  if (!hasPixelCoords) {
    // Already percentage-based or within 0-100 range.
    // But check if all steps are at 0,0 — need auto-distribute
    const allZero = steps.every((s) => s.x === 0 && s.y === 0);
    if (allZero) return autoDistributeSteps(steps);
    return steps;
  }

  // Convert pixel coordinates to percentage
  return steps.map((s) => ({
    ...s,
    x: Math.max(2, Math.min(98, (s.x / CANVAS_REFERENCE_WIDTH) * 100)),
    y: Math.max(2, Math.min(98, (s.y / CANVAS_REFERENCE_HEIGHT) * 100)),
  }));
}

function autoDistributeSteps(steps: ThemeStep[]): ThemeStep[] {
  const count = steps.length;
  if (count === 0) return steps;

  const cols = Math.min(count, Math.ceil(Math.sqrt(count)));
  const marginX = 10;
  const marginY = 8;
  const usableW = 80;
  const usableH = 84;
  const cellW = cols > 1 ? usableW / (cols - 1) : 0;
  const rows = Math.ceil(count / cols);
  const cellH = rows > 1 ? usableH / (rows - 1) : 0;

  return steps.map((s, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      ...s,
      x: marginX + col * cellW,
      y: marginY + row * cellH,
    };
  });
}

export default function PassMapThemePage() {
  const { branchCode, themeId } = useParams<{ branchCode: string; themeId: string }>();
  const navigate = useNavigate();

  const branch = MOCK_BRANCHES.find((b) => b.code === branchCode);
  const theme = themeId ? getThemeById(themeId) : undefined;

  // Load steps + details from store
  const [steps, setSteps] = useState<ThemeStep[]>([]);
  const [details, setDetails] = useState<StepDetail[]>([]);
  const [viewMode, setViewMode] = useState<PassMapViewMode>('map');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Track if we've already normalized coordinates for this theme
  const normalizedRef = useRef<string | null>(null);

  // Initialize from store
  useEffect(() => {
    if (!themeId) return;
    const loadedSteps = getStepsByTheme(themeId);

    // Normalize coordinates once per theme
    let normalized: ThemeStep[];
    if (normalizedRef.current !== themeId) {
      normalized = normalizeStepCoordinates(loadedSteps);
      normalizedRef.current = themeId;

      // If coordinates were changed, save back to store immediately
      const coordsChanged = normalized.some((s, i) =>
        s.x !== loadedSteps[i]?.x || s.y !== loadedSteps[i]?.y,
      );
      if (coordsChanged && normalized.length > 0) {
        saveStepsForTheme(themeId, normalized);
      }
    } else {
      normalized = loadedSteps;
    }

    setSteps(normalized);
    const stepIds = normalized.map((s) => s.id);
    setDetails(getDetailsByStepIds(stepIds));
    setIsDirty(false);
  }, [themeId]);

  const selectedStep = steps.find((s) => s.id === selectedStepId) || null;
  const selectedDetail = selectedStep
    ? details.find((d) => d.stepId === selectedStep.id) || getDetailByStepId(selectedStep.id)
    : undefined;

  // ── Dirty tracking helper ─────────────────────────────────────────────────

  const markDirty = useCallback(() => {
    setIsDirty(true);
    setSaveMessage(null);
  }, []);

  // ── Step selection (shared across MAP/FLOW/EDITOR) ────────────────────────

  const handleSelectStep = useCallback((step: ThemeStep) => {
    setSelectedStepId(step.id);
  }, []);

  // ── FLOW → MAP bridge: click step in FLOW, switch to MAP ──────────────────

  const handleFlowStepClick = useCallback((step: ThemeStep) => {
    setSelectedStepId(step.id);
  }, []);

  // ── Status change (auto-persists) ─────────────────────────────────────────

  const handleStatusChange = useCallback((stepId: string, status: ThemeStep['status']) => {
    setSteps((prev) => {
      const updated = prev.map((s) => (s.id === stepId ? { ...s, status } : s));
      // Auto-save status changes immediately
      if (themeId) saveStepsForTheme(themeId, updated);
      return updated;
    });
  }, [themeId]);

  // ── Detail update (from editable StepDetailCard) ──────────────────────────

  const handleUpdateDetail = useCallback((stepId: string, updates: Partial<StepDetail>) => {
    setDetails((prev) => {
      const idx = prev.findIndex((d) => d.stepId === stepId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...updates };
        return updated;
      }
      // Create new detail if none exists
      return [...prev, { stepId, answer: '', input: '', output: '', resetMethod: '', memo: '', ...updates }];
    });
    markDirty();
  }, [markDirty]);

  // ── Editor: move step ─────────────────────────────────────────────────────

  const handleStepMove = useCallback((stepId: string, x: number, y: number) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, x, y } : s)),
    );
    markDirty();
  }, [markDirty]);

  // ── Editor: add step ──────────────────────────────────────────────────────

  const handleAddStep = useCallback((type: StepType) => {
    const maxNum = steps.reduce((m, s) => Math.max(m, s.stepNumber), 0);
    const newStep: ThemeStep = {
      id: `new-${Date.now()}`,
      themeId: themeId || '',
      stepNumber: maxNum + 1,
      type,
      label: `New ${type}`,
      zone: '',
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 40,
      status: 'unchecked',
    };
    const newDetail: StepDetail = {
      stepId: newStep.id,
      answer: '',
      input: '',
      output: '',
      resetMethod: '',
      memo: '',
    };
    setSteps((prev) => [...prev, newStep]);
    setDetails((prev) => [...prev, newDetail]);
    setSelectedStepId(newStep.id);
    markDirty();
  }, [steps, themeId, markDirty]);

  // ── Editor: delete step ───────────────────────────────────────────────────

  const handleDeleteStep = useCallback(() => {
    if (!selectedStepId) return;
    setSteps((prev) => prev.filter((s) => s.id !== selectedStepId));
    setDetails((prev) => prev.filter((d) => d.stepId !== selectedStepId));
    setSelectedStepId(null);
    markDirty();
  }, [selectedStepId, markDirty]);

  // ── Save to localStorage ──────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    if (!themeId) return;
    setIsSaving(true);
    saveStepsForTheme(themeId, steps);
    saveDetailsForTheme(themeId, details);
    setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
      setSaveMessage('저장 완료');
      setTimeout(() => setSaveMessage(null), 2500);
    }, 200);
  }, [themeId, steps, details]);

  // ── Delete theme ──────────────────────────────────────────────────────────

  const handleDeleteTheme = useCallback(() => {
    if (!themeId) return;
    deleteTheme(themeId);
    navigate('/projects');
  }, [themeId, navigate]);

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!branch || !theme) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-white/40 text-center py-20">
          테마를 찾을 수 없습니다.
          <button
            onClick={() => navigate('/projects')}
            className="block mx-auto mt-4 text-white/40 hover:text-white/60 transition-colors"
          >
            ← 프로젝트 목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-white/20 hover:text-white/50 text-caption mb-2 inline-block transition-colors"
          >
            ← 프로젝트
          </button>
          <h1 className="text-title2 text-white/90 font-bold tracking-tight">{theme.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-caption text-white/20 font-mono">{branch.code}</span>
            <span className="text-caption text-white/30">{steps.length}개 스텝</span>
            {isDirty && (
              <span className="text-caption text-amber-400/60">· 미저장 변경</span>
            )}
          </div>
        </div>

        {/* View Mode Tabs + Actions */}
        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="text-caption text-emerald-400/70 animate-pulse">{saveMessage}</span>
          )}
          <div className="flex gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`px-4 py-1.5 rounded-md text-[11px] font-semibold tracking-wide transition-all ${
                  viewMode === tab.key
                    ? 'bg-white/[0.10] text-white'
                    : 'text-white/30 hover:text-white/55'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Toolbar */}
      {viewMode === 'editor' && (
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

      {/* Main Content */}
      {viewMode === 'flow' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Flow Panel */}
          <div className="lg:col-span-2 bg-white/[0.02] rounded-xl border border-white/10 p-4 max-h-[600px] overflow-y-auto">
            <FlowPanel
              steps={steps}
              selectedStepId={selectedStepId}
              onSelectStep={handleFlowStepClick}
            />
            {/* Go to MAP button */}
            {selectedStepId && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <button
                  onClick={() => { setViewMode('map'); }}
                  className="text-caption text-sky-400/60 hover:text-sky-400 transition-colors"
                >
                  → MAP에서 보기
                </button>
              </div>
            )}
          </div>
          {/* Detail Card */}
          <div>
            {selectedStep ? (
              <StepDetailCard
                step={selectedStep}
                detail={selectedDetail}
                onStatusChange={handleStatusChange}
                onUpdateDetail={handleUpdateDetail}
                editable
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/30 text-center text-sm">
                Step을 선택하세요
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MAP & EDITOR Layout: 3-column */
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-4">
          {/* Left: Step List */}
          <div className="bg-white/[0.02] rounded-xl border border-white/10 p-3 max-h-[600px] overflow-hidden">
            <StepListPanel
              steps={steps}
              selectedStepId={selectedStepId}
              onSelectStep={handleSelectStep}
            />
          </div>

          {/* Center: Mini Map */}
          <div className="min-h-[500px]">
            <MiniMapCanvas
              steps={steps}
              selectedStepId={selectedStepId}
              onSelectStep={handleSelectStep}
              mapImage={theme.mapImage || undefined}
              rooms={theme.rooms}
              editable={viewMode === 'editor'}
              onStepMove={viewMode === 'editor' ? handleStepMove : undefined}
            />
          </div>

          {/* Right: Step Detail */}
          <div>
            {selectedStep ? (
              <StepDetailCard
                step={selectedStep}
                detail={selectedDetail}
                onStatusChange={handleStatusChange}
                onUpdateDetail={handleUpdateDetail}
                editable={viewMode === 'editor'}
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/30 text-center text-sm">
                Step을 선택하세요
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDirty && (
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-white text-black text-[12px] font-semibold hover:bg-white/90 transition-all"
            >
              변경사항 저장
            </button>
          )}
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-caption text-red-400/40 hover:text-red-400/70 transition-colors"
        >
          테마 삭제
        </button>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm mx-4 rounded-2xl border border-white/[0.08] bg-[#161618] shadow-2xl p-6 space-y-4">
            <h3 className="text-body text-white/90 font-bold">테마 삭제</h3>
            <p className="text-subhead text-white/50">
              <span className="text-white/80 font-medium">"{theme.name}"</span> 테마와 모든 Step 데이터를 삭제합니다.
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDeleteTheme}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-[12px] font-semibold hover:bg-red-500/30 transition-all"
              >
                삭제
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-white/[0.10] text-white/50 text-[12px] hover:bg-white/[0.06] transition-all"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
