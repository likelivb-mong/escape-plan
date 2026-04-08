import { useEffect, useState } from 'react';
import type { StoryProposal, TwistIntensity, InvestigationFramework } from '../../types/story';
import StoryStructurePreview from './StoryStructurePreview';
import NarrativeSection from './NarrativeSection';

interface StoryDetailModalProps {
  proposal: StoryProposal;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate?: (proposal: StoryProposal) => void;
  onClose: () => void;
}

const TWIST_LABEL: Record<TwistIntensity, string> = {
  low:    '반전 약함',
  medium: '반전 중간',
  high:   '반전 강함',
};
const TWIST_COLOR: Record<TwistIntensity, string> = {
  low:    'text-white/40 border-white/[0.09]',
  medium: 'text-amber-300/70 border-amber-400/25',
  high:   'text-rose-300/70 border-rose-400/30',
};

const INVEST_BADGES: {
  key: keyof InvestigationFramework;
  label: string;
  color: string;
}[] = [
  { key: 'motive',    label: '동기',   color: 'text-rose-300/80 border-rose-400/30 bg-rose-500/[0.08]' },
  { key: 'method',    label: '방법',   color: 'text-amber-300/80 border-amber-400/30 bg-amber-500/[0.08]' },
  { key: 'clue',      label: '단서',   color: 'text-amber-300/80 border-amber-400/30 bg-amber-500/[0.08]' },
  { key: 'technique', label: '기법',   color: 'text-sky-300/80 border-sky-400/30 bg-sky-500/[0.08]' },
];

