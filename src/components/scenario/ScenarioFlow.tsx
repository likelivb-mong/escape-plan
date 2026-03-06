import type { ScenarioBlock } from '../../types/scenario';

interface ScenarioFlowProps {
  blocks: ScenarioBlock[];
}

/** 블록 타입별 색상 매핑 */
const BLOCK_COLORS: Record<string, { badge: string; border: string; bg: string; text: string }> = {
  offender:      { badge: 'bg-rose-500/20 text-rose-300 border-rose-400/30',     border: 'border-rose-400/20',  bg: 'bg-rose-500/[0.04]',  text: 'text-rose-200/80' },
  motive:        { badge: 'bg-rose-500/20 text-rose-300 border-rose-400/30',     border: 'border-rose-400/20',  bg: 'bg-rose-500/[0.04]',  text: 'text-rose-200/80' },
  victim:        { badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',  border: 'border-amber-400/20', bg: 'bg-amber-500/[0.04]', text: 'text-amber-200/80' },
  crime:         { badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',  border: 'border-amber-400/20', bg: 'bg-amber-500/[0.04]', text: 'text-amber-200/80' },
  location:      { badge: 'bg-sky-500/20 text-sky-300 border-sky-400/30',        border: 'border-sky-400/20',   bg: 'bg-sky-500/[0.04]',   text: 'text-sky-200/80' },
  clue:          { badge: 'bg-sky-500/20 text-sky-300 border-sky-400/30',        border: 'border-sky-400/20',   bg: 'bg-sky-500/[0.04]',   text: 'text-sky-200/80' },
  investigation: { badge: 'bg-violet-500/20 text-violet-300 border-violet-400/30', border: 'border-violet-400/20', bg: 'bg-violet-500/[0.04]', text: 'text-violet-200/80' },
};

export default function ScenarioFlow({ blocks }: ScenarioFlowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {blocks.map((block, idx) => {
        const colors = BLOCK_COLORS[block.key] ?? BLOCK_COLORS.offender;
        const isLast = idx === blocks.length - 1;

        return (
          <div key={block.key} className="flex items-center gap-2">
            {/* 블록 카드 */}
            <div
              className={`
                relative rounded-xl border px-3 py-2.5 min-w-[100px]
                transition-all duration-200
                ${block.isEmpty
                  ? 'border-white/[0.06] bg-white/[0.015]'
                  : `${colors.border} ${colors.bg}`
                }
              `}
            >
              {/* 상단 배지 [가][A][나]... */}
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`
                    inline-flex items-center justify-center w-5 h-5 rounded-md border text-[9px] font-bold
                    ${block.isEmpty ? 'border-white/10 bg-white/5 text-white/20' : colors.badge}
                  `}
                >
                  {block.badge}
                </span>
                <span className={`text-[10px] font-medium tracking-wide ${block.isEmpty ? 'text-white/20' : 'text-white/40'}`}>
                  {block.label}
                </span>
              </div>

              {/* 값 표시 */}
              {block.isEmpty ? (
                <p className="text-[11px] text-white/15 italic">미입력</p>
              ) : (
                <p className={`text-[12px] font-medium leading-snug ${colors.text}`}>
                  {block.displayText}
                </p>
              )}
            </div>

            {/* 화살표 연결선 (마지막 블록 제외) */}
            {!isLast && (
              <div className="flex-shrink-0 text-white/15">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
