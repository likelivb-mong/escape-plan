import { useNavigate } from 'react-router-dom';

interface PuzzleFlowHeaderProps {
  projectName: string;
  /** Whether the flow plan has been generated (enables Continue button) */
  canContinue: boolean;
  /** Called when user clicks "Continue to Puzzle Recommendations" */
  onContinue?: () => void;
}

export default function PuzzleFlowHeader({ projectName, canContinue, onContinue }: PuzzleFlowHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
      {/* ── Left: breadcrumb + title ── */}
      <div className="flex flex-col gap-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/story')}
            className="text-white/30 hover:text-white/60 transition-colors text-subhead"
          >
            ← Story Proposals
          </button>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-footnote text-white/30">{projectName}</span>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-footnote text-white/45 font-medium">Puzzle Flow</span>
        </div>

        {/* Title block */}
        <div className="mt-0.5">
          <h1 className="text-title3 font-semibold text-white/90 leading-tight">Puzzle Flow</h1>
          <p className="text-footnote text-white/30 mt-0.5 leading-relaxed max-w-sm">
            Shape the full player journey before generating individual puzzle recommendations.
          </p>
        </div>
      </div>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-3 flex-shrink-0 pt-0.5">
        <button
          onClick={() => navigate('/story')}
          className="px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote text-white/45 hover:border-white/25 hover:text-white/65 transition-all duration-150"
        >
          ← Back to Story Proposals
        </button>

        <button
          disabled={!canContinue}
          onClick={onContinue}
          className="px-4 py-1.5 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 hover:scale-[1.02] active:bg-white/80 active:scale-[0.98] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continue to Puzzle Recommendations →
        </button>
      </div>
    </div>
  );
}