export default function StoryDetailModal({
  proposal,
  isSelected,
  onSelect,
  onUpdate,
  onClose,
}: StoryDetailModalProps) {
  const { title, genre, tone, logline, synopsis, beats, meta, investigation } = proposal;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<StoryProposal>(proposal);

  useEffect(() => {
    setDraft(proposal);
    setIsEditing(false);
  }, [proposal]);

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 바디 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/15 bg-[#0f0f0f] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-7 pt-6 pb-5 border-b border-white/[0.07] flex-shrink-0">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-150 text-title2"
          >
            ×
          </button>

          {onUpdate && (
            <button
              onClick={() => {
                if (isEditing) {
                  onUpdate(draft);
                }
                setIsEditing((prev) => !prev);
              }}
              className="absolute top-4 right-13 px-3 h-7 flex items-center justify-center rounded-full text-white/35 hover:text-white/75 hover:bg-white/[0.06] transition-all duration-150 text-footnote"
            >
              {isEditing ? '저장' : '편집'}
            </button>
          )}

          {/* Genre + Tone */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {isEditing ? (
              <>
                <InlineField value={draft.genre} onChange={(value) => setDraft((prev) => ({ ...prev, genre: value }))} />
                <InlineField value={draft.tone} onChange={(value) => setDraft((prev) => ({ ...prev, tone: value }))} subtle />
              </>
            ) : (
              <>
                <span className="px-2 py-0.5 rounded-md border border-white/[0.12] text-caption text-white/50 bg-white/[0.04]">
                  {genre}
                </span>
                <span className="px-2 py-0.5 rounded-md border border-white/[0.08] text-caption text-white/35">
                  {tone}
                </span>
              </>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2 pr-8">
              <TitleInput value={draft.title} onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))} />
              <TextAreaInput value={draft.logline} onChange={(value) => setDraft((prev) => ({ ...prev, logline: value }))} rows={2} />
            </div>
          ) : (
            <>
              <h2 className="text-title2 font-semibold text-white/95 mb-2 leading-snug pr-8">{title}</h2>
              <p className="text-body text-white/45 italic leading-relaxed">"{logline}"</p>
            </>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-6">

          {/* 시놉시스 */}
          <section>
            <SectionLabel>시놉시스</SectionLabel>
            {isEditing ? (
              <TextAreaInput value={draft.synopsis} onChange={(value) => setDraft((prev) => ({ ...prev, synopsis: value }))} rows={4} />
            ) : (
              <p className="text-body text-white/60 leading-relaxed">{synopsis}</p>
            )}
          </section>

          {/* 기승전반전결 */}
          <section>
            <SectionLabel>스토리 구조</SectionLabel>
            {isEditing ? (
              <div className="mt-2 space-y-2">
                {draft.beats.map((beat, index) => (
                  <div key={`${beat.label}-${index}`} className="grid grid-cols-[40px_1fr] gap-2 items-start">
                    <span className="text-caption text-white/35 pt-2">{beat.label}</span>
                    <TextAreaInput
                      value={beat.description}
                      onChange={(value) => setDraft((prev) => ({
                        ...prev,
                        beats: prev.beats.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, description: value } : item,
                        ),
                      }))}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-1">
                <StoryStructurePreview beats={beats} />
              </div>
            )}
          </section>

          {/* 수사 프레임워크 */}
          {investigation && (
            <section>
              <SectionLabel>수사 프레임워크</SectionLabel>
              {(isEditing ? draft.investigation?.formula : investigation.formula) && (
                <p className="text-subhead text-white/40 italic leading-relaxed mb-3 pl-3 border-l-2 border-white/10">
                  {isEditing ? draft.investigation?.formula : investigation.formula}
                </p>
              )}
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(['perpetrator', 'victim', 'scene', 'motive', 'method', 'clue', 'technique', 'formula'] as const).map((key) => (
                    <div key={key}>
                      <p className="text-caption text-white/30 mb-1">{key}</p>
                      <input
                        value={draft.investigation?.[key] ?? ''}
                        onChange={(e) => setDraft((prev) => ({
                          ...prev,
                          investigation: {
                            perpetrator: '',
                            motive: '',
                            victim: '',
                            method: '',
                            scene: '',
                            clue: '',
                            technique: '',
                            formula: '',
                            ...(prev.investigation ?? {}),
                            [key]: e.target.value,
                          },
                        }))}
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-footnote text-white outline-none focus:border-white/[0.18]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3 text-footnote text-white/50">
                    <span className="px-2 py-1 rounded-lg border border-white/[0.10] bg-white/[0.03]">
                      {investigation.perpetrator}
                    </span>
                    <span className="text-white/20">→</span>
                    <span className="px-2 py-1 rounded-lg border border-white/[0.10] bg-white/[0.03]">
                      {investigation.victim}
                    </span>
                    {investigation.scene && (
                      <>
                        <span className="text-white/20">@</span>
                        <span className="text-white/35">{investigation.scene}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INVEST_BADGES.map(({ key, label, color }) => {
                      const value = investigation[key];
                      if (!value) return null;
                      return (
                        <span key={key} className={`px-2.5 py-1 rounded-lg border text-footnote ${color}`}>
                          <span className="opacity-60 mr-1">{label}</span>{value}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}

          {/* 원본 서사 분석 (YouTube 분석 시에만 표시) */}
          {proposal.narrative && (
            <section>
              <NarrativeSection narrative={proposal.narrative} />
            </section>
          )}

          {/* 메타 */}
          <section className="flex items-center gap-4 pb-1">
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                <input
                  value={draft.meta.playtime}
                  onChange={(e) => setDraft((prev) => ({ ...prev, meta: { ...prev.meta, playtime: e.target.value } }))}
                  className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-footnote text-white outline-none focus:border-white/[0.18]"
                />
                <input
                  value={draft.meta.playerCount}
                  onChange={(e) => setDraft((prev) => ({ ...prev, meta: { ...prev.meta, playerCount: e.target.value } }))}
                  className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-footnote text-white outline-none focus:border-white/[0.18]"
                />
                <select
                  value={draft.meta.twistIntensity}
                  onChange={(e) => setDraft((prev) => ({ ...prev, meta: { ...prev.meta, twistIntensity: e.target.value as TwistIntensity } }))}
                  className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-footnote text-white outline-none focus:border-white/[0.18]"
                >
                  <option value="low">반전 약함</option>
                  <option value="medium">반전 중간</option>
                  <option value="high">반전 강함</option>
                </select>
              </div>
            ) : (
              <>
                <MetaItem icon="⏱" value={meta.playtime} />
                <MetaItem icon="👥" value={meta.playerCount} />
                <span className={`px-2.5 py-1 rounded-lg border text-footnote ${TWIST_COLOR[meta.twistIntensity]}`}>
                  {TWIST_LABEL[meta.twistIntensity]}
                </span>
              </>
            )}
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="px-7 py-4 border-t border-white/[0.07] flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => { onSelect(); onClose(); }}
            className={[
              'flex-1 py-2.5 rounded-xl text-body font-semibold transition-all duration-150',
              isSelected
                ? 'bg-white/10 text-white/60 hover:bg-white/15 border border-white/20'
                : 'bg-white text-black hover:bg-white/90',
            ].join(' ')}
          >
            {isSelected ? '✓ 선택 해제' : '이 스토리 선택'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-white/[0.10] text-body text-white/40 hover:text-white/65 hover:border-white/20 transition-all duration-150"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineField({
  value,
  onChange,
  subtle = false,
}: {
  value: string;
  onChange: (value: string) => void;
  subtle?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-2 py-1 rounded-md border text-caption bg-white/[0.04] outline-none focus:border-white/[0.18] ${
        subtle ? 'border-white/[0.08] text-white/45' : 'border-white/[0.12] text-white/60'
      }`}
    />
  );
}

function TitleInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-title2 font-semibold text-white/95 bg-white/[0.03] border border-white/[0.10] rounded-xl px-4 py-3 outline-none focus:border-white/[0.20]"
    />
  );
}

function TextAreaInput({
  value,
  onChange,
  rows,
}: {
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full bg-white/[0.03] border border-white/[0.10] rounded-xl px-4 py-3 text-body text-white/80 outline-none focus:border-white/[0.20] resize-none leading-relaxed"
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-caption font-semibold text-white/20 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

function MetaItem({ icon, value }: { icon: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-subhead text-white/45">
      <span>{icon}</span>{value}
    </span>
  );
}
