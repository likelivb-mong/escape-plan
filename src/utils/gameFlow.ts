import type { StoryProposal } from '../types/story';
import type { MandalartCellData } from '../types/mandalart';
import type {
  GameFlowPlan,
  GameFlowStep,
  ProblemMode,
  AnswerType,
  DeviceSubtype,
  OutputType,
  StageLabel,
} from '../types/gameFlow';

// ── Default rooms ─────────────────────────────────────────────────────────────

const DEFAULT_ROOMS = ['수사실', '처치실', '할머니 방', '골목', '공용 부엌'];

// ── Mandalart → structured keyword extraction ────────────────────────────────
// Sub-goal block mapping: sub-goal position (row,col) → expansion block rows/cols
// 분위기(3,3)→(0,0) 스토리(3,4)→(0,1) 퍼즐(3,5)→(0,2)
// 인물(4,3)→(1,0)                      단서(4,5)→(1,2)
// 장치(5,3)→(2,0) 공간(5,4)→(2,1)    반전(5,5)→(2,2)

interface MandalartBlock {
  label: string;
  keywords: string[];
}

export interface MandalartStructure {
  mainTheme: string;
  분위기: MandalartBlock;
  스토리: MandalartBlock;
  퍼즐: MandalartBlock;
  인물: MandalartBlock;
  단서: MandalartBlock;
  장치: MandalartBlock;
  공간: MandalartBlock;
  반전: MandalartBlock;
}

const SUBGOAL_BLOCK_MAP: { label: string; sgRow: number; sgCol: number; br: number; bc: number }[] = [
  { label: '분위기', sgRow: 3, sgCol: 3, br: 0, bc: 0 },
  { label: '스토리', sgRow: 3, sgCol: 4, br: 0, bc: 1 },
  { label: '퍼즐',   sgRow: 3, sgCol: 5, br: 0, bc: 2 },
  { label: '인물',   sgRow: 4, sgCol: 3, br: 1, bc: 0 },
  { label: '단서',   sgRow: 4, sgCol: 5, br: 1, bc: 2 },
  { label: '장치',   sgRow: 5, sgCol: 3, br: 2, bc: 0 },
  { label: '공간',   sgRow: 5, sgCol: 4, br: 2, bc: 1 },
  { label: '반전',   sgRow: 5, sgCol: 5, br: 2, bc: 2 },
];

/**
 * Extract structured keywords from mandalart cells organized by sub-goal block.
 * Each block's action items become keywords for that category.
 */
export function extractMandalartStructure(cells: MandalartCellData[]): MandalartStructure {
  const cellMap = new Map<string, MandalartCellData>();
  for (const c of cells) cellMap.set(`${c.row}-${c.col}`, c);

  const mainCell = cellMap.get('4-4');
  const mainTheme = mainCell?.text?.trim() || '';

  const result: Record<string, MandalartBlock> = {};

  for (const { label, br, bc } of SUBGOAL_BLOCK_MAP) {
    const minRow = br * 3;
    const maxRow = minRow + 2;
    const minCol = bc * 3;
    const maxCol = minCol + 2;
    const centerRow = br * 3 + 1;
    const centerCol = bc * 3 + 1;

    const keywords: string[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r === centerRow && c === centerCol) continue; // skip center (linked cell)
        const cell = cellMap.get(`${r}-${c}`);
        if (cell?.text?.trim()) keywords.push(cell.text.trim());
      }
    }
    result[label] = { label, keywords };
  }

  return {
    mainTheme,
    분위기: result['분위기'],
    스토리: result['스토리'],
    퍼즐: result['퍼즐'],
    인물: result['인물'],
    단서: result['단서'],
    장치: result['장치'],
    공간: result['공간'],
    반전: result['반전'],
  };
}

/**
 * Extract room names from the 공간 block of the mandalart.
 * Falls back to DEFAULT_ROOMS if no rooms are found.
 */
export function extractRoomsFromMandalart(cells: MandalartCellData[]): string[] {
  const structure = extractMandalartStructure(cells);
  const rooms = structure.공간.keywords.filter((k) => k.length > 0);
  return rooms.length > 0 ? rooms : DEFAULT_ROOMS;
}

// ── Step count by playtime ────────────────────────────────────────────────────

function parsePlaytime(playtime: string): number {
  const m = playtime.match(/\d+/);
  return m ? parseInt(m[0], 10) : 60;
}

function calcTotalSteps(minutes: number): number {
  if (minutes >= 80) return 40;
  if (minutes >= 70) return 30;
  return 20; // 60분 기본
}

