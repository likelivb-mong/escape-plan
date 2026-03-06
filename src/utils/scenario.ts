// ── 수사 시나리오 생성기 유틸 함수 ───────────────────────────────────────────

import type {
  CategoryMap,
  ScenarioBuildInput,
  ScenarioOutput,
  ScenarioFormState,
  CategorySelection,
  ScenarioBlock,
  ScenarioBlockType,
  ScenarioBuildResult,
} from '../types/scenario';
import { INITIAL_FORM_STATE } from '../types/scenario';
import {
  motives, crimeTypes, clues, investigationMethods,
  RANDOM_PERPETRATORS, RANDOM_VICTIMS, RANDOM_LOCATIONS,
} from '../data/investigationReference';

/** CategoryMap에서 카테고리 목록 반환 */
export function getCategoryOptions(map: CategoryMap): string[] {
  return Object.keys(map);
}

/** CategoryMap에서 특정 카테고리의 항목 목록 반환 */
export function getItemOptions(map: CategoryMap, category: string): string[] {
  return map[category] ?? [];
}

/** 배열에서 랜덤 하나 뽑기 */
export function getRandomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** CategoryMap에서 랜덤 카테고리+항목 선택 */
function randomSelection(map: CategoryMap): CategorySelection {
  const cats = Object.keys(map);
  const category = getRandomItem(cats);
  const items = map[category];
  const item = getRandomItem(items);
  return { category, item };
}

/** 전체 폼 랜덤 채우기 */
export function randomizeForm(): ScenarioFormState {
  return {
    characters: [
      { id: crypto.randomUUID(), role: '가해자', name: getRandomItem(RANDOM_PERPETRATORS) },
      { id: crypto.randomUUID(), role: '피해자', name: getRandomItem(RANDOM_VICTIMS) },
    ],
    location: getRandomItem(RANDOM_LOCATIONS),
    motive: randomSelection(motives),
    crimeType: randomSelection(crimeTypes),
    clue: randomSelection(clues),
    method: randomSelection(investigationMethods),
    memo: '',
  };
}

/** 폼 초기화 */
export function resetScenarioForm(): ScenarioFormState {
  return {
    ...INITIAL_FORM_STATE,
    characters: [{ id: crypto.randomUUID(), role: '가해자', name: '' }],
    motive: { category: '', item: '' },
    crimeType: { category: '', item: '' },
    clue: { category: '', item: '' },
    method: { category: '', item: '' },
  };
}

/** 클립보드 복사 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ── 블록 기반 시나리오 생성 (PDF 2-1/2-2 구조) ─────────────────────────────

interface BlockDef {
  key: string;
  type: ScenarioBlockType;
  label: string;
  badge: string;
}

const BLOCK_DEFS: BlockDef[] = [
  { key: 'offender',      type: 'offender',      label: '가해자',   badge: '가' },
  { key: 'motive',        type: 'motive',        label: '범행동기', badge: 'A' },
  { key: 'victim',        type: 'victim',        label: '피해자',   badge: '나' },
  { key: 'crime',         type: 'crime',         label: '범행방법', badge: 'B' },
  { key: 'location',      type: 'location',      label: '사건장소', badge: '다' },
  { key: 'clue',          type: 'clue',          label: '수사단서', badge: 'C' },
  { key: 'investigation', type: 'investigation', label: '수사기법', badge: 'D' },
];

/** 각 블록의 displayText를 생성 (조사/표현 포함) */
export function formatScenarioBlockText(type: ScenarioBlockType, value: string): string {
  if (!value) return '';

  switch (type) {
    case 'offender':
      return `${value}가`;
    case 'motive':
      return `${value}을 이유로`;
    case 'victim':
      return `${value}을`;
    case 'crime': {
      const hasSuffix = value.includes('사건') || value.includes('발생');
      return hasSuffix ? value : `${value} 사건 발생`;
    }
    case 'location':
      return `${value}에서`;
    case 'clue':
      return `${value}을 찾아내`;
    case 'investigation':
      return `${value}으로 수사`;
    default:
      return value;
  }
}

/** FormState에서 7단계 블록 배열 생성 */
export function buildScenarioBlocks(form: ScenarioFormState): ScenarioBlock[] {
  // 역할별 인물 이름 조합
  const offenderNames = form.characters
    .filter(c => c.role === '가해자' && c.name.trim())
    .map(c => c.name.trim())
    .join(', ');

  const victimNames = form.characters
    .filter(c => c.role === '피해자' && c.name.trim())
    .map(c => c.name.trim())
    .join(', ');

  const valueMap: Record<string, string> = {
    offender:      offenderNames,
    motive:        form.motive.item,
    victim:        victimNames,
    crime:         form.crimeType.item,
    location:      form.location,
    clue:          form.clue.item,
    investigation: form.method.item,
  };

  return BLOCK_DEFS.map((def) => {
    const value = valueMap[def.key] || '';
    const isEmpty = !value;
    return {
      key: def.key,
      type: def.type,
      label: def.label,
      badge: def.badge,
      value,
      displayText: isEmpty ? '' : formatScenarioBlockText(def.type, value),
      isEmpty,
    };
  });
}

