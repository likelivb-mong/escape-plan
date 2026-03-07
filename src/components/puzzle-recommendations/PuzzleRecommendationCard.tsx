import type { PuzzleRecommendation, PuzzleRecommendationStatus, PuzzleType, PuzzleDifficulty } from '../../types/puzzleRecommendation';

interface PuzzleRecommendationCardProps {
  puzzle: PuzzleRecommendation;
  isRegenerating?: boolean;
  onAdopt: (id: string) => void;
  onDiscard: (id: string) => void;
  onRegenerate: (id: string) => void;
}

// ── Visual tokens ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PuzzleType, string> = {
  text:        '텍스트',
  image:       '이미지',
  uv:          'UV',
  audio:       '음향',
  device:      '장치',
  spatial:     '공간',
  cooperative: '협력',
};

const TYPE_COLORS: Record<PuzzleType, string> = {
  text:        'border-sky-400/20 text-sky-300/60 bg-sky-500/[0.06]',
  image:       'border-violet-400/20 text-violet-300/60 bg-violet-500/[0.06]',
  uv:          'border-purple-400/20 text-purple-300/60 bg-purple-500/[0.06]',
  audio:       'border-amber-400/20 text-amber-300/60 bg-amber-500/[0.06]',
  device:      'border-emerald-400/20 text-emerald-300/60 bg-emerald-500/[0.06]',
  spatial:     'border-rose-400/20 text-rose-300/60 bg-rose-500/[0.06]',
  cooperative: 'border-orange-400/20 text-orange-300/60 bg-orange-500/[0.06]',
};

const DIFFICULTY_LABELS: Record<PuzzleDifficulty, string> = {
  easy:   '쉬움',
  medium: '보통',
  hard:   '어려움',
};

const DIFFICULTY_COLORS: Record<PuzzleDifficulty, string> = {
  easy:   'text-emerald-300/55',
  medium: 'text-amber-300/60',
  hard:   'text-rose-300/65',
};

const STATUS_RING: Record<PuzzleRecommendationStatus, string> = {
  suggested: 'border-white/[0.07]',
  adopted:   'border-emerald-400/30',
  edited:    'border-sky-400/30',
  discarded: 'border-white/[0.03] opacity-40',
};

