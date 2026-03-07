import type { StoryProposal } from '../../types/story';
import StoryProposalCard from './StoryProposalCard';

interface StoryProposalGridProps {
  proposals: StoryProposal[];
  selectedId: string | null;
  regeneratingId: string | null;
  isAddingBatch: boolean;
  onSelect: (id: string) => void;
  onRegenerate: (id: string) => void;
  onViewDetail: (id: string) => void;
}

export default function StoryProposalGrid({
  proposals,
  selectedId,
  regeneratingId,
  isAddingBatch,
  onSelect,
  onRegenerate,
  onViewDetail,
}: StoryProposalGridProps) {
  return (
    <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start min-w-0 pb-4">
      {proposals.map((proposal) => (
        <StoryProposalCard
          key={proposal.id}
          proposal={proposal}
          isSelected={selectedId === proposal.id}
          isRegenerating={isAddingBatch || regeneratingId === proposal.id}
          onSelect={() =>
            onSelect(selectedId === proposal.id ? '' : proposal.id)
          }
          onRegenerate={() => onRegenerate(proposal.id)}
          onViewDetail={() => onViewDetail(proposal.id)}
        />
      ))}
    </div>
  );
}
