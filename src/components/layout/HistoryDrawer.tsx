import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  listHistorySnapshots,
  formatSnapshotTime,
  getSnapshotSummary,
  type HistorySnapshot,
} from '../../utils/projectHistory';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const { currentProjectId, loadProject, saveCurrentProject } = useProject();
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!currentProjectId) return;
    setSnapshots(listHistorySnapshots(currentProjectId));
  }, [currentProjectId]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleRestore = (snap: HistorySnapshot) => {
    if (confirmId !== snap.id) {
      setConfirmId(snap.id);
      return;
    }
    // Save current state first as a snapshot before restoring
    saveCurrentProject();
    // Load the snapshot data
    loadProject(snap.data.id);
    setConfirmId(null);
    onClose();
  };

  if (!open) return null;

  // Group snapshots by date
  const grouped = groupByDate(snapshots);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-[#1a1a1a] border-l border-white/[0.08] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-white/90">버전 히스토리</h2>
            <p className="text-[11px] text-white/30 mt-0.5">최근 7일간 저장 기록</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {snapshots.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[13px] text-white/25 text-center">
                저장된 히스토리가 없습니다.<br />
                프로젝트를 저장하면 자동으로 기록됩니다.
              </p>
            </div>
          ) : (
            grouped.map(({ dateLabel, items }) => (
              <div key={dateLabel} className="mb-4">
                <div className="sticky top-0 bg-[#1a1a1a] px-2 py-1.5 mb-1 z-10">
                  <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
                    {dateLabel}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {items.map((snap, idx) => {
                    const summary = getSnapshotSummary(snap);
                    const isConfirming = confirmId === snap.id;
                    const isLatest = idx === 0 && dateLabel === grouped[0].dateLabel;

                    return (
                      <div
                        key={snap.id}
                        className={[
                          'group px-3 py-2.5 rounded-lg border transition-all duration-150',
                          isConfirming
                            ? 'border-amber-400/30 bg-amber-500/[0.06]'
                            : 'border-white/[0.05] hover:border-white/[0.10] hover:bg-white/[0.03]',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-white/60">
                              {formatSnapshotTime(snap.savedAt)}
                            </span>
                            {isLatest && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/[0.12] text-emerald-400/80 font-medium">
                                현재
                              </span>
                            )}
                          </div>
                          {!isLatest && (
                            <button
                              onClick={() => handleRestore(snap)}
                              className={[
                                'text-[11px] font-medium px-2 py-0.5 rounded transition-all',
                                isConfirming
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                  : 'text-white/30 hover:text-white/60 opacity-0 group-hover:opacity-100',
                              ].join(' ')}
                            >
                              {isConfirming ? '복원 확인' : '복원'}
                            </button>
                          )}
                        </div>

                        {/* Summary badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            label={`만다라트 ${summary.cellsFilled}/81`}
                            active={summary.cellsFilled > 0}
                          />
                          <Badge label="스토리" active={summary.hasStory} />
                          {summary.hasGameFlow && (
                            <Badge
                              label={`Flow ${summary.stepCount}스텝 · ${summary.roomCount}룸`}
                              active
                            />
                          )}
                          {summary.hasFloorPlan && <Badge label="배치도" active />}
                        </div>

                        {isConfirming && (
                          <p className="text-[10px] text-amber-400/60 mt-1.5">
                            이 버전으로 되돌립니다. 현재 상태는 자동 저장됩니다.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex-shrink-0">
          <p className="text-[10px] text-white/20 leading-relaxed">
            7일이 지난 기록은 자동으로 삭제됩니다
          </p>
        </div>
      </div>
    </>
  );
}

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={[
        'text-[9px] px-1.5 py-0.5 rounded font-medium',
        active
          ? 'bg-white/[0.06] text-white/40'
          : 'bg-transparent text-white/15',
      ].join(' ')}
    >
      {label}
    </span>
  );
}

function groupByDate(snapshots: HistorySnapshot[]): { dateLabel: string; items: HistorySnapshot[] }[] {
  const groups: Map<string, HistorySnapshot[]> = new Map();

  for (const snap of snapshots) {
    const date = new Date(snap.savedAt);
    const now = new Date();
    const diffDay = Math.floor((now.getTime() - date.getTime()) / 86400000);

    let label: string;
    if (diffDay === 0) label = '오늘';
    else if (diffDay === 1) label = '어제';
    else if (diffDay < 7) label = `${diffDay}일 전`;
    else label = date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(snap);
  }

  return Array.from(groups.entries()).map(([dateLabel, items]) => ({ dateLabel, items }));
}
