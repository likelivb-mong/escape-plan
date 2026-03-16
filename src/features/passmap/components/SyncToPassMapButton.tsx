/**
 * SyncToPassMapButton
 *
 * Placed on FloorPlanPage. Opens a branch selector,
 * then syncs GameFlowPlan + FloorPlanData → PassMap store directly.
 * Saves the passmapLink back to ProjectContext for bidirectional sync.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameFlowPlan } from '../../../types/gameFlow';
import type { FloorPlanData } from '../../../types/floorPlan';
import { MOCK_BRANCHES } from '../mock/branches';
import { syncFloorPlanToPassMap, findMatchingTheme } from '../utils/floorplan-sync';
import type { SyncResult } from '../utils/floorplan-sync';

interface SyncToPassMapButtonProps {
  plan: GameFlowPlan;
  floorPlan: FloorPlanData;
  /** Called after sync to save the link in ProjectContext */
  onLinked?: (branchCode: string, themeId: string) => void;
  /** If already linked, show the linked branch */
  currentLink?: { branchCode: string; themeId: string } | null;
}

type DialogState =
  | { type: 'closed' }
  | { type: 'branch-select' }
  | { type: 'conflict'; branchCode: string; branchName: string; existingId: string; existingName: string }
  | { type: 'success'; result: SyncResult; branchCode: string };

