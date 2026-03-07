import type { DraftDocument } from '../../types/draft';
import type { TwistIntensity } from '../../types/story';
import { SectionMeta } from './DraftOverviewSection';

interface DraftStorySectionProps {
  doc: DraftDocument;
}

const TWIST_STYLES: Record<TwistIntensity, string> = {
  low:    'border-white/[0.10] text-white/40',
  medium: 'border-amber-400/25 text-amber-300/65',
  high:   'border-rose-400/25 text-rose-300/70',
};
const TWIST_LABELS: Record<TwistIntensity, string> = {
  low: '반전 약함', medium: '반전 중간', high: '반전 강함',
};

export default function DraftStorySection({ doc }: DraftStorySectionProps) {
  return (
    <section className="mb-10">
      <SectionMeta index="03" label="Selected Story" />

      <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.018] overflow-hidden">

        {/* Story header */}
        <div className="px-8 pt-7 pb-5 border-b border-white/[0.06]">
          <div className="flex items-start gap-3 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg border border-white/[0.10] text-caption text-white/40 bg-white/[0.02] flex-shrink-0">
              {doc.genre}
            </span>
            <span className="px-2.5 py-1 rounded-lg border border-white/[0.07] text-caption text-white/30 flex-shrink-0">
              {doc.tone}
            </span>
            <span className={`px-2.5 py-1 rounded-lg border text-caption flex-shrink-0 ${TWIST_STYLES[doc.twistIntensity]}`}>
              {TWIST_LABELS[doc.twistIntensity]}
            </span>
          </div>

          <h3 className="text-title2 font-bold text-white/90 mt-3 leading-tight tracking-tight">
            {doc.storyTitle}
          </h3>

          <blockquote className="mt-3 border-l-2 border-white/[0.15] pl-4">
            <p className="text-subhead text-white/50 italic leading-relaxed">"{doc.logline}"</p>
          </blockquote>
        </div>

        {/* Synopsis */}
        <div className="px-8 py-6 border-b border-white/[0.06]">
          <p className="text-micro font-bold uppercase tracking-widest text-white/20 mb-3">Synopsis</p>
          <p className="text-subhead text-white/55 leading-relaxed">{doc.synopsis}</p>
        </div>

        {/* Meta stats */}
        <div className="flex flex-wrap">
          <StoryMeta label="플레이타임" value={`${doc.playTime}분`} />
          <StoryMeta label="인원" value={doc.playerCount} />
          <StoryMeta label="장르" value={doc.genre} />
          <StoryMeta label="분위기" value={doc.tone} />
        </div>
      </div>
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StoryMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col px-6 py-3.5 border-t border-r border-white/[0.05]">
      <span className="text-micro font-bold uppercase tracking-widest text-white/20 mb-1">{label}</span>
      <span className="text-subhead font-semibold text-white/60">{value}</span>
    </div>
  );
}
