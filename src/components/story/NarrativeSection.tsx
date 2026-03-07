// ── NarrativeSection ─────────────────────────────────────────────────────────
// YouTube 서사 구조 분석 결과를 표시하는 컴포넌트
// StoryDetailModal 내부에서 사용됩니다.

import type { NarrativeAnalysis } from '../../types/narrative';
import {
  PHASE_LABEL,
  PHASE_STYLES,
  SUMMARY_MODE_BADGE,
  TAG_STYLES,
} from '../../types/narrative';

interface NarrativeSectionProps {
  narrative: NarrativeAnalysis;
}

export default function NarrativeSection({ narrative }: NarrativeSectionProps) {
  const {
    summaryShort,
    storyLogline,
    characters,
    timeline,
    escapeRoomUsefulPoints: ep,
    quality,
  } = narrative;

  const modeBadge = SUMMARY_MODE_BADGE[quality.summaryMode];

  return (
    <div className="flex flex-col gap-5">

      {/* ── 분석 품질 + 요약 ── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <NarrLabel>원본 서사 분석</NarrLabel>
          <span className={`px-2 py-0.5 rounded-md border text-[9px] ${modeBadge.style}`}>
            {modeBadge.label}
          </span>
          {quality.warning && (
            <span className="text-[9px] text-white/25 italic">{quality.warning}</span>
          )}
        </div>
        {summaryShort && (
          <p className="text-[12px] text-white/55 leading-relaxed mb-1.5">{summaryShort}</p>
        )}
        {storyLogline && (
          <p className="text-[11px] text-white/30 italic">→ {storyLogline}</p>
        )}
      </div>

      {/* ── 등장인물 ── */}
      {characters.length > 0 && (
        <div>
          <NarrLabel>등장인물</NarrLabel>
          <div className="flex flex-col gap-2 mt-2">
            {characters.map((char, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-medium text-white/70">{char.name}</span>
                    <span className="text-[9px] text-white/30 border border-white/[0.08] rounded px-1 py-0.5">
                      {char.role}
                    </span>
                  </div>
                  {char.desire && (
                    <p className="text-[10px] text-white/40 leading-relaxed">욕망: {char.desire}</p>
                  )}
                  {char.conflict && (
                    <p className="text-[10px] text-white/30 leading-relaxed">갈등: {char.conflict}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 서사 타임라인 ── */}
      {timeline.length > 0 && (
        <div>
          <NarrLabel>서사 타임라인</NarrLabel>
          <div className="flex flex-col gap-2 mt-2">
            {timeline.map((entry, i) => {
              const ps = PHASE_STYLES[entry.phase];
              const pl = PHASE_LABEL[entry.phase];
              return (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2.5 ${ps.border}`}
                >
                  {/* Phase label + time */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-medium ${ps.badge}`}>
                      {pl}
                    </span>
                    {entry.timeRange && entry.timeRange !== '알 수 없음' && (
                      <span className="text-[9px] text-white/25 font-mono">{entry.timeRange}</span>
                    )}
                  </div>

                  {/* Event */}
                  <p className="text-[12px] text-white/65 leading-relaxed mb-1">{entry.event}</p>

                  {/* Detail */}
                  {entry.detail && (
                    <p className="text-[10px] text-white/35 leading-relaxed mb-1.5">{entry.detail}</p>
                  )}

                  {/* Metadata row */}
                  {(entry.emotion || entry.clueOrObject || entry.spaceChange) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 pt-1.5 border-t border-white/[0.05]">
                      {entry.emotion && (
                        <span className="text-[9px] text-white/30">
                          <span className="opacity-60">감정</span> {entry.emotion}
                        </span>
                      )}
                      {entry.clueOrObject && (
                        <span className="text-[9px] text-amber-300/50">
                          🔍 {entry.clueOrObject}
                        </span>
                      )}
                      {entry.spaceChange && (
                        <span className="text-[9px] text-sky-300/50">
                          📍 {entry.spaceChange}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 방탈출 기획 포인트 ── */}
      {(ep.coreConflict || ep.tags.length > 0 || ep.investigationPoints.length > 0) && (
        <div>
          <NarrLabel>방탈출 기획 포인트</NarrLabel>

          {/* Tags */}
          {ep.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
              {ep.tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2 py-0.5 rounded-md border text-[9px] ${TAG_STYLES[tag] ?? 'text-white/40 border-white/15 bg-white/[0.03]'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Core conflict */}
          {ep.coreConflict && (
            <div className="flex items-start gap-2 mb-1.5">
              <span className="text-[10px] text-white/25 shrink-0 mt-0.5">⚡</span>
              <p className="text-[11px] text-white/55 leading-relaxed">{ep.coreConflict}</p>
            </div>
          )}

          {/* Hidden secret */}
          {ep.hiddenSecret && (
            <div className="flex items-start gap-2 mb-3">
              <span className="text-[10px] text-white/25 shrink-0 mt-0.5">🔐</span>
              <p className="text-[11px] text-white/40 italic leading-relaxed">{ep.hiddenSecret}</p>
            </div>
          )}

          {/* Investigation points */}
          {ep.investigationPoints.length > 0 && (
            <IdeaGroup label="수사 포인트" items={ep.investigationPoints} dotColor="bg-white/20" />
          )}

          {/* Spatial / Props / Twist */}
          {ep.spatialIdeas.length > 0 && (
            <IdeaGroup label="공간 아이디어" items={ep.spatialIdeas} dotColor="bg-sky-400/40" />
          )}
          {ep.propsIdeas.length > 0 && (
            <IdeaGroup label="소품 아이디어" items={ep.propsIdeas} dotColor="bg-amber-400/40" />
          )}
          {ep.twistIdeas.length > 0 && (
            <IdeaGroup label="반전 아이디어" items={ep.twistIdeas} dotColor="bg-rose-400/40" />
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NarrLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest">
      {children}
    </p>
  );
}

function IdeaGroup({
  label,
  items,
  dotColor,
}: {
  label: string;
  items: string[];
  dotColor: string;
}) {
  return (
    <div className="mb-2.5">
      <p className="text-[9px] text-white/20 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex flex-col gap-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
            <p className="text-[10px] text-white/45 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
