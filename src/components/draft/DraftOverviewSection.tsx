import type { DraftDocument } from '../../types/draft';
import type { TwistIntensity } from '../../types/story';

interface DraftOverviewSectionProps {
  doc: DraftDocument;
}

const TWIST_LABELS: Record<TwistIntensity, string> = {
  low: '반전 약함', medium: '반전 중간', high: '반전 강함',
};
const TWIST_COLORS: Record<TwistIntensity, string> = {
  low:    'text-white/40 border-white/[0.10]',
  medium: 'text-amber-300/65 border-amber-400/25',
  high:   'text-rose-300/70 border-rose-400/25',
};

export default function DraftOverviewSection({ doc }: DraftOverviewSectionProps) {
  return (
    <section className="mb-10">
      <SectionMeta index="01" label="Project Overview" />

      <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.018] overflow-hidden">

        {/* Cover block */}
        <div className="px-8 pt-8 pb-6 border-b border-white/[0.06]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-white/90 leading-tight tracking-tight">
                {doc.projectName}
              </h2>
              {doc.mainTheme && doc.mainTheme !== doc.projectName && (
                <p className="text-base text-white/45 mt-1 font-medium">{doc.mainTheme}</p>
              )}
            </div>
            {/* Generated timestamp */}
            <span className="text-[10px] text-white/20 tabular-nums flex-shrink-0 mt-1">
              {new Date(doc.generatedAt).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </div>

          {/* Logline */}
          <blockquote className="mt-5 border-l-2 border-white/20 pl-4">
            <p className="text-[13px] text-white/55 italic leading-relaxed">"{doc.logline}"</p>
          </blockquote>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          <MetaCell label="장르" value={doc.genre} />
          <MetaCell label="분위기" value={doc.tone} />
          <MetaCell label="플레이타임" value={`${doc.playTime}분`} />
          <MetaCell label="인원" value={doc.playerCount} />
          <MetaCell label="추천 퍼즐" value={`${doc.totalAdoptedCount}개 채택됨`} accent={doc.totalAdoptedCount > 0 ? 'emerald' : undefined} />
          <div className="flex flex-col justify-center px-5 py-3.5 border-t border-r border-white/[0.05] last:border-r-0">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">반전 강도</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border self-start ${TWIST_COLORS[doc.twistIntensity]}`}>
              {TWIST_LABELS[doc.twistIntensity]}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionMeta({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <span className="text-[10px] font-bold text-white/15 tabular-nums">{index}</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">{label}</span>
    </div>
  );
}

function MetaCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'emerald';
}) {
  const valueCls = accent === 'emerald' ? 'text-emerald-300/70' : 'text-white/65';
  return (
    <div className="flex flex-col px-5 py-3.5 border-t border-r border-white/[0.05] last:border-r-0">
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">{label}</span>
      <span className={`text-[12px] font-semibold ${valueCls}`}>{value}</span>
    </div>
  );
}

export { SectionMeta };
