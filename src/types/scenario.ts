// ── 수사 시나리오 생성기 타입 정의 ───────────────────────────────────────────

/** 카테고리명 → 항목 배열 */
export type CategoryMap = Record<string, string[]>;

/** 드롭다운 하나의 선택 상태 */
export interface CategorySelection {
  category: string;
  item: string;
}

// ── 등장인물 ─────────────────────────────────────────────────────────────────

/** 인물 역할 */
export type CharacterRole = '가해자' | '피해자' | '목격자' | '주변인물' | '공범' | '의뢰인';

export const CHARACTER_ROLES: CharacterRole[] = [
  '가해자', '피해자', '목격자', '주변인물', '공범', '의뢰인',
];

/** 개별 인물 */
export interface Character {
  id: string;
  role: CharacterRole;
  name: string;
}

// ── 폼 상태 ──────────────────────────────────────────────────────────────────

/** 폼 전체 상태 */
export interface ScenarioFormState {
  characters: Character[];   // 가해자·피해자·목격자 등 (추가/삭제/수정 가능)
  location: string;
  motive: CategorySelection;
  crimeType: CategorySelection;
  clue: CategorySelection;
  method: CategorySelection;
  memo: string;
}

/** 시나리오 문장 생성 입력 */
export interface ScenarioBuildInput {
  perpetrator: string;
  victim: string;
  location: string;
  motive: string;
  crimeType: string;
  clue: string;
  method: string;
}

/** 생성된 시나리오 결과 (legacy - 하위 호환) */
export interface ScenarioOutput {
  sentence: string;
  overview: string;
  keyClue: string;
  investigationPoint: string;
}

// ── 블록 기반 구조 (PDF 2-1/2-2 반영) ──────────────────────────────────────

/** 사건 구성 블록 타입 [가][A][나][B][다][C][D] */
export type ScenarioBlockType =
  | 'offender'       // [가] 가해자
  | 'motive'         // [A]  범행동기
  | 'victim'         // [나] 피해자
  | 'crime'          // [B]  범행방법
  | 'location'       // [다] 장소
  | 'clue'           // [C]  수사단서
  | 'investigation'; // [D]  수사기법

/** 사건 구성 개별 블록 */
export interface ScenarioBlock {
  key: string;
  type: ScenarioBlockType;
  label: string;
  badge: string;
  value: string;
  displayText: string;
  isEmpty: boolean;
}

/** 사건 구성 최종 결과 */
export interface ScenarioBuildResult {
  blocks: ScenarioBlock[];
  scenarioText: string;
  summary: {
    caseOverview: string;
    coreClue: string;
    recommendedFocus: string;
  };
}

// ── 초기값 ───────────────────────────────────────────────────────────────────

/** 빈 선택 상태 */
export const EMPTY_SELECTION: CategorySelection = { category: '', item: '' };

/** 폼 초기 상태 */
export const INITIAL_FORM_STATE: ScenarioFormState = {
  characters: [{ id: 'default-1', role: '가해자', name: '' }],
  location: '',
  motive: { ...EMPTY_SELECTION },
  crimeType: { ...EMPTY_SELECTION },
  clue: { ...EMPTY_SELECTION },
  method: { ...EMPTY_SELECTION },
  memo: '',
};
