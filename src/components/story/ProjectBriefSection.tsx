import type { ProjectBrief } from '../../types';
import StoryStructurePreview from './StoryStructurePreview';

interface ProjectBriefSectionProps {
  brief: ProjectBrief;
}

const GENRE_LABELS: Record<string, string> = {
  horror: '공포', mystery: '미스터리', adventure: '어드벤처', thriller: '스릴러',
  fantasy: '판타지', 'sci-fi': 'SF', romance: '로맨스', comedy: '코미디',
};

const INVEST_LABEL: Record<string, { label: string; color: string }> = {
  motives:    { label: '동기', color: 'text-rose-300/70 border-rose-400/25 bg-rose-500/[0.06]' },
  methods:    { label: '방법', color: 'text-amber-300/70 border-amber-400/25 bg-amber-500/[0.06]' },
  clues:      { label: '단서', color: 'text-amber-300/70 border-amber-400/25 bg-amber-500/[0.06]' },
  techniques: { label: '기법', color: 'text-sky-300/70 border-sky-400/25 bg-sky-500/[0.06]' },
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
    <div className="flex-shrink-0 mx-6 mt-3 mb-1 rounded-xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
      {/* Top row: source badge + meta */}
      <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-b border-white/[0.05]">
        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-medium ${badgeStyle}`}>
          {badgeLabel}
        </span>
        {brief.playTimes.length > 0 && (
          <span className="text-[10px] text-white/30">
            {brief.playTimes.map((t) => `${t}m`).join(' / ')}
          </span>
        )}
        {brief.genres.length > 0 && (
          <span className="text-[10px] text-white/35">
            {brief.genres.map((g) => GENRE_LABELS[g] ?? g).join(' · ')}
          </span>
        )}
      </div>

      {/* YouTube info */}
      {isYoutube && brief.videoId && (
        <div className="px-4 py-3 flex items-center gap-3 border-b border-white/[0.05]">
          <div className="flex-shrink-0 w-14 h-8 rounded-md overflow-hidden bg-white/[0.06]">
            <img
              src={`https://img.youtube.com/vi/${brief.videoId}/mqdefault.jpg`}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-white/60 truncate leading-snug">
              {brief.videoTitle || 'YouTube 영상'}
            </p>
            {brief.videoChannel && (
              <p className="text-[10px] text-white/30 truncate mt-0.5">{brief.videoChannel}</p>
            )}
          </div>
        </div>
      )}

      {/* Synopsis */}
      {brief.synopsis && (
        <div className="px-4 py-3 border-b border-white/[0.05]">
          <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-2">
            {isYoutube ? '영상 내용 요약' : isScenario ? '사건 시나리오' : '스토리 핵심 흐름'}
          </p>
          <p className="text-[11px] text-white/50 leading-relaxed">{brief.synopsis}</p>
        </div>
      )}

      {/* Beats */}
      {brief.beats.length > 0 && (
        <div className="px-4 py-3 border-b border-white/[0.05]">
          <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-3">
            스토리 구조
          </p>
          <StoryStructurePreview beats={brief.beats} />
        </div>
      )}

      {/* Investigation keywords (manual + scenario) */}
      {!isYoutube && <InvestigationChips investigation={brief.investigation} />}
    </div>
  );
}

function InvestigationChips({ investigation }: { investigation: ProjectBrief['investigation'] }) {
  const entries = Object.entries(INVEST_LABEL)
    .map(([key, meta]) => ({
      ...meta,
      items: investigation[key as keyof typeof investigation] as string[],
    }))
    .filter((e) => e.items.length > 0);

  if (entries.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-2">
        수사 키워드
      </p>
      <div className="flex flex-wrap gap-1.5">
        {entries.map((e) =>
          e.items.map((item) => (
            <span
              key={`${e.label}-${item}`}
              className={`px-2 py-0.5 rounded-md border text-[9px] ${e.color}`}
            >
              {e.label}: {item}
            </span>
          )),
        )}
      </div>
    </div>
  );
}
