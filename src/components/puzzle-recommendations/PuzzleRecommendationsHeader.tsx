import { useNavigate } from 'react-router-dom';

interface PuzzleRecommendationsHeaderProps {
  projectName: string;
  isRegenerating: boolean;
  onRegenerateAll: () => void;
}

export default function PuzzleRecommendationsHeader({
  projectName,
  isRegenerating,
  onRegenerateAll,
}: PuzzleRecommendationsHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
      {/* ── Left: breadcrumb + title ── */}
      <div className="flex flex-col gap-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/puzzle-flow')}
            className="text-white/30 hover:text-white/60 transition-colors text-subhead"
          >
            ← Puzzle Flow
          </button>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-footnote text-white/30">{projectName}</span>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-footnote text-white/45 font-medium">Puzzle Recommendations</span>
        </div>

        {/* Title block */}
        <div className="mt-0.5">
          <h1 className="text-title3 font-semibold text-white/90 leading-tight">
            AI Puzzle Recommendations
          </h1>
          <p className="text-footnote text-white/30 mt-0.5 leading-relaxed max-w-sm">
            AI-suggested puzzles for each stage. Adopt, edit, or discard to finalize your design.
          </p>
        </div>
      </div>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-3 flex-shrink-0 pt-0.5">
        <button
          onClick={() => navigate('/puzzle-flow')}
          className="px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote text-white/45 hover:border-white/25 hover:text-white/65 transition-all duration-150"
        >
          ← Puzzle Flow
        </button>

        <button
          onClick={onRegenerateAll}
          disabled={isRegenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote text-white/45 hover:border-white/25 hover:text-white/65 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isRegenerating ? (
            <>
              <span className="w-2.5 h-2.5 border border-white/25 border-t-white/60 rounded-full animate-spin" />
              재생성 중…
            </>
          ) : (
            <>↺ Regenerate All</>
          )}
        </button>

        <button
          className="px-4 py-1.5 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 hover:scale-[1.02] active:bg-white/80 active:scale-[0.98] transition-colors"
        >
          Export Plan →
        </button>
      </div>
    </div>
  );
}
