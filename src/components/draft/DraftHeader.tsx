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
      saveCurrentProject();
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('idle');
    }
  };

  const saveLabel =
    saveState === 'saving' ? '저장 중…' :
    saveState === 'saved'  ? '✓ 저장됨' :
    'Save Draft';

  return (
    <div className="flex-shrink-0 px-8 py-4 border-b border-white/[0.07] flex items-start justify-between gap-6">

      {/* ── Left ── */}
      <div className="flex flex-col gap-1 min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/puzzle-recommendations')}
            className="text-white/30 hover:text-white/60 transition-colors text-subhead"
          >
            ← Puzzle Recommendations
          </button>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-footnote text-white/30 truncate">{projectName}</span>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-footnote text-white/45 font-medium">Theme Draft</span>
        </div>

        {/* Title */}
        <div className="mt-0.5">
          <h1 className="text-title3 font-semibold text-white/90 leading-tight">Theme Draft</h1>
          <p className="text-footnote text-white/30 mt-0.5 leading-relaxed max-w-md">
            Review the current concept, story, and adopted puzzle structure before exporting.
          </p>
        </div>
      </div>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
        <button
          onClick={() => navigate('/puzzle-recommendations')}
          className="px-3 py-1.5 rounded-full border border-white/[0.12] text-footnote text-white/40 hover:border-white/25 hover:text-white/65 transition-all"
        >
          ← Back
        </button>

        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Export buttons (mock) */}
        <button
          onClick={() => doc && mockExportPDF(doc)}
          className="px-3 py-1.5 rounded-full border border-white/[0.10] text-footnote text-white/35 hover:border-white/20 hover:text-white/55 transition-all"
        >
          Export PDF
        </button>

        <button
          onClick={() => doc && mockExportNotion(doc)}
          className="px-3 py-1.5 rounded-full border border-white/[0.10] text-footnote text-white/35 hover:border-white/20 hover:text-white/55 transition-all"
        >
          Export Notion
        </button>

        <button
          onClick={handleSave}
          disabled={!doc || saveState === 'saving'}
          className={`px-4 py-1.5 rounded-full text-subhead font-semibold transition-all disabled:opacity-25 disabled:cursor-not-allowed ${
            saveState === 'saved'
              ? 'bg-emerald-400/90 text-black shadow-[0_0_12px_rgba(52,211,153,0.25)]'
              : 'bg-white text-black hover:bg-white/90 hover:scale-[1.02] active:bg-white/80 active:scale-[0.98]'
          }`}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
