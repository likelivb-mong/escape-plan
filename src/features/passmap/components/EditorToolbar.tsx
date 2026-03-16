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
    <div className="flex items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5">
      <span className="text-caption text-white/40 mr-2">EDITOR</span>

      <button
        onClick={() => onAddStep('puzzle')}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-all border border-indigo-500/30"
      >
        + ● Puzzle
      </button>
      <button
        onClick={() => onAddStep('lock')}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all border border-amber-500/30"
      >
        + 🔒 Lock
      </button>
      <button
        onClick={() => onAddStep('device')}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-all border border-sky-500/30"
      >
        + ★ Device
      </button>

      <div className="w-px h-6 bg-white/10 mx-1" />

      <button
        onClick={onDeleteStep}
        disabled={!hasSelection}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all border border-rose-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Delete
      </button>

      <div className="flex-1" />

      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all border border-emerald-500/30 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
