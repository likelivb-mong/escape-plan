import type { StoryProposal } from '../types/story';
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

// ── Step blueprint (structure only) ──────────────────────────────────────────

interface StepBlueprint {
  stageLabel: StageLabel;
  roomIndex: number;
  problemMode: ProblemMode;
  answerType: AnswerType;
  deviceSubtype?: DeviceSubtype;
  output: OutputType;
  inputLabel: string;
}

const BLUEPRINTS: StepBlueprint[] = [
  // 기 (2 steps) — 수사실
  {
    stageLabel: '기', roomIndex: 0, problemMode: 'clue',
    answerType: 'number_4', output: 'hidden_compartment_open',
    inputLabel: '서랍 속 4자리 숫자 자물쇠',
  },
  {
    stageLabel: '기', roomIndex: 0, problemMode: 'clue',
    answerType: 'alphabet_5', output: 'item_acquired',
    inputLabel: '캐비닛 알파벳 5자리 자물쇠',
  },
  // 승 (3 steps) — 처치실 · 할머니 방
  {
    stageLabel: '승', roomIndex: 1, problemMode: 'clue_device',
    answerType: 'keypad', deviceSubtype: 'keypad_device', output: 'door_open',
    inputLabel: '전자 키패드 패널',
  },
  {
    stageLabel: '승', roomIndex: 1, problemMode: 'device',
    answerType: 'xkit', deviceSubtype: 'light', output: 'xkit_guide_revealed',
    inputLabel: 'X-KIT 폰 앱',
  },
  {
    stageLabel: '승', roomIndex: 2, problemMode: 'clue',
    answerType: 'key', output: 'door_open',
    inputLabel: '문 열쇠 슬롯',
  },
  // 전 (2 steps) — 할머니 방 · 골목
  {
    stageLabel: '전', roomIndex: 2, problemMode: 'device',
    answerType: 'auto', deviceSubtype: 'auto_trigger', output: 'led_on',
    inputLabel: '자동 조명 트리거',
  },
  {
    stageLabel: '전', roomIndex: 3, problemMode: 'clue_device',
    answerType: 'number_3', deviceSubtype: 'sensor', output: 'next_room_open',
    inputLabel: '3자리 숫자 자물쇠 (센서)',
  },
  // 반전 (2 steps) — 골목 · 공용 부엌
  {
    stageLabel: '반전', roomIndex: 3, problemMode: 'clue',
    answerType: 'xkit', output: 'xkit_guide_revealed',
    inputLabel: 'X-KIT 폰 앱',
  },
  {
    stageLabel: '반전', roomIndex: 4, problemMode: 'device',
    answerType: 'auto', deviceSubtype: 'hidden_door', output: 'hidden_compartment_open',
    inputLabel: '숨겨진 문 자동 개방',
  },
  // 결 (2 steps) — 공용 부엌
  {
    stageLabel: '결', roomIndex: 4, problemMode: 'clue_device',
    answerType: 'number_4', deviceSubtype: 'keypad_device', output: 'ending_video',
    inputLabel: '최종 4자리 번호 자물쇠',
  },
  {
    stageLabel: '결', roomIndex: 4, problemMode: 'device',
    answerType: 'auto', deviceSubtype: 'auto_trigger', output: 'escape_clear',
    inputLabel: '탈출 자동장치 트리거',
  },
];

// ── Step content templates per stage ─────────────────────────────────────────

interface StepContent {
  clueTitle: string;
  answer: string;
  clueTags: string[];
  deviceTags: string[];
  notes: string;
  xkitPrompt?: string;
  xkitAnswer?: string;
  xkitNextGuide?: string;
}