type FiveTuple = [number, number, number, number, number];
const STAGE_ORDER: StageLabel[] = ['기', '승', '전', '반전', '결'];

/**
 * 기:15% / 승:25% / 전:25% / 반전:20% / 결:15%
 */
function distributeSteps(total: number): FiveTuple {
  const ratios: FiveTuple = [0.15, 0.25, 0.25, 0.20, 0.15];
  const raw = ratios.map((r) => Math.max(2, Math.round(total * r))) as FiveTuple;
  // Correct rounding drift on 승 (index 1)
  const drift = total - (raw[0] + raw[1] + raw[2] + raw[3] + raw[4]);
  raw[1] += drift;
  return raw;
}

// ── Blueprint pools (per stage) ──────────────────────────────────────────────

interface StepBlueprint {
  problemMode: ProblemMode;
  answerType: AnswerType;
  deviceSubtype?: DeviceSubtype;
  output: OutputType;
  inputLabel: string;
}

const POOL_기: StepBlueprint[] = [
  { problemMode: 'clue', answerType: 'number_4', output: 'hidden_compartment_open', inputLabel: '서랍 속 4자리 숫자 자물쇠' },
  { problemMode: 'clue', answerType: 'alphabet_5', output: 'item_acquired', inputLabel: '캐비닛 알파벳 5자리 자물쇠' },
  { problemMode: 'clue', answerType: 'key', output: 'door_open', inputLabel: '열쇠 슬롯' },
  { problemMode: 'clue_device', answerType: 'keypad', deviceSubtype: 'keypad_device', output: 'hidden_compartment_open', inputLabel: '전자 키패드 패널' },
  { problemMode: 'clue', answerType: 'number_3', output: 'item_acquired', inputLabel: '3자리 숫자 자물쇠' },
  { problemMode: 'device', answerType: 'auto', deviceSubtype: 'sensor', output: 'led_on', inputLabel: '센서 반응 트리거' },
];

const POOL_승: StepBlueprint[] = [
  { problemMode: 'clue_device', answerType: 'keypad', deviceSubtype: 'keypad_device', output: 'door_open', inputLabel: '전자 키패드 패널' },
  { problemMode: 'device', answerType: 'xkit', deviceSubtype: 'light', output: 'xkit_guide_revealed', inputLabel: 'X-KIT 폰 앱' },
  { problemMode: 'clue', answerType: 'key', output: 'door_open', inputLabel: '문 열쇠 슬롯' },
  { problemMode: 'clue', answerType: 'number_4', output: 'hidden_compartment_open', inputLabel: '보관함 4자리 자물쇠' },
  { problemMode: 'clue_device', answerType: 'number_3', deviceSubtype: 'sensor', output: 'next_room_open', inputLabel: '센서 3자리 자물쇠' },
  { problemMode: 'device', answerType: 'auto', deviceSubtype: 'auto_trigger', output: 'led_on', inputLabel: '자동 조명 트리거' },
  { problemMode: 'clue', answerType: 'alphabet_5', output: 'item_acquired', inputLabel: '해독 알파벳 자물쇠' },
  { problemMode: 'clue_device', answerType: 'keypad', deviceSubtype: 'magnet', output: 'hidden_compartment_open', inputLabel: '자석 패널 + 키패드' },
];

const POOL_전: StepBlueprint[] = [
  { problemMode: 'device', answerType: 'auto', deviceSubtype: 'auto_trigger', output: 'led_on', inputLabel: '자동 조명 트리거' },
  { problemMode: 'clue_device', answerType: 'number_3', deviceSubtype: 'sensor', output: 'next_room_open', inputLabel: '센서 3자리 자물쇠' },
  { problemMode: 'clue', answerType: 'number_4', output: 'hidden_compartment_open', inputLabel: '전환점 4자리 자물쇠' },
  { problemMode: 'device', answerType: 'auto', deviceSubtype: 'hidden_door', output: 'hidden_compartment_open', inputLabel: '숨겨진 공간 탐지' },
  { problemMode: 'clue_device', answerType: 'keypad', deviceSubtype: 'keypad_device', output: 'door_open', inputLabel: '비밀번호 키패드' },
  { problemMode: 'device', answerType: 'auto', deviceSubtype: 'light', output: 'tv_on', inputLabel: 'UV 라이트 반응' },
  { problemMode: 'clue', answerType: 'key', output: 'next_room_open', inputLabel: '특수 열쇠 슬롯' },
  { problemMode: 'clue', answerType: 'alphabet_5', output: 'item_acquired', inputLabel: '암호 해독 자물쇠' },
];

