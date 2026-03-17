import type { ProjectBrief } from '../../types';
import StoryStructurePreview from './StoryStructurePreview';

interface ProjectBriefSectionProps {
  brief: ProjectBrief;
}

const GENRE_LABELS: Record<string, string> = {
  horror: '공포', mystery: '미스터리', adventure: '어드벤처', thriller: '스릴러',
  fantasy: '판타지', 'sci-fi': 'SF', romance: '로맨스', comedy: '코미디',
};

const INVEST_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  motives:    { label: '동기', icon: '💭', color: 'text-rose-300/70 border-rose-400/25 bg-rose-500/[0.06]' },
  methods:    { label: '방법', icon: '🔧', color: 'text-amber-300/70 border-amber-400/25 bg-amber-500/[0.06]' },
  clues:      { label: '단서', icon: '🔍', color: 'text-amber-300/70 border-amber-400/25 bg-amber-500/[0.06]' },
  techniques: { label: '기법', icon: '⚡', color: 'text-sky-300/70 border-sky-400/25 bg-sky-500/[0.06]' },
};

export default function ProjectBriefSection({ brief }: ProjectBriefSectionProps) {
  const isYoutube = brief.source === 'youtube';
  const isScenario = brief.source === 'scenario';

  const badgeStyle = isYoutube
    ? 'bg-red-500/[0.12] border-red-500/20 text-red-400/70'
    : isScenario
      ? 'bg-amber-500/[0.12] border-amber-500/20 text-amber-400/70'
      : 'bg-sky-500/[0.12] border-sky-500/20 text-sky-400/70';

  const badgeLabel = isYoutube ? 'YouTube 기반' : isScenario ? '사건 구성' : '직접 입력';

  return (
    <div className="flex-shrink-0 mx-4 sm:mx-6 mt-4 mb-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)]">

      {/* ── Header: Source badge + Meta ── */}
      <div className="px-5 sm:px-6 py-4 border-b border-white/[0.05] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full border text-micro font-semibold tracking-wide ${badgeStyle}`}>
            {badgeLabel}
          </span>
          {brief.playTimes.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-white/[0.10] bg-white/[0.03]">
              <span className="text-micro text-white/30">⏱</span>
              <span className="text-footnote font-medium text-white/40">
                {brief.playTimes.map((t) => `${t}분`).join(' / ')}
              </span>
            </div>
          )}
        </div>
        {brief.genres.length > 0 && (
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-micro text-white/20">장르:</span>
            <div className="flex gap-1.5 flex-wrap">
              {brief.genres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-md border border-white/[0.12] bg-white/[0.04] text-footnote font-medium text-white/50"
                >
                  {GENRE_LABELS[g] ?? g}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── YouTube Info (thumbnail + details) ── */}
      {isYoutube && brief.videoId && (
        <div className="px-5 sm:px-6 py-4 border-b border-white/[0.05]">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-full sm:w-40 h-24 rounded-lg overflow-hidden border border-white/[0.10] bg-black shadow-lg">
              <img
                src={`https://img.youtube.com/vi/${brief.videoId}/hqdefault.jpg`}
                alt="YouTube Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Video details */}
            <div className="flex-1 min-w-0">
              <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-2">원본 영상</p>
              <p className="text-subhead font-semibold text-white/80 mb-1 line-clamp-2">
                {brief.videoTitle || 'YouTube 영상'}
              </p>
              {brief.videoChannel && (
                <p className="text-footnote text-white/40 mb-3">{brief.videoChannel}</p>
              )}
              <a
                href={`https://www.youtube.com/watch?v=${brief.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.15] bg-red-500/[0.08] text-footnote font-semibold text-red-300/70 hover:bg-red-500/[0.12] transition-colors"
              >
                YouTube에서 보기 →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Synopsis / Story Core ── */}
      {brief.synopsis && (
        <div className="px-5 sm:px-6 py-4 border-b border-white/[0.05]">
          <p className="text-micro font-semibold text-white/20 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span>📖</span>
            {isYoutube ? '영상 내용 요약' : isScenario ? '사건 시나리오' : '스토리 핵심 흐름'}
          </p>
          <p className="text-footnote text-white/55 leading-relaxed whitespace-pre-wrap">
            {brief.synopsis}
          </p>
        </div>
      )}

      {/* ── Story Structure: 기승전반결 ── */}
      {brief.beats.length > 0 && (
        <div className="px-5 sm:px-6 py-4 border-b border-white/[0.05]">
          <p className="text-micro font-semibold text-white/20 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <span>📊</span>
            스토리 구조 (기승전반결)
          </p>
          <StoryStructurePreview beats={brief.beats} />
        </div>
      )}

      {/* ── Investigation Keywords (Manual + Scenario) ── */}
      {!isYoutube && <InvestigationSection investigation={brief.investigation} />}

      {/* ── Puzzle & Clue Formats (if available) ── */}
      {(brief.puzzleTypes || brief.clueFormats) && (
        <div className="px-5 sm:px-6 py-4 border-t border-white/[0.05]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {brief.puzzleTypes && brief.puzzleTypes.length > 0 && (
              <div>
                <p className="text-micro font-semibold text-white/20 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span>🧩</span>
                  문제 유형
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {brief.puzzleTypes.map((type) => (
                    <span
                      key={type}
                      className="px-2.5 py-1 rounded-md border border-purple-400/25 bg-purple-500/[0.06] text-footnote font-medium text-purple-300/70"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {brief.clueFormats && brief.clueFormats.length > 0 && (
              <div>
                <p className="text-micro font-semibold text-white/20 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span>📋</span>
                  단서 형식
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {brief.clueFormats.map((format) => (
                    <span
                      key={format}
                      className="px-2.5 py-1 rounded-md border border-teal-400/25 bg-teal-500/[0.06] text-footnote font-medium text-teal-300/70"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Investigation Keywords Section ──

function InvestigationSection({ investigation }: { investigation: ProjectBrief['investigation'] }) {
  const entries = Object.entries(INVEST_LABEL)
    .map(([key, meta]) => ({
      ...meta,
      items: investigation[key as keyof typeof investigation] as string[],
    }))
    .filter((e) => e.items.length > 0);

  if (entries.length === 0) return null;

  return (
    <div className="px-5 sm:px-6 py-4 border-t border-white/[0.05]">
      <p className="text-micro font-semibold text-white/20 uppercase tracking-widest mb-4 flex items-center gap-1.5">
        <span>🔎</span>
        수사 키워드 분석
      </p>

      {/* Grid layout for better PC view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {entries.map((e) => (
          <div
            key={e.label}
            className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3"
          >
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-lg">{e.icon}</span>
              <p className="text-footnote font-bold text-white/40">{e.label}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {e.items.map((item) => (
                <span
                  key={`${e.label}-${item}`}
                  className={`px-2.5 py-1.5 rounded-md border text-footnote font-medium leading-relaxed break-words ${e.color}`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
