import { useNavigate } from 'react-router-dom';

interface StoryPageHeaderProps {
  projectName: string;
  selectedId: string | null;
  isAddingBatch: boolean;
  onAddNewBatch: () => void;
  onContinue: () => void;
  historyIndex: number;
  historyLength: number;
  onHistoryBack: () => void;
  onHistoryForward: () => void;
}

export default function StoryPageHeader({
  projectName,
  selectedId,
  isAddingBatch,
  onAddNewBatch,
  onContinue,
  historyIndex,
  historyLength,
  onHistoryBack,
  onHistoryForward,
}: StoryPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.07] flex-shrink-0">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/projects')}
          className="text-white/30 hover:text-white/60 transition-colors text-subhead"
        >
          ← 내 프로젝트
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

        {/* ── History navigation ── */}
        {historyLength > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={onHistoryBack}
              disabled={historyIndex <= 0}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-white/[0.12] text-footnote text-white/45 hover:border-white/25 hover:text-white/65 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <span className="text-footnote text-white/35 tabular-nums min-w-[2.5rem] text-center">
              {historyIndex + 1}/{historyLength}
            </span>
            <button
              onClick={onHistoryForward}
              disabled={historyIndex >= historyLength - 1}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-white/[0.12] text-footnote text-white/45 hover:border-white/25 hover:text-white/65 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        )}

        <button
          onClick={onContinue}
          disabled={!selectedId}
          className="px-4 py-1.5 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 hover:scale-[1.02] active:bg-white/80 active:scale-[0.98] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Story Flow 확정
        </button>
      </div>
    </div>
  );
}
