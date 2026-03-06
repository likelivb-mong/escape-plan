import type { PuzzleFlowStageKey } from '../types/puzzleFlow';

// ── Stage title variants  [stageKey][variantIndex] ────────────────────────────
export const STAGE_TITLES: Record<PuzzleFlowStageKey, [string, string]> = {
  intro:       ['Opening · 사건의 발단',        'Prelude · 진입과 배경'],
  development: ['Investigation · 단서 조사',    'Discovery · 첫 연결과 탐색'],
  expansion:   ['Revelation · 숨겨진 구조',     'Escalation · 중반 확장'],
  twist:       ['Inversion · 진실 왜곡',        'Disruption · 예상의 전복'],
  ending:      ['Resolution · 최종 해답',       'Escape · 탈출과 결말'],
};

// ── Objective text variants ───────────────────────────────────────────────────
export const OBJECTIVES: Record<PuzzleFlowStageKey, [string, string]> = {
  intro: [
    '공간 분위기 세팅 및 첫 번째 단서 탐색 유도',
    '초기 맥락 전달, 플레이어 몰입 진입 및 방향 제시',
  ],
  development: [
    '복수의 단서를 조합해 첫 번째 잠금장치 해제',
    '단서 연결 구조 구축 및 중간 목표 달성',
  ],
  expansion: [
    '숨겨진 공간 또는 2차 단서 구조 발견 및 정보 재구성',
    '중반 반전 포석 설치, 복합 퍼즐 심화 전개',
  ],
  twist: [
    '기존 가정을 전복시키는 핵심 진실 공개 및 경로 재설정',
    '예상된 탈출 경로 차단, 새로운 해결책으로 전환 유도',
  ],
  ending: [
    '최종 코드 해독 및 메인 잠금장치 해제 — 탈출 트리거',
    '스토리 결말과 동기화된 퍼즐 완성 및 탈출 이벤트',
  ],
};

// ── Effects note pools  [stageKey][variantIndex][noteIndex] ───────────────────
export const EFFECTS_POOL: Record<PuzzleFlowStageKey, [string[], string[]]> = {
  intro: [
    [
      '입장 시 전체 조명 OFF → 착석 후 서서히 앰비언트 점등',
      'BGM: 낮은 긴장감의 드론 앰비언트 (20–40Hz 기반)',
      'GM 인트로 방송: 30초 내러티브 후 자동 전환',
    ],
    [
      '첫 단서를 시야 정면에 위치 — 진입 즉시 확인 가능',
      '환경음: 문 잠기는 소리 + 발자국 이펙트',
      '조명 1개 포인트 라이트만 켠 상태로 시작',
    ],
  ],
  development: [
    [
      'UV 조명 활성화 구간 — 블랙라이트 단서 집중 배치',
      '잠금 해제 시 "클릭" 사운드 이펙트 + 조명 색 변화',
      '첫 번째 조합 성공 시 BGM 템포 소폭 상승',
    ],
    [
      '단서 발견 시 작은 진동 또는 사운드 피드백',
      '복수의 단서를 한 곳에 모으는 "조사대" 공간 설계',
      '레이어드 BGM: 단서 수집량에 따라 악기 요소 추가',
    ],
  ],
  expansion: [
    [
      '숨겨진 방/공간 개방 — 빛 + 사운드 동시 큐',
      'BGM 전환: 미스터리 → 긴박함으로 분위기 상승',
      '핵심 단서 위에 스팟 조명으로 시각적 강조',
    ],
    [
      '비밀 서랍 또는 숨겨진 문서 트리거 설계',
      'GM 개입 포인트: 단서 과부하 시 힌트 방송',
      '물리적 퍼즐 요소 집중 배치 구간',
    ],
  ],
  twist: [
    [
      '극적 조명 변화: 전체 RED 전환 — 반전 시각 신호',
      'BGM: 갑작스러운 사일런스 → 고긴장 BGM 재개',
      '기존 무의미 소품이 핵심 단서로 전환',
    ],
    [
      '환경 변화 연출: 특정 구역 조명 반전 또는 깜박임',
      '저주파 진동 + 효과음 레이어로 긴장감 극대화',
      '플레이어가 지나쳤던 단서 스팟 조명으로 재조명',
    ],
  ],
  ending: [
    [
      '최종 잠금 해제 시 전체 조명 ON + 팡파레 사운드',
      '탈출 카운트다운 종료 후 1분 여유 시간 제공',
      '엔딩 브리핑: GM이 직접 결말 내러티브 전달',
    ],
    [
      '탈출 직전 라스트 힌트: 자동 방송 또는 조명 유도',
      '마지막 퍼즐은 전 팀원 협력이 필요한 구조',
      '탈출 후 스토리 엔딩 영상 또는 기념 촬영 이벤트',
    ],
  ],
};

// ── Tension curve values (0–100) per stage ────────────────────────────────────
export const TENSION_CURVE: Record<PuzzleFlowStageKey, number> = {
  intro:       22,
  development: 52,
  expansion:   72,
  twist:       94,
  ending:      62,
};
