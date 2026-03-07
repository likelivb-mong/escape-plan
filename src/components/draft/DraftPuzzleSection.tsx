import type { DraftDocument, DraftAdoptedPuzzle, DraftAdoptedPuzzlesByStage, StageLabel } from '../../types/draft';
import type { PuzzleType, PuzzleDifficulty } from '../../types/puzzleRecommendation';
import { SectionMeta } from './DraftOverviewSection';

interface DraftPuzzleSectionProps {
  doc: DraftDocument;
}

// ── Stage accent colors ───────────────────────────────────────────────────────

const STAGE_ACCENTS: Record<string, { badge: string; dot: string; accent: string }> = {
  intro:       { badge: 'bg-sky-500/[0.10] text-sky-300/80 border-sky-400/20',           dot: 'bg-sky-400/70',     accent: 'text-sky-300/60' },
  development: { badge: 'bg-emerald-500/[0.10] text-emerald-300/80 border-emerald-400/20', dot: 'bg-emerald-400/70', accent: 'text-emerald-300/60' },
  expansion:   { badge: 'bg-amber-500/[0.10] text-amber-300/80 border-amber-400/20',       dot: 'bg-amber-400/70',   accent: 'text-amber-300/60' },
  twist:       { badge: 'bg-rose-500/[0.10] text-rose-300/80 border-rose-400/20',         dot: 'bg-rose-400/70',    accent: 'text-rose-300/60' },
  ending:      { badge: 'bg-purple-500/[0.10] text-purple-300/80 border-purple-400/20',   dot: 'bg-purple-400/70',  accent: 'text-purple-300/60' },
};

