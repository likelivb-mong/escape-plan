import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  listHistorySnapshots,
  formatSnapshotTime,
  getSnapshotSummary,
  extractPageData,
  PAGE_LABELS,
  type HistoryPage,
  type HistorySnapshot,
} from '../../utils/projectHistory';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

const PAGE_TABS: HistoryPage[] = ['plan', 'story', 'mandalart', 'gameFlow', 'setting'];

export default function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const {
    currentProjectId,
    persistProject,
    setCells,
    setSelectedStory,
    setGameFlowDesign,
    setFloorPlanData,
    setProjectBrief,
  } = useProject();

  const [activePage, setActivePage] = useState<HistoryPage>('mandalart');
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!currentProjectId) return;
    setSnapshots(listHistorySnapshots(currentProjectId, activePage));
  }, [currentProjectId, activePage]);

  useEffect(() => {
    if (open) {
      refresh();
      setConfirmId(null);
    }
  }, [open, refresh]);

  const handleRestore = (snap: HistorySnapshot) => {
    if (confirmId !== snap.id) {
      setConfirmId(snap.id);
      return;
    }

    // Save current state first
    persistProject();

    // Restore only the page-specific data
    const data = extractPageData(snap);
    switch (snap.page) {
      case 'plan':
        if (data.projectBrief !== undefined) setProjectBrief(data.projectBrief);
        break;
      case 'story':
        if (data.selectedStory !== undefined) setSelectedStory(data.selectedStory);
        break;
      case 'mandalart':
        if (data.cells) setCells(data.cells);
        break;
      case 'gameFlow':
        if (data.gameFlowDesign !== undefined) setGameFlowDesign(data.gameFlowDesign);
        break;
      case 'setting':
        if (data.floorPlanData !== undefined) setFloorPlanData(data.floorPlanData);
        break;
    }

    setConfirmId(null);
    onClose();
  };

  if (!open) return null;

  const grouped = groupByDate(snapshots);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-[#1a1a1a] border-l border-white/[0.08] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-white/90">버전 히스토리</h2>
            <p className="text-[11px] text-white/30 mt-0.5">페이지별 저장 기록 · 최근 7일</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Page Tabs */}
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/[0.06] flex-shrink-0 overflow-x-auto">
          {PAGE_TABS.map((page) => (
            <button
              key={page}
              onClick={() => { setActivePage(page); setConfirmId(null); }}
              className={[
                'px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all',
                activePage === page
                  ? 'bg-white/[0.10] text-white/80'
                  : 'text-white/30 hover:text-white/55 hover:bg-white/[0.04]',
              ].join(' ')}
            >
              {PAGE_LABELS[page]}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {snapshots.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[13px] text-white/25 text-center">
                {PAGE_LABELS[activePage]} 페이지의<br />
                저장된 히스토리가 없습니다.
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
                            <span className="text-[12px] font-bold text-white/70 tabular-nums">
                              v{snap.version}
                            </span>
                            <span className="text-[11px] text-white/30">
                              {formatSnapshotTime(snap.savedAt)}
                            </span>
                            {isLatest && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/[0.12] text-emerald-400/80 font-medium">
                                최신
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

                        {/* Summary */}
                        <p className="text-[11px] text-white/35">{summary}</p>

                        {isConfirming && (
                          <p className="text-[10px] text-amber-400/60 mt-1.5">
                            {PAGE_LABELS[activePage]} 데이터만 이 버전으로 복원됩니다.
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
            각 페이지의 데이터만 개별 복원됩니다 · 7일 후 자동 삭제
          </p>
        </div>
      </div>
    </>
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
