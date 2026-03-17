import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockExportPDF, mockExportNotion } from '../../utils/draft';
import type { DraftDocument } from '../../types/draft';
import { useProject } from '../../context/ProjectContext';

interface DraftHeaderProps {
  projectName: string;
  doc: DraftDocument | null;
}

export default function DraftHeader({ projectName, doc }: DraftHeaderProps) {
  const navigate = useNavigate();
  const { saveCurrentProject } = useProject();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = () => {
    if (!doc) return;
    setSaveState('saving');
    try {
      saveCurrentProject('plan');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('idle');
    }
  };

  const saveLabel =
    saveState === 'saving' ? '저장 중…' :
    saveState === 'saved'  ? '저장 완료' :
    '기획안 저장';

  return (
    <div className="flex-shrink-0 px-6 sm:px-8 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-4">
      {/* Left: breadcrumb + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate('/puzzle-flow')}
          className="text-white/25 hover:text-white/50 transition-colors text-caption flex-shrink-0"
        >
          ← 퍼즐 플로우
        </button>
        <span className="h-3 w-px bg-white/[0.08]" />
        <span className="text-caption text-white/25 truncate max-w-[120px]">{projectName}</span>
        <span className="h-3 w-px bg-white/[0.08]" />
        <h1 className="text-body font-semibold text-white/80">테마 기획안</h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => doc && mockExportPDF(doc)}
          className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-caption text-white/30 hover:border-white/15 hover:text-white/50 transition-all"
        >
          PDF
        </button>

        <button
          onClick={() => doc && mockExportNotion(doc)}
          className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-caption text-white/30 hover:border-white/15 hover:text-white/50 transition-all"
        >
          Notion
        </button>

        <button
          onClick={handleSave}
          disabled={!doc || saveState === 'saving'}
          className={`px-4 py-1.5 rounded-lg text-caption font-semibold transition-all disabled:opacity-25 disabled:cursor-not-allowed ${
            saveState === 'saved'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-indigo-500 text-white hover:bg-indigo-400'
          }`}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
