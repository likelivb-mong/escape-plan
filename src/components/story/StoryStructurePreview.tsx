import type { StoryBeat } from '../../types/story';

interface StoryStructurePreviewProps {
  beats: StoryBeat[];
}

const BEAT_CONFIG: Record<string, {
  label: string;
  sub: string;
  dot: string;
  line: string;
  badge: string;
  text: string;
}> = {
  기:   { label: '기', sub: '도입',  dot: 'bg-sky-400',      line: 'bg-sky-400/20',    badge: 'bg-sky-500/10 text-sky-300 border-sky-400/20',    text: 'text-sky-200/60' },
  승:   { label: '승', sub: '전개',  dot: 'bg-emerald-400',  line: 'bg-emerald-400/20', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20', text: 'text-emerald-200/60' },
  전:   { label: '전', sub: '전환',  dot: 'bg-amber-400',    line: 'bg-amber-400/20',   badge: 'bg-amber-500/10 text-amber-300 border-amber-400/20',   text: 'text-amber-200/60' },
  반전: { label: '반전', sub: '반전', dot: 'bg-rose-400',    line: 'bg-rose-400/20',    badge: 'bg-rose-500/10 text-rose-300 border-rose-400/20',    text: 'text-rose-200/60' },
  결:   { label: '결', sub: '결말',  dot: 'bg-purple-400',   line: 'bg-purple-400/20',  badge: 'bg-purple-500/10 text-purple-300 border-purple-400/20',  text: 'text-purple-200/60' },
};

const DEFAULT_CONFIG = {
  label: '?', sub: '', dot: 'bg-white/40', line: 'bg-white/10',
  badge: 'bg-white/5 text-white/40 border-white/10', text: 'text-white/40',
};

export default function StoryStructurePreview({ beats }: StoryStructurePreviewProps) {
  return (
    <div className="relative">
      {beats.map((beat, i) => {
        const cfg = BEAT_CONFIG[beat.label] ?? DEFAULT_CONFIG;
        const isLast = i === beats.length - 1;

        return (
          <div key={beat.label} className="relative flex gap-3.5">
            {/* Timeline rail */}
            <div className="flex flex-col items-center flex-shrink-0 w-5">
              {/* Dot */}
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} mt-[7px] flex-shrink-0 ring-[3px] ring-black/30`} />
              {/* Connecting line */}
              {!isLast && (
                <div className={`w-px flex-1 ${cfg.line} min-h-[12px]`} />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
              {/* Beat label row */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`px-2 py-0.5 rounded-md border text-micro font-bold tracking-wide ${cfg.badge}`}>
                  {cfg.label}
                </span>
                <span className="text-micro text-white/20 font-medium">{cfg.sub}</span>
              </div>

              {/* Description */}
              <p className="text-footnote text-white/45 leading-[1.7] whitespace-pre-wrap break-words">
                {beat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
