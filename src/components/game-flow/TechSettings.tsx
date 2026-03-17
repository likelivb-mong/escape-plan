import { useState, useRef, useEffect } from 'react';

// ── Labels ──────────────────────────────────────────────────────────────────

export const MODE_OPTIONS = [
  { value: 'clue', label: '단서 탐색' },
  { value: 'device', label: '장치 조작' },
  { value: 'clue_device', label: '단서+장치' },
] as const;

export const ANSWER_OPTIONS = [
  { value: 'key', label: '열쇠' },
  { value: 'number_4', label: '4자리 숫자' },
  { value: 'number_3', label: '3자리 숫자' },
  { value: 'alphabet_5', label: '알파벳 5자리' },
  { value: 'keypad', label: '키패드' },
  { value: 'xkit', label: 'X-KIT' },
  { value: 'auto', label: '자동' },
] as const;

export const OUTPUT_OPTIONS = [
  { value: 'door_open', label: '문 열림' },
  { value: 'hidden_compartment_open', label: '비밀 공간 열림' },
  { value: 'led_on', label: 'LED 점등' },
  { value: 'tv_on', label: 'TV/모니터 재생' },
  { value: 'xkit_guide_revealed', label: 'X-KIT 안내' },
  { value: 'item_acquired', label: '아이템 획득' },
  { value: 'next_room_open', label: '다음 공간 열림' },
  { value: 'ending_video', label: '엔딩 영상' },
  { value: 'escape_clear', label: '탈출 성공' },
] as const;

// Short labels for compact tags
export const MODE_SHORT: Record<string, string> = {
  clue: '단서', device: '장치', clue_device: '복합',
};
export const ANSWER_SHORT: Record<string, string> = {
  key: '열쇠', number_4: '4자리', number_3: '3자리',
  alphabet_5: '영문5', keypad: '키패드', xkit: 'X-KIT', auto: '자동',
};
export const OUTPUT_SHORT: Record<string, string> = {
  door_open: '문열림', hidden_compartment_open: '비밀공간', led_on: 'LED',
  tv_on: 'TV', xkit_guide_revealed: 'X-KIT', item_acquired: '아이템',
  next_room_open: '다음방', ending_video: '엔딩', escape_clear: '탈출',
};

// ── InlineSelect ────────────────────────────────────────────────────────────
// select + "직접입력" hybrid: pick from list or type custom value

interface InlineSelectProps {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
  /** Short display labels for compact mode */
  shortLabels?: Record<string, string>;
  /** Styling class for the tag appearance */
  className?: string;
  /** Compact size (for card tags) */
  compact?: boolean;
}

