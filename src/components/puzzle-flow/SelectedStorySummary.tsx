import type { StoryProposal, TwistIntensity } from '../../types/story';

interface SelectedStorySummaryProps {
  story: StoryProposal;
}

const TWIST_STYLES: Record<TwistIntensity, string> = {
  low:    'border-white/[0.09] text-white/35',
  medium: 'border-amber-400/20 text-amber-300/55',
  high:   'border-rose-400/20 text-rose-300/60',
};
const TWIST_LABEL: Record<TwistIntensity, string> = {
  low: '반전 약함', medium: '반전 중간', high: '반전 강함',
};

export default function SelectedStorySummary({ story }: SelectedStorySummaryProps) {
  const { title, genre, tone, logline, meta } = story;

  return (
    <div className="flex-shrink-0 px-6 py-3 border-b border-white/[0.06] bg-white/[0.015]">
      <div className="flex items-start gap-6 flex-wrap">

        {/* Story identity */}
        <div className="flex flex-col gap-1.5 min-w-[220px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md border border-white/[0.10] text-micro text-white/40 bg-white/[0.03]">
              {genre}
            </span>
            <span className="px-2 py-0.5 rounded-md border border-white/[0.07] text-micro text-white/30">
              {tone}
            </span>
          </div>
          <h2 className="text-body font-semibold text-white/90 leading-snug">{title}</h2>
          <p className="text-footnote text-white/40 italic leading-relaxed">"{logline}"</p>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-white/[0.07] flex-shrink-0" />

        {/* Meta stats */}
        <div className="flex items-center gap-5 flex-wrap self-center">
          <MetaStat icon="⏱" label="플레이타임" value={meta.playtime} />
          <MetaStat icon="👥" label="인원" value={meta.playerCount} />
          <div className="flex flex-col gap-1">
            <span className="text-micro font-semibold text-white/20 uppercase tracking-widest">
              반전 강도
            </span>
            <span
              className={[
                'px-2 py-0.5 rounded-md border text-caption',
                TWIST_STYLES[meta.twistIntensity],
              ].join(' ')}
            >
              {TWIST_LABEL[meta.twistIntensity]}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-white/[0.07] flex-shrink-0" />

        {/* Context label */}
        <div className="flex items-center self-center ml-auto flex-shrink-0">
          <span className="flex items-center gap-1.5 text-caption text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
            현재 기준 스토리
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function MetaStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-micro font-semibold text-white/20 uppercase tracking-widest">
        {label}
      </span>
      <span className="flex items-center gap-1 text-footnote text-white/60">
        <span>{icon}</span>
        {value}
      </span>
    </div>
  );
}