/** blocks → 자연스러운 최종 문장 조합 */
function blocksToSentence(blocks: ScenarioBlock[]): string {
  const get = (key: string) => blocks.find((b) => b.key === key);

  const offender = get('offender');
  const motive   = get('motive');
  const victim   = get('victim');
  const crime    = get('crime');
  const location = get('location');
  const clue     = get('clue');
  const investigation = get('investigation');

  const who = offender?.value || '범인';
  const motiveClause  = motive?.value  ? ` ${motive.displayText}` : '';
  const victimClause  = victim?.value  ? ` ${victim.displayText}` : '';
  const locationClause = location?.value ? ` ${location.displayText}` : '';

  let crimeClause: string;
  if (crime?.value) {
    const hasSuffix = crime.value.includes('사건') || crime.value.includes('발생');
    crimeClause = hasSuffix ? ` ${crime.value}.` : ` ${crime.value} 사건을 일으켰다.`;
  } else {
    crimeClause = ' 사건을 일으켰다.';
  }

  let sentence = `${who}가${motiveClause}${victimClause}${locationClause}${crimeClause}`;

  const clueClause = clue?.value ? `${clue.value}를 발견했고` : '';
  const methodClause = investigation?.value ? `${investigation.value} 방식으로 수사가 진행된다` : '';

  if (clueClause && methodClause) {
    sentence += ` 수사 과정에서 ${clueClause}, ${methodClause}.`;
  } else if (clueClause) {
    sentence += ` 수사 과정에서 ${clueClause}.`;
  } else if (methodClause) {
    sentence += ` ${methodClause}.`;
  }

  return sentence.replace(/\s{2,}/g, ' ').trim();
}

/** blocks → 자동 요약 생성 */
function buildSummary(blocks: ScenarioBlock[]): ScenarioBuildResult['summary'] {
  const get = (key: string) => blocks.find((b) => b.key === key)?.value || '';

  const motive    = get('motive');
  const crime     = get('crime');
  const location  = get('location');
  const clue      = get('clue');
  const method    = get('investigation');

  const overviewParts = [
    motive && `${motive}에 의한`,
    crime,
    location && `(${location})`,
  ].filter(Boolean);
  const caseOverview = overviewParts.length > 0
    ? overviewParts.join(' ') + ' 사건'
    : '사건 정보가 부족합니다.';

  const coreClue = clue || '단서 미선택';

  const recommendedFocus = method
    ? `${method}을(를) 활용하여 사건의 핵심 증거를 확보하고 용의자를 추적한다.`
    : '수사 기법 미선택';

  return { caseOverview, coreClue, recommendedFocus };
}

/** 최종 빌드: blocks + scenarioText + summary 반환 */
export function buildScenarioResult(form: ScenarioFormState): ScenarioBuildResult {
  const blocks = buildScenarioBlocks(form);
  const scenarioText = blocksToSentence(blocks);
  const summary = buildSummary(blocks);

  return { blocks, scenarioText, summary };
}

// ── 레거시 호환 ─────────────────────────────────────────────────────────────

export function makeScenario(input: ScenarioBuildInput): ScenarioOutput {
  const { perpetrator, victim, location, motive, crimeType, clue, method } = input;

  const who = perpetrator || '범인';
  const motiveClause = motive ? `${motive}을(를) 이유로` : '';
  const victimClause = victim ? ` ${victim}을(를) 상대로` : '';
  const locationClause = location ? ` ${location}에서` : '';
  const crimeClause = crimeType ? ` ${crimeType} 사건을 일으켰다.` : ' 사건을 일으켰다.';

  let sentence = `${who}가 ${motiveClause}${victimClause}${locationClause}${crimeClause}`;

  if (clue || method) {
    const clueClause = clue ? `${clue}를 발견했고` : '';
    const methodClause = method ? `${method} 방식으로 수사가 진행된다` : '';
    if (clueClause && methodClause) {
      sentence += ` 수사 과정에서 ${clueClause}, ${methodClause}.`;
    } else if (clueClause) {
      sentence += ` 수사 과정에서 ${clueClause}.`;
    } else if (methodClause) {
      sentence += ` ${methodClause}.`;
    }
  }

  sentence = sentence.replace(/\s{2,}/g, ' ').trim();

  const overviewParts = [motive && `${motive}에 의한`, crimeType, location && `(${location})`].filter(Boolean);
  const overview = overviewParts.length > 0 ? overviewParts.join(' ') + ' 사건' : '사건 정보가 부족합니다.';
  const keyClue = clue || '단서 미선택';
  const investigationPoint = method
    ? `${method}을(를) 활용하여 사건의 핵심 증거를 확보하고 용의자를 추적한다.`
    : '수사 기법 미선택';

  return { sentence, overview, keyClue, investigationPoint };
}