const POOL_반전: StepBlueprint[] = [
  { problemMode: 'clue', answerType: 'xkit', output: 'xkit_guide_revealed', inputLabel: 'X-KIT 폰 앱' },
  { problemMode: 'device', answerType: 'auto', deviceSubtype: 'hidden_door', output: 'hidden_compartment_open', inputLabel: '숨겨진 문 자동 개방' },
  { problemMode: 'clue', answerType: 'number_4', output: 'hidden_compartment_open', inputLabel: '반전 4자리 자물쇠' },
  { problemMode: 'device', answerType: 'auto', deviceSubtype: 'sensor', output: 'led_on', inputLabel: '센서 반응 연출' },
  { problemMode: 'clue_device', answerType: 'keypad', deviceSubtype: 'keypad_device', output: 'next_room_open', inputLabel: '반전 키패드 패널' },
  { problemMode: 'clue', answerType: 'number_3', output: 'item_acquired', inputLabel: '숨겨진 3자리 자물쇠' },
];

const POOL_결: StepBlueprint[] = [
  { problemMode: 'clue_device', answerType: 'number_4', deviceSubtype: 'keypad_device', output: 'ending_video', inputLabel: '최종 4자리 번호 자물쇠' },
  { problemMode: 'device', answerType: 'auto', deviceSubtype: 'auto_trigger', output: 'escape_clear', inputLabel: '탈출 자동장치 트리거' },
  { problemMode: 'clue', answerType: 'key', output: 'door_open', inputLabel: '최종 열쇠 슬롯' },
  { problemMode: 'clue_device', answerType: 'keypad', deviceSubtype: 'keypad_device', output: 'hidden_compartment_open', inputLabel: '최종 키패드 입력' },
  { problemMode: 'clue', answerType: 'alphabet_5', output: 'item_acquired', inputLabel: '최종 알파벳 해독' },
  { problemMode: 'clue', answerType: 'number_3', output: 'ending_video', inputLabel: '엔딩 3자리 코드' },
];

const BLUEPRINT_POOLS: Record<StageLabel, StepBlueprint[]> = {
  '기': POOL_기,
  '승': POOL_승,
  '전': POOL_전,
  '반전': POOL_반전,
  '결': POOL_결,
};

// ── Answer pools ─────────────────────────────────────────────────────────────

const ANSWER_POOLS: Record<string, string[]> = {
  number_4: ['1947', '3614', '7829', '5204', '9631', '4187', '2756', '6043', '8812', '1124'],
  number_3: ['428', '715', '392', '861', '573', '249', '637', '184'],
  alphabet_5: ['TRUTH', 'GHOST', 'NERVE', 'ALIVE', 'CHASE', 'FLAME', 'TRACE', 'BLIND'],
  key: ['(열쇠 획득)', '(특수 열쇠 획득)', '(마스터키 획득)'],
  keypad: ['8812', '4627', '1953', '7340', '5918', '2064'],
  auto: ['(자동 반응)', '(자동 트리거)', '(자동 개방)', '(센서 반응)', '(자동 조명)'],
};

// ── Clue title templates per stage ──────────────────────────────────────────

const TITLE_TEMPLATES: Record<StageLabel, string[]> = {
  '기': [
    '{perp}의 초기 흔적 분석',
    '사건 기록부 해독',
    '현장 초기 증거물 확인',
    '진입 코드 해제',
    '{scene} 첫 번째 단서',
    '암호화된 명찰 분석',
    '초기 현장 보존 자료',
    '사건 접수 기록 해독',
  ],
  '승': [
    '{victim} 관련 기록 해독',
    'UV 자외선 벽면 메시지',
    '숨겨진 연결 단서 해독',
    '심층 증거물 분석',
    '{scene} 추가 단서 확보',
    '증인 진술 기록 분석',
    '중간 보고서 암호 해제',
    '교차 검증 단서 조합',
  ],
  '전': [
    '오르골 멜로디 시퀀스',
    '{scene} 건물번호 암호',
    '전환점 — 숨겨진 공간 탐색',
    '비밀 통로 발견',
    '핵심 증거물 연결',
    '위장된 단서 해독',
    '새로운 공간 진입 코드',
    '시간순 단서 재배열',
  ],
  '반전': [
    '{victim}의 마지막 메시지',
    '진실 — 숨겨진 공모 관계',
    '반전 증거물 확보',
    '위조된 기록 발견',
    '{perp}의 숨겨진 동기',
    '최종 진술 해독',
  ],
  '결': [
    '최종 암호 — 전 단계 단서 집약',
    '탈출 시퀀스 가동',
    '마스터 퍼즐 해제',
    '최종 탈출 코드',
    '엔딩 트리거 해제',
    '진실 공개 시퀀스',
  ],
};

