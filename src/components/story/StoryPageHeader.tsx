import { useNavigate } from 'react-router-dom';

interface StoryPageHeaderProps {
  projectName: string;
  selectedId: string | null;
  isAddingBatch: boolean;
  onAddNewBatch: () => void;
  onContinue: () => void;
  onSave?: () => void;
}

export default function StoryPageHeader({
  projectName,
  selectedId,
  isAddingBatch,
  onAddNewBatch,
  onContinue,
  onSave,
}: StoryPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.07] flex-shrink-0">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/plan')}
          className="text-white/30 hover:text-white/60 transition-colors text-subhead"
        >
          ← Plan
        </button>
        <span className="h-3.5 w-px bg-white/10" />
        <h1 className="text-body font-semibold text-white/85">{projectName}</h1>
        <span className="h-3.5 w-px bg-white/10" />
        <span className="text-footnote text-white/35 font-medium tracking-wide">
          Story Proposals
        </span>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3">
        {onSave && (
          <button
            onClick={onSave}
            className="px-3 py-1.5 rounded-lg border border-white/[0.10] text-footnote font-medium text-white/45 hover:border-white/20 hover:text-white/70 transition-all"
          >
            저장
          </button>
        )}
        <button
          onClick={onAddNewBatch}
          disabled={isAddingBatch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote text-white/45 hover:border-white/25 hover:text-white/65 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isAddingBatch ? (
            <>
              <span className="inline-block w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin" />
              생성 중…
            </>
          ) : (
            <>+ NEW 스토리 생성</>
          )}
        </button>

        <button
          onClick={onContinue}
          disabled={!selectedId}
          className="px-4 py-1.5 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 hover:scale-[1.02] active:bg-white/80 active:scale-[0.98] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          만다라트 편집 →
        </button>
      </div>
    </div>
  );
}
