import type { StoryBeat } from '../../types/story';

interface StoryStructurePreviewProps {
  beats: StoryBeat[];
}

const BEAT_INFO: Record<string, { label: string; dot: string; label_color: string; bar: string; icon: string; description: string }> = {
  기: {
    label: '기',
    dot: 'bg-sky-400/70',
    label_color: 'text-sky-300/80',
    bar: 'bg-sky-500/25',
    icon: '🎬',
    description: '도입',
  },
  승: {
    label: '승',
    dot: 'bg-emerald-400/70',
    label_color: 'text-emerald-300/80',
    bar: 'bg-emerald-500/25',
    icon: '📈',
    description: '전개',
  },
  전: {
    label: '전',
    dot: 'bg-amber-400/70',
    label_color: 'text-amber-300/80',
    bar: 'bg-amber-500/25',
    icon: '🔄',
    description: '전환',
  },
  반전: {
    label: '반전',
    dot: 'bg-rose-400/70',
    label_color: 'text-rose-300/80',
    bar: 'bg-rose-500/25',
    icon: '⚡',
    description: '반전',
  },
  결: {
    label: '결',
    dot: 'bg-purple-400/70',
    label_color: 'text-purple-300/80',
    bar: 'bg-purple-500/25',
    icon: '🎭',
    description: '결말',
  },
};

const DEFAULT_STYLE = {
  label: '결',
  dot: 'bg-white/30',
  label_color: 'text-white/40',
  bar: 'bg-white/10',
  icon: '❓',
  description: '',
};

export default function StoryStructurePreview({ beats }: StoryStructurePreviewProps) {
  // Responsive: mobile 세로, lg+ 가로
  const isCompact = beats.length <= 3;

  return (
    <div className={`grid gap-4 ${
      isCompact
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 auto-rows-min'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 auto-rows-min'
    }`}>
      {beats.map((beat) => {
        const info = BEAT_INFO[beat.label] ?? DEFAULT_STYLE;
        return (
          <div
            key={beat.label}
            className="rounded-lg border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-3.5 transition-all hover:border-white/[0.15] hover:bg-white/[0.06]"
          >
            {/* Header: Icon + Label */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-lg flex-shrink-0">{info.icon}</span>
              <span className={`text-body font-bold tracking-wider flex-shrink-0 ${info.label_color}`}>
                {info.label}
              </span>
            </div>

            {/* Stage name */}
            <p className="text-micro font-semibold text-white/25 uppercase tracking-widest mb-2">
              {info.description}
            </p>

            {/* Description */}
            <p className="text-footnote text-white/50 leading-relaxed whitespace-pre-wrap break-words">
              {beat.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
