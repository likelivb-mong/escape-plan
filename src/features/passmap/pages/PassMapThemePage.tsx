import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ThemeStep, StepType, PassMapViewMode } from '../types/passmap';
import { MOCK_BRANCHES } from '../mock/branches';
import { MOCK_THEMES } from '../mock/themes';
import { MOCK_STEPS, MOCK_STEP_DETAILS } from '../mock/steps';
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
  const theme = MOCK_THEMES.find((t) => t.id === themeId);

  const [viewMode, setViewMode] = useState<PassMapViewMode>('map');
  const [steps, setSteps] = useState<ThemeStep[]>(
    () => MOCK_STEPS.filter((s) => s.themeId === themeId)
  );
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedStep = steps.find((s) => s.id === selectedStepId) || null;
  const selectedDetail = selectedStep
    ? MOCK_STEP_DETAILS.find((d) => d.stepId === selectedStep.id)
    : undefined;

  const handleSelectStep = useCallback((step: ThemeStep) => {
    setSelectedStepId(step.id);
  }, []);

  const handleStatusChange = useCallback((stepId: string, status: ThemeStep['status']) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status } : s))
    );
  }, []);

  const handleStepMove = useCallback((stepId: string, x: number, y: number) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, x, y } : s))
    );
  }, []);

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
    setSteps((prev) => [...prev, newStep]);
    setSelectedStepId(newStep.id);
  }, [steps, themeId]);

  const handleDeleteStep = useCallback(() => {
    if (!selectedStepId) return;
    setSteps((prev) => prev.filter((s) => s.id !== selectedStepId));
    setSelectedStepId(null);
  }, [selectedStepId]);

  const handleSave = useCallback(() => {
    setIsSaving(true);
    // Mock save
    setTimeout(() => setIsSaving(false), 800);
  }, []);

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
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate(`/passmap/${branchCode}`)}
            className="text-white/30 hover:text-white/60 text-sm mb-2 inline-block transition-colors"
          >
            ← {branch.name}
          </button>
          <h1 className="text-title1 text-white font-bold">{theme.name}</h1>
          <span className="text-caption text-white/30 font-mono">{branch.code} · {theme.id}</span>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === tab.key
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
              onSelectStep={handleSelectStep}
            />
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
