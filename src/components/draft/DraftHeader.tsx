import { useNavigate } from 'react-router-dom';
import { mockExportPDF, mockExportNotion, mockSaveDraft } from '../../utils/draft';
import type { DraftDocument } from '../../types/draft';

interface DraftHeaderProps {
  projectName: string;
  doc: DraftDocument | null;
}

export default function DraftHeader({ projectName, doc }: DraftHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex-shrink-0 px-8 py-4 border-b border-white/[0.07] flex items-start justify-between gap-6">

      {/* ── Left ── */}
      <div className="flex flex-col gap-1 min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/puzzle-recommendations')}
            className="text-white/30 hover:text-white/60 transition-colors text-xs"
          >
            ← Puzzle Recommendations
          </button>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-[11px] text-white/20 truncate">{projectName}</span>
          <span className="h-3 w-px bg-white/10" />
          <span className="text-[11px] text-white/45 font-medium">Theme Draft</span>
        </div>

        {/* Title */}
        <div className="mt-0.5">
          <h1 className="text-base font-semibold text-white/90 leading-tight">Theme Draft</h1>
          <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed max-w-md">
            Review the current concept, story, and adopted puzzle structure before exporting.
          </p>
        </div>
      </div>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
        <button
          onClick={() => navigate('/puzzle-recommendations')}
          className="px-3 py-1.5 rounded-full border border-white/[0.12] text-[11px] text-white/40 hover:border-white/25 hover:text-white/65 transition-all"
        >
          ← Back
        </button>

        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Export buttons (mock) */}
        <button
          onClick={() => doc && mockExportPDF(doc)}
          className="px-3 py-1.5 rounded-full border border-white/[0.10] text-[11px] text-white/35 hover:border-white/20 hover:text-white/55 transition-all"
        >
          Export PDF
        </button>

        <button
          onClick={() => doc && mockExportNotion(doc)}
          className="px-3 py-1.5 rounded-full border border-white/[0.10] text-[11px] text-white/35 hover:border-white/20 hover:text-white/55 transition-all"
        >
          Export Notion
        </button>

        <button
          onClick={() => doc && mockSaveDraft(doc)}
          className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 active:bg-white/80 transition-colors"
        >
          Save Draft
        </button>
      </div>
    </div>
  );
}
