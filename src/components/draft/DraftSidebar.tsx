import { useState } from 'react';
import type { DraftDocument, DraftStatus } from '../../types/draft';
import { getSuggestedNextSteps, mockExportPDF, mockExportNotion } from '../../utils/draft';
import { useProject } from '../../context/ProjectContext';

interface DraftSidebarProps {
  doc: DraftDocument;
  status: DraftStatus;
}

export default function DraftSidebar({ doc, status }: DraftSidebarProps) {
  const nextSteps = getSuggestedNextSteps(status);
  const { saveCurrentProject } = useProject();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = () => {
    setSaveState('saving');
    try {
      saveCurrentProject('plan');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('idle');
    }
  };

  const saveLabel =
    saveState === 'saving' ? '저장 중…' :
    saveState === 'saved'  ? '저장 완료' :
    '기획안 저장';

  return (
    <div className="flex flex-col h-full border-l border-white/[0.06]">
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-0 divide-y divide-white/[0.05]">

        {/* ── 1. Completeness ── */}
        <SidebarSection>
          <SectionLabel>기획안 완성도</SectionLabel>
          <div className="mt-3 flex items-center gap-3">
            <ScoreRing value={status.completenessScore} />
            <div>
              <p className="text-title2 font-bold text-white/85">{status.completenessScore}<span className="text-subhead text-white/30 font-normal ml-0.5">/ 100</span></p>
              <p className="text-caption text-white/30">
                {status.completenessScore >= 80 ? '기획안 완성도 높음' : status.completenessScore >= 50 ? '보완이 필요합니다' : '초기 단계'}
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="mt-3 flex flex-col gap-1.5">
            <CheckItem done={status.hasStory} label="Story 선택됨" />
            <CheckItem done={status.hasFlow} label="Flow 구조 완성" />
            <CheckItem done={status.adoptedCount > 0} label={`퍼즐 채택됨 (${status.adoptedCount}개)`} />
            <CheckItem done={status.conceptKeywordCount > 0} label={`컨셉 키워드 (${status.conceptKeywordCount}개)`} />
            <CheckItem done={status.clueCount > 0} label={`단서 키워드 (${status.clueCount}개)`} />
            <CheckItem done={status.deviceCount > 0} label={`연출 키워드 (${status.deviceCount}개)`} />
          </div>
        </SidebarSection>

        {/* ── 2. Quick stats ── */}
        <SidebarSection>
          <SectionLabel>요약 통계</SectionLabel>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatPill label="플레이타임" value={`${doc.totalPlayTime}분`} />
            <StatPill label="채택 퍼즐" value={`${doc.totalAdoptedCount}개`} accent={doc.totalAdoptedCount > 0 ? 'emerald' : undefined} />
            <StatPill label="컨셉 키워드" value={`${doc.conceptKeywords.length}개`} />
            <StatPill label="단서" value={`${doc.clueKeywords.length}개`} accent={doc.clueKeywords.length > 0 ? 'amber' : undefined} />
            <StatPill label="연출" value={`${doc.effectsKeywords.length}개`} accent={doc.effectsKeywords.length > 0 ? 'sky' : undefined} />
            <StatPill label="Flow 단계" value={`${doc.beats.length}단계`} />
          </div>
        </SidebarSection>

        {/* ── 3. Suggested next steps ── */}
        {nextSteps.length > 0 && (
          <SidebarSection>
            <SectionLabel>다음 작업 추천</SectionLabel>
            <ul className="mt-3 flex flex-col gap-2">
              {nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-[3px] text-white/30 text-caption">→</span>
                  <p className="text-caption text-white/45 leading-relaxed">{step}</p>
                </li>
              ))}
            </ul>
          </SidebarSection>
        )}

        {/* ── 4. Stage breakdown ── */}
        {doc.adoptedPuzzlesByStage.length > 0 && (
          <SidebarSection>
            <SectionLabel>스테이지별 퍼즐</SectionLabel>
            <div className="mt-3 flex flex-col gap-1.5">
              {doc.adoptedPuzzlesByStage.map((s) => (
                <div key={s.stageKey} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StageDot stageKey={s.stageKey} />
                    <span className="text-caption text-white/50">{s.stageLabel} — {s.stageTitle}</span>
                  </div>
                  <span className="text-caption text-white/30 tabular-nums">{s.puzzles.length}개</span>
                </div>
              ))}
            </div>
          </SidebarSection>
        )}
      </div>

      {/* ── Export actions (pinned bottom) ── */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-white/[0.06] flex flex-col gap-2">
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className={`w-full py-2 rounded-lg text-subhead font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            saveState === 'saved'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-indigo-500 text-white hover:bg-indigo-400'
          }`}
        >
          {saveLabel}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => mockExportPDF(doc)}
            className="flex-1 py-2 rounded-xl border border-white/[0.10] text-footnote text-white/40 hover:border-white/20 hover:text-white/60 transition-all"
          >
            Export PDF
          </button>
          <button
            onClick={() => mockExportNotion(doc)}
            className="flex-1 py-2 rounded-xl border border-white/[0.10] text-footnote text-white/40 hover:border-white/20 hover:text-white/60 transition-all"
          >
            Export Notion
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SidebarSection({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-5">{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-micro font-bold uppercase tracking-widest text-white/25">{children}</p>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center text-micro ${done ? 'bg-emerald-400/20 text-emerald-300/80' : 'border border-white/[0.10] text-white/20'}`}>
        {done ? '✓' : ''}
      </span>
      <span className={`text-caption ${done ? 'text-white/55' : 'text-white/25'}`}>{label}</span>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'emerald' | 'amber' | 'sky';
}) {
  const valCls = accent === 'emerald' ? 'text-emerald-300/70'
    : accent === 'amber' ? 'text-amber-300/65'
    : accent === 'sky' ? 'text-sky-300/65'
    : 'text-white/60';
  return (
    <div className="flex flex-col px-3 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.015]">
      <span className="text-micro text-white/30 font-bold uppercase tracking-wider mb-0.5">{label}</span>
      <span className={`text-subhead font-bold tabular-nums ${valCls}`}>{value}</span>
    </div>
  );
}

const STAGE_DOTS: Record<string, string> = {
  intro: 'bg-sky-400/70', development: 'bg-emerald-400/70',
  expansion: 'bg-amber-400/70', twist: 'bg-rose-400/70', ending: 'bg-purple-400/70',
};

function StageDot({ stageKey }: { stageKey: string }) {
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STAGE_DOTS[stageKey] ?? 'bg-white/30'}`} />;
}

function ScoreRing({ value }: { value: number }) {
  const color = value >= 80 ? '#34d399' : value >= 50 ? '#fbbf24' : '#f87171';
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <svg width="44" height="44" className="flex-shrink-0 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle
        cx="22" cy="22" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        opacity={0.7}
      />
    </svg>
  );
}
