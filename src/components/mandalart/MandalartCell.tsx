import { useState, useEffect, useRef } from 'react';
import type { MandalartCellData, MandalartTheme } from '../../types/mandalart';
import { BLOCK_COLORS } from './blockColors';

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
  /** Color index (0-7) for position-based coloring. -1 = no block color. */
  blockColorIndex?: number;
  onSelect: (id: string, multi: boolean) => void;
  onStartEdit: (id: string) => void;
  /** newText = null means "cancel — do not save" */
  onFinishEdit: (id: string, newText: string | null) => void;
  onDragStart?: (id: string) => void;
  onDragEnter?: (id: string) => void;
  onDragEnd?: () => void;
  onDrop?: (id: string) => void;
}

// Theme only affects text color, not cell background/border
const THEME_TEXT: Record<NonNullable<MandalartTheme>, string> = {
  rose: 'text-rose-400/90',
  sky: 'text-sky-400/90',
  amber: 'text-amber-400/90',
};

export default function MandalartCell({
  cell,
  isSelected,
  isEditing,
  isLinked = false,
  isDraggable = false,
  isDragSource = false,
  isDragTarget = false,
  blockColorIndex = -1,
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

  // ── Determine if this cell uses position-based block color ──────────────
  const hasBlockColor = blockColorIndex >= 0 && blockColorIndex < BLOCK_COLORS.length;
  const palette = hasBlockColor ? BLOCK_COLORS[blockColorIndex] : null;
  const isPositionColored = (isSubGoal || isLinked) && palette;

  // ── Styles ─────────────────────────────────────────────────────────────
  // Use inline styles for position-based colors; Tailwind classes for manual themes and defaults
  const inlineStyle: React.CSSProperties = {};

  let borderClass: string;
  let bgClass: string;

  if (isPositionColored) {
    // Position-based coloring for sub-goal / linked cells
    inlineStyle.backgroundColor = palette.bg;
    inlineStyle.borderColor = palette.border;
    borderClass = '';
    bgClass = '';
  } else if (isCenter) {
    borderClass = 'border-purple-400/50';
    bgClass = 'bg-purple-500/[0.14]';
  } else {
    borderClass = 'border-white/[0.09]';
    bgClass = 'bg-transparent';
  }

  let ringClass: string;
  if (isDragTarget) {
    ringClass = 'ring-[2px] ring-white/60 z-10';
  } else if (isEditing) {
    ringClass = 'ring-[1.5px] ring-white/55 z-10';
  } else if (isSelected) {
    if (isPositionColored) {
      inlineStyle.boxShadow = `0 0 0 1.5px ${palette.ring}`;
      ringClass = 'z-10';
    } else {
      ringClass = 'ring-[1.5px] ring-white/35';
    }
  } else {
    ringClass = '';
  }

  const opacityClass = isDragSource ? 'opacity-30' : '';

  const cursorClass = isEditing
    ? 'cursor-text'
    : isDraggable
    ? 'cursor-grab active:cursor-grabbing'
    : 'cursor-pointer';

  // ── Font sizes via CSS custom properties (set on the board wrapper in MandalartPage) ──
  // --cell-fs:    action / linked / sub-goal cells (scales with boardSize)
  // --cell-fs-lg: center cell (slightly larger)
  let textColorClass: string;
  if (isCenter) {
    textColorClass = 'font-semibold text-white/85';
  } else if (isPositionColored) {
    // Use the palette text color via inline style
    textColorClass = 'font-semibold';
  } else if (isLinked) {
    textColorClass = 'font-semibold text-white/70';
  } else if (isSubGoal) {
    textColorClass = 'font-medium text-white/65';
  } else if (theme) {
    // Manual theme → font color only
    textColorClass = `font-medium ${THEME_TEXT[theme]}`;
  } else {
    textColorClass = 'text-white/55';
  }

  const textFontSize = isCenter
    ? 'var(--cell-fs-lg, 10px)'
    : 'var(--cell-fs, 9px)';

  // Text color for position-colored cells
  const textInlineStyle: React.CSSProperties = isPositionColored
    ? { color: palette.text }
    : {};

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
      style={inlineStyle}
      className={[
        'relative overflow-hidden border rounded-[4px] transition-all duration-100',
        cursorClass,
        !isEditing ? 'hover:brightness-125 hover:bg-white/[0.03]' : '',
        borderClass,
        bgClass,
        ringClass,
        opacityClass,
      ]
        .filter(Boolean)
        .join(' ')}
    >

      {/* Position color indicator — sub-goal & linked cells */}
      {isPositionColored && !isEditing && (
        <div
          className="absolute top-[2px] right-[2px] w-[5px] h-[5px] rounded-full pointer-events-none z-10"
          style={{ backgroundColor: palette.border }}
        />
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
          placeholder=""
          style={{ fontSize: textFontSize }}
          className={[
            'absolute inset-0 w-full h-full resize-none bg-transparent',
            'border-none outline-none text-center leading-tight overflow-hidden',
            'placeholder:text-white/[0.15] cursor-text',
            isCenter
              ? 'font-semibold text-white/95 p-[5px]'
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
            'pt-[5px]',
          ].join(' ')}
        >
          {text ? (
            <p
              style={{ fontSize: textFontSize, ...textInlineStyle }}
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