function buildStepContent(
  blueprint: StepBlueprint,
  index: number,
  story: StoryProposal,
): StepContent {
  const inv = story.investigation;

  const contents: StepContent[] = [
    // Step 01 — 기 / number_4
    {
      clueTitle: inv ? `${inv.perpetrator}의 초기 흔적 분석` : '사건 기록부의 첫 번째 단서',
      answer: '1947',
      clueTags: ['기록부', '날짜코드', inv?.scene ?? '사건 현장'],
      deviceTags: ['서랍', '4자리 자물쇠'],
      notes: '기록부 속 형광펜으로 표시된 연도 4개를 순서대로 조합. 기 도입부 — 플레이어가 사건의 실마리를 처음 접하는 장면.',
    },
    // Step 02 — 기 / alphabet_5
    {
      clueTitle: inv ? `암호화된 ${inv.perpetrator} 명찰` : '암호화된 명찰',
      answer: 'TRUTH',
      clueTags: ['명찰', '알파벳 치환', '특수기호'],
      deviceTags: ['캐비닛', '알파벳 자물쇠'],
      notes: '명찰 뒷면 특수 기호를 알파벳 치환표로 변환. 5글자 정답을 완성해야 다음 아이템 획득.',
    },
    // Step 03 — 승 / keypad
    {
      clueTitle: inv ? `${inv.victim} 의료 기록 해독` : '의료 기록 해독',
      answer: '8812',
      clueTags: ['의료 기록', '혈압 수치', inv?.clue ?? '기록지'],
      deviceTags: ['전자 키패드', '숫자 역순'],
      notes: '기록지의 수치(혈압 88/12 → 8812)를 키패드에 입력. 단서와 장치가 결합된 문제.',
    },
    // Step 04 — 승 / xkit + UV
    {
      clueTitle: 'UV 자외선 벽면 메시지',
      answer: inv?.motive ?? '존속방관',
      clueTags: ['UV 메시지', '벽면 단서', '한자'],
      deviceTags: ['UV 라이트', 'X-KIT'],
      notes: '자외선 등을 벽면에 비추면 숨겨진 한자/단어 드러남. X-KIT 앱에 입력해야 다음 가이드 해제.',
      xkitPrompt: '벽에 숨겨진 진실을 붙여쓰기 없이 입력하세요',
      xkitAnswer: inv?.motive ?? '존속방관',
      xkitNextGuide: '할머니 방 침대 밑 왼쪽 구석을 조사하세요',
    },
    // Step 05 — 승 / key
    {
      clueTitle: 'X-KIT 가이드 — 침대 밑 열쇠',
      answer: '(열쇠 획득)',
      clueTags: ['X-KIT 가이드', '침대 밑', '위치 정보'],
      deviceTags: ['열쇠', '문 잠금장치'],
      notes: '이전 X-KIT 가이드에서 위치 확인 → 침대 밑 열쇠 수거 → 할머니 방 잠긴 문 해제.',
    },
    // Step 06 — 전 / auto (오르골)
    {
      clueTitle: '오르골 멜로디 시퀀스',
      answer: '(자동 반응)',
      clueTags: ['오르골', '멜로디 순서', '악보'],
      deviceTags: ['자동 조명', '숨겨진 공간 LED'],
      notes: '벽면 악보를 보고 오르골 버튼을 순서대로 누르면 자동으로 LED가 켜지며 숨겨진 공간 조명. 전 초입 — 분위기 전환.',
    },
    // Step 07 — 전 / number_3 + sensor
    {
      clueTitle: inv ? `골목 ${inv.scene ?? '현장'} 건물번호 암호` : '골목 건물 번호판 암호',
      answer: '428',
      clueTags: ['번호판', '건물 코드', '골목 단서'],
      deviceTags: ['센서 자물쇠', '3자리', '자외선 반응'],
      notes: '골목 벽면 번호판 3개에서 특정 숫자만 추출하여 조합. 센서가 정답 감지 시 다음 공간 문 자동 개방.',
    },
    // Step 08 — 반전 / xkit
    {
      clueTitle: inv ? `${inv.victim}의 마지막 메시지` : '피해자의 마지막 메시지',
      answer: inv ? `${inv.victim}은무죄다` : '나는범인이아니다',
      clueTags: ['메시지 카드', '피해자 필적', '반전 단서'],
      deviceTags: ['X-KIT'],
      notes: '반전 구간 핵심. 피해자로 알려진 인물이 실제로는 공모자였음을 암시하는 메시지. 붙여쓰기로 입력.',
      xkitPrompt: '메시지 카드에 적힌 문장을 붙여쓰기로 입력하세요',
      xkitAnswer: inv ? `${inv.victim}은무죄다` : '나는범인이아니다',
      xkitNextGuide: '공용 부엌 냉장고 안쪽 세 번째 칸을 확인하세요',
    },
    // Step 09 — 반전 / auto (hidden_door)
    {
      clueTitle: 'X-KIT 가이드 — 냉장고 숨겨진 칸',
      answer: '(자동 개방)',
      clueTags: ['X-KIT 가이드', '냉장고', '숨겨진 문서'],
      deviceTags: ['숨겨진 문', '자동 개방', '센서'],
      notes: 'X-KIT 다음 가이드에서 냉장고 위치 확인. 세 번째 칸에 손을 넣으면 센서가 반응하여 숨겨진 칸 자동 개방 → 최종 문서 획득.',
    },
    // Step 10 — 결 / number_4
    {
      clueTitle: '최종 암호 — 전 단계 단서 집약',
      answer: '1124',
      clueTags: ['전체 단서 통합', '날짜 코드', '최종 해독'],
      deviceTags: ['최종 키패드', '4자리 자물쇠'],
      notes: '1단계(19), 3단계(88→반전으로 12), 7단계(4)에서 추출한 숫자 조합 → 1124. 전체 흐름을 이해해야만 풀 수 있는 마스터 퍼즐.',
    },
    // Step 11 — 결 / auto (escape)
    {
      clueTitle: '탈출 시퀀스 가동',
      answer: '(자동 트리거)',
      clueTags: ['최종 코드 입력 완료', '엔딩'],
      deviceTags: ['탈출 장치', '자동 도어', '엔딩 영상'],
      notes: '10번 최종 코드 입력 시 자동으로 탈출 도어 오픈 + 엔딩 영상 재생. escape_clear 상태 전환.',
    },
  ];

  return contents[index] ?? contents[0];
}

// ── Main generator ────────────────────────────────────────────────────────────

export function generateGameFlowFromStory(
  story: StoryProposal,
  rooms: string[] = DEFAULT_ROOMS,
): GameFlowPlan {
  const steps: GameFlowStep[] = BLUEPRINTS.map((blueprint, i) => {
    const content = buildStepContent(blueprint, i, story);
    const room = rooms[blueprint.roomIndex] ?? rooms[rooms.length - 1];

    return {
      id: `step-${story.id}-${i + 1}`,
      stepNumber: i + 1,
      room,
      stageLabel: blueprint.stageLabel,
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
    };
  });

  return {
    storyId: story.id,
    title: story.title,
    rooms,
    steps,
  };
}

export async function regenerateGameFlow(
  story: StoryProposal,
  rooms?: string[],
): Promise<GameFlowPlan> {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
  return generateGameFlowFromStory(story, rooms);
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
