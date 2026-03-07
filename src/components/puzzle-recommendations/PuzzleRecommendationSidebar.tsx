import type { RecommendationStats, PuzzleType } from '../../types/puzzleRecommendation';

interface PuzzleRecommendationSidebarProps {
  stats: RecommendationStats;
}

// ── Type colors ───────────────────────────────────────────────────────────────

const TYPE_DISPLAY: Record<PuzzleType, { label: string; bar: string }> = {
  text:        { label: '텍스트',  bar: 'bg-sky-400/55' },
  image:       { label: '이미지',  bar: 'bg-violet-400/55' },
  uv:          { label: 'UV',      bar: 'bg-purple-400/55' },
  audio:       { label: '음향',    bar: 'bg-amber-400/55' },
  device:      { label: '장치',    bar: 'bg-emerald-400/55' },
  spatial:     { label: '공간',    bar: 'bg-rose-400/55' },
  cooperative: { label: '협력',    bar: 'bg-orange-400/55' },
};

// ── Score ring color ──────────────────────────────────────────────────────────

function scoreColor(v: number): string {
  if (v >= 75) return 'text-emerald-300/80';
  if (v >= 50) return 'text-amber-300/75';
  return 'text-rose-300/70';
}

function scoreBg(v: number): string {
  if (v >= 75) return 'bg-emerald-400/20';
  if (v >= 50) return 'bg-amber-400/20';
  return 'bg-rose-400/20';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PuzzleRecommendationSidebar({ stats }: PuzzleRecommendationSidebarProps) {
  const { totalPuzzles, adoptedCount, discardedCount, varietyScore, consistencyScore, difficultyBalance } = stats;
  const total = difficultyBalance.easy + difficultyBalance.medium + difficultyBalance.hard;

  return (
    <div className="flex flex-col rounded-xl border border-white/[0.07] bg-white/[0.015] overflow-hidden h-full">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <h2 className="text-subhead font-semibold text-white/75 mb-1">AI Design Insights</h2>
        <p className="text-footnote text-white/28 leading-relaxed">
          Design quality analysis based on your current selections.
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-5 px-4 py-4 min-h-0">

        {/* ── Section 1: Overview ── */}
        <div>
          <SectionLabel>Overview</SectionLabel>
          <div className="mt-2 flex gap-3 flex-wrap">
            <StatPill label="전체 퍼즐" value={totalPuzzles} />
            <StatPill label="채택됨" value={adoptedCount} accent="emerald" />
            <StatPill label="제외됨" value={discardedCount} accent="rose" />
          </div>
        </div>

        {/* ── Section 2: Scores ── */}
        <div>
          <SectionLabel>Design Scores</SectionLabel>
          <div className="flex flex-col gap-2.5 mt-2">
            <ScoreRow label="유형 다양성" value={varietyScore} hint="퍼즐 유형이 다양할수록 높습니다" />
            <ScoreRow label="스토리 연계" value={consistencyScore} hint="단서 키워드 활용률 기준" />
          </div>
        </div>

        {/* ── Section 3: Difficulty balance ── */}
        <div>
          <SectionLabel>Difficulty Balance</SectionLabel>
          <div className="flex flex-col gap-2 mt-2">
            <DiffBar label="쉬움"  count={difficultyBalance.easy}   total={total} color="bg-emerald-400/50" />
            <DiffBar label="보통"  count={difficultyBalance.medium} total={total} color="bg-amber-400/50" />
            <DiffBar label="어려움" count={difficultyBalance.hard}  total={total} color="bg-rose-400/50" />
          </div>
        </div>

        {/* ── Section 4: Suggested action ── */}
        <div>
          <SectionLabel>Suggested Action</SectionLabel>
          <div className="mt-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3">
            <SuggestedAction stats={stats} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pt-3 pb-4 border-t border-white/[0.06] flex-shrink-0">
        <button
          className="w-full py-2.5 rounded-xl bg-white/90 text-black text-subhead font-semibold hover:bg-white active:bg-white/80 transition-colors"
        >
          Export Design Plan
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-micro font-bold uppercase tracking-widest text-white/25">{children}</p>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'emerald' | 'rose';
}) {
  const numCls = accent === 'emerald'
    ? 'text-emerald-300/70'
    : accent === 'rose'
      ? 'text-rose-300/65'
      : 'text-white/75';
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border border-white/[0.07] bg-white/[0.02]">
      <span className={`text-title2 font-bold tabular-nums ${numCls}`}>{value}</span>
      <span className="text-micro text-white/35">{label}</span>
    </div>
  );
}

function ScoreRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-caption text-white/45">{label}</span>
        <span className={`text-footnote font-bold tabular-nums ${scoreColor(value)}`}>
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${scoreBg(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {hint && <p className="text-micro text-white/30 leading-relaxed">{hint}</p>}
    </div>
  );
}

function DiffBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-caption text-white/30 w-10 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-micro text-white/35 w-6 text-right tabular-nums">{count}</span>
    </div>
  );
}

function SuggestedAction({ stats }: { stats: RecommendationStats }) {
  const { varietyScore, consistencyScore, difficultyBalance } = stats;
  const total = difficultyBalance.easy + difficultyBalance.medium + difficultyBalance.hard;
  const hardPct = total > 0 ? difficultyBalance.hard / total : 0;

  if (varietyScore < 50) {
    return (
      <p className="text-caption text-white/50 leading-relaxed">
        <span className="text-amber-300/70 font-semibold">퍼즐 유형 다양성 부족.</span>{' '}
        여러 유형의 퍼즐을 추가하거나 재생성해 다양한 플레이 경험을 만들어보세요.
      </p>
    );
  }

  if (hardPct > 0.6) {
    return (
      <p className="text-caption text-white/50 leading-relaxed">
        <span className="text-rose-300/70 font-semibold">어려움 비중 높음.</span>{' '}
        쉬움/보통 퍼즐을 추가해 플레이어 학습 곡선을 고려해보세요.
      </p>
    );
  }

  if (consistencyScore < 60) {
    return (
      <p className="text-caption text-white/50 leading-relaxed">
        <span className="text-sky-300/70 font-semibold">스토리 연계 개선 필요.</span>{' '}
        만다라트 단서 키워드를 더 활용하는 퍼즐로 재생성해보세요.
      </p>
    );
  }

  return (
    <p className="text-caption text-white/50 leading-relaxed">
      <span className="text-emerald-300/70 font-semibold">설계 상태 양호.</span>{' '}
      채택을 완료한 후 Export Design Plan으로 기획안을 내보내세요.
    </p>
  );
}