export function InlineSelect({
  value,
  options,
  onChange,
  shortLabels,
  className = '',
  compact = false,
}: InlineSelectProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isKnownValue = options.some((o) => o.value === value);
  const displayLabel = shortLabels?.[value] ?? options.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    if (customMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [customMode]);

  const handleSelectChange = (selected: string) => {
    if (selected === '__custom__') {
      setCustomMode(true);
      setCustomValue(isKnownValue ? '' : value);
    } else {
      setCustomMode(false);
      onChange(selected);
    }
  };

  const commitCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed) {
      onChange(trimmed);
    }
    setCustomMode(false);
  };

  if (customMode) {
    const inputCls = compact
      ? 'w-[72px] px-1.5 py-[2px] text-[9px] rounded bg-white/[0.08] border border-white/20 text-white/90 outline-none focus:border-white/40 font-medium'
      : 'w-[100px] px-2 py-1 text-[11px] rounded-md bg-white/[0.08] border border-white/20 text-white/90 outline-none focus:border-white/40 font-medium';

    return (
      <input
        ref={inputRef}
        type="text"
        value={customValue}
        onChange={(e) => setCustomValue(e.target.value)}
        onBlur={commitCustom}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitCustom();
          if (e.key === 'Escape') setCustomMode(false);
        }}
        placeholder="입력..."
        className={inputCls}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  const selectCls = compact
    ? `appearance-none cursor-pointer bg-transparent outline-none text-[9px] font-semibold leading-none pr-3 ${className}`
    : `appearance-none cursor-pointer bg-transparent outline-none text-[11px] font-semibold pr-4 ${className}`;

  return (
    <span className="relative inline-flex items-center">
      <select
        value={isKnownValue ? value : '__custom__'}
        onChange={(e) => handleSelectChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className={selectCls}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#1a1a1a] text-white/80">
            {compact ? (shortLabels?.[opt.value] ?? opt.label) : opt.label}
          </option>
        ))}
        <option value="__custom__" className="bg-[#1a1a1a] text-white/80">
          직접입력
        </option>
      </select>
      {/* Dropdown arrow */}
      <svg className={`pointer-events-none absolute right-0 ${compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} text-white/25`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

// ── TechSettingsBar ─────────────────────────────────────────────────────────
// Reusable [방식|입력] ▸ [출력] inline editor

// All tag styles use neutral — no per-type color variation
const MODE_CLS  = 'text-white/55 bg-transparent';
const ANSWER_CLS = 'text-white/55 bg-transparent';
// Output tag is the "result" — slightly brighter to read as destination
const OUTPUT_CLS = 'text-white/65 bg-transparent';

interface TechSettingsBarProps {
  problemMode: string;
  answerType: string;
  output: string;
  onChangeMode?: (v: string) => void;
  onChangeAnswer?: (v: string) => void;
  onChangeOutput?: (v: string) => void;
  compact?: boolean;
}

export function TechSettingsBar({
  problemMode,
  answerType,
  output,
  onChangeMode,
  onChangeAnswer,
  onChangeOutput,
  compact = false,
}: TechSettingsBarProps) {
  const modeCls  = MODE_CLS;
  const answerCls = ANSWER_CLS;
  const outputCls = OUTPUT_CLS;

  if (!onChangeMode && !onChangeAnswer && !onChangeOutput) {
    // Read-only mode
    const modeLabel = MODE_SHORT[problemMode] ?? problemMode;
    const answerLabel = ANSWER_SHORT[answerType] ?? answerType;
    const outputLabel = OUTPUT_SHORT[output] ?? output;

    return (
      <div className="flex items-center gap-0">
        <div className="flex items-center rounded-l border border-r-0 border-white/[0.06] overflow-hidden">
          <span className={`px-1.5 py-[3px] text-[9px] font-semibold leading-none ${modeCls} border-r border-white/[0.06]`}>
            {modeLabel}
          </span>
          <span className={`px-1.5 py-[3px] text-[9px] font-semibold leading-none ${answerCls}`}>
            {answerLabel}
          </span>
        </div>
        <span className="text-[9px] text-white/20 px-1">▸</span>
        <span className={`px-1.5 py-[3px] rounded text-[9px] font-semibold border border-white/[0.06] leading-none ${outputCls}`}>
          {outputLabel}
        </span>
      </div>
    );
  }

  // Editable mode
  return (
    <div className="flex items-center gap-0" onClick={(e) => e.stopPropagation()}>
      <div className={`flex items-center ${compact ? 'rounded-l' : 'rounded-l-md'} border border-r-0 border-white/[0.08] overflow-hidden`}>
        {onChangeMode ? (
          <span className={`${compact ? 'px-1.5 py-[3px]' : 'px-2 py-1'} ${modeCls} border-r border-white/[0.08]`}>
            <InlineSelect
              value={problemMode}
              options={MODE_OPTIONS}
              onChange={onChangeMode}
              shortLabels={compact ? MODE_SHORT : undefined}
              compact={compact}
            />
          </span>
        ) : (
          <span className={`px-1.5 py-[3px] text-[9px] font-semibold leading-none ${modeCls} border-r border-white/[0.08]`}>
            {MODE_SHORT[problemMode] ?? problemMode}
          </span>
        )}
        {onChangeAnswer ? (
          <span className={`${compact ? 'px-1.5 py-[3px]' : 'px-2 py-1'} ${answerCls}`}>
            <InlineSelect
              value={answerType}
              options={ANSWER_OPTIONS}
              onChange={onChangeAnswer}
              shortLabels={compact ? ANSWER_SHORT : undefined}
              compact={compact}
            />
          </span>
        ) : (
          <span className={`px-1.5 py-[3px] text-[9px] font-semibold leading-none ${answerCls}`}>
            {ANSWER_SHORT[answerType] ?? answerType}
          </span>
        )}
      </div>
      <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-white/20 px-1`}>▸</span>
      {onChangeOutput ? (
        <span className={`${compact ? 'px-1.5 py-[3px] rounded' : 'px-2 py-1 rounded-md'} border border-white/[0.08] ${outputCls}`}>
          <InlineSelect
            value={output}
            options={OUTPUT_OPTIONS}
            onChange={onChangeOutput}
            shortLabels={compact ? OUTPUT_SHORT : undefined}
            compact={compact}
          />
        </span>
      ) : (
        <span className={`px-1.5 py-[3px] rounded text-[9px] font-semibold border border-white/[0.08] leading-none ${outputCls}`}>
          {OUTPUT_SHORT[output] ?? output}
        </span>
      )}
    </div>
  );
}
