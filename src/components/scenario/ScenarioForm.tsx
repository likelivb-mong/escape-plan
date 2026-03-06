import type { ScenarioFormState, CategoryMap, Character, CharacterRole } from '../../types/scenario';
import { CHARACTER_ROLES } from '../../types/scenario';
import { motives, crimeTypes, clues, investigationMethods } from '../../data/investigationReference';
import { getCategoryOptions, getItemOptions } from '../../utils/scenario';

interface ScenarioFormProps {
  form: ScenarioFormState;
  onChange: (form: ScenarioFormState) => void;
}

// ── 드롭다운 쌍 설정 ──────────────────────────────────────────────────────────

interface DropdownPairConfig {
  label: string;
  mapData: CategoryMap;
  catKey: 'motive' | 'crimeType' | 'clue' | 'method';
}

const DROPDOWN_PAIRS: DropdownPairConfig[] = [
  { label: '범행 동기', mapData: motives,               catKey: 'motive' },
  { label: '범행 방법', mapData: crimeTypes,             catKey: 'crimeType' },
  { label: '수사 단서', mapData: clues,                  catKey: 'clue' },
  { label: '수사 기법', mapData: investigationMethods,   catKey: 'method' },
];

/** 역할별 배지 색상 */
const ROLE_BADGE: Record<CharacterRole, string> = {
  '가해자':  'bg-rose-500/20 text-rose-300 border-rose-400/30',
  '피해자':  'bg-amber-500/20 text-amber-300 border-amber-400/30',
  '목격자':  'bg-sky-500/20 text-sky-300 border-sky-400/30',
  '주변인물': 'bg-neutral-500/20 text-neutral-300 border-neutral-400/30',
  '공범':    'bg-violet-500/20 text-violet-300 border-violet-400/30',
  '의뢰인':  'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
};

export default function ScenarioForm({ form, onChange }: ScenarioFormProps) {
  const update = (patch: Partial<ScenarioFormState>) => onChange({ ...form, ...patch });

  // ── 인물 핸들러 ──────────────────────────────────────────────────────────

  const addCharacter = () => {
    const newChar: Character = { id: crypto.randomUUID(), role: '가해자', name: '' };
    update({ characters: [...form.characters, newChar] });
  };

  const removeCharacter = (id: string) => {
    update({ characters: form.characters.filter((c) => c.id !== id) });
  };

  const updateCharacter = (id: string, patch: Partial<Character>) => {
    update({
      characters: form.characters.map((c) => c.id === id ? { ...c, ...patch } : c),
    });
  };

  // ── 드롭다운 핸들러 ──────────────────────────────────────────────────────

  const updateCat = (key: DropdownPairConfig['catKey'], category: string) => {
    update({ [key]: { category, item: '' } });
  };

  const updateItem = (key: DropdownPairConfig['catKey'], item: string) => {
    update({ [key]: { ...form[key], item } });
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── 등장인물 ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/40 font-medium tracking-wide uppercase">
            등장인물
          </label>
          <button
            type="button"
            onClick={addCharacter}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-medium text-white/40 hover:text-white/70 hover:border-white/25 transition-all"
          >
            <span className="text-base leading-none">+</span>
            인물 추가
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {form.characters.length === 0 && (
            <p className="text-[11px] text-white/20 italic py-2">
              인물을 추가하세요
            </p>
          )}

          {form.characters.map((char) => (
            <div key={char.id} className="flex items-center gap-2">
              {/* 역할 select */}
              <div className="relative flex-shrink-0">
                <select
                  value={char.role}
                  onChange={(e) => updateCharacter(char.id, { role: e.target.value as CharacterRole })}
                  className={`
                    pl-2.5 pr-6 py-2 rounded-xl border text-[11px] font-medium
                    outline-none appearance-none cursor-pointer transition-all
                    ${ROLE_BADGE[char.role]}
                  `}
                >
                  {CHARACTER_ROLES.map((r) => (
                    <option key={r} value={r} className="bg-neutral-900 text-white">{r}</option>
                  ))}
                </select>
                {/* 화살표 아이콘 */}
                <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] opacity-50">▾</span>
              </div>

              {/* 이름 input */}
              <input
                type="text"
                value={char.name}
                onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                placeholder="이름 입력"
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all"
              />

              {/* 삭제 버튼 */}
              <button
                type="button"
                onClick={() => removeCharacter(char.id)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-white/10 text-white/25 hover:text-white/60 hover:border-white/25 transition-all text-xs"
                aria-label="인물 삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── 장소 ──────────────────────────────────────────────────────────── */}
      <Field label="사건 장소">
        <input
          type="text"
          value={form.location}
          onChange={(e) => update({ location: e.target.value })}
          placeholder="예: 폐교 지하실"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all"
        />
      </Field>

      {/* ── 카테고리 드롭다운 쌍 ──────────────────────────────────────────── */}
      {DROPDOWN_PAIRS.map((cfg) => {
        const sel = form[cfg.catKey];
        const catOptions = getCategoryOptions(cfg.mapData);
        const itemOptions = sel.category ? getItemOptions(cfg.mapData, sel.category) : [];

        return (
          <div key={cfg.catKey}>
            <label className="text-xs text-white/40 font-medium tracking-wide uppercase block mb-1.5">
              {cfg.label}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={sel.category}
                onChange={(e) => updateCat(cfg.catKey, e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-neutral-900">선택하세요</option>
                {catOptions.map((c) => (
                  <option key={c} value={c} className="bg-neutral-900">{c}</option>
                ))}
              </select>
              <select
                value={sel.item}
                onChange={(e) => updateItem(cfg.catKey, e.target.value)}
                disabled={!sel.category}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/30 transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-neutral-900">선택하세요</option>
                {itemOptions.map((it) => (
                  <option key={it} value={it} className="bg-neutral-900">{it}</option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-white/40 font-medium tracking-wide uppercase block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
