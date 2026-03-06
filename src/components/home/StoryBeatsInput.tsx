interface StoryBeatsInputProps {
  beats: Record<string, string>;
  onChange: (beats: Record<string, string>) => void;
}

const BEAT_LABELS = ['기', '승', '전', '반전', '결'] as const;

const BEAT_COLORS: Record<string, string> = {
  기:   'bg-sky-400/60',
  승:   'bg-emerald-400/60',
  전:   'bg-amber-400/60',
  반전: 'bg-rose-400/60',
  결:   'bg-purple-400/60',
};

const BEAT_PLACEHOLDERS: Record<string, string> = {
  기:   '도입부 — 배경, 인물, 사건의 발단...',
  승:   '전개 — 사건이 심화되고 갈등이 커지는...',
  전:   '전환점 — 예상치 못한 전개...',
  반전: '반전 — 숨겨진 진실이 드러나는...',
  결:   '결말 — 사건의 해결과 마무리...',
};

export default function StoryBeatsInput({ beats, onChange }: StoryBeatsInputProps) {
  const update = (label: string, value: string) => {
    onChange({ ...beats, [label]: value });
  };

  return (
    <div className="flex flex-col gap-2.5">
      {BEAT_LABELS.map((label) => (
        <div key={label} className="flex items-start gap-3">
          {/* Color dot + label */}
          <div className="flex items-center gap-1.5 flex-shrink-0 pt-2.5 w-12">
            <div className={`w-[7px] h-[7px] rounded-full ${BEAT_COLORS[label]}`} />
            <span className="text-[11px] font-semibold text-white/40">{label}</span>
          </div>
          {/* Textarea */}
          <textarea
            value={beats[label] ?? ''}
            onChange={(e) => update(label, e.target.value)}
            placeholder={BEAT_PLACEHOLDERS[label]}
            rows={2}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-200 resize-none leading-relaxed"
          />
        </div>
      ))}
    </div>
  );
}