export default function SyncToPassMapButton({ plan, floorPlan, onLinked, currentLink }: SyncToPassMapButtonProps) {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<DialogState>({ type: 'closed' });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dialog.type === 'closed') return;
    const handleClick = (e: MouseEvent) => {
      if (overlayRef.current === e.target) setDialog({ type: 'closed' });
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dialog.type]);

  const finishSync = (result: SyncResult, branchCode: string) => {
    onLinked?.(branchCode, result.themeId);
    setDialog({ type: 'success', result, branchCode });
  };

  const handleBranchSelect = (branchCode: string, branchName: string) => {
    const existing = findMatchingTheme(branchCode, plan.title);
    if (existing) {
      setDialog({
        type: 'conflict', branchCode, branchName,
        existingId: existing.id, existingName: existing.name,
      });
    } else {
      const result = syncFloorPlanToPassMap(plan, floorPlan, branchCode);
      finishSync(result, branchCode);
    }
  };

  const handleOverwrite = () => {
    if (dialog.type !== 'conflict') return;
    const result = syncFloorPlanToPassMap(plan, floorPlan, dialog.branchCode, dialog.existingId);
    finishSync(result, dialog.branchCode);
  };

  const handleCreateNew = () => {
    if (dialog.type !== 'conflict') return;
    const result = syncFloorPlanToPassMap(plan, floorPlan, dialog.branchCode);
    finishSync(result, dialog.branchCode);
  };

  const handleResync = () => {
    if (!currentLink) return;
    const result = syncFloorPlanToPassMap(plan, floorPlan, currentLink.branchCode, currentLink.themeId);
    finishSync(result, currentLink.branchCode);
  };

  const handleGoToPassMap = () => {
    if (dialog.type !== 'success') return;
    navigate(`/passmap/${dialog.branchCode}/${dialog.result.themeId}`);
  };

  const linkedBranch = currentLink
    ? MOCK_BRANCHES.find((b) => b.code === currentLink.branchCode)
    : null;

  return (
    <>
      {currentLink ? (
        <div className="inline-flex items-center gap-1">
          <button
            onClick={handleResync}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-300/70 text-footnote font-medium hover:bg-emerald-500/10 hover:text-emerald-300 transition-all"
            title="현재 연동된 PassMap에 최신 데이터 동기화"
          >
            <span className="text-xs">↻</span>
            동기화
          </button>
          <button
            onClick={() => navigate(`/passmap/${currentLink.branchCode}/${currentLink.themeId}`)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 border-y border-r border-emerald-500/20 bg-emerald-500/5 text-emerald-300/50 text-footnote hover:text-emerald-300 transition-all"
            title={`${linkedBranch?.name ?? currentLink.branchCode} PassMap 열기`}
          >
            <span className="text-xs">→</span>
          </button>
          <button
            onClick={() => setDialog({ type: 'branch-select' })}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-r-full border-y border-r border-white/10 bg-white/[0.02] text-white/30 text-footnote hover:text-white/50 transition-all"
            title="다른 지점에 연동"
          >
            <span className="text-[10px]">⚙</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setDialog({ type: 'branch-select' })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-300/70 text-footnote font-medium hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300 transition-all"
        >
          <span className="text-xs">🗺️</span>
          PassMap 연동
        </button>
      )}

      {/* Dialog overlay */}
      {dialog.type !== 'closed' && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-[#12141a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {dialog.type === 'branch-select' && (
              <>
                <div className="px-5 pt-5 pb-3">
                  <h3 className="text-body font-bold text-white/90">PassMap 연동</h3>
                  <p className="text-caption text-white/40 mt-1">
                    연동할 지점을 선택하세요. 이후 편집 시 자동으로 양쪽 모두 반영됩니다.
                  </p>
                </div>
                <div className="px-5 pb-5 space-y-1.5">
                  {MOCK_BRANCHES.map((b) => (
                    <button
                      key={b.code}
                      onClick={() => handleBranchSelect(b.code, b.name)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all text-left"
                    >
                      <span className="text-caption font-mono text-violet-400/60 w-10">{b.code}</span>
                      <span className="text-subhead text-white/75 font-medium">{b.name}</span>
                    </button>
                  ))}
                </div>
                <div className="px-5 pb-4 flex justify-end">
                  <button
                    onClick={() => setDialog({ type: 'closed' })}
                    className="text-caption text-white/30 hover:text-white/50 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </>
            )}

            {dialog.type === 'conflict' && (
              <>
                <div className="px-5 pt-5 pb-3">
                  <h3 className="text-body font-bold text-amber-400/90">동일 테마 발견</h3>
                  <p className="text-caption text-white/40 mt-1">
                    <span className="text-white/60 font-medium">{dialog.branchName}</span>에
                    이미 "<span className="text-white/70">{dialog.existingName}</span>" 테마가 있습니다.
                  </p>
                </div>
                <div className="px-5 pb-5 space-y-2">
                  <button
                    onClick={handleOverwrite}
                    className="w-full px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/80 text-subhead font-medium hover:bg-amber-500/15 transition-all text-left"
                  >
                    <div>덮어쓰기</div>
                    <div className="text-caption text-white/30 mt-0.5">기존 데이터를 새 데이터로 교체</div>
                  </button>
                  <button
                    onClick={handleCreateNew}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/60 text-subhead font-medium hover:bg-white/[0.07] transition-all text-left"
                  >
                    <div>새로 추가</div>
                    <div className="text-caption text-white/30 mt-0.5">별도 테마로 생성 (이름 자동 구분)</div>
                  </button>
                </div>
                <div className="px-5 pb-4 flex justify-end">
                  <button
                    onClick={() => setDialog({ type: 'branch-select' })}
                    className="text-caption text-white/30 hover:text-white/50 transition-colors"
                  >
                    ← 지점 선택
                  </button>
                </div>
              </>
            )}

            {dialog.type === 'success' && (
              <>
                <div className="px-5 pt-5 pb-3">
                  <h3 className="text-body font-bold text-emerald-400/90">연동 완료</h3>
                  <p className="text-caption text-white/40 mt-1">
                    "<span className="text-white/70">{dialog.result.themeName}</span>"
                    {dialog.result.action === 'updated' ? ' 업데이트됨' : ' 생성됨'} ·{' '}
                    {dialog.result.stepCount}개 스텝
                  </p>
                </div>
                <div className="px-5 pb-5 flex gap-2">
                  <button
                    onClick={handleGoToPassMap}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 text-subhead font-medium hover:bg-violet-500/20 transition-all"
                  >
                    PassMap에서 확인 →
                  </button>
                  <button
                    onClick={() => setDialog({ type: 'closed' })}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/40 text-subhead font-medium hover:bg-white/[0.07] transition-all"
                  >
                    닫기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
