import type { KeywordCategory } from '../../types/story';

interface SelectedKeywordSummaryProps {
  categories: KeywordCategory[];
  themeTitle: string;
}

const THEME_CHIP: Record<'rose' | 'sky' | 'amber', string> = {
  rose:  'border-rose-400/25 text-rose-300/70 bg-rose-500/[0.06]',
  sky:   'border-sky-400/25 text-sky-300/70 bg-sky-500/[0.06]',
  amber: 'border-amber-400/25 text-amber-300/70 bg-amber-500/[0.06]',
};
const DEFAULT_CHIP = 'border-white/[0.09] text-white/45 bg-white/[0.03]';

const LABEL_COLOR: Record<'rose' | 'sky' | 'amber', string> = {
  rose:  'text-rose-300/50',
  sky:   'text-sky-300/50',
  amber: 'text-amber-300/50',
};

export default function SelectedKeywordSummary({
  categories,
  themeTitle,
}: SelectedKeywordSummaryProps) {
  const totalCount = categories.reduce((s, c) => s + c.keywords.length, 0);

  if (totalCount === 0) return null;

  return (
    <div className="flex-shrink-0 px-6 py-3 border-b border-white/[0.05] flex items-start gap-5 flex-wrap">
      {/* Theme label */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-caption font-semibold text-white/25 uppercase tracking-wider">
          테마
        </span>
        <span className="text-footnote font-semibold text-white/60">{themeTitle}</span>
        <span className="text-caption text-white/30">·</span>
        <span className="text-caption text-white/35">{totalCount} 키워드</span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-white/[0.08] self-center" />

      {/* Categories */}
      <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center gap-2 flex-wrap">
            <span
              className={[
                'text-micro font-bold uppercase tracking-widest flex-shrink-0',
                cat.theme ? LABEL_COLOR[cat.theme] : 'text-white/25',
              ].join(' ')}
            >
              {cat.label}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {cat.keywords.map((kw) => (
                <span
                  key={kw.id}
                  className={[
                    'px-2 py-0.5 rounded-md border text-caption leading-snug',
                    kw.theme ? THEME_CHIP[kw.theme] : DEFAULT_CHIP,
                  ].join(' ')}
                >
                  {kw.text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
