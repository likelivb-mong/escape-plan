import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MandalartTheme } from '../types/mandalart';
import { useProject } from '../context/ProjectContext';
import type { ProjectBrief } from '../types';
import MandalartBoard from '../components/mandalart/MandalartBoard';
import MandalartToolbar from '../components/mandalart/MandalartToolbar';
import { createExampleCells, EXAMPLE_PROJECT_NAME } from '../data/mockMandalart';

export default function MandalartPage() {
  const navigate = useNavigate();
  const { projectName, setProjectName, cells, setCells, projectBrief, selectedStory, saveCurrentProject } = useProject();

  const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(new Set());
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [boardSize, setBoardSize] = useState(600);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 셀 변경 후 1.5초 debounce 자동 저장
  const debounceSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveCurrentProject(), 1500);
  }, [saveCurrentProject]);

  // ── Auto-fit board size to container ──────────────────────────────────────
  useEffect(() => {
    const el = boardContainerRef.current;
    if (!el) return;
    const update = () => {
      const size = Math.min(el.clientWidth, el.clientHeight) - 8;
      if (size > 0) setBoardSize(size);
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  // ── Cell font sizes (scale with board size) ────────────────────────────────
  // cellFs: action / linked / sub-goal cells; cellFsLg: center cell
  // Floor of 6/7 so text also shrinks on small screens
  const cellFs   = Math.max(6, Math.min(Math.round(boardSize / 9 * 0.18), 11));
  const cellFsLg = Math.max(7, Math.min(Math.round(boardSize / 9 * 0.21), 13));

  // ── Selection ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback((id: string, multi: boolean) => {
    setSelectedCellIds((prev) => {
      if (multi) {
        // Cmd/Ctrl+Click: toggle individual cell
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }
      // Single click: already selected → deselect all; otherwise select this cell
      if (prev.has(id)) return new Set();
      return new Set([id]);
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    (document.activeElement as HTMLElement)?.blur();
    setSelectedCellIds(new Set());
  }, []);

  // ── Delete key: clear content of selected cells ───────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (editingCellId) return; // don't interfere with textarea editing
      if (selectedCellIds.size === 0) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      // Don't fire if a real input/textarea has focus
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      e.preventDefault();
      setCells((prev) => {
        let result = prev;
        for (const id of selectedCellIds) {
          const updated = result.map((c) => (c.id === id ? { ...c, text: '' } : c));
          const edited = result.find((c) => c.id === id);
          if (!edited) { result = updated; continue; }
          const { row, col } = edited;
          // Bidirectional sync
          if (row >= 3 && row <= 5 && col >= 3 && col <= 5 && !(row === 4 && col === 4)) {
            const syncId = `cell-${(row - 3) * 3 + 1}-${(col - 3) * 3 + 1}`;
            result = updated.map((c) => (c.id === syncId ? { ...c, text: '' } : c));
          } else if ((row - 1) % 3 === 0 && (col - 1) % 3 === 0) {
            const br = (row - 1) / 3; const bc = (col - 1) / 3;
            if (!(br === 1 && bc === 1)) {
              const syncId = `cell-${3 + br}-${3 + bc}`;
              result = updated.map((c) => (c.id === syncId ? { ...c, text: '' } : c));
            } else { result = updated; }
          } else { result = updated; }
        }
        return result;
      });
      setSelectedCellIds(new Set());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingCellId, selectedCellIds, setCells]);

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleStartEdit = useCallback((id: string) => {
    setEditingCellId(id);
    setSelectedCellIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  /**
   * Finish editing a cell and sync bidirectionally:
   *
   * • Center-block sub-goal (row∈[3,5], col∈[3,5], not center)
   *   → mirrors to expansion block (br=row-3, bc=col-3) center cell (br*3+1, bc*3+1)
   *
   * • Expansion block center cell (row%3===1 && col%3===1 for non-center expansions)
   *   → mirrors to center-block sub-goal (3+br, 3+bc)
   */
  const handleFinishEdit = useCallback(
    (id: string, newText: string | null) => {
      setEditingCellId(null);
      if (newText === null) return; // ESC — discard

      setCells((prev) => {
        const updated = prev.map((c) => (c.id === id ? { ...c, text: newText } : c));
        const edited = prev.find((c) => c.id === id);
        if (!edited) return updated;
        const { row, col } = edited;

        // ── Case 1: edited a center-block sub-goal → sync expansion center ──
        if (
          row >= 3 && row <= 5 &&
          col >= 3 && col <= 5 &&
          !(row === 4 && col === 4)
        ) {
          const br = row - 3;
          const bc = col - 3;
          const syncId = `cell-${br * 3 + 1}-${bc * 3 + 1}`;
          return updated.map((c) => (c.id === syncId ? { ...c, text: newText } : c));
        }

        // ── Case 2: edited an expansion block center → sync center-block sub-goal ──
        if ((row - 1) % 3 === 0 && (col - 1) % 3 === 0) {
          const br = (row - 1) / 3;
          const bc = (col - 1) / 3;
          if (!(br === 1 && bc === 1)) {
            const syncId = `cell-${3 + br}-${3 + bc}`;
            return updated.map((c) => (c.id === syncId ? { ...c, text: newText } : c));
          }
        }

        return updated;
      });
      debounceSave();
    },
    [setCells, debounceSave]
  );

  // ── Swap cells (drag-to-reposition) ───────────────────────────────────────
  const handleSwapCells = useCallback(
    (id1: string, id2: string) => {
      setCells((prev) => {
        const c1 = prev.find((c) => c.id === id1);
        const c2 = prev.find((c) => c.id === id2);
        if (!c1 || !c2) return prev;
        return prev.map((c) => {
          if (c.id === id1) return { ...c, text: c2.text, theme: c2.theme };
          if (c.id === id2) return { ...c, text: c1.text, theme: c1.theme };
          return c;
        });
      });
      debounceSave();
    },
    [setCells, debounceSave]
  );

  // ── Theme ──────────────────────────────────────────────────────────────────
  const handleApplyTheme = useCallback(
    (theme: NonNullable<MandalartTheme>) => {
      setCells((prev) =>
        prev.map((c) => (selectedCellIds.has(c.id) ? { ...c, theme } : c))
      );
    },
    [setCells, selectedCellIds]
  );

  const handleClearTheme = useCallback(() => {
    setCells((prev) =>
      prev.map((c) => (selectedCellIds.has(c.id) ? { ...c, theme: null } : c))
    );
  }, [setCells, selectedCellIds]);

  // ── Clear all keywords (keep center cell) ─────────────────────────────────
  const handleClearAllKeywords = useCallback(() => {
    setCells((prev) =>
      prev.map((c) => (c.isCenter ? c : { ...c, text: '' }))
    );
    setSelectedCellIds(new Set());
  }, [setCells]);

  // ── 예시 보기: 누르는 동안만 표시, 떼면 복원 ──────────────────────────────
  const exampleSnapshotRef = useRef<{ name: string; cells: ReturnType<typeof createExampleCells> } | null>(null);

  const handleExamplePressStart = useCallback(() => {
    if (exampleSnapshotRef.current) return; // 이미 누르고 있음
    exampleSnapshotRef.current = { name: projectName, cells: [...cells] };
    setProjectName(EXAMPLE_PROJECT_NAME);
    setCells(createExampleCells());
    setSelectedCellIds(new Set());
  }, [projectName, cells, setProjectName, setCells]);

  const handleExamplePressEnd = useCallback(() => {
    if (!exampleSnapshotRef.current) return;
    setProjectName(exampleSnapshotRef.current.name);
    setCells(exampleSnapshotRef.current.cells);
    exampleSnapshotRef.current = null;
  }, [setProjectName, setCells]);

  // ── Selected keywords for AI panel ────────────────────────────────────────
  const selectedKeywords = useMemo(
    () =>
      cells
        .filter((c) => selectedCellIds.has(c.id) && c.text.trim())
        .map((c) => ({ id: c.id, text: c.text.trim(), theme: c.theme })),
    [cells, selectedCellIds]
  );

  // ── Empty state: story must be selected ────────────────────────────────────
  if (!selectedStory) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4 px-6">
        <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-title2">
          📋
        </div>
        <div className="text-center">
          <p className="text-body font-semibold text-white/70 mb-1">스토리가 선택되지 않았습니다.</p>
          <p className="text-subhead text-white/35 leading-relaxed">
            먼저 스토리를 선택한 후 만다라트를 작성할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => navigate('/story')}
          className="mt-2 px-4 py-2 rounded-full border border-white/[0.12] text-subhead text-white/50 hover:border-white/25 hover:text-white/70 transition-all"
        >
          스토리 선택하러 →
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.07] flex-shrink-0">
        <div className="flex items-center gap-3">
          <SourceBreadcrumb
            projectBrief={projectBrief}
            hasSelectedStory={!!selectedStory}
            projectName={projectName}
            onNavigateBack={(path) => navigate(path)}
          />
          {selectedStory && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/[0.1]">
              <span className="text-footnote text-white/30">스토리:</span>
              <span className="text-subhead font-medium text-white/70">{selectedStory.title}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-footnote text-white/30">임시 저장됨</span>
          <button
            onMouseDown={handleExamplePressStart}
            onMouseUp={handleExamplePressEnd}
            onMouseLeave={handleExamplePressEnd}
            onTouchStart={handleExamplePressStart}
            onTouchEnd={handleExamplePressEnd}
            title="누르는 동안 예시 미리보기"
            className="px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote font-medium text-white/35 hover:text-white/60 hover:border-white/25 hover:bg-white/[0.04] active:border-white/40 active:text-white/70 transition-all duration-150 select-none"
          >
            예시 보기
          </button>
          <button
            onClick={() => navigate('/game-flow')}
            className="px-4 py-1.5 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 hover:scale-[1.02] active:bg-white/80 active:scale-[0.98] transition-colors"
          >
            Game Flow →
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-1 gap-4 px-4 py-4 overflow-hidden min-h-0">

        {/* ── Left: Toolbar + Board ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">

          {/* Toolbar */}
          <div className="flex-shrink-0 flex items-center gap-2 flex-wrap w-full">
            <MandalartToolbar
              selectedCount={selectedCellIds.size}
              onApplyTheme={handleApplyTheme}
              onClearTheme={handleClearTheme}
              onClearSelection={handleClearSelection}
              onClearAll={handleClearAllKeywords}
            />
            {editingCellId ? (
              <span className="text-caption text-white/30 ml-1">
                편집 중 — Enter로 저장 · ESC로 취소
              </span>
            ) : (
              <span className="text-caption text-white/15">
                더블클릭으로 편집 · Delete/Backspace로 선택 삭제 · 드래그로 위치 교환
              </span>
            )}
          </div>

          {/* Board — auto-fit, font sizes scale with board size */}
          <div
            ref={boardContainerRef}
            className="flex-1 flex items-center justify-center min-h-0 overflow-hidden"
          >
            <div
              style={{
                width: boardSize,
                height: boardSize,
                '--cell-fs': `${cellFs}px`,
                '--cell-fs-lg': `${cellFsLg}px`,
              } as React.CSSProperties}
            >
              <MandalartBoard
                cells={cells}
                selectedCellIds={selectedCellIds}
                editingCellId={editingCellId}
                onSelect={handleSelect}
                onStartEdit={handleStartEdit}
                onFinishEdit={handleFinishEdit}
                onClearSelection={handleClearSelection}
                onSwapCells={handleSwapCells}
              />
            </div>
          </div>
        </div>

        {/* ── Right: AI Expansion Panel ── */}
        <div className="hidden lg:flex w-60 flex-shrink-0 flex-col rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">

          <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
            <h2 className="text-subhead font-semibold text-white/75 mb-1">AI 확장</h2>
            <p className="text-footnote text-white/30 leading-relaxed">
              선택한 키워드를 기반으로 스토리 제안을 생성합니다.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-footnote text-white/30">선택</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/[0.08] text-caption text-white/50 font-medium tabular-nums">
                {selectedCellIds.size}
              </span>
            </div>

            {selectedKeywords.length > 0 ? (
              selectedKeywords.map(({ id, text, theme }) => (
                <div
                  key={id}
                  className={[
                    'px-2.5 py-2 rounded-lg border text-footnote text-white/60 break-words leading-snug',
                    theme === 'rose'
                      ? 'bg-rose-500/[0.06] border-rose-400/20'
                      : theme === 'sky'
                      ? 'bg-sky-500/[0.06] border-sky-400/20'
                      : theme === 'amber'
                      ? 'bg-amber-500/[0.06] border-amber-400/20'
                      : 'bg-white/[0.04] border-white/[0.07]',
                  ].join(' ')}
                >
                  {text}
                </div>
              ))
            ) : (
              <p className="text-footnote text-white/30 italic leading-relaxed mt-1">
                셀을 클릭해 키워드를 선택하세요. ⌘/Ctrl+클릭으로 다중 선택 가능합니다.
              </p>
            )}
          </div>

          <div className="px-4 pt-3 pb-4 border-t border-white/[0.06] flex-shrink-0">
            <p className="text-caption text-white/30 leading-relaxed">
              선택한 키워드는 스토리 생성, 사건 설계, 퍼즐 제안에 활용됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Source-aware breadcrumb ─────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { label: string; badge: string; badgeStyle: string; backPath: string }> = {
  youtube:  { label: 'YouTube 스토리', badge: 'YouTube', badgeStyle: 'bg-red-500/[0.12] border-red-500/20 text-red-400/70', backPath: '/story' },
  manual:   { label: '스토리 제안',    badge: '스토리',   badgeStyle: 'bg-sky-500/[0.12] border-sky-500/20 text-sky-400/70', backPath: '/story' },
  scenario: { label: '스토리 제안',    badge: '사건 구성', badgeStyle: 'bg-amber-500/[0.12] border-amber-500/20 text-amber-400/70', backPath: '/story' },
};

function SourceBreadcrumb({
  projectBrief,
  hasSelectedStory,
  projectName,
  onNavigateBack,
}: {
  projectBrief: ProjectBrief | null;
  hasSelectedStory: boolean;
  projectName: string;
  onNavigateBack: (path: string) => void;
}) {
  const source = projectBrief?.source;
  const config = source ? SOURCE_CONFIG[source] : null;

  // All flows now go through /story, so always use source config
  const effectiveConfig = config; // hasSelectedStory is kept for future use when flows differ

  return (
    <div className="flex items-center gap-2">
      {effectiveConfig && (
        <>
          <button
            onClick={() => onNavigateBack(effectiveConfig.backPath)}
            className="text-footnote text-white/30 hover:text-white/60 transition-colors"
          >
            &larr; {effectiveConfig.label}
          </button>
          <span className="text-white/15">/</span>
          <span className={`px-1.5 py-0.5 rounded-md border text-micro font-medium ${effectiveConfig.badgeStyle}`}>
            {effectiveConfig.badge}
          </span>
        </>
      )}
      <h1 className="text-body font-semibold text-white/85">{projectName}</h1>
      <span className="h-3.5 w-px bg-white/10" />
      <span className="text-footnote text-white/35 font-medium tracking-wide">만다라트</span>
    </div>
  );
}
