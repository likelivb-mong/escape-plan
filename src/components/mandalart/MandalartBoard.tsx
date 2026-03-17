import { useState, useCallback, useMemo } from 'react';
import type { MandalartCellData } from '../../types/mandalart';
import MandalartCell from './MandalartCell';
import { BLOCK_COLORS, getBlockColorIndex, getSubGoalColorIndex } from './blockColors';

// ── Props ─────────────────────────────────────────────────────────────────────
interface MandalartBoardProps {
  cells: MandalartCellData[];
  selectedCellIds: Set<string>;
  editingCellId: string | null;
  onSelect: (id: string, multi: boolean) => void;
  onStartEdit: (id: string) => void;
  onFinishEdit: (id: string, newText: string | null) => void;
  onClearSelection: () => void;
  onSwapCells: (id1: string, id2: string) => void;
}

const BLOCK_POSITIONS = [0, 1, 2].flatMap((br) =>
  [0, 1, 2].map((bc) => ({ br, bc }))
);

/**
 * Draggable cells = action item cells in expansion blocks.
 * Non-draggable:
 *  - Main theme center (4,4)
 *  - Center block cells (rows 3-5, cols 3-5) → sub-goals
 *  - Expansion block center cells → (row-1)%3===0 && (col-1)%3===0
 */
function isDraggableCell(row: number, col: number): boolean {
  if (row === 4 && col === 4) return false;
  if (row >= 3 && row <= 5 && col >= 3 && col <= 5) return false;
  if ((row - 1) % 3 === 0 && (col - 1) % 3 === 0) return false;
  return true;
}

export default function MandalartBoard({
  cells,
  selectedCellIds,
  editingCellId,
  onSelect,
  onStartEdit,
  onFinishEdit,
  onClearSelection,
  onSwapCells,
}: MandalartBoardProps) {
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);

  // Group cells by block
  const blocks = useMemo(() => {
    const map: Record<string, MandalartCellData[]> = {};
    for (const cell of cells) {
      const key = `${Math.floor(cell.row / 3)}-${Math.floor(cell.col / 3)}`;
      if (!map[key]) map[key] = [];
      map[key].push(cell);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.row * 9 + a.col - (b.row * 9 + b.col));
    }
    return map;
  }, [cells]);

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handleDragStart = useCallback((id: string) => {
    setDragSourceId(id);
    setDragTargetId(null);
  }, []);

  const handleDragEnter = useCallback((id: string) => {
    setDragTargetId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragSourceId(null);
    setDragTargetId(null);
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (dragSourceId && dragSourceId !== targetId) {
        onSwapCells(dragSourceId, targetId);
      }
      setDragSourceId(null);
      setDragTargetId(null);
    },
    [dragSourceId, onSwapCells]
  );

  return (
    <div
      onClick={onClearSelection}
      className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[5px] p-[4px] rounded-xl border border-white/[0.07] bg-white/[0.025] shadow-2xl"
    >
      {BLOCK_POSITIONS.map(({ br, bc }) => {
        const isCenterBlock = br === 1 && bc === 1;
        const blockCells = blocks[`${br}-${bc}`] ?? [];
        const colorIndex = getBlockColorIndex(br, bc);
        const palette = colorIndex >= 0 ? BLOCK_COLORS[colorIndex] : null;

        // Center cell of expansion block (sub-goal mirror)
        const linkedCellId = !isCenterBlock
          ? `cell-${br * 3 + 1}-${bc * 3 + 1}`
          : undefined;

        // Block-level styling
        const blockStyle: React.CSSProperties = isCenterBlock
          ? {}
          : palette
          ? {
              backgroundColor: palette.blockBg,
              boxShadow: `inset 0 0 0 1px ${palette.blockBorder}`,
            }
          : {};

        return (
          <div
            key={`block-${br}-${bc}`}
            className={[
              'grid grid-cols-3 grid-rows-3 gap-[1px] rounded-lg overflow-hidden',
              isCenterBlock
                ? 'bg-purple-500/[0.08] ring-[1.5px] ring-inset ring-purple-400/[0.25]'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={blockStyle}
          >
            {blockCells.map((cell) => {
              const draggable = isDraggableCell(cell.row, cell.col);
              // Determine color index for this specific cell
              let cellColorIndex = -1;
              if (isCenterBlock && cell.isSubGoal) {
                cellColorIndex = getSubGoalColorIndex(cell.row, cell.col);
              } else if (!isCenterBlock && cell.id === linkedCellId) {
                cellColorIndex = colorIndex;
              }

              return (
                <MandalartCell
                  key={cell.id}
                  cell={cell}
                  isSelected={selectedCellIds.has(cell.id)}
                  isEditing={editingCellId === cell.id}
                  isLinked={cell.id === linkedCellId}
                  isDraggable={draggable}
                  isDragSource={draggable && dragSourceId === cell.id}
                  isDragTarget={
                    draggable &&
                    dragTargetId === cell.id &&
                    dragSourceId !== cell.id
                  }
                  blockColorIndex={cellColorIndex}
                  onSelect={onSelect}
                  onStartEdit={onStartEdit}
                  onFinishEdit={onFinishEdit}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
