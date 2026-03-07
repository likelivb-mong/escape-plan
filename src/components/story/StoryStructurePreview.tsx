import type { StoryBeat } from '../../types/story';

interface StoryStructurePreviewProps {
  beats: StoryBeat[];
}

const BEAT_STYLES: Record<string, { dot: string; label: string; bar: string }> = {
  기:   { dot: 'bg-sky-400/60',     label: 'text-sky-300/70',     bar: 'bg-sky-500/20' },
  승:   { dot: 'bg-emerald-400/60', label: 'text-emerald-300/70', bar: 'bg-emerald-500/20' },
  전:   { dot: 'bg-amber-400/60',   label: 'text-amber-300/70',   bar: 'bg-amber-500/20' },
  반전: { dot: 'bg-rose-400/60',    label: 'text-rose-300/70',    bar: 'bg-rose-500/20' },
  결:   { dot: 'bg-purple-400/60',  label: 'text-purple-300/70',  bar: 'bg-purple-500/20' },
};
const DEFAULT_STYLE = {
  dot: 'bg-white/30', label: 'text-white/40', bar: 'bg-white/10',
};

export default function StoryStructurePreview({ beats }: StoryStructurePreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      {beats.map((beat, i) => {
        const s = BEAT_STYLES[beat.label] ?? DEFAULT_STYLE;
        return (
          <div key={beat.label} className="flex items-start gap-2.5">
            {/* Timeline column */}
            <div className="flex flex-col items-center flex-shrink-0 pt-[3px]">
              <div className={`w-[7px] h-[7px] rounded-full ${s.dot}`} />
              {i < beats.length - 1 && (
                <div className="w-px flex-1 min-h-[10px] mt-1 bg-white/[0.07]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className={`text-caption font-bold tracking-wide flex-shrink-0 ${s.label}`}
                >
                  {beat.label}
                </span>
                <div className={`flex-1 h-px ${s.bar}`} />
              </div>
              <p className="text-caption text-white/38 leading-relaxed">{beat.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
