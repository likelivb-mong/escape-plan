import { useState } from 'react';
import type { MandalartCellData } from '../../types/mandalart';

interface LinkedKeywordsEditorProps {
  cells: MandalartCellData[];
  selectedCellIds: Set<string>;
  onEditCell: (id: string, newText: string) => void;
}

// Get the 3x3 block index (0-8) from row/col
function getBlockIndex(row: number, col: number): number {
  const blockRow = Math.floor((row - 1) / 3);
  const blockCol = Math.floor((col - 1) / 3);
  return blockRow * 3 + blockCol;
}

// Get all cells in a 3x3 block
function getBlockCells(cells: MandalartCellData[], blockIndex: number): MandalartCellData[] {
  const blockRow = Math.floor(blockIndex / 3);
  const blockCol = blockIndex % 3;
  const minRow = blockRow * 3 + 1;
  const maxRow = minRow + 2;
  const minCol = blockCol * 3 + 1;
  const maxCol = minCol + 2;

  return cells.filter(c => c.row >= minRow && c.row <= maxRow && c.col >= minCol && c.col <= maxCol);
}

// Get the center cell of a block
function getBlockCenter(cells: MandalartCellData[], blockIndex: number): MandalartCellData | null {
  const blockRow = Math.floor(blockIndex / 3);
  const blockCol = blockIndex % 3;
  const centerRow = blockRow * 3 + 2; // 1,2,3 → 2 / 4,5,6 → 5 / 7,8,9 → 8
  const centerCol = blockCol * 3 + 2;

  return cells.find(c => c.row === centerRow && c.col === centerCol) || null;
}

export default function LinkedKeywordsEditor({
  cells,
  selectedCellIds,
  onEditCell,
}: LinkedKeywordsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Get selected cell or first selected
  const selectedCell = selectedCellIds.size > 0
    ? cells.find(c => selectedCellIds.has(c.id))
    : null;

  if (!selectedCell) {
    return (
      <div className="hidden lg:flex w-64 flex-shrink-0 flex-col rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
          <h2 className="text-subhead font-semibold text-white/75 mb-1">연관 키워드</h2>
          <p className="text-footnote text-white/30 leading-relaxed">
            칸을 선택하면 연결된 키워드들이 표시됩니다.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <p className="text-footnote text-white/25 italic text-center">
            만다라트에서 칸을 선택해보세요
          </p>
        </div>
      </div>
    );
  }

  // Get block index and related cells
  const blockIndex = getBlockIndex(selectedCell.row, selectedCell.col);
  const blockCells = getBlockCells(cells, blockIndex);
  const blockCenter = getBlockCenter(cells, blockIndex);

  // Sort block cells: center first, then others
  const sortedCells = blockCenter
    ? [blockCenter, ...blockCells.filter(c => c.id !== blockCenter.id)]
    : blockCells;

  const handleStartEdit = (cell: MandalartCellData) => {
    setEditingId(cell.id);
    setEditValue(cell.text);
  };

  const handleCommitEdit = () => {
    if (editingId) {
      onEditCell(editingId, editValue.trim());
      setEditingId(null);
      setEditValue('');
    }
  };

  return (
    <div className="hidden lg:flex w-64 flex-shrink-0 flex-col rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <h2 className="text-subhead font-semibold text-white/75 mb-1">연관 키워드</h2>
        <p className="text-footnote text-white/30 leading-relaxed line-clamp-2">
          {blockCenter?.text || selectedCell.text}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0">
        {sortedCells.map((cell, idx) => (
          <div
            key={cell.id}
            className={`flex items-center gap-2 ${idx === 0 ? 'mb-1 pb-2 border-b border-white/[0.05]' : ''}`}
          >
            {/* Icon */}
            <span className="text-[10px] text-white/20 flex-shrink-0 w-4 text-center">
              {idx === 0 ? '●' : '○'}
            </span>

            {/* Cell text */}
            {editingId === cell.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleCommitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitEdit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="flex-1 px-2 py-1 text-xs bg-white/[0.08] border border-white/[0.15] rounded text-white outline-none focus:border-white/[0.25]"
              />
            ) : (
              <div
                onClick={() => handleStartEdit(cell)}
                className={`flex-1 px-2.5 py-1.5 rounded-lg border text-[13px] cursor-text transition-all line-clamp-2 break-words ${
                  cell.theme === 'rose'
                    ? 'bg-rose-500/[0.06] border-rose-400/20 text-white/70 hover:bg-rose-500/[0.10] hover:border-rose-400/30'
                    : cell.theme === 'sky'
                    ? 'bg-sky-500/[0.06] border-sky-400/20 text-white/70 hover:bg-sky-500/[0.10] hover:border-sky-400/30'
                    : cell.theme === 'amber'
                    ? 'bg-amber-500/[0.06] border-amber-400/20 text-white/70 hover:bg-amber-500/[0.10] hover:border-amber-400/30'
                    : 'bg-white/[0.04] border-white/[0.07] text-white/60 hover:bg-white/[0.06] hover:border-white/[0.10]'
                }`}
              >
                {cell.text || '(빈 칸)'}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 pt-3 pb-4 border-t border-white/[0.06] flex-shrink-0">
        <p className="text-[10px] text-white/25 leading-relaxed">
          클릭해서 직접 편집하세요 · 색상은 차트에서 적용
        </p>
      </div>
    </div>
  );
}
