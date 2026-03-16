import type { StepType } from '../types/passmap';

interface EditorToolbarProps {
  onAddStep: (type: StepType) => void;
  onDeleteStep: () => void;
  onSave: () => void;
  hasSelection: boolean;
  isSaving: boolean;
}

export default function EditorToolbar({
  onAddStep,
  onDeleteStep,
  onSave,
  hasSelection,
  isSaving,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <span className="text-[10px] text-white/25 font-medium tracking-widest mr-2">EDIT</span>

      <button
        onClick={() => onAddStep('puzzle')}
        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all"
      >
        + Puzzle
      </button>
      <button
        onClick={() => onAddStep('lock')}
        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all"
      >
        + Lock
      </button>
      <button
        onClick={() => onAddStep('device')}
        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all"
      >
        + Device
      </button>

      <div className="w-px h-5 bg-white/[0.06] mx-1" />

      <button
        onClick={onDeleteStep}
        disabled={!hasSelection}
        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
      >
        삭제
      </button>

      <div className="flex-1" />

      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.08] text-white/70 hover:bg-white/[0.12] hover:text-white transition-all disabled:opacity-50"
      >
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  );
}