// ── Notes templates per stage ────────────────────────────────────────────────

const NOTES_TEMPLATES: Record<StageLabel, string[]> = {
  '기': [
    '기 도입부 — 플레이어가 사건의 실마리를 처음 접하는 장면.',
    '기 초반 — 기본 탐색과 초기 단서 수집 구간.',
    '기 진입 — 현장의 분위기를 파악하고 첫 퍼즐을 만나는 단계.',
  ],
  '승': [
    '승 전개 — 단서가 연결되기 시작하며 긴장감이 높아지는 구간.',
    '승 심화 — 복합 퍼즐과 장치 조작이 결합되는 단계.',
    '승 확장 — 새로운 공간과 정보가 드러나는 구간.',
  ],
  '전': [
    '전 전환 — 분위기가 급변하며 새로운 사실이 드러나는 구간.',
    '전 확장 — 숨겨진 공간과 비밀이 밝혀지는 클라이맥스 직전.',
    '전 심화 — 이전 단서들이 재해석되는 구간.',
  ],
  '반전': [
    '반전 핵심 — 기존 가설이 뒤집히며 진실이 드러나는 구간.',
    '반전 충격 — 예상치 못한 사실이 밝혀지는 극적 순간.',
    '반전 재해석 — 모든 단서가 새로운 관점으로 재조명되는 구간.',
  ],
  '결': [
    '결 마무리 — 전 단계 단서를 통합하여 최종 해결하는 구간.',
    '결 탈출 — 마지막 퍼즐 해제 후 탈출 시퀀스 가동.',
    '결 엔딩 — 최종 코드 입력으로 사건이 종결되는 구간.',
  ],
};

// ── xkit prompt/answer pools ──────────────────────────────────────────────────

const XKIT_POOL = [
  { prompt: '벽에 숨겨진 진실을 붙여쓰기 없이 입력하세요', answer: '존속방관', guide: '할머니 방 침대 밑 왼쪽 구석을 조사하세요' },
  { prompt: '메시지 카드에 적힌 문장을 붙여쓰기로 입력하세요', answer: '나는범인이아니다', guide: '공용 부엌 냉장고 안쪽 세 번째 칸을 확인하세요' },
  { prompt: '사진 뒷면에 적힌 단어를 입력하세요', answer: '무죄', guide: '다음 방 서랍 밑바닥을 확인하세요' },
  { prompt: '거울에 비친 글자를 바르게 입력하세요', answer: '진실은반대다', guide: '벽면 세 번째 타일을 눌러보세요' },
  { prompt: '손편지의 마지막 문장 키워드를 입력하세요', answer: '용서해줘', guide: '장롱 윗칸 오른쪽을 확인하세요' },
];

// ── Keyword extraction from mandalart cells ─────────────────────────────────

function pickN<T>(arr: T[], n: number, offset = 0): T[] {
  if (arr.length === 0) return [];
  return Array.from({ length: Math.min(n, arr.length) }, (_, i) => arr[(i + offset) % arr.length]);
}

/**
 * Build clueTags and deviceTags per stage using structured mandalart blocks.
 * Maps sub-goal categories to game flow elements:
 * - 단서 block → clueTags (primary clue source)
 * - 장치 block → deviceTags (primary device source)
 * - 퍼즐 block → clueTags (puzzle-type clues)
 * - 반전 block → clueTags for twist stages
 * - 인물 block → character references
 * - 분위기 block → atmosphere notes
 */
function getStageKeywordsFromStructure(
  stage: StageLabel,
  ms: MandalartStructure,
  offset: number,
): { clueTags: string[]; deviceTags: string[] } {
  switch (stage) {
    case '기':
      return {
        clueTags: [...pickN(ms.단서.keywords, 2, offset), ...pickN(ms.분위기.keywords, 1, offset)],
        deviceTags: pickN(ms.장치.keywords, 1, offset),
      };
    case '승':
      return {
        clueTags: [...pickN(ms.단서.keywords, 2, offset + 2), ...pickN(ms.퍼즐.keywords, 1, offset), ...pickN(ms.인물.keywords, 1, offset)],
        deviceTags: pickN(ms.장치.keywords, 2, offset + 1),
      };
    case '전':
      return {
        clueTags: [...pickN(ms.퍼즐.keywords, 2, offset + 2), ...pickN(ms.단서.keywords, 1, offset + 4)],
        deviceTags: pickN(ms.장치.keywords, 2, offset + 3),
      };
    case '반전':
      return {
        clueTags: [...pickN(ms.반전.keywords, 2, offset), ...pickN(ms.단서.keywords, 1, offset + 6), ...pickN(ms.인물.keywords, 1, offset + 2)],
        deviceTags: pickN(ms.장치.keywords, 1, offset + 5),
      };
    case '결':
      return {
        clueTags: [...pickN(ms.단서.keywords, 2, offset + 8), ...pickN(ms.반전.keywords, 1, offset + 3)],
        deviceTags: pickN(ms.장치.keywords, 1, offset + 7),
      };
    default:
      return { clueTags: [], deviceTags: [] };
  }
}

