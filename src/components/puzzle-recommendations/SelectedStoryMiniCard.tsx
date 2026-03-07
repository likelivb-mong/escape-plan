import type { StoryProposal } from '../../types/story';
import type { PuzzleFlowPlan } from '../../types/puzzleFlow';

interface SelectedStoryMiniCardProps {
  story: StoryProposal;
  plan: PuzzleFlowPlan;
}

export default function SelectedStoryMiniCard({ story, plan }: SelectedStoryMiniCardProps) {
  return (
    <div className="flex-shrink-0 px-6 py-2.5 border-b border-white/[0.06] bg-white/[0.012]">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Story identity */}
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-md border border-white/[0.10] text-micro text-white/40 bg-white/[0.03]">
            {story.genre}
          </span>
          <span className="text-subhead font-semibold text-white/80">{story.title}</span>
          <span className="text-footnote text-white/30 italic">"{story.logline}"</span>
        </div>

        {/* Divider */}
        <span className="w-px h-3 bg-white/[0.10] flex-shrink-0" />

        {/* Flow plan stats */}
        <div className="flex items-center gap-4">
          <MiniStat label="총 단계" value={`${plan.stages.length}단계`} />
          <MiniStat label="예상 시간" value={`${plan.totalPlayTime}분`} />
          <MiniStat label="추천 퍼즐" value={`${plan.totalSuggestedPuzzleCount}개`} />
        </div>

        {/* Context label */}
        <div className="ml-auto flex-shrink-0 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
          <span className="text-caption text-white/35">현재 기준 플로우</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-micro text-white/35 uppercase tracking-widest font-semibold">{label}</span>
      <span className="text-footnote text-white/55 font-semibold">{value}</span>
    </div>
  );
}
