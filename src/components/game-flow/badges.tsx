import type { ProblemMode, AnswerType, OutputType, StageLabel, DeviceSubtype } from '../../types/gameFlow';
import {
  PROBLEM_MODE_LABELS,
  ANSWER_TYPE_LABELS,
  OUTPUT_LABELS,
  DEVICE_SUBTYPE_LABELS,
} from '../../utils/gameFlow';

// ── Problem Mode Badge ─────────────────────────────────────────────────────────

const PROBLEM_MODE_STYLES: Record<ProblemMode, string> = {
  clue:         'text-sky-300/80 border-sky-400/30 bg-sky-500/[0.08]',
  device:       'text-amber-300/80 border-amber-400/30 bg-amber-500/[0.08]',
  clue_device:  'text-violet-300/80 border-violet-400/30 bg-violet-500/[0.08]',
};

export function ProblemModeBadge({
  mode,
  size = 'sm',
}: {
  mode: ProblemMode;
  size?: 'xs' | 'sm';
}) {
  const base = size === 'xs'
    ? 'px-1.5 py-0.5 rounded text-micro'
    : 'px-2 py-0.5 rounded-md text-caption';
  return (
    <span className={`${base} border font-medium ${PROBLEM_MODE_STYLES[mode]}`}>
      {PROBLEM_MODE_LABELS[mode]}
    </span>
  );
}

// ── Answer Type Badge ──────────────────────────────────────────────────────────

const ANSWER_TYPE_STYLES: Record<AnswerType, string> = {
  key:          'text-rose-300/75 border-rose-400/25 bg-rose-500/[0.07]',
  number_4:     'text-white/55 border-white/15 bg-white/[0.04]',
  number_3:     'text-white/55 border-white/15 bg-white/[0.04]',
  alphabet_5:   'text-green-300/70 border-green-400/25 bg-green-500/[0.07]',
  keypad:       'text-cyan-300/70 border-cyan-400/25 bg-cyan-500/[0.07]',
  xkit:         'text-purple-300/80 border-purple-400/30 bg-purple-500/[0.08]',
  auto:         'text-orange-300/70 border-orange-400/25 bg-orange-500/[0.07]',
};

export function AnswerTypeBadge({
  type,
  size = 'sm',
}: {
  type: AnswerType;
  size?: 'xs' | 'sm';
}) {
  const base = size === 'xs'
    ? 'px-1.5 py-0.5 rounded text-micro'
    : 'px-2 py-0.5 rounded-md text-caption';
  return (
    <span className={`${base} border font-medium ${ANSWER_TYPE_STYLES[type]}`}>
      {ANSWER_TYPE_LABELS[type]}
    </span>
  );
}

// ── Answer Type Visual (lock/device representation) ───────────────────────────