// ── Room assignment per stage ────────────────────────────────────────────────

function getRoomForStep(
  stage: StageLabel,
  stepInStage: number,
  rooms: string[],
): string {
  const r = rooms.length > 0 ? rooms : DEFAULT_ROOMS;
  const safeIdx = (i: number) => r[Math.min(i, r.length - 1)];

  switch (stage) {
    case '기':   return safeIdx(stepInStage % 2 === 0 ? 0 : Math.min(1, r.length - 1));
    case '승':   return safeIdx(stepInStage % 2 === 0 ? Math.min(1, r.length - 1) : Math.min(2, r.length - 1));
    case '전':   return safeIdx(stepInStage % 2 === 0 ? Math.min(2, r.length - 1) : Math.min(3, r.length - 1));
    case '반전': return safeIdx(stepInStage % 2 === 0 ? Math.min(3, r.length - 1) : Math.min(4, r.length - 1));
    case '결':   return safeIdx(Math.min(4, r.length - 1));
    default:     return r[0];
  }
}

// ── Dynamic content builder ──────────────────────────────────────────────────

function buildDynamicContent(
  blueprint: StepBlueprint,
  stage: StageLabel,
  stepInStage: number,
  story: StoryProposal,
  stageTags: { clueTags: string[]; deviceTags: string[] },
): {
  clueTitle: string;
  answer: string;
  clueTags: string[];
  deviceTags: string[];
  notes: string;
  xkitPrompt?: string;
  xkitAnswer?: string;
  xkitNextGuide?: string;
} {
  const inv = story.investigation;
  const perp = inv?.perpetrator ?? '용의자';
  const victim = inv?.victim ?? '피해자';
  const scene = inv?.scene ?? '현장';

  // Clue title
  const titlePool = TITLE_TEMPLATES[stage];
  const rawTitle = titlePool[stepInStage % titlePool.length];
  const clueTitle = rawTitle
    .replace('{perp}', perp)
    .replace('{victim}', victim)
    .replace('{scene}', scene);

  // Answer
  const answerPool = ANSWER_POOLS[blueprint.answerType] ?? ['(정답)'];
  let answer = answerPool[stepInStage % answerPool.length];

  // For xkit, use investigation data
  if (blueprint.answerType === 'xkit') {
    const xkitData = XKIT_POOL[stepInStage % XKIT_POOL.length];
    if (inv?.motive) answer = inv.motive;
    else answer = xkitData.answer;
  }

  // Tags: merge blueprint-implied + mandalart keywords
  const baseClueTags = stageTags.clueTags.length > 0
    ? stageTags.clueTags.slice(0, 3)
    : [scene, '단서'];
  const baseDeviceTags = stageTags.deviceTags.length > 0
    ? stageTags.deviceTags.slice(0, 2)
    : blueprint.deviceSubtype ? [blueprint.inputLabel] : [];

  // Notes
  const notesPool = NOTES_TEMPLATES[stage];
  const notes = notesPool[stepInStage % notesPool.length];

  // xkit fields
  let xkitPrompt: string | undefined;
  let xkitAnswer: string | undefined;
  let xkitNextGuide: string | undefined;
  if (blueprint.answerType === 'xkit') {
    const xd = XKIT_POOL[stepInStage % XKIT_POOL.length];
    xkitPrompt = xd.prompt;
    xkitAnswer = answer;
    xkitNextGuide = xd.guide;
  }

  return {
    clueTitle,
    answer,
    clueTags: baseClueTags,
    deviceTags: baseDeviceTags,
    notes,
    xkitPrompt,
    xkitAnswer,
    xkitNextGuide,
  };
}

// ── Main generator ────────────────────────────────────────────────────────────

