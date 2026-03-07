import type { PuzzleFlowPlan, PuzzleFlowStage } from '../../types/puzzleFlow';
import PuzzleFlowStageCard from './PuzzleFlowStageCard';

interface PuzzleFlowTimelineProps {
  plan: PuzzleFlowPlan;
  onUpdateStage?: (stageId: string, updates: Partial<PuzzleFlowStage>) => void;
}

export default function PuzzleFlowTimeline({ plan, onUpdateStage }: PuzzleFlowTimelineProps) {
  const { stages, totalPlayTime, totalSuggestedPuzzleCount } = plan;

  return (
    <div className="flex flex-col min-h-0">
      {/* Timeline summary row */}
      <div className="flex items-center gap-4 mb-5 px-1 flex-wrap">
        <p className="text-footnote text-white/35">
          총 <span className="text-white/50 font-semibold">{stages.length}단계</span>
        </p>
        <span className="w-px h-3 bg-white/[0.08]" />
        <p className="text-footnote text-white/35">
          예상 시간{' '}
          <span className="text-white/50 font-semibold">{totalPlayTime}분</span>
        </p>
        <span className="w-px h-3 bg-white/[0.08]" />
        <p className="text-footnote text-white/35">
          총 추천 퍼즐{' '}
          <span className="text-white/50 font-semibold">{totalSuggestedPuzzleCount}개</span>
        </p>
      </div>

      {/* Stage cards */}
      <div className="flex flex-col">
        {stages.map((stage, i) => (
          <PuzzleFlowStageCard
            key={stage.id}
            stage={stage}
            index={i}
            isLast={i === stages.length - 1}
            onUpdate={onUpdateStage}
          />
        ))}
      </div>
    </div>
  );
}
