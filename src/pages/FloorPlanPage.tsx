import { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { generateInitialLayout, reconcileRooms } from '../utils/floorPlan';
import type { FloorPlanData } from '../types/floorPlan';

import FloorPlanCanvas from '../components/floor-plan/FloorPlanCanvas';
import PassMapTable from '../components/floor-plan/PassMapTable';
import SyncToPassMapButton from '../features/passmap/components/SyncToPassMapButton';

type Tab = 'floor' | 'passmap';

export default function FloorPlanPage() {
  const navigate = useNavigate();
  const {
    projectName,
    gameFlowDesign,
    floorPlanData,
    setFloorPlanData,
  } = useProject();

  const [activeTab, setActiveTab] = useState<Tab>('floor');
  const [isEditing, setIsEditing] = useState(false);

  // ── Auto-generate layout if missing ─────────────────────────────────────────
  useEffect(() => {
    if (!gameFlowDesign) return;

    if (!floorPlanData) {
      setFloorPlanData(generateInitialLayout(gameFlowDesign.rooms));
    } else {
      // Reconcile rooms if game flow rooms changed
      const reconciled = reconcileRooms(floorPlanData, gameFlowDesign.rooms);
      if (reconciled !== floorPlanData) {
        setFloorPlanData(reconciled);
      }
    }
  }, [gameFlowDesign]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateFloorPlan = (data: FloorPlanData) => {
    setFloorPlanData(data);
  };

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
            도면 / PassMap
          </span>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 p-0.5 rounded-full border border-white/[0.08] bg-white/[0.02]">
          <TabButton active={activeTab === 'floor'} onClick={() => setActiveTab('floor')}>
            도면
          </TabButton>
          <TabButton active={activeTab === 'passmap'} onClick={() => setActiveTab('passmap')}>
            PassMap
          </TabButton>
        </div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2">
          {activeTab === 'floor' && (
            <button
              onClick={() => setIsEditing(prev => !prev)}
              className={`px-3 py-1.5 rounded-full border text-footnote font-medium transition-all duration-150 ${
                isEditing
                  ? 'bg-white text-black border-transparent'
                  : 'border-white/[0.12] text-white/45 hover:border-white/25 hover:text-white/70'
              }`}
            >
              {isEditing ? '✓ 수정 완료' : '✏ 도면 수정'}
            </button>
          )}
          {floorPlanData && (
            <SyncToPassMapButton plan={gameFlowDesign} floorPlan={floorPlanData} />
          )}
          <button
            onClick={() => navigate('/draft')}
            className="text-footnote text-white/35 hover:text-white/50 transition-colors"
          >
            Draft 보기 →
          </button>
        </div>
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'floor' ? (
        <div className="flex flex-col flex-1 overflow-hidden min-h-0 px-4 sm:px-6 py-4 sm:py-5">
          {floorPlanData && (
            <FloorPlanCanvas
              plan={gameFlowDesign}
              floorPlan={floorPlanData}
              onUpdateFloorPlan={handleUpdateFloorPlan}
              isEditing={isEditing}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 print:px-0 print:py-0">
          <PassMapTable plan={gameFlowDesign} projectName={projectName} />
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