export function generateGameFlowFromStory(
  story: StoryProposal,
  cells: MandalartCellData[] = [],
  rooms?: string[],
): GameFlowPlan {
  const minutes = parsePlaytime(story.meta.playtime);
  const totalSteps = calcTotalSteps(minutes);
  const stepDist = distributeSteps(totalSteps);

  // Extract structured mandalart data
  const ms = cells.length > 0 ? extractMandalartStructure(cells) : null;

  // Use mandalart 공간 block for rooms, then explicit rooms, then defaults
  const effectiveRooms = rooms && rooms.length > 0
    ? rooms
    : ms && ms.공간.keywords.length > 0
    ? ms.공간.keywords
    : DEFAULT_ROOMS;

  const steps: GameFlowStep[] = [];
  let stepNumber = 1;

  STAGE_ORDER.forEach((stage, stageIdx) => {
    const count = stepDist[stageIdx];
    const pool = BLUEPRINT_POOLS[stage];

    for (let i = 0; i < count; i++) {
      const blueprint = pool[i % pool.length];
      const room = getRoomForStep(stage, i, effectiveRooms);
      const stageTags = ms
        ? getStageKeywordsFromStructure(stage, ms, i)
        : { clueTags: [], deviceTags: [] };
      const content = buildDynamicContent(blueprint, stage, i, story, stageTags);

      steps.push({
        id: `step-${story.id}-${stepNumber}`,
        stepNumber,
        room,
        stageLabel: stage,
        clueTitle: content.clueTitle,
        problemMode: blueprint.problemMode,
        answerType: blueprint.answerType,
        deviceSubtype: blueprint.deviceSubtype ?? null,
        inputLabel: blueprint.inputLabel,
        answer: content.answer,
        output: blueprint.output,
        clueTags: content.clueTags,
        deviceTags: content.deviceTags,
        notes: content.notes,
        ...(blueprint.answerType === 'xkit' ? {
          xkitPrompt: content.xkitPrompt,
          xkitAnswer: content.xkitAnswer,
          xkitNextGuide: content.xkitNextGuide,
        } : {}),
      });

      stepNumber++;
    }
  });

  // Ensure last step is always escape_clear
  if (steps.length > 0) {
    const last = steps[steps.length - 1];
    if (last.output !== 'escape_clear') {
      steps[steps.length - 1] = { ...last, output: 'escape_clear' };
    }
  }

  return {
    storyId: story.id,
    title: story.title,
    rooms: effectiveRooms,
    steps,
  };
}

export async function regenerateGameFlow(
  story: StoryProposal,
  cells: MandalartCellData[] = [],
): Promise<GameFlowPlan> {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
  // Rooms are now auto-derived from mandalart 공간 block inside generateGameFlowFromStory
  return generateGameFlowFromStory(story, cells);
}

// ── Add step to stage ────────────────────────────────────────────────────────

export function createEmptyStep(
  stageLabel: StageLabel,
  room: string,
  stepNumber: number,
): GameFlowStep {
  return {
    id: `step-new-${Date.now()}-${stepNumber}`,
    stepNumber,
    room,
    stageLabel,
    clueTitle: '새 단서',
    problemMode: 'clue',
    answerType: 'number_4',
    deviceSubtype: null,
    inputLabel: '4자리 숫자 자물쇠',
    answer: '0000',
    output: 'item_acquired',
    clueTags: [],
    deviceTags: [],
    notes: '',
  };
}

export function addStepToStage(
  plan: GameFlowPlan,
  stageLabel: StageLabel,
): GameFlowPlan {
  // Find the last step of this stage
  let insertIdx = -1;
  for (let i = plan.steps.length - 1; i >= 0; i--) {
    if (plan.steps[i].stageLabel === stageLabel) {
      insertIdx = i + 1;
      break;
    }
  }
  if (insertIdx < 0) insertIdx = plan.steps.length;

  // Use the room of the last step in this stage, or first room
  const lastInStage = plan.steps.filter((s) => s.stageLabel === stageLabel);
  const room = lastInStage.length > 0
    ? lastInStage[lastInStage.length - 1].room
    : plan.rooms[0] ?? DEFAULT_ROOMS[0];

  const newStep = createEmptyStep(stageLabel, room, insertIdx + 1);

  // Insert and renumber
  const newSteps = [...plan.steps];
  newSteps.splice(insertIdx, 0, newStep);

  // Renumber all steps
  const renumbered = newSteps.map((s, i) => ({
    ...s,
    stepNumber: i + 1,
  }));

  return { ...plan, steps: renumbered };
}

// ── Label/display helpers ─────────────────────────────────────────────────────

export const PROBLEM_MODE_LABELS: Record<string, string> = {
  clue: '단서 해석',
  device: '장치 조작',
  clue_device: '단서 + 장치',
};

