import type { StoryProposal, TwistIntensity, InvestigationFramework } from '../../types/story';
import { SUMMARY_MODE_BADGE } from '../../types/narrative';
import StoryStructurePreview from './StoryStructurePreview';

interface StoryProposalCardProps {
  proposal: StoryProposal;
  isSelected: boolean;
  isRegenerating: boolean;
  onSelect: () => void;
  onRegenerate: () => void;
  onViewDetail: () => void;
}

// ── Meta helpers ─────────────────────────────────────────────────────────────

const TWIST_LABEL: Record<TwistIntensity, string> = {
  low:    '반전 약함',
  medium: '반전 중간',
  high:   '반전 강함',
};
const TWIST_COLOR: Record<TwistIntensity, string> = {
  low:    'text-white/30 border-white/[0.09]',
  medium: 'text-amber-300/55 border-amber-400/20',
  high:   'text-rose-300/60 border-rose-400/25',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function StoryProposalCard({
  proposal,
  isSelected,
  isRegenerating,
  onSelect,
  onRegenerate,
  onViewDetail,
}: StoryProposalCardProps) {
  const { title, genre, tone, logline, synopsis, beats, meta, investigation } = proposal;

  return (
    <div
      className={[
        'flex flex-col rounded-2xl border-2 transition-all duration-300 overflow-hidden relative',
        isSelected
          ? 'border-emerald-400/60 bg-emerald-500/[0.04] shadow-[0_0_24px_rgba(52,211,153,0.12),0_0_0_1px_rgba(52,211,153,0.15)] ring-1 ring-emerald-400/20'
          : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.18] hover:bg-white/[0.03]',
        isRegenerating ? 'opacity-50 pointer-events-none' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* ── Selected indicator badge ── */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/70 via-emerald-300/50 to-emerald-400/70" />
      )}

      {/* ── Clickable body (opens detail modal) ── */}
      <div className="flex-1 flex flex-col cursor-pointer" onClick={onViewDetail}>

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
        {/* Genre + Tone badges + Quality badge */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="px-2 py-0.5 rounded-md border border-white/[0.10] text-[9px] text-white/40 bg-white/[0.03]">
            {genre}
          </span>
          <span className="px-2 py-0.5 rounded-md border border-white/[0.08] text-[9px] text-white/30 bg-transparent">
            {tone}
          </span>
          {proposal.narrative && (
            <span className={`px-2 py-0.5 rounded-md border text-[9px] ${SUMMARY_MODE_BADGE[proposal.narrative.quality.summaryMode].style}`}>
              {SUMMARY_MODE_BADGE[proposal.narrative.quality.summaryMode].label}
            </span>
          )}
        </div>

        <h3 className={`text-sm font-semibold mb-2 leading-snug ${isSelected ? 'text-emerald-200/95' : 'text-white/90'}`}>{title}</h3>
        <p className="text-[11px] text-white/40 leading-relaxed italic">"{logline}"</p>
      </div>

      {/* ── Synopsis ── */}
      <div className="px-5 py-4 border-b border-white/[0.05]">
        <p className="text-[11px] text-white/50 leading-relaxed">{synopsis}</p>
      </div>

      {/* ── 기승전반전결 ── */}
      <div className="px-5 py-4 border-b border-white/[0.05] flex-1">
        <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-3">
          스토리 구조
        </p>
        <StoryStructurePreview beats={beats} />
      </div>

      {/* ── Investigation Framework (수사 프레임워크) ── */}
      {investigation && <InvestigationSection data={investigation} />}

      {/* ── Meta ── */}
      <div className="px-5 py-3 border-b border-white/[0.05] flex items-center gap-3 flex-wrap">
        <MetaChip icon="⏱" value={meta.playtime} />
        <MetaChip icon="👥" value={meta.playerCount} />
        <span
          className={[
            'px-2 py-0.5 rounded-md border text-[9px]',
            TWIST_COLOR[meta.twistIntensity],
          ].join(' ')}
        >
          {TWIST_LABEL[meta.twistIntensity]}
        </span>
      </div>

      </div>{/* end clickable body */}

      {/* ── Footer: actions ── */}
      <div className="px-5 pb-5 pt-3 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={[
            'flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
            isSelected
              ? 'bg-emerald-400/90 text-black hover:bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
              : 'bg-white/[0.07] text-white/55 hover:bg-white/[0.12] hover:text-white/80',
          ].join(' ')}
        >
          {isSelected ? '✓ 선택됨' : '이 스토리 선택'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
          disabled={isRegenerating}
          title="이 슬롯만 새로 생성"
          className={[
            'w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-150',
            'border-white/[0.09] text-white/30 hover:border-white/20 hover:text-white/55',
            isRegenerating ? 'cursor-not-allowed' : '',
          ].join(' ')}
        >
          {isRegenerating ? (
            <span className="w-3.5 h-3.5 border border-white/25 border-t-white/60 rounded-full animate-spin" />
          ) : (
            <span className="text-sm">↺</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function MetaChip({ icon, value }: { icon: string; value: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-white/35">
      <span className="text-[11px]">{icon}</span>
      {value}
    </span>
  );
}

// ── Investigation Framework Section ──────────────────────────────────────────

const INVEST_BADGES: {
  key: keyof InvestigationFramework;
  label: string;
  color: string;
}[] = [
  { key: 'motive',    label: '동기',   color: 'text-rose-300/70 border-rose-400/25 bg-rose-500/[0.06]' },
  { key: 'method',    label: '방법',   color: 'text-amber-300/70 border-amber-400/25 bg-amber-500/[0.06]' },
  { key: 'clue',      label: '단서',   color: 'text-amber-300/70 border-amber-400/25 bg-amber-500/[0.06]' },
  { key: 'technique', label: '기법',   color: 'text-sky-300/70 border-sky-400/25 bg-sky-500/[0.06]' },
];

function InvestigationSection({ data }: { data: InvestigationFramework }) {
  return (
    <div className="px-5 py-4 border-b border-white/[0.05]">
      <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-3">
        수사 프레임워크
      </p>

      {/* 조합 공식 문장 */}
      {data.formula && (
        <p className="text-[11px] text-white/35 italic leading-relaxed mb-3 pl-3 border-l-2 border-white/10">
          {data.formula}
        </p>
      )}

      {/* 가해자 → 피해자 */}
      <div className="flex items-center gap-2 mb-2.5 text-[10px] text-white/45">
        <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.03]">
          {data.perpetrator || '?'}
        </span>
        <span className="text-white/20">&rarr;</span>
        <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.03]">
          {data.victim || '?'}
        </span>
        {data.scene && (
          <>
            <span className="text-white/20">@</span>
            <span className="text-white/30">{data.scene}</span>
          </>
        )}
      </div>

      {/* 동기 / 방법 / 단서 / 기법 배지 */}
      <div className="flex flex-wrap gap-1.5">
        {INVEST_BADGES.map(({ key, label, color }) => {
          const value = data[key];
          if (!value) return null;
          return (
            <span
              key={key}
              className={`px-2 py-0.5 rounded-md border text-[9px] ${color}`}
            >
              {label}: {value}
            </span>
          );
        })}
      </div>
    </div>
  );
}
