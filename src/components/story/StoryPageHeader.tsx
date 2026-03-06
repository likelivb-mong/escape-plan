import { useNavigate } from 'react-router-dom';

interface StoryPageHeaderProps {
  projectName: string;
  selectedId: string | null;
  isAddingBatch: boolean;
  onAddNewBatch: () => void;
  onContinue: () => void;
}

export default function StoryPageHeader({
  projectName,
  selectedId,
  isAddingBatch,
  onAddNewBatch,
  onContinue,
}: StoryPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.07] flex-shrink-0">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/')}
          className="text-white/30 hover:text-white/60 transition-colors text-xs"
        >
          ← 홈
        </button>
        <span className="h-3.5 w-px bg-white/10" />
        <h1 className="text-sm font-semibold text-white/85">{projectName}</h1>
        <span className="h-3.5 w-px bg-white/10" />
        <span className="text-[11px] text-white/25 font-medium tracking-wide">
          Story Proposals
        </span>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onAddNewBatch}
          disabled={isAddingBatch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.12] text-[11px] text-white/45 hover:border-white/25 hover:text-white/65 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
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
          className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 active:bg-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          만다라트 편집 →
        </button>
      </div>
    </div>
  );
}
