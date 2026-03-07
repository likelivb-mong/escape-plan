import { useState, useEffect, useRef } from 'react';
import type { MandalartCellData, MandalartTheme } from '../../types/mandalart';

interface MandalartCellProps {
  cell: MandalartCellData;
  isSelected: boolean;
  isEditing: boolean;
  /** True when this cell is the sub-goal mirror center of an expansion block */
  isLinked?: boolean;
  /** True when this cell can be dragged (action items in expansion blocks) */
  isDraggable?: boolean;
  /** True when this cell is the current drag source */
  isDragSource?: boolean;
  /** True when this cell is the current drag target */
  isDragTarget?: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onStartEdit: (id: string) => void;
  /** newText = null means "cancel — do not save" */
  onFinishEdit: (id: string, newText: string | null) => void;
  onDragStart?: (id: string) => void;
  onDragEnter?: (id: string) => void;
  onDragEnd?: () => void;
  onDrop?: (id: string) => void;
}

const THEME_BORDER: Record<NonNullable<MandalartTheme>, string> = {
  rose: 'border-rose-400/55',
  sky: 'border-sky-400/55',
  amber: 'border-amber-400/55',
};
const THEME_BG: Record<NonNullable<MandalartTheme>, string> = {
  rose: 'bg-rose-500/[0.06]',
  sky: 'bg-sky-500/[0.06]',
  amber: 'bg-amber-500/[0.06]',
};
const SELECTED_RING: Record<NonNullable<MandalartTheme> | 'default', string> = {
  rose: 'ring-rose-400/50',
  sky: 'ring-sky-400/50',
  amber: 'ring-amber-400/50',
  default: 'ring-white/35',
};

export default function MandalartCell({
  cell,
  isSelected,
  isEditing,
  isLinked = false,
  isDraggable = false,
  isDragSource = false,
  isDragTarget = false,
  onSelect,
  onStartEdit,
  onFinishEdit,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}: MandalartCellProps) {
  const { id, text, theme, isCenter, isSubGoal } = cell;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [draftText, setDraftText] = useState(text);
  const isFinishingRef = useRef(false);

  useEffect(() => {
    if (isEditing) {
      setDraftText(text);
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 0);
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Display mode handlers ──────────────────────────────────────────────
  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    onSelect(id, e.metaKey || e.ctrlKey);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartEdit(id);
  };

  // ── Edit mode handlers ─────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      isFinishingRef.current = true;
      onFinishEdit(id, draftText.trim() || '');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      isFinishingRef.current = true;
      onFinishEdit(id, null);
    }
  };

  const handleBlur = () => {
    if (isFinishingRef.current) {
      isFinishingRef.current = false;
      return;
    }
    onFinishEdit(id, draftText.trim() || '');
  };

  // ── Drag handlers ──────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable || isEditing) return;
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragEnter?.(id);
  };

  const handleDragEnterEvent = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    onDragEnter?.(id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(id);
  };

  const handleDragEndEvent = () => {
    onDragEnd?.();
  };

  // ── Styles ─────────────────────────────────────────────────────────────
  const borderClass = theme
    ? THEME_BORDER[theme]
    : isCenter
    ? 'border-purple-400/45'
    : isLinked
    ? 'border-purple-400/[0.32]'
    : isSubGoal
    ? 'border-purple-400/[0.28]'
    : 'border-white/[0.09]';

  const bgClass = theme
    ? THEME_BG[theme]
    : isCenter
    ? 'bg-purple-500/[0.12]'
    : isLinked
    ? 'bg-purple-500/[0.07]'
    : isSubGoal
    ? 'bg-purple-500/[0.06]'
    : 'bg-transparent';

  const ringClass = isDragTarget
    ? 'ring-[2px] ring-white/60 z-10'
    : isEditing
    ? 'ring-[1.5px] ring-white/55 z-10'
    : isSelected
    ? `ring-[1.5px] ${theme ? SELECTED_RING[theme] : SELECTED_RING.default}`
    : '';

  const opacityClass = isDragSource ? 'opacity-30' : '';

  const cursorClass = isEditing
    ? 'cursor-text'
    : isDraggable
    ? 'cursor-grab active:cursor-grabbing'
    : 'cursor-pointer';

  // ── Font sizes via CSS custom properties (set on the board wrapper in MandalartPage) ──
  // --cell-fs:    action / linked / sub-goal cells (scales with boardSize)
  // --cell-fs-lg: center cell (slightly larger)
  const textColorClass = isCenter
    ? 'font-semibold text-white/85'
    : isLinked
    ? 'font-semibold text-white/70'
    : isSubGoal
    ? 'font-medium text-white/65'
    : 'text-white/55';

  const textFontSize = isCenter
    ? 'var(--cell-fs-lg, 10px)'
    : 'var(--cell-fs, 9px)';

  return (
    <div
      draggable={isDraggable && !isEditing}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnterEvent}
      onDrop={handleDrop}
      onDragEnd={handleDragEndEvent}
      className={[
        'relative overflow-hidden border rounded-[4px] transition-all duration-100',
        cursorClass,
        !isEditing ? 'hover:border-white/20 hover:bg-white/[0.03]' : '',
        borderClass,
        bgClass,
        ringClass,
        opacityClass,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Main Theme badge — center cell only */}
      {isCenter && (
        <div className="absolute top-[3px] left-0 right-0 flex justify-center pointer-events-none z-10">
          <span className="text-micro font-bold tracking-[0.18em] uppercase text-white/30 select-none">
            메인 테마
          </span>
        </div>
      )}

      {/* Linked indicator dot — expansion block center cell only */}
      {isLinked && !isEditing && (
        <div className="absolute top-[3px] right-[3px] w-[4px] h-[4px] rounded-full bg-white/25 pointer-events-none z-10" />
      )}

      {/* Drag target highlight overlay */}
      {isDragTarget && (
        <div className="absolute inset-0 bg-white/[0.06] pointer-events-none z-0 rounded-[3px]" />
      )}

      {isEditing ? (
        /* ── Edit mode ── */
        <textarea
          ref={textareaRef}
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          spellCheck={false}
          placeholder={isCenter ? '메인 테마 입력' : ''}
          style={{ fontSize: textFontSize }}
          className={[
            'absolute inset-0 w-full h-full resize-none bg-transparent',
            'border-none outline-none text-center leading-tight overflow-hidden',
            'placeholder:text-white/[0.15] cursor-text',
            isCenter
              ? 'font-semibold text-white/95 pt-4 px-1 pb-1'
              : 'text-white/75 p-[5px]',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      ) : (
        /* ── Display mode ── */
        <div
          className={[
            'absolute inset-0 flex items-center justify-center px-[5px] pb-[5px] select-none',
            isCenter ? 'pt-[14px]' : 'pt-[5px]',
          ].join(' ')}
        >
          {text ? (
            <p
              style={{ fontSize: textFontSize }}
              className={[
                'text-center leading-tight break-words w-full overflow-hidden',
                '[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]',
                textColorClass,
              ].join(' ')}
            >
              {text}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