const STATUS_BG: Record<PuzzleRecommendationStatus, string> = {
  suggested: 'bg-white/[0.015]',
  adopted:   'bg-emerald-500/[0.04]',
  edited:    'bg-sky-500/[0.04]',
  discarded: 'bg-white/[0.008]',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PuzzleRecommendationCard({
  puzzle,
  isRegenerating = false,
  onAdopt,
  onDiscard,
  onRegenerate,
}: PuzzleRecommendationCardProps) {
  const isAdopted  = puzzle.status === 'adopted' || puzzle.status === 'edited';
  const isDiscarded = puzzle.status === 'discarded';

  return (
    <div
      className={[
        'rounded-2xl border overflow-hidden transition-all duration-200',
        STATUS_RING[puzzle.status],
        STATUS_BG[puzzle.status],
      ].join(' ')}
    >
      {/* ── Card header ── */}
      <div className="px-4 pt-3.5 pb-2.5 border-b border-white/[0.05] flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-wrap min-w-0">
          {/* Type badge */}
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-md border text-caption font-medium leading-snug ${TYPE_COLORS[puzzle.type]}`}>
            {TYPE_LABELS[puzzle.type]}
          </span>

          {/* Title */}
          <h4 className={`text-subhead font-semibold leading-snug min-w-0 ${isDiscarded ? 'text-white/30 line-through' : 'text-white/85'}`}>
            {puzzle.title}
          </h4>
        </div>

        {/* Meta: difficulty + time */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className={`text-caption font-semibold ${DIFFICULTY_COLORS[puzzle.difficulty]}`}>
            {DIFFICULTY_LABELS[puzzle.difficulty]}
          </span>
          <span className="text-caption text-white/30 flex items-center gap-0.5">
            <span>⏱</span>{puzzle.estimatedMinutes}분
          </span>
        </div>
      </div>

      {/* ── Card body ── */}
      {!isDiscarded && (
        <div className="px-4 py-3.5 flex flex-col gap-3">
          {/* Description */}
          <p className="text-footnote text-white/50 leading-relaxed">{puzzle.description}</p>

          {/* Why recommended */}
          <div className="flex items-start gap-2">
            <span className="text-caption flex-shrink-0 mt-[1px]">💡</span>
            <p className="text-caption text-white/35 leading-relaxed italic">{puzzle.recommendedBecause}</p>
          </div>

          {/* Clue + Device usage */}
          <div className="flex gap-4 flex-wrap">
            {puzzle.clueUsage.length > 0 && (
              <div>
                <p className="text-micro font-bold uppercase tracking-widest text-white/20 mb-1.5">단서 활용</p>
                <div className="flex flex-wrap gap-1">
                  {puzzle.clueUsage.map((kw) => (
                    <span
                      key={kw}
                      className="px-1.5 py-0.5 rounded border border-amber-400/15 text-amber-300/50 text-micro bg-amber-500/[0.04]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {puzzle.deviceUsage.length > 0 && (
              <div>
                <p className="text-micro font-bold uppercase tracking-widest text-white/20 mb-1.5">연출 장치</p>
                <div className="flex flex-wrap gap-1">
                  {puzzle.deviceUsage.map((kw) => (
                    <span
                      key={kw}
                      className="px-1.5 py-0.5 rounded border border-sky-400/15 text-sky-300/50 text-micro bg-sky-500/[0.04]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Expected output */}
          <div className="flex items-center gap-2 pt-0.5 border-t border-white/[0.04]">
            <span className="text-micro font-bold uppercase tracking-widest text-white/20">플레이어 획득</span>
            <span className="text-caption text-white/50 font-medium">{puzzle.expectedOutput}</span>
          </div>
        </div>
      )}

      {/* ── Action row ── */}
      <div className="px-4 py-2.5 border-t border-white/[0.04] flex items-center gap-2">
        {/* Status badge */}
        <StatusBadge status={puzzle.status} />

        <div className="flex-1" />

        {/* Regenerate */}
        <button
          onClick={() => onRegenerate(puzzle.id)}
          disabled={isRegenerating}
          className="text-caption text-white/35 hover:text-white/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {isRegenerating ? (
            <span className="w-2.5 h-2.5 border border-white/20 border-t-white/50 rounded-full animate-spin" />
          ) : (
            '↺'
          )}
          재생성
        </button>

        {/* Discard / Restore */}
        {isDiscarded ? (
          <button
            onClick={() => onAdopt(puzzle.id)}
            className="px-2.5 py-1 rounded-full border border-white/[0.12] text-caption text-white/40 hover:border-white/25 hover:text-white/65 transition-all"
          >
            복원
          </button>
        ) : (
          <button
            onClick={() => onDiscard(puzzle.id)}
            className="px-2.5 py-1 rounded-full border border-white/[0.08] text-caption text-white/35 hover:border-rose-400/20 hover:text-rose-300/50 transition-all"
          >
            제외
          </button>
        )}

        {/* Adopt toggle */}
        {!isDiscarded && (
          <button
            onClick={() => onAdopt(puzzle.id)}
            className={[
              'px-3 py-1 rounded-full border text-caption font-medium transition-all',
              isAdopted
                ? 'border-emerald-400/30 text-emerald-300/70 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.04]'
                : 'border-white/[0.12] text-white/40 hover:border-emerald-400/25 hover:text-emerald-300/60',
            ].join(' ')}
          >
            {isAdopted ? '✓ 채택됨' : '채택'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PuzzleRecommendationStatus, { label: string; cls: string }> = {
  suggested: { label: 'AI 추천',  cls: 'text-white/25 border-white/[0.08]' },
  adopted:   { label: '✓ 채택됨', cls: 'text-emerald-300/60 border-emerald-400/20' },
  edited:    { label: '✏ 수정됨', cls: 'text-sky-300/60 border-sky-400/20' },
  discarded: { label: '제외됨',   cls: 'text-white/20 border-white/[0.05]' },
};

function StatusBadge({ status }: { status: PuzzleRecommendationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`px-2 py-0.5 rounded-md border text-micro font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
