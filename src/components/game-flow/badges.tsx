import type { ProblemMode, AnswerType, OutputType, StageLabel, DeviceSubtype } from '../../types/gameFlow';
import {
  PROBLEM_MODE_LABELS,
  ANSWER_TYPE_LABELS,
  OUTPUT_LABELS,
  DEVICE_SUBTYPE_LABELS,
} from '../../utils/gameFlow';

// ── Problem Mode Badge ─────────────────────────────────────────────────────────

const PROBLEM_MODE_STYLES: Record<ProblemMode, string> = {
  clue:         'text-white/55 border-white/[0.10] bg-white/[0.04]',
  device:       'text-white/55 border-white/[0.10] bg-white/[0.04]',
  clue_device:  'text-white/55 border-white/[0.10] bg-white/[0.04]',
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
  key:          'text-white/55 border-white/[0.10] bg-white/[0.04]',
  number_4:     'text-white/55 border-white/[0.10] bg-white/[0.04]',
  number_3:     'text-white/55 border-white/[0.10] bg-white/[0.04]',
  alphabet_5:   'text-white/55 border-white/[0.10] bg-white/[0.04]',
  keypad:       'text-white/55 border-white/[0.10] bg-white/[0.04]',
  xkit:         'text-white/55 border-white/[0.10] bg-white/[0.04]',
  auto:         'text-white/55 border-white/[0.10] bg-white/[0.04]',
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
          <div key={i} className="w-8 h-9 flex items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] text-body font-mono font-bold text-white/75">
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
          <div key={k} className="w-6 h-6 flex items-center justify-center rounded border border-white/[0.10] bg-white/[0.04] text-micro text-white/55 font-mono">
            {k}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'xkit') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.12] bg-white/[0.04]">
        <span className="text-footnote text-white/60 font-medium">X-KIT 앱 입력</span>
      </div>
    );
  }

  if (type === 'key') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.12] bg-white/[0.04]">
        <span className="text-footnote text-white/60 font-medium">열쇠 슬롯</span>
      </div>
    );
  }

  if (type === 'auto') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.12] bg-white/[0.04]">
        <span className="text-footnote text-white/60 font-medium">자동 트리거</span>
      </div>
    );
  }

  return null;
}

// ── Output Badge ───────────────────────────────────────────────────────────────

// Output badge: uniform neutral, slightly brighter as the "result" slot
const OUTPUT_STYLES: Record<OutputType, string> = {
  door_open:                'text-white/65 border-white/[0.12] bg-white/[0.05]',
  hidden_compartment_open:  'text-white/65 border-white/[0.12] bg-white/[0.05]',
  led_on:                   'text-white/65 border-white/[0.12] bg-white/[0.05]',
  tv_on:                    'text-white/65 border-white/[0.12] bg-white/[0.05]',
  xkit_guide_revealed:      'text-white/65 border-white/[0.12] bg-white/[0.05]',
  item_acquired:            'text-white/65 border-white/[0.12] bg-white/[0.05]',
  next_room_open:           'text-white/65 border-white/[0.12] bg-white/[0.05]',
  ending_video:             'text-white/65 border-white/[0.12] bg-white/[0.05]',
  escape_clear:             'text-white/80 border-white/[0.18] bg-white/[0.07]',
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-micro font-medium ${OUTPUT_STYLES[output]}`}>
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
