import { useNavigate } from 'react-router-dom';
import type { PuzzleFlowPlan, PuzzleFlowStageKey } from '../../types/puzzleFlow';
import type { MandalartCellData } from '../../types/mandalart';
import { TENSION_CURVE } from '../../data/mockPuzzleFlow';

interface PuzzleFlowSidebarProps {
  plan: PuzzleFlowPlan;
  cells: MandalartCellData[];
}

// ── Tension bar colors ────────────────────────────────────────────────────────

const TENSION_COLORS: Record<PuzzleFlowStageKey, string> = {
  intro:       'bg-sky-400/50',
  development: 'bg-emerald-400/50',
  expansion:   'bg-amber-400/55',
  twist:       'bg-rose-400/60',
  ending:      'bg-purple-400/50',
};

const TENSION_LABELS: Record<PuzzleFlowStageKey, string> = {
  intro:       '기',
  development: '승',
  expansion:   '전',
  twist:       '반전',
  ending:      '결',
};

const STAGE_ORDER: PuzzleFlowStageKey[] = [
  'intro', 'development', 'expansion', 'twist', 'ending',
];

function tensionLabel(value: number): string {
  if (value >= 85) return '매우 높음';
  if (value >= 65) return '높음';
  if (value >= 45) return '중간';
  if (value >= 25) return '낮음';
  return '매우 낮음';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PuzzleFlowSidebar({ plan, cells }: PuzzleFlowSidebarProps) {
  const navigate = useNavigate();

  // Concept keywords (rose-themed mandalart cells)
  const conceptKeywords = cells
    .filter((c) => !c.isCenter && c.theme === 'rose' && c.text.trim())
    .map((c) => c.text.trim());

  // Effects keywords (sky-themed)
  const effectsKeywords = cells
    .filter((c) => !c.isCenter && c.theme === 'sky' && c.text.trim())
    .map((c) => c.text.trim());

  // Clue keywords (amber-themed)
  const clueKeywords = cells
    .filter((c) => !c.isCenter && c.theme === 'amber' && c.text.trim())
    .map((c) => c.text.trim());

  const allDetected = [...conceptKeywords, ...effectsKeywords, ...clueKeywords];

  return (
    <div className="flex flex-col rounded-xl border border-white/[0.07] bg-white/[0.015]">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <h2 className="text-subhead font-semibold text-white/75 mb-1">AI Flow Notes</h2>
        <p className="text-footnote text-white/28 leading-relaxed">
          These recommendations are derived from the selected story structure and concept keywords.
        </p>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-col gap-5 px-4 py-4">

        {/* ── Section 1: Detected keywords ── */}
        <div>
          <SectionLabel>Detected Keywords</SectionLabel>
          {allDetected.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {conceptKeywords.map((kw) => (
                <Chip key={kw} color="rose">{kw}</Chip>
              ))}
              {effectsKeywords.map((kw) => (
                <Chip key={kw} color="sky">{kw}</Chip>
              ))}
              {clueKeywords.map((kw) => (
                <Chip key={kw} color="amber">{kw}</Chip>
              ))}
            </div>
          ) : (
            <p className="text-footnote text-white/30 italic mt-2 leading-relaxed">
              No tagged keywords found. Go back to Mandalart to tag cells with theme colors.
            </p>
          )}
        </div>

        {/* ── Section 2: Tension curve ── */}
        <div>
          <SectionLabel>Suggested Tension Curve</SectionLabel>
          <div className="flex flex-col gap-2 mt-2">
            {STAGE_ORDER.map((key) => {
              const value = TENSION_CURVE[key];
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-caption font-bold text-white/30 w-6 flex-shrink-0 text-right">
                    {TENSION_LABELS[key]}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${TENSION_COLORS[key]} transition-all duration-500`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-micro text-white/35 w-14 flex-shrink-0">
                    {tensionLabel(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 3: Puzzle count ── */}
        <div>
          <SectionLabel>Estimated Puzzle Count</SectionLabel>
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-title1 font-bold text-white/80">
                {plan.totalSuggestedPuzzleCount}
              </span>
              <span className="text-footnote text-white/30">개 권장</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {plan.stages.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-0.5">
                  <span className="text-micro text-white/35">{s.label}</span>
                  <span className="text-footnote font-semibold text-white/55">
                    {s.suggestedPuzzleSlots}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-caption text-white/30 leading-relaxed">
              플레이타임 {plan.totalPlayTime}분 기준 추천값입니다.
            </p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-4 pt-3 pb-4 border-t border-white/[0.06] flex-shrink-0">
        <button
          onClick={() => {
            // TODO: navigate to /puzzle-recommendations when ready
            console.log('[PuzzleFlow] Generate Puzzle Recommendations →');
          }}
          className="w-full py-2.5 rounded-xl bg-white/90 text-black text-subhead font-semibold hover:bg-white active:bg-white/80 transition-colors"
        >
          Generate Puzzle Recommendations
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

type ChipColor = 'rose' | 'sky' | 'amber';
const CHIP_STYLES: Record<ChipColor, string> = {
  rose:  'border-rose-400/20 text-rose-300/60 bg-rose-500/[0.06]',
  sky:   'border-sky-400/20 text-sky-300/60 bg-sky-500/[0.06]',
  amber: 'border-amber-400/20 text-amber-300/60 bg-amber-500/[0.06]',
};

function Chip({ children, color }: { children: React.ReactNode; color: ChipColor }) {
  return (
    <span className={`px-2 py-0.5 rounded-md border text-caption leading-snug ${CHIP_STYLES[color]}`}>
      {children}
    </span>
  );
}
