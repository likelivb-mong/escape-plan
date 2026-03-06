import { useState } from 'react';
import { MOTIVES, METHODS, CLUES, TECHNIQUES } from '../../data/xcapeKnowledge';
import type { InvestigationSelection } from '../../types';

interface InvestigationPickerProps {
  selection: InvestigationSelection;
  onChange: (sel: InvestigationSelection) => void;
}

const CATEGORIES = [
  { key: 'motives' as const, label: '[A] 범행 동기', data: MOTIVES },
  { key: 'methods' as const, label: '[B] 범행 방법', data: METHODS },
  { key: 'clues' as const,   label: '[C] 수사 단서', data: CLUES },
  { key: 'techniques' as const, label: '[D] 수사 기법', data: TECHNIQUES },
] as const;

function subCatLabel(key: string): string {
  return key.replace(/_/g, '/');
}

export default function InvestigationPicker({ selection, onChange }: InvestigationPickerProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggle = (catKey: keyof InvestigationSelection, item: string) => {
    const arr = selection[catKey];
    const next = arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];
    onChange({ ...selection, [catKey]: next });
  };

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      {CATEGORIES.map((cat) => {
        const isOpen = openKey === cat.key;
        const count = selection[cat.key].length;
        return (
          <div key={cat.key} className="border-b border-white/[0.06] last:border-b-0">
            {/* Accordion header */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
              onClick={() => setOpenKey(isOpen ? null : cat.key)}
            >
              <span className="text-xs font-medium text-white/50">{cat.label}</span>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[9px] text-white/50 font-medium">
                    {count}개
                  </span>
                )}
                <svg
                  viewBox="0 0 10 10"
                  className={`w-3 h-3 text-white/20 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M2 3.5L5 6.5L8 3.5" />
                </svg>
              </div>
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div className="px-4 pb-4 max-h-[300px] overflow-y-auto">
                {Object.entries(cat.data).map(([subKey, items]) => (
                  <div key={subKey} className="mb-3 last:mb-0">
                    <p className="text-[10px] text-white/25 font-medium mb-1.5">
                      {subCatLabel(subKey)}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(items as readonly string[]).map((item) => {
                        const selected = selection[cat.key].includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggle(cat.key, item)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 border ${
                              selected
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-white/40 border-white/10 hover:border-white/25 hover:text-white/60'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
