import { useState, useCallback, useEffect } from 'react';
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

  // Initialize from store
  useEffect(() => {
    if (!themeId) return;
    const loadedSteps = getStepsByTheme(themeId);
    setSteps(loadedSteps);
    const stepIds = loadedSteps.map((s) => s.id);
    setDetails(getDetailsByStepIds(stepIds));
  }, [themeId]);

  const selectedStep = steps.find((s) => s.id === selectedStepId) || null;
  const selectedDetail = selectedStep
    ? details.find((d) => d.stepId === selectedStep.id) || getDetailByStepId(selectedStep.id)
    : undefined;

  // ── Step selection (shared across MAP/FLOW/EDITOR) ────────────────────────

  const handleSelectStep = useCallback((step: ThemeStep) => {
    setSelectedStepId(step.id);
  }, []);

  // ── FLOW → MAP bridge: click step in FLOW, switch to MAP ──────────────────

  const handleFlowStepClick = useCallback((step: ThemeStep) => {
    setSelectedStepId(step.id);
    // If user wants to see it on map, they can switch tab
    // Selection persists across tabs
  }, []);

  // ── Status change ─────────────────────────────────────────────────────────

  const handleStatusChange = useCallback((stepId: string, status: ThemeStep['status']) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status } : s))
    );
  }, []);

  // ── Editor: move step ─────────────────────────────────────────────────────

  const handleStepMove = useCallback((stepId: string, x: number, y: number) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, x, y } : s))
    );
  }, []);

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
      x: 300 + Math.random() * 100,
      y: 200 + Math.random() * 100,
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
  }, [steps, themeId]);

  // ── Editor: delete step ───────────────────────────────────────────────────

  const handleDeleteStep = useCallback(() => {
    if (!selectedStepId) return;
    setSteps((prev) => prev.filter((s) => s.id !== selectedStepId));
    setDetails((prev) => prev.filter((d) => d.stepId !== selectedStepId));
    setSelectedStepId(null);
  }, [selectedStepId]);

  // ── Editor: save to localStorage ──────────────────────────────────────────

  const handleSave = useCallback(() => {
    if (!themeId) return;
    setIsSaving(true);
    saveStepsForTheme(themeId, steps);
    saveDetailsForTheme(themeId, details);
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('저장 완료');
      setTimeout(() => setSaveMessage(null), 2000);
    }, 300);
  }, [themeId, steps, details]);

  // ── Tab switch with "Go to MAP" from FLOW ─────────────────────────────────

  const handleViewModeChange = useCallback((mode: PassMapViewMode) => {
    setViewMode(mode);
    // Selection persists — no reset needed
  }, []);

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!branch || !theme) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-white/40 text-center py-20">
          테마를 찾을 수 없습니다.
          <button
            onClick={() => navigate('/passmap')}
            className="block mx-auto mt-4 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            ← 지점 목록으로
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
            onClick={() => navigate(`/passmap/${branchCode}`)}
            className="text-white/20 hover:text-white/50 text-caption mb-2 inline-block transition-colors"
          >
            ← {branch.name}
          </button>
          <h1 className="text-title2 text-white/90 font-bold tracking-tight">{theme.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-caption text-white/20 font-mono">{branch.code}</span>
            <span className="text-caption text-white/30">{steps.length}개 스텝</span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2">
          {saveMessage && (
            <span className="text-caption text-emerald-400/70">{saveMessage}</span>
          )}
          <div className="flex gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleViewModeChange(tab.key)}
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
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/30 text-center text-sm">
                Step을 선택하세요
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