export const ANSWER_TYPE_LABELS: Record<string, string> = {
  key: '열쇠',
  number_4: '숫자 4자리',
  number_3: '숫자 3자리',
  alphabet_5: '알파벳 5자리',
  keypad: '키패드',
  xkit: 'X-KIT 앱',
  auto: '자동 트리거',
};

export const OUTPUT_LABELS: Record<string, string> = {
  door_open: '문 열림',
  hidden_compartment_open: '숨겨진 공간 개방',
  led_on: 'LED 점등',
  tv_on: 'TV 가동',
  xkit_guide_revealed: 'X-KIT 가이드 해제',
  item_acquired: '아이템 획득',
  next_room_open: '다음 공간 개방',
  ending_video: '엔딩 영상',
  escape_clear: '탈출 완료',
};

export const DEVICE_SUBTYPE_LABELS: Record<string, string> = {
  electronic_pen: '전자 펜',
  magnet: '자석',
  tagging: '태깅',
  sensor: '센서',
  light: 'UV 라이트',
  tv: 'TV',
  moving_room: '이동 공간',
  hidden_door: '숨겨진 문',
  auto_trigger: '자동 트리거',
  keypad_device: '키패드 장치',
  phone_device: '폰 장치',
  other: '기타',
};

export const STAGE_LABELS: Record<string, string> = {
  기: '기 (Intro)',
  승: '승 (Development)',
  전: '전 (Expansion)',
  반전: '반전 (Twist)',
  결: '결 (Ending)',
};

// ── AI-powered Game Flow Generation ──────────────────────────────────────────

import { GoogleGenerativeAI } from '@google/generative-ai';

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];

function buildMandalaPrompt(keywords: MandalartCellData[], story: StoryProposal): string {
  // Extract structured mandalart data organized by sub-goal block
  const ms = extractMandalartStructure(keywords);

  const blockEntries = [
    { label: '분위기 (Atmosphere)', kw: ms.분위기.keywords },
    { label: '스토리 (Story Arc)', kw: ms.스토리.keywords },
    { label: '퍼즐 (Puzzles)', kw: ms.퍼즐.keywords },
    { label: '인물 (Characters)', kw: ms.인물.keywords },
    { label: '단서 (Clues)', kw: ms.단서.keywords },
    { label: '장치 (Devices)', kw: ms.장치.keywords },
    { label: '공간 (Rooms/Spaces)', kw: ms.공간.keywords },
    { label: '반전 (Twists)', kw: ms.반전.keywords },
  ];

  let kwCtx = '';
  for (const { label, kw } of blockEntries) {
    if (kw.length) kwCtx += `- ${label}: ${kw.join(', ')}\n`;
  }

  // Room names from 공간 block
  const roomNames = ms.공간.keywords.length > 0
    ? ms.공간.keywords.join(', ')
    : DEFAULT_ROOMS.join(', ');

  // Investigation context
  const inv = story.investigation;
  const invCtx = inv
    ? `\n【수사 정보】\n- 범행동기: ${inv.motive ?? '미정'}\n- 용의자: ${inv.perpetrator ?? '미정'}\n- 피해자: ${inv.victim ?? '미정'}\n- 현장: ${inv.scene ?? '미정'}`
    : '';

  return `당신은 XCAPE 방탈출 게임 플로우 설계 전문가입니다.
아래 스토리, 수사 정보, 만다라트 키워드를 활용하여 방탈출 게임의 스텝 플로우를 설계하세요.

【스토리】
제목: ${story.title}
메인 테마: ${ms.mainTheme || story.title}
설명: ${story.description}
${invCtx}

【만다라트 키워드 (하위목표별)】
${kwCtx}

【중요 설계 규칙】
1. **공간(Room) 연동**: 반드시 아래 공간 이름을 Room으로 사용하세요. 임의의 방 이름을 만들지 마세요.
   사용할 공간: ${roomNames}
2. **단서 연동**: '단서' 블록의 키워드를 각 스텝의 단서/힌트에 직접 활용하세요.
3. **장치 연동**: '장치' 블록의 키워드를 실제 장치 유형과 매칭하세요.
4. **인물 연동**: '인물' 블록의 캐릭터를 스텝 내러티브에 등장시키세요.
5. **퍼즐 연동**: '퍼즐' 블록의 키워드를 퍼즐 디자인에 반영하세요.
6. **스토리 개연성**: '스토리'와 '반전' 키워드로 기승전반전결의 서사적 흐름을 만드세요.
7. **분위기 연출**: '분위기' 키워드를 각 스텝의 연출/설명에 활용하세요.

【스테이지 구조 (기승전반전결)】
- 기 (Intro): 첫 공간 진입, 기본 탐색, 초기 단서 — 호기심 유발
- 승 (Development): 단서 연결, 복합 퍼즐, 새 공간 이동 — 몰입 심화
- 전 (Expansion): 전환점, 숨겨진 공간 발견, 핵심 증거 — 클라이맥스 접근
- 반전 (Twist): 진실 드러남, 기존 가설 뒤집힘 — 충격과 재해석
- 결 (Ending): 전 단계 통합, 최종 퍼즐, 탈출 — 만족스러운 결말

각 스테이지별 8~10개 스텝, 총 40개 이상 생성하세요.

JSON 형식으로 다음과 같이 응답하세요:
{
  "steps": [
    {
      "stepNumber": 1,
      "stageLabel": "기",
      "title": "스텝 제목",
      "description": "퍼즐 상황 설명 (플레이어가 이 공간에서 마주하는 상황을 구체적으로)",
      "puzzleSetup": "문제 설정 (어떤 퍼즐이 어떻게 배치되어 있고, 플레이어가 무엇을 발견/조사해야 하는지)",
      "puzzleSolution": "풀이 방법 (정답에 도달하기 위한 단계별 과정, 어떤 단서를 조합하면 정답이 나오는지)",
      "answer": "정답 (예: 1234, OPEN, 열쇠 등)",
      "hint": "힌트 (막혔을 때 제공할 단서)",
      "problemMode": "clue|device|clue_device",
      "answerType": "key|number_4|number_3|alphabet_5|keypad|xkit|auto",
      "room": "공간 블록에서 가져온 방 이름",
      "content": "연출 설명 (정답 입력 후 일어나는 연출 효과)",
      "deviceSubtype": "electronic_pen|magnet|tagging|sensor|light|tv|moving_room|hidden_door|auto_trigger|keypad_device|phone_device|other",
      "outputType": "door_open|hidden_compartment_open|led_on|tv_on|xkit_guide_revealed|item_acquired|next_room_open|ending_video|escape_clear"
    }
  ]
}`;
}

