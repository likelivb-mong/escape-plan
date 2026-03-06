import type { DraftDocument, DraftBeat, StageLabel } from '../../types/draft';
import { SectionMeta } from './DraftOverviewSection';

interface DraftFlowSectionProps {
  doc: DraftDocument;
}

// ── Stage tokens ──────────────────────────────────────────────────────────────

type StageKey = 'intro' | 'development' | 'expansion' | 'twist' | 'ending';

const LABEL_TO_KEY: Record<StageLabel, StageKey> = {
  '기':   'intro',
  '승':   'development',
  '전':   'expansion',
  '반전': 'twist',
  '결':   'ending',
};

const STAGE_TOKENS: Record<StageKey, { dot: string; badge: string; accent: string; line: string }> = {
  intro:       { dot: 'bg-sky-400/70',     badge: 'bg-sky-500/[0.10] text-sky-300/80 border-sky-400/20',       accent: 'text-sky-300/60',     line: 'bg-sky-400/25' },
  development: { dot: 'bg-emerald-400/70', badge: 'bg-emerald-500/[0.10] text-emerald-300/80 border-emerald-400/20', accent: 'text-emerald-300/60', line: 'bg-emerald-400/25' },
  expansion:   { dot: 'bg-amber-400/70',   badge: 'bg-amber-500/[0.10] text-amber-300/80 border-amber-400/20',     accent: 'text-amber-300/60',   line: 'bg-amber-400/25' },
  twist:       { dot: 'bg-rose-400/70',    badge: 'bg-rose-500/[0.10] text-rose-300/80 border-rose-400/20',       accent: 'text-rose-300/60',    line: 'bg-rose-400/25' },
  ending:      { dot: 'bg-purple-400/70',  badge: 'bg-purple-500/[0.10] text-purple-300/80 border-purple-400/20',   accent: 'text-purple-300/60',  line: 'bg-purple-400/25' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DraftFlowSection({ doc }: DraftFlowSectionProps) {
  if (doc.beats.length === 0) return null;

  return (
    <section className="mb-10">
      <SectionMeta index="04" label="Story Flow Structure" />

      {/* Summary row */}
      <div className="mt-4 mb-4 flex items-center gap-4 px-1 flex-wrap">
        <p className="text-[11px] text-white/25">
          총 <span className="text-white/50 font-semibold">{doc.beats.length}단계</span>
        </p>
        <span className="w-px h-3 bg-white/[0.08]" />
        <p className="text-[11px] text-white/25">
          예상 시간{' '}
          <span className="text-white/50 font-semibold">{doc.totalPlayTime}분</span>
        </p>
      </div>

      <div className="flex flex-col">
        {doc.beats.map((beat, i) => (
          <BeatBlock
            key={beat.label}
            beat={beat}
            index={i}
            isLast={i === doc.beats.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

// ── Beat block ────────────────────────────────────────────────────────────────

function BeatBlock({
  beat,
  index,
  isLast,
}: {
  beat: DraftBeat;
  index: number;
  isLast: boolean;
}) {
  const key = LABEL_TO_KEY[beat.label] ?? 'intro';
  const tok = STAGE_TOKENS[key];

  return (
    <div className="flex gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center flex-shrink-0 w-6 pt-[22px]">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tok.dot}`} />
        {!isLast && (
          <div className={`w-px flex-1 min-h-[24px] mt-2 ${tok.line} opacity-40`} />
        )}
      </div>

      {/* Content block */}
      <div className="flex-1 rounded-2xl border border-white/[0.07] bg-white/[0.015] overflow-hidden mb-4">

        {/* Header */}
        <div className="px-6 pt-4 pb-3 border-b border-white/[0.05] flex items-center gap-3 flex-wrap">
          <span className="text-[10px] text-white/20 font-medium tabular-nums w-5 flex-shrink-0">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold leading-none ${tok.badge}`}>
            {beat.label}
          </span>
          <h4 className="text-sm font-semibold text-white/85">{beat.title}</h4>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-white/30 flex-shrink-0">
            <span>⏱</span>{beat.estimatedMinutes}분
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-4 flex flex-col gap-3">
          <p className="text-[12px] text-white/50 leading-relaxed">{beat.description}</p>

          {beat.objective && (
            <div className="flex items-start gap-2">
              <span className="text-[11px] flex-shrink-0 mt-[1px]">🎯</span>
              <div>
                <span className={`text-[9px] font-bold uppercase tracking-wider block mb-0.5 ${tok.accent}`}>
                  플레이 목표
                </span>
                <p className="text-[11px] text-white/45 leading-relaxed">{beat.objective}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
