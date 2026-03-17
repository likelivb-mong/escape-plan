import type { MandalartTheme } from '../../types/mandalart';

interface MandalartToolbarProps {
  selectedCount: number;
  onApplyTheme: (theme: NonNullable<MandalartTheme>) => void;
  onClearTheme: () => void;
  onClearSelection: () => void;
  onClearAll: () => void;
}

const THEME_BUTTONS: {
  theme: NonNullable<MandalartTheme>;
  label: string;
  dot: string;
  style: string;
}[] = [
  {
    theme: 'rose',
    label: '컨셉',
    dot: 'bg-rose-400',
    style:
      'border-rose-400/30 text-rose-300/70 hover:bg-rose-500/10 hover:border-rose-400/55 hover:text-rose-300/90',
  },
  {
    theme: 'sky',
    label: '연출 / 장치',
    dot: 'bg-sky-400',
    style:
      'border-sky-400/30 text-sky-300/70 hover:bg-sky-500/10 hover:border-sky-400/55 hover:text-sky-300/90',
  },
  {
    theme: 'amber',
    label: '단서 / 소품',
    dot: 'bg-amber-400',
    style:
      'border-amber-400/30 text-amber-300/70 hover:bg-amber-500/10 hover:border-amber-400/55 hover:text-amber-300/90',
  },
];

export default function MandalartToolbar({
  selectedCount,
  onApplyTheme,
  onClearTheme,
  onClearSelection,
  onClearAll,
}: MandalartToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap w-full">
      {/* Theme apply buttons */}
      {THEME_BUTTONS.map(({ theme, label, dot, style }) => (
        <button
          key={theme}
          onClick={() => onApplyTheme(theme)}
          disabled={!hasSelection}
          title={`선택한 칸에 '${label}' 색상 적용`}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
            'text-footnote font-medium transition-all duration-150',
            'disabled:opacity-25 disabled:cursor-not-allowed',
            style,
          ].join(' ')}
        >
          <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${dot}`} />
          {label}
        </button>
      ))}

      {/* Divider */}
      <div className="h-4 w-px bg-white/10 mx-1" />

      {/* Clear theme */}
      <button
        onClick={onClearTheme}
        disabled={!hasSelection}
        className="px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote font-medium text-white/35 hover:text-white/55 hover:border-white/20 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed"
      >
        색상 초기화
      </button>

      {/* Clear selection */}
      <button
        onClick={onClearSelection}
        disabled={!hasSelection}
        className="px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote font-medium text-white/35 hover:text-white/55 hover:border-white/20 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed"
      >
        선택 해제
      </button>

      {/* Selection count indicator */}
      {hasSelection && (
        <span className="text-footnote text-white/35 ml-0.5 tabular-nums">
          {selectedCount}칸 선택됨
        </span>
      )}

      {/* Spacer pushes delete to the right */}
      <div className="flex-1" />

      {/* Delete selected cells - low visibility to prevent accidental clicks */}
      <button
        onClick={onClearAll}
        disabled={!hasSelection}
        title={hasSelection ? "선택한 칸 삭제 (색상도 초기화됨)" : "칸을 선택하면 삭제 가능"}
        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 border ${
          hasSelection
            ? 'border-red-400/15 text-red-400/40 hover:border-red-400/25 hover:text-red-400/60 hover:bg-red-500/[0.05]'
            : 'border-transparent text-white/15 cursor-not-allowed'
        }`}
      >
        삭제
      </button>
    </div>
  );
}
