import { useNavigate } from 'react-router-dom';
import type { DraftDocument } from '../../types/draft';
import { mockExportPDF, mockExportNotion, mockSaveDraft } from '../../utils/draft';

interface DraftDocumentActionsProps {
  doc: DraftDocument | null;
}

export default function DraftDocumentActions({ doc }: DraftDocumentActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex-shrink-0 px-8 py-4 border-t border-white/[0.06] flex items-center justify-between gap-4">
      {/* Left */}
      <button
        onClick={() => navigate('/puzzle-recommendations')}
        className="text-footnote text-white/35 hover:text-white/60 transition-colors"
      >
        ← Back to Puzzle Recommendations
      </button>

      {/* Center: stats */}
      {doc && (
        <div className="flex items-center gap-4">
          <ActionStat label="채택 퍼즐" value={`${doc.totalAdoptedCount}개`} accent="emerald" />
          <span className="w-px h-3 bg-white/[0.08]" />
          <ActionStat label="플레이타임" value={`${doc.totalPlayTime}분`} />
          <span className="w-px h-3 bg-white/[0.08]" />
          <ActionStat label="Flow 단계" value={`${doc.beats.length}단계`} />
        </div>
      )}

      {/* Right: export actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => doc && mockExportPDF(doc)}
          disabled={!doc}
          className="px-3 py-1.5 rounded-full border border-white/[0.10] text-footnote text-white/35 hover:border-white/20 hover:text-white/55 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
        >
          Export PDF
        </button>

        <button
          onClick={() => doc && mockExportNotion(doc)}
          disabled={!doc}
          className="px-3 py-1.5 rounded-full border border-white/[0.10] text-footnote text-white/35 hover:border-white/20 hover:text-white/55 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
        >
          Export Notion
        </button>

        <button
          onClick={() => doc && mockSaveDraft(doc)}
          disabled={!doc}
          className="px-4 py-1.5 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 hover:scale-[1.02] active:bg-white/80 active:scale-[0.98] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          Save Draft
        </button>
      </div>
    </div>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function ActionStat({ label, value, accent }: { label: string; value: string; accent?: 'emerald' }) {
  const valCls = accent === 'emerald' ? 'text-emerald-300/70' : 'text-white/55';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-caption text-white/35">{label}</span>
      <span className={`text-body font-bold tabular-nums ${valCls}`}>{value}</span>
    </div>
  );
}
