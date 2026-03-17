import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DraftDocument } from '../../types/draft';
import { mockExportPDF, mockExportNotion } from '../../utils/draft';
import { useProject } from '../../context/ProjectContext';

interface DraftDocumentActionsProps {
  doc: DraftDocument | null;
}

export default function DraftDocumentActions({ doc }: DraftDocumentActionsProps) {
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
    <div className="flex-shrink-0 px-6 sm:px-8 py-3 border-t border-white/[0.06] flex items-center justify-between gap-4">
      {/* Left: back nav */}
      <button
        onClick={() => navigate('/puzzle-flow')}
        className="text-caption text-white/25 hover:text-white/50 transition-colors"
      >
        ← 퍼즐 플로우
      </button>

      {/* Center: key stats */}
      {doc && (
        <div className="flex items-center gap-4">
          <ActionStat label="채택 퍼즐" value={`${doc.totalAdoptedCount}개`} accent="emerald" />
          <span className="w-px h-3 bg-white/[0.06]" />
          <ActionStat label="플레이타임" value={`${doc.totalPlayTime}분`} />
          <span className="w-px h-3 bg-white/[0.06]" />
          <ActionStat label="Flow 단계" value={`${doc.beats.length}단계`} />
        </div>
      )}

      {/* Right: export */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => doc && mockExportPDF(doc)}
          disabled={!doc}
          className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-caption text-white/30 hover:border-white/15 hover:text-white/50 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
        >
          PDF
        </button>

        <button
          onClick={() => doc && mockExportNotion(doc)}
          disabled={!doc}
          className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-caption text-white/30 hover:border-white/15 hover:text-white/50 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
        >
          Notion
        </button>

        <button
          onClick={() => navigate('/projects')}
          className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-caption text-white/30 hover:border-white/15 hover:text-white/50 transition-all"
        >
          내 프로젝트
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

// ── Sub-component ─────────────────────────────────────────────────────────────

function ActionStat({ label, value, accent }: { label: string; value: string; accent?: 'emerald' }) {
  const valCls = accent === 'emerald' ? 'text-emerald-300/70' : 'text-white/55';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-caption text-white/30">{label}</span>
      <span className={`text-subhead font-bold tabular-nums ${valCls}`}>{value}</span>
    </div>
  );
}
