import type { DraftDocument } from '../../types/draft';
import { SectionMeta } from './DraftOverviewSection';

interface DraftConceptSummaryProps {
  doc: DraftDocument;
}

export default function DraftConceptSummary({ doc }: DraftConceptSummaryProps) {
  const { conceptKeywords, effectsKeywords, clueKeywords } = doc;
  const hasAny = conceptKeywords.length > 0 || effectsKeywords.length > 0 || clueKeywords.length > 0;

  return (
    <section className="mb-10">
      <SectionMeta index="02" label="Concept Keywords" />

      <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.018] overflow-hidden">
        {hasAny ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
            <KeywordColumn
              label="컨셉"
              sublabel="Concept"
              keywords={conceptKeywords}
              chipCls="border-rose-400/20 text-rose-300/65 bg-rose-500/[0.06]"
              dotCls="bg-rose-400/60"
              emptyMsg="컨셉 키워드 없음"
            />
            <KeywordColumn
              label="연출 / 장치"
              sublabel="Effects & Devices"
              keywords={effectsKeywords}
              chipCls="border-sky-400/20 text-sky-300/65 bg-sky-500/[0.06]"
              dotCls="bg-sky-400/60"
              emptyMsg="연출 키워드 없음"
            />
            <KeywordColumn
              label="단서 / 소품"
              sublabel="Clues & Props"
              keywords={clueKeywords}
              chipCls="border-amber-400/20 text-amber-300/65 bg-amber-500/[0.06]"
              dotCls="bg-amber-400/60"
              emptyMsg="단서 키워드 없음"
            />
          </div>
        ) : (
          <div className="px-8 py-10 text-center">
            <p className="text-subhead text-white/30 font-medium">Not enough keywords yet.</p>
            <p className="text-footnote text-white/30 mt-1 leading-relaxed">
              Mandalart 페이지에서 키워드에 색상(분홍·하늘·주황)을 지정하면 여기에 표시됩니다.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function KeywordColumn({
  label,
  sublabel,
  keywords,
  chipCls,
  dotCls,
  emptyMsg,
}: {
  label: string;
  sublabel: string;
  keywords: string[];
  chipCls: string;
  dotCls: string;
  emptyMsg: string;
}) {
  return (
    <div className="px-6 py-5">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
        <div>
          <p className="text-footnote font-semibold text-white/65 leading-tight">{label}</p>
          <p className="text-micro text-white/35 font-medium">{sublabel}</p>
        </div>
        <span className="ml-auto text-caption text-white/30 tabular-nums">{keywords.length}</span>
      </div>

      {/* Chips */}
      {keywords.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <span
              key={kw}
              className={`px-2 py-0.5 rounded-md border text-caption leading-snug ${chipCls}`}
            >
              {kw}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-caption text-white/30 italic">{emptyMsg}</p>
      )}
    </div>
  );
}
