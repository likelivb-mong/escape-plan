import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import type { OptionalSectionKey } from '../types/optionalSections';

const SECTION_META: Record<OptionalSectionKey, { label: string; short: string }> = {
  schedule: { label: 'Schedule', short: '일정' },
  budget: { label: 'Budget', short: '예산' },
  operations: { label: 'Ops', short: '운영' },
  executiveReport: { label: 'Report', short: '보고' },
  externalReview: { label: 'Review', short: '리뷰' },
};

export default function OptionalSectionPage() {
  const navigate = useNavigate();
  const { sectionKey } = useParams<{ sectionKey: OptionalSectionKey }>();
  const { projectName, optionalSections, setOptionalSections, persistProject } = useProject();

  const section = sectionKey ? optionalSections[sectionKey] : null;
  const [draftTitle, setDraftTitle] = useState(section?.title ?? '');
  const [draftSummary, setDraftSummary] = useState(section?.summary ?? '');
  const [draftContent, setDraftContent] = useState(section?.content ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraftTitle(section?.title ?? '');
    setDraftSummary(section?.summary ?? '');
    setDraftContent(section?.content ?? '');
  }, [section?.title, section?.summary, section?.content]);

  const meta = useMemo(() => {
    if (!sectionKey) return null;
    return SECTION_META[sectionKey];
  }, [sectionKey]);

  if (!sectionKey || !meta || !section) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4 px-6">
        <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-title2">
          🗂
        </div>
        <div className="text-center">
          <p className="text-body font-semibold text-white/70 mb-1">추가 섹션이 없습니다.</p>
          <p className="text-subhead text-white/35 leading-relaxed">
            이 프로젝트에는 해당 부가 문서가 생성되지 않았습니다.
          </p>
        </div>
        <button
          onClick={() => navigate('/plan')}
          className="px-4 py-2 rounded-full border border-white/[0.12] text-subhead text-white/50 hover:border-white/25 hover:text-white/70 transition-all"
        >
          ← Plan으로
        </button>
      </div>
    );
  }

  const handleSave = () => {
    setOptionalSections({
      ...optionalSections,
      [sectionKey]: {
        ...section,
        title: draftTitle.trim() || section.title,
        summary: draftSummary.trim(),
        content: draftContent.trim(),
      },
    });
    persistProject();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.07] flex-shrink-0 gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={() => navigate('/plan')}
            className="text-white/30 hover:text-white/60 transition-colors text-subhead flex-shrink-0"
          >
            ← Plan
          </button>
          <span className="h-3.5 w-px bg-white/10 flex-shrink-0" />
          <h1 className="text-body font-semibold text-white/85 truncate">{projectName}</h1>
          <span className="hidden sm:block h-3.5 w-px bg-white/10 flex-shrink-0" />
          <span className="hidden sm:block text-footnote text-white/35 font-medium tracking-wide flex-shrink-0">
            {meta.label}
          </span>
        </div>

        <button
          onClick={handleSave}
          className={`px-3 py-1.5 rounded-lg border text-footnote font-medium transition-all ${
            saved
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300/80'
              : 'border-white/[0.10] text-white/45 hover:border-white/20 hover:text-white/70'
          }`}
        >
          {saved ? '저장됨' : '저장'}
        </button>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-caption uppercase tracking-[0.22em] text-white/25 mb-2">{meta.short}</p>
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full bg-transparent text-title2 font-semibold text-white/90 outline-none"
            />
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-footnote font-medium text-white/35 mb-2">요약</label>
              <textarea
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-body text-white placeholder:text-white/20 outline-none focus:border-white/[0.20] focus:bg-white/[0.06] transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-footnote font-medium text-white/35 mb-2">본문</label>
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={18}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-body text-white placeholder:text-white/20 outline-none focus:border-white/[0.20] focus:bg-white/[0.06] transition-all resize-y leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
