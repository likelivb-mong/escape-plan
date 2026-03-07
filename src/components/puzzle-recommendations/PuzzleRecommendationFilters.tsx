import type { PuzzleFilterState, PuzzleType, PuzzleDifficulty } from '../../types/puzzleRecommendation';
import type { PuzzleFlowStageKey } from '../../types/puzzleFlow';

interface PuzzleRecommendationFiltersProps {
  filters: PuzzleFilterState;
  onChange: (next: PuzzleFilterState) => void;
  stageKeys: string[];
  stageLabels: Record<string, string>;
}

// ── Option lists ──────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: 'all' | PuzzleType; label: string }[] = [
  { value: 'all',         label: '전체 유형' },
  { value: 'text',        label: '텍스트' },
  { value: 'image',       label: '이미지' },
  { value: 'uv',          label: 'UV' },
  { value: 'audio',       label: '음향' },
  { value: 'device',      label: '장치' },
  { value: 'spatial',     label: '공간' },
  { value: 'cooperative', label: '협력' },
];

const DIFFICULTY_OPTIONS: { value: 'all' | PuzzleDifficulty; label: string }[] = [
  { value: 'all',    label: '전체 난이도' },
  { value: 'easy',   label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard',   label: '어려움' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PuzzleRecommendationFilters({
  filters,
  onChange,
  stageKeys,
  stageLabels,
}: PuzzleRecommendationFiltersProps) {
  function set<K extends keyof PuzzleFilterState>(key: K, value: PuzzleFilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex-shrink-0 px-6 py-2.5 border-b border-white/[0.06] flex items-center gap-3 flex-wrap">
      {/* Stage filter */}
      <FilterGroup label="단계">
        <PillGroup
          value={filters.stage}
          options={[
            { value: 'all', label: '전체' },
            ...stageKeys.map((k) => ({ value: k, label: stageLabels[k] ?? k })),
          ]}
          onChange={(v) => set('stage', v)}
        />
      </FilterGroup>

      <Divider />

      {/* Type filter */}
      <FilterGroup label="유형">
        <SelectPill
          value={filters.type}
          options={TYPE_OPTIONS}
          onChange={(v) => set('type', v as PuzzleFilterState['type'])}
        />
      </FilterGroup>

      <Divider />

      {/* Difficulty filter */}
      <FilterGroup label="난이도">
        <SelectPill
          value={filters.difficulty}
          options={DIFFICULTY_OPTIONS}
          onChange={(v) => set('difficulty', v as PuzzleFilterState['difficulty'])}
        />
      </FilterGroup>

      <Divider />

      {/* Show adopted only */}
      <button
        onClick={() => set('showAdoptedOnly', !filters.showAdoptedOnly)}
        className={[
          'flex items-center gap-1.5 px-3 py-1 rounded-full border text-caption transition-all',
          filters.showAdoptedOnly
            ? 'border-emerald-400/30 text-emerald-300/70 bg-emerald-500/[0.08]'
            : 'border-white/[0.10] text-white/35 hover:border-white/20 hover:text-white/55',
        ].join(' ')}
      >
        <span>{filters.showAdoptedOnly ? '✓' : ''} 채택됨만 보기</span>
      </button>

      {/* Reset */}
      {(filters.stage !== 'all' || filters.type !== 'all' || filters.difficulty !== 'all' || filters.showAdoptedOnly) && (
        <button
          onClick={() => onChange({ stage: 'all', type: 'all', difficulty: 'all', showAdoptedOnly: false })}
          className="text-caption text-white/35 hover:text-white/50 transition-colors ml-auto"
        >
          초기화
        </button>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-micro font-bold uppercase tracking-widest text-white/20 flex-shrink-0">
        {label}
      </span>
      {children}
    </div>
  );
}

function Divider() {
  return <span className="w-px h-3 bg-white/[0.08] flex-shrink-0" />;
}

function PillGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={[
            'px-2.5 py-1 rounded-full text-caption transition-all',
            value === o.value
              ? 'bg-white/[0.08] text-white/75 border border-white/[0.15]'
              : 'text-white/30 hover:text-white/55 border border-transparent hover:border-white/[0.08]',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SelectPill({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border border-white/[0.10] rounded-full px-2.5 py-1 text-caption text-white/45 hover:border-white/20 transition-all cursor-pointer outline-none appearance-none pr-5"
      style={{ backgroundImage: 'none' }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0f0f0f] text-white/70">
          {o.label}
        </option>
      ))}
    </select>
  );
}
