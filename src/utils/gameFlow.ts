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

function extractKeywordsByTheme(cells: MandalartCellData[]): {
  rose: string[];
  sky: string[];
  amber: string[];
  other: string[];
  subGoals: string[];
} {
  const filled = cells.filter((c) => !c.isCenter && c.text.trim());
  return {
    rose:     filled.filter((c) => c.theme === 'rose' && !c.isSubGoal).map((c) => c.text.trim()),
    sky:      filled.filter((c) => c.theme === 'sky'  && !c.isSubGoal).map((c) => c.text.trim()),
    amber:    filled.filter((c) => c.theme === 'amber' && !c.isSubGoal).map((c) => c.text.trim()),
    other:    filled.filter((c) => !c.theme && !c.isSubGoal).map((c) => c.text.trim()),
    subGoals: filled.filter((c) => c.isSubGoal).map((c) => c.text.trim()),
  };
}

function pickN<T>(arr: T[], n: number, offset = 0): T[] {
  if (arr.length === 0) return [];
  return Array.from({ length: Math.min(n, arr.length) }, (_, i) => arr[(i + offset) % arr.length]);
}

function getStageKeywords(
  stage: StageLabel,
  kw: ReturnType<typeof extractKeywordsByTheme>,
  offset: number,
): { clueTags: string[]; deviceTags: string[] } {
  switch (stage) {
    case '기':
      return {
        clueTags: [...pickN(kw.amber, 2, offset), ...pickN(kw.other, 1, offset)],
        deviceTags: pickN(kw.sky, 1, offset),
      };
    case '승':
      return {
        clueTags: [...pickN(kw.amber, 3, offset + 2), ...pickN(kw.rose, 1, offset)],
        deviceTags: pickN(kw.sky, 2, offset + 1),
      };
    case '전':
      return {
        clueTags: [...pickN(kw.amber, 2, offset + 4), ...pickN(kw.rose, 1, offset + 2)],
        deviceTags: pickN(kw.sky, 2, offset + 3),
      };
    case '반전':
      return {
        clueTags: [...pickN(kw.rose, 3, offset + 3), ...pickN(kw.amber, 1, offset + 6)],
        deviceTags: pickN(kw.sky, 1, offset + 5),
      };
    case '결':
      return {
        clueTags: [...pickN(kw.amber, 2, offset + 8), ...pickN(kw.rose, 1, offset + 5)],
        deviceTags: pickN(kw.sky, 1, offset + 7),
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
  rooms: string[] = DEFAULT_ROOMS,
): GameFlowPlan {
  const minutes = parsePlaytime(story.meta.playtime);
  const totalSteps = calcTotalSteps(minutes);
  const stepDist = distributeSteps(totalSteps);
  const kw = extractKeywordsByTheme(cells);

  const steps: GameFlowStep[] = [];
  let stepNumber = 1;

  STAGE_ORDER.forEach((stage, stageIdx) => {
    const count = stepDist[stageIdx];
    const pool = BLUEPRINT_POOLS[stage];

    for (let i = 0; i < count; i++) {
      const blueprint = pool[i % pool.length];
      const room = getRoomForStep(stage, i, rooms);
      const stageTags = getStageKeywords(stage, kw, i);
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
    rooms,
    steps,
  };
}

export async function regenerateGameFlow(
  story: StoryProposal,
  cells: MandalartCellData[] = [],
  rooms?: string[],
): Promise<GameFlowPlan> {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
  return generateGameFlowFromStory(story, cells, rooms);
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
  const themed = keywords.filter((c) => !c.isCenter && c.text.trim());

  const byTheme: Record<string, string[]> = {
    '컨셉': [],
    '연출/장치': [],
    '단서/소품': [],
    '기타': [],
  };

  themed.forEach((k) => {
    if (k.theme === 'rose') byTheme['컨셉'].push(k.text);
    else if (k.theme === 'sky') byTheme['연출/장치'].push(k.text);
    else if (k.theme === 'amber') byTheme['단서/소품'].push(k.text);
    else byTheme['기타'].push(k.text);
  });

  let kwCtx = '';
  for (const [label, kws] of Object.entries(byTheme)) {
    if (kws.length) kwCtx += `${label}: ${kws.join(', ')}\n`;
  }

  return `당신은 XCAPE 방탈출 게임 플로우 설계 전문가입니다.
아래 스토리와 만다라트 키워드를 활용하여 방탈출 게임의 스텝 플로우를 설계하세요.

【스토리】
제목: ${story.title}
설명: ${story.description}

【만다라트 키워드】
${kwCtx}

【최신 트렌드 포함 요소】
1. 몰입감 있는 오프닝 (호기심 유발)
2. 단서 발견의 쾌감 (보상 시스템)
3. 예상치 못한 반전 (스토리 전개)
4. 협력 플레이 강제 (팀 플레이)
5. 기술 장치 활용 (현대 감각)
6. 시간 압박감 (긴장감)
7. 명확한 엔딩 (만족감)

각 스테이지별 10개 정도의 스텝을 생성하되:
- 각 스텝은 고유한 puzzle/device/output을 가져야 함
- 스텝의 내용/힌트는 만다라트 키워드 활용
- 스텝은 단계적으로 어려워져야 함
- 최소 40개 이상의 스텝 생성

JSON 형식으로 다음과 같이 응답하세요:
{
  "steps": [
    {
      "stepNumber": 1,
      "stageLabel": "기",
      "title": "스텝 제목",
      "description": "스텝 설명",
      "problemMode": "decryption|input|find_order|multipart",
      "answerType": "text|number|select",
      "room": "방 이름",
      "content": "퍼즐 내용",
      "hint": "힌트",
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
    // Fallback to default generation
    return generateGameFlowFromStory(story, cells);
  }

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

      // Convert to GameFlowPlan
      const roomSet = new Set<string>(data.steps.map((s: any) => s.room as string));
      const rooms: string[] = Array.from(roomSet);
      const steps: GameFlowStep[] = data.steps.map((s: any) => ({
        id: `step-${s.stepNumber}`,
        stepNumber: s.stepNumber,
        stage: s.stageLabel,
        title: s.title,
        description: s.description,
        content: s.content,
        hint: s.hint,
        room: s.room,
        problemMode: s.problemMode || 'decryption',
        answerType: s.answerType || 'text',
        deviceSubtype: s.deviceSubtype || 'other',
        outputType: s.outputType || 'item_acquired',
      }));

      return {
        id: `game-flow-${Date.now()}`,
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