export async function generateGameFlowFromMandala(
  story: StoryProposal,
  cells: MandalartCellData[],
): Promise<GameFlowPlan> {
  const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing VITE_GOOGLE_GEMINI_API_KEY');
    // Fallback to procedural generation (auto-derives rooms from mandalart)
    return generateGameFlowFromStory(story, cells);
  }

  // Pre-extract mandalart rooms for validation
  const ms = extractMandalartStructure(cells);
  const mandalartRooms = ms.공간.keywords.length > 0 ? ms.공간.keywords : DEFAULT_ROOMS;

  const client = new GoogleGenerativeAI(apiKey);
  const prompt = buildMandalaPrompt(cells, story);

  for (const model of MODELS) {
    try {
      const genModel = client.getGenerativeModel({ model });
      const result = await genModel.generateContent(prompt);
      const text = result.response.text();

      // Extract JSON from response
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found in response');

      const data = JSON.parse(match[0]);
      if (!data.steps || !Array.isArray(data.steps)) {
        throw new Error('Invalid steps format');
      }

      // Collect rooms from AI response, but prioritize mandalart rooms
      const aiRoomSet = new Set<string>(data.steps.map((s: any) => s.room as string).filter(Boolean));
      // Merge: mandalart rooms first, then any additional AI rooms
      const rooms: string[] = [
        ...mandalartRooms,
        ...Array.from(aiRoomSet).filter((r) => !mandalartRooms.includes(r)),
      ];

      const steps: GameFlowStep[] = data.steps.map((s: any) => ({
        id: `step-${s.stepNumber}`,
        stepNumber: s.stepNumber,
        stageLabel: s.stageLabel,
        clueTitle: s.title || '',
        description: s.description || '',
        puzzleSetup: s.puzzleSetup || '',
        puzzleSolution: s.puzzleSolution || '',
        content: s.content || '',
        hint: s.hint || '',
        room: s.room || mandalartRooms[0],
        problemMode: s.problemMode || 'clue',
        answerType: s.answerType || 'number_4',
        deviceSubtype: s.deviceSubtype || null,
        inputLabel: '',
        answer: s.answer || '',
        output: s.outputType || 'item_acquired',
        clueTags: [],
        deviceTags: [],
        notes: '',
      }));

      return {
        id: `game-flow-${Date.now()}`,
        storyId: story.id,
        title: story.title,
        description: story.description,
        rooms,
        steps,
      };
    } catch (err) {
      console.warn(`Model ${model} failed:`, err);
      continue;
    }
  }

  // Fallback
  console.warn('AI generation failed, using default');
  return generateGameFlowFromStory(story, cells);
}
