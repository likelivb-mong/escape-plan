import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MandalartTheme, MandalartCellData } from '../types/mandalart';
import { useProject } from '../context/ProjectContext';
import type { ProjectBrief } from '../types';
import MandalartBoard from '../components/mandalart/MandalartBoard';
import MandalartToolbar from '../components/mandalart/MandalartToolbar';
import LinkedKeywordsEditor from '../components/mandalart/LinkedKeywordsEditor';
import { createExampleCells, EXAMPLE_PROJECT_NAME } from '../data/mockMandalart';
import WorkflowStepBar from '../components/layout/WorkflowStepBar';

const MAX_UNDO = 50;

export default function MandalartPage() {
  const navigate = useNavigate();
  const { projectName, setProjectName, cells, setCells, projectBrief, selectedStory, saveCurrentProject } = useProject();

  const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(new Set());
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [boardSize, setBoardSize] = useState(600);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Undo / Redo ──────────────────────────────────────────────────────────
  const undoStackRef = useRef<MandalartCellData[][]>([]);
  const redoStackRef = useRef<MandalartCellData[][]>([]);

  /** Snapshot current cells before a mutation */
  const pushUndo = useCallback(() => {
    undoStackRef.current.push([...cells]);
    if (undoStackRef.current.length > MAX_UNDO) undoStackRef.current.shift();
    redoStackRef.current = []; // clear redo on new action
  }, [cells]);

  /** setCells with automatic undo snapshot */
  const setCellsWithUndo = useCallback(
    (updater: MandalartCellData[] | ((prev: MandalartCellData[]) => MandalartCellData[])) => {
      pushUndo();
      setCells(updater);
    },
    [pushUndo, setCells],
  );

  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current.pop()!;
    redoStackRef.current.push([...cells]);
    setCells(prev);
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  }, [cells, setCells]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push([...cells]);
    setCells(next);
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  }, [cells, setCells]);

  // Keep counts in sync after mutations
  const syncHistoryCounts = useCallback(() => {
    setUndoCount(undoStackRef.current.length);
    setRedoCount(redoStackRef.current.length);
  }, []);

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
      if (multi || multiSelectMode) {
        // Cmd/Ctrl+Click or multi-select mode: toggle individual cell
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }
      // Single click: already selected → deselect all; otherwise select this cell
      if (prev.has(id)) return new Set();
      return new Set([id]);
    });
  }, [multiSelectMode]);

  const handleClearSelection = useCallback(() => {
    (document.activeElement as HTMLElement)?.blur();
    setSelectedCellIds(new Set());
  }, []);

  // ── Keyboard: Delete, Undo (Ctrl+Z), Redo (Ctrl+Shift+Z / Ctrl+Y) ──────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // ── Undo / Redo ──
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
          return;
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // ── Delete ──
      if (editingCellId) return;
      if (selectedCellIds.size === 0) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      e.preventDefault();
      setCellsWithUndo((prev) => {
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
      syncHistoryCounts();
      setSelectedCellIds(new Set());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingCellId, selectedCellIds, setCellsWithUndo, handleUndo, handleRedo, syncHistoryCounts]);

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

      setCellsWithUndo((prev) => {
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
      syncHistoryCounts();
      debounceSave();
    },
    [setCellsWithUndo, debounceSave, syncHistoryCounts]
  );

  // ── Swap cells (drag-to-reposition) ───────────────────────────────────────
  const handleSwapCells = useCallback(
    (id1: string, id2: string) => {
      setCellsWithUndo((prev) => {
        const c1 = prev.find((c) => c.id === id1);
        const c2 = prev.find((c) => c.id === id2);
        if (!c1 || !c2) return prev;
        return prev.map((c) => {
          if (c.id === id1) return { ...c, text: c2.text, theme: c2.theme };
          if (c.id === id2) return { ...c, text: c1.text, theme: c1.theme };
          return c;
        });
      });
      syncHistoryCounts();
      debounceSave();
    },
    [setCellsWithUndo, debounceSave, syncHistoryCounts]
  );

  // ── Theme ──────────────────────────────────────────────────────────────────
  const handleApplyTheme = useCallback(
    (theme: NonNullable<MandalartTheme>) => {
      setCellsWithUndo((prev) =>
        prev.map((c) => (selectedCellIds.has(c.id) ? { ...c, theme } : c))
      );
      syncHistoryCounts();
    },
    [setCellsWithUndo, selectedCellIds, syncHistoryCounts]
  );

  const handleClearTheme = useCallback(() => {
    setCellsWithUndo((prev) =>
      prev.map((c) => (selectedCellIds.has(c.id) ? { ...c, theme: null } : c))
    );
    syncHistoryCounts();
  }, [setCellsWithUndo, selectedCellIds, syncHistoryCounts]);

  // ── Clear selected cells (text + color) ───────────────────────────────────
  const handleClearAllKeywords = useCallback(() => {
    if (selectedCellIds.size === 0) return;
    setCellsWithUndo((prev) =>
      prev.map((c) =>
        selectedCellIds.has(c.id) && !c.isCenter ? { ...c, text: '', theme: null } : c
      )
    );
    syncHistoryCounts();
    setSelectedCellIds(new Set());
    debounceSave();
  }, [setCellsWithUndo, selectedCellIds, debounceSave, syncHistoryCounts]);

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
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/[0.07] flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SourceBreadcrumb
            projectBrief={projectBrief}
            hasSelectedStory={!!selectedStory}
            projectName={projectName}
            onNavigateBack={(path) => navigate(path)}
          />
          {selectedStory && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/[0.1]">
              <span className="text-footnote text-white/30">스토리:</span>
              <span className="text-subhead font-medium text-white/70 truncate max-w-[120px]">{selectedStory.title}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => saveCurrentProject()}
            disabled={!editingCellId && selectedCellIds.size === 0}
            className={`px-3 py-1.5 rounded-lg border text-footnote font-medium transition-all ${
              editingCellId || selectedCellIds.size > 0
                ? 'border-white/[0.10] text-white/45 hover:border-white/20 hover:text-white/70'
                : 'border-white/[0.08] text-white/20 bg-white/[0.02] cursor-not-allowed'
            }`}
          >
            {editingCellId || selectedCellIds.size > 0 ? '저장' : '저장됨'}
          </button>
          <button
            onMouseDown={handleExamplePressStart}
            onMouseUp={handleExamplePressEnd}
            onMouseLeave={handleExamplePressEnd}
            onTouchStart={handleExamplePressStart}
            onTouchEnd={handleExamplePressEnd}
            title="누르는 동안 예시 미리보기"
            className="hidden sm:block px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote font-medium text-white/35 hover:text-white/60 hover:border-white/25 hover:bg-white/[0.04] active:border-white/40 active:text-white/70 transition-all duration-150 select-none"
          >
            예시 보기
          </button>
          <button
            onClick={() => { saveCurrentProject(); navigate('/game-flow'); }}
            className="px-3 sm:px-4 py-1.5 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 active:bg-white/80 transition-colors"
          >
            <span className="hidden sm:inline">Game Flow →</span>
            <span className="sm:hidden">Flow →</span>
          </button>
        </div>
      </div>

      {/* Workflow step bar */}
      <WorkflowStepBar onBeforeNavigate={saveCurrentProject} />

      {/* ── Main Content ── */}
      <div className="flex flex-1 gap-4 px-4 py-4 overflow-hidden min-h-0">

        {/* ── Left: Toolbar + Board ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">

          {/* Toolbar */}
          <div className="flex-shrink-0 flex items-center gap-2 flex-wrap w-full">
            <MandalartToolbar
              selectedCount={selectedCellIds.size}
              multiSelectMode={multiSelectMode}
              onToggleMultiSelect={() => setMultiSelectMode((v) => !v)}
              canUndo={undoCount > 0}
              canRedo={redoCount > 0}
              onUndo={handleUndo}
              onRedo={handleRedo}
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

        {/* ── Right: Linked Keywords Editor ── */}
        <LinkedKeywordsEditor
          cells={cells}
          selectedCellIds={selectedCellIds}
          onEditCell={(id, newText) => {
            const updated = cells.map(c => c.id === id ? { ...c, text: newText } : c);
            setCells(updated);
            debounceSave();
          }}
        />
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
    <div className="flex items-center gap-2 min-w-0">
      {effectiveConfig && (
        <>
          <button
            onClick={() => onNavigateBack(effectiveConfig.backPath)}
            className="text-footnote text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
          >
            ← Story
          </button>
          <span className="text-white/15 flex-shrink-0">/</span>
        </>
      )}
      <h1 className="text-body font-semibold text-white/85 truncate">{projectName}</h1>
      <span className="hidden sm:block h-3.5 w-px bg-white/10 flex-shrink-0" />
      <span className="hidden sm:block text-footnote text-white/35 font-medium tracking-wide flex-shrink-0">만다라트</span>
    </div>
  );
}
