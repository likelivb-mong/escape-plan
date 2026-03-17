import type { MandalartTheme } from '../../types/mandalart';

interface MandalartToolbarProps {
  selectedCount: number;
  multiSelectMode: boolean;
  onToggleMultiSelect: () => void;
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
    style: 'border-rose-400/30 text-rose-300/70 hover:bg-rose-500/10 hover:border-rose-400/55 hover:text-rose-300/90',
  },
  {
    theme: 'sky',
    label: '연출 / 장치',
    dot: 'bg-sky-400',
    style: 'border-sky-400/30 text-sky-300/70 hover:bg-sky-500/10 hover:border-sky-400/55 hover:text-sky-300/90',
  },
  {
    theme: 'amber',
    label: '단서 / 소품',
    dot: 'bg-amber-400',
    style: 'border-amber-400/30 text-amber-300/70 hover:bg-amber-500/10 hover:border-amber-400/55 hover:text-amber-300/90',
  },
];

export default function MandalartToolbar({
  selectedCount,
  multiSelectMode,
  onToggleMultiSelect,
  onApplyTheme,
  onClearTheme,
  onClearSelection,
  onClearAll,
}: MandalartToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center gap-1.5 flex-wrap w-full">

      {/* ── Multi-select toggle (always visible, independent ON/OFF) ── */}
      <button
        onClick={onToggleMultiSelect}
        title={multiSelectMode ? '중복 선택 모드 끄기' : '중복 선택 모드 켜기 (여러 칸 연속 선택)'}
        className={[
          'px-3 py-1.5 rounded-full border text-footnote font-medium transition-all duration-150',
          multiSelectMode
            ? 'border-indigo-400/40 bg-indigo-500/[0.12] text-indigo-300/90'
            : 'border-white/[0.10] text-white/30 hover:text-white/50 hover:border-white/20',
        ].join(' ')}
      >
        {multiSelectMode ? '● 다중 선택' : '○ 다중 선택'}
      </button>

      {/* ── Divider ── */}
      <div className="h-4 w-px bg-white/10 mx-0.5" />

      {/* ── Color theme buttons ── */}
      {THEME_BUTTONS.map(({ theme, label, dot, style }) => (
        <button
          key={theme}
          onClick={() => onApplyTheme(theme)}
          disabled={!hasSelection}
          title={`선택한 칸에 '${label}' 색상 적용`}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
            'text-footnote font-medium transition-all duration-150',
            'disabled:opacity-20 disabled:cursor-not-allowed',
            style,
          ].join(' ')}
        >
          <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${dot}`} />
          {label}
        </button>
      ))}

      {/* ── Selection actions (only when cells are selected) ── */}
      {hasSelection && (
        <>
          <div className="h-4 w-px bg-white/10 mx-0.5" />

          <button
            onClick={onClearTheme}
            className="px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote font-medium text-white/40 hover:text-white/65 hover:border-white/20 transition-all duration-150"
          >
            색상 초기화
          </button>

          <button
            onClick={onClearAll}
            className="px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote font-medium text-white/40 hover:text-white/65 hover:border-white/20 transition-all duration-150"
          >
            삭제
          </button>

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          <button
            onClick={onClearSelection}
            className="px-2.5 py-1.5 rounded-full border border-white/[0.08] text-footnote font-medium text-white/25 hover:text-white/50 hover:border-white/15 transition-all duration-150"
          >
            선택 해제
          </button>

          <span className="text-footnote text-white/30 tabular-nums">
            {selectedCount}칸
          </span>
        </>
      )}

      {/* ── Hint when no selection ── */}
      {!hasSelection && (
        <span className="text-footnote text-white/20">칸을 클릭해 선택하세요</span>
      )}
    </div>
  );
}