export function AnswerTypeVisual({
  type,
  answer,
}: {
  type: AnswerType;
  answer: string;
}) {
  if (type === 'number_4') {
    const digits = answer.replace(/\D/g, '').padEnd(4, '·').slice(0, 4).split('');
    return (
      <div className="flex items-center gap-1.5">
        {digits.map((d, i) => (
          <div
            key={i}
            className="w-8 h-9 flex items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] text-title3 font-mono font-bold text-white/70"
          >
            {d}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'number_3') {
    const digits = answer.replace(/\D/g, '').padEnd(3, '·').slice(0, 3).split('');
    return (
      <div className="flex items-center gap-1.5">
        {digits.map((d, i) => (
          <div
            key={i}
            className="w-9 h-10 flex items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] text-title2 font-mono font-bold text-white/70"
          >
            {d}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'alphabet_5') {
    const chars = answer.toUpperCase().padEnd(5, '·').slice(0, 5).split('');
    return (
      <div className="flex items-center gap-1.5">
        {chars.map((c, i) => (
          <div
            key={i}
            className="w-8 h-9 flex items-center justify-center rounded-lg border border-green-400/20 bg-green-500/[0.06] text-body font-mono font-bold text-green-300/80"
          >
            {c}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'keypad') {
    return (
      <div className="grid grid-cols-3 gap-1">
        {['1','2','3','4','5','6','7','8','9','*','0','#'].map((k) => (
          <div
            key={k}
            className="w-6 h-6 flex items-center justify-center rounded border border-cyan-400/15 bg-cyan-500/[0.05] text-micro text-cyan-300/60 font-mono"
          >
            {k}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'xkit') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-purple-400/25 bg-purple-500/[0.07]">
        <span className="text-title3">📱</span>
        <span className="text-footnote text-purple-300/70 font-medium">X-KIT 앱 입력</span>
      </div>
    );
  }

  if (type === 'key') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-400/20 bg-rose-500/[0.06]">
        <span className="text-title3">🗝</span>
        <span className="text-footnote text-rose-300/70 font-medium">열쇠 슬롯</span>
      </div>
    );
  }

  if (type === 'auto') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-400/20 bg-orange-500/[0.06]">
        <span className="text-title3">⚡</span>
        <span className="text-footnote text-orange-300/70 font-medium">자동 트리거</span>
      </div>
    );
  }

  return null;
}

// ── Output Badge ───────────────────────────────────────────────────────────────

const OUTPUT_STYLES: Record<OutputType, string> = {
  door_open:                'text-emerald-300/80 border-emerald-400/25 bg-emerald-500/[0.07]',
  hidden_compartment_open:  'text-teal-300/75 border-teal-400/25 bg-teal-500/[0.07]',
  led_on:                   'text-yellow-300/80 border-yellow-400/25 bg-yellow-500/[0.07]',
  tv_on:                    'text-blue-300/75 border-blue-400/25 bg-blue-500/[0.07]',
  xkit_guide_revealed:      'text-purple-300/80 border-purple-400/30 bg-purple-500/[0.08]',
  item_acquired:            'text-amber-300/80 border-amber-400/30 bg-amber-500/[0.08]',
  next_room_open:           'text-sky-300/80 border-sky-400/30 bg-sky-500/[0.08]',
  ending_video:             'text-rose-300/80 border-rose-400/30 bg-rose-500/[0.08]',
  escape_clear:             'text-white/80 border-white/30 bg-white/[0.08]',
};

const OUTPUT_ICONS: Record<OutputType, string> = {
  door_open:                '🚪',
  hidden_compartment_open:  '🔓',
  led_on:                   '💡',
  tv_on:                    '📺',
  xkit_guide_revealed:      '📱',
  item_acquired:            '📦',
  next_room_open:           '➡️',
  ending_video:             '🎬',
  escape_clear:             '🏁',
};

export function OutputBadge({ output }: { output: OutputType }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-footnote font-medium ${OUTPUT_STYLES[output]}`}>
      <span>{OUTPUT_ICONS[output]}</span>
      {OUTPUT_LABELS[output]}
    </span>
  );
}

// ── Stage Badge ────────────────────────────────────────────────────────────────

const STAGE_STYLES: Record<StageLabel, string> = {
  기:   'text-sky-300/70 border-sky-400/20 bg-sky-500/[0.06]',
  승:   'text-emerald-300/70 border-emerald-400/20 bg-emerald-500/[0.06]',
  전:   'text-amber-300/70 border-amber-400/20 bg-amber-500/[0.06]',
  반전: 'text-rose-300/75 border-rose-400/25 bg-rose-500/[0.07]',
  결:   'text-violet-300/70 border-violet-400/20 bg-violet-500/[0.06]',
};

export function StageBadge({ label }: { label: StageLabel }) {
  return (
    <span className={`px-1.5 py-0.5 rounded border text-micro font-bold tracking-wider ${STAGE_STYLES[label]}`}>
      {label}
    </span>
  );
}

// ── Room Badge ─────────────────────────────────────────────────────────────────

const ROOM_COLORS = [
  'text-white/50 border-white/[0.10] bg-white/[0.03]',
  'text-sky-300/60 border-sky-400/15 bg-sky-500/[0.04]',
  'text-rose-300/60 border-rose-400/15 bg-rose-500/[0.04]',
  'text-amber-300/60 border-amber-400/15 bg-amber-500/[0.04]',
  'text-emerald-300/60 border-emerald-400/15 bg-emerald-500/[0.04]',
];

export function RoomBadge({ room, rooms }: { room: string; rooms?: string[] }) {
  const idx = rooms ? rooms.indexOf(room) : 0;
  const color = ROOM_COLORS[idx % ROOM_COLORS.length];
  return (
    <span className={`px-1.5 py-0.5 rounded border text-micro font-medium ${color}`}>
      {room}
    </span>
  );
}

// ── Device Subtype Badge ───────────────────────────────────────────────────────

export function DeviceSubtypeBadge({ subtype }: { subtype: DeviceSubtype }) {
  return (
    <span className="px-2 py-0.5 rounded border border-amber-400/20 bg-amber-500/[0.06] text-micro text-amber-300/70 font-medium">
      ⚙ {DEVICE_SUBTYPE_LABELS[subtype]}
    </span>
  );
}