// ── Type / difficulty labels ──────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  text: '텍스트', image: '이미지', uv: 'UV', audio: '음향',
  device: '장치', spatial: '공간', cooperative: '협력',
};
const TYPE_COLORS: Record<string, string> = {
  text: 'border-sky-400/20 text-sky-300/60 bg-sky-500/[0.06]',
  image: 'border-violet-400/20 text-violet-300/60 bg-violet-500/[0.06]',
  uv: 'border-purple-400/20 text-purple-300/60 bg-purple-500/[0.06]',
  audio: 'border-amber-400/20 text-amber-300/60 bg-amber-500/[0.06]',
  device: 'border-emerald-400/20 text-emerald-300/60 bg-emerald-500/[0.06]',
  spatial: 'border-rose-400/20 text-rose-300/60 bg-rose-500/[0.06]',
  cooperative: 'border-orange-400/20 text-orange-300/60 bg-orange-500/[0.06]',
};
const DIFF_LABELS: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' };
const DIFF_COLORS: Record<string, string> = {
  easy: 'text-emerald-300/60', medium: 'text-amber-300/65', hard: 'text-rose-300/70',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DraftPuzzleSection({ doc }: DraftPuzzleSectionProps) {
  const { adoptedPuzzlesByStage, totalAdoptedCount } = doc;

  return (
    <section className="mb-10">
      <SectionMeta index="05" label="Adopted Puzzles" />

      {/* Summary row */}
      <div className="mt-4 mb-5 flex items-center gap-3 px-1">
        <p className="text-footnote text-white/35">
          채택된 퍼즐{' '}
          <span className="text-white/55 font-semibold">{totalAdoptedCount}개</span>
        </p>
        {totalAdoptedCount === 0 && (
          <span className="text-caption text-white/30 italic">
            — 아직 채택된 퍼즐이 없습니다
          </span>
        )}
      </div>

      {totalAdoptedCount === 0 ? (
        <EmptyPuzzleGuidance />
      ) : (
        <div className="flex flex-col gap-6">
          {adoptedPuzzlesByStage.map((group) => (
            <StageGroup key={group.stageKey} group={group} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Empty guidance ────────────────────────────────────────────────────────────

function EmptyPuzzleGuidance() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] px-8 py-10 text-center">
      <div className="w-8 h-8 rounded-xl border border-white/[0.10] flex items-center justify-center text-title3 mx-auto mb-3">
        🧩
      </div>
      <p className="text-subhead text-white/40 font-medium mb-1">채택된 퍼즐이 없습니다.</p>
      <p className="text-footnote text-white/35 leading-relaxed">
        Puzzle Recommendations 페이지로 돌아가<br />퍼즐을 채택하면 이 문서에 포함됩니다.
      </p>
    </div>
  );
}

// ── Stage group ───────────────────────────────────────────────────────────────

function StageGroup({ group }: { group: DraftAdoptedPuzzlesByStage }) {
  const tok = STAGE_ACCENTS[group.stageKey] ?? STAGE_ACCENTS.intro;

  return (
    <div>
      {/* Stage sub-header */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tok.dot}`} />
        <span className={`px-2.5 py-1 rounded-lg border text-footnote font-bold leading-none ${tok.badge}`}>
          {group.stageLabel}
        </span>
        <span className={`text-body font-semibold ${tok.accent}`}>{group.stageTitle}</span>
        <span className="text-caption text-white/30">{group.puzzles.length}개</span>
      </div>

      {/* Puzzle entries */}
      <div className="flex flex-col gap-3 pl-4 border-l border-white/[0.06]">
        {group.puzzles.map((puzzle, i) => (
          <PuzzleEntry key={puzzle.id} puzzle={puzzle} index={i} stageAccent={tok.accent} />
        ))}
      </div>
    </div>
  );
}

// ── Puzzle entry (document-style card) ────────────────────────────────────────

function PuzzleEntry({
  puzzle,
  index,
  stageAccent,
}: {
  puzzle: DraftAdoptedPuzzle;
  index: number;
  stageAccent: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-3.5 pb-2.5 border-b border-white/[0.05] flex items-center gap-3 flex-wrap">
        <span className="text-caption text-white/30 tabular-nums w-4 flex-shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Type badge */}
        <span className={`px-2 py-0.5 rounded-md border text-caption font-medium ${TYPE_COLORS[puzzle.type] ?? 'border-white/[0.10] text-white/40'}`}>
          {TYPE_LABELS[puzzle.type] ?? puzzle.type}
        </span>

        {/* Title */}
        <span className="text-subhead font-semibold text-white/85 flex-1 min-w-0">{puzzle.title}</span>

        {/* Difficulty + time */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className={`text-caption font-semibold ${DIFF_COLORS[puzzle.difficulty] ?? 'text-white/40'}`}>
            {DIFF_LABELS[puzzle.difficulty] ?? puzzle.difficulty}
          </span>
          <span className="text-caption text-white/30 flex items-center gap-0.5">
            <span>⏱</span>{puzzle.estimatedMinutes}분
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {/* Description */}
        <p className="text-footnote text-white/50 leading-relaxed">{puzzle.description}</p>

        {/* Why recommended */}
        <div className="flex items-start gap-2">
          <span className="text-caption flex-shrink-0 mt-[1px]">💡</span>
          <p className="text-caption text-white/35 italic leading-relaxed">{puzzle.recommendedBecause}</p>
        </div>

        {/* Keywords row */}
        <div className="flex gap-6 flex-wrap pt-1 border-t border-white/[0.04]">
          {puzzle.clueUsage.length > 0 && (
            <KeywordRow label="단서" keywords={puzzle.clueUsage} chipCls="border-amber-400/15 text-amber-300/50 bg-amber-500/[0.04]" />
          )}
          {puzzle.deviceUsage.length > 0 && (
            <KeywordRow label="연출" keywords={puzzle.deviceUsage} chipCls="border-sky-400/15 text-sky-300/50 bg-sky-500/[0.04]" />
          )}
          {puzzle.expectedOutput && (
            <div className="flex items-center gap-2">
              <span className="text-micro font-bold uppercase tracking-wider text-white/20">획득</span>
              <span className="text-caption text-white/50 font-medium">{puzzle.expectedOutput}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function KeywordRow({ label, keywords, chipCls }: { label: string; keywords: string[]; chipCls: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-micro font-bold uppercase tracking-wider text-white/20 flex-shrink-0">{label}</span>
      {keywords.map((kw) => (
        <span key={kw} className={`px-1.5 py-0.5 rounded border text-micro ${chipCls}`}>{kw}</span>
      ))}
    </div>
  );
}
