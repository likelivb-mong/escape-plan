// ── Narrative Analysis types — YouTube 서사 구조 추출기 ──────────────────────

export type NarrativePhase = 'setup' | 'development' | 'turn' | 'twist' | 'ending';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type SummaryMode    = 'precise' | 'limited' | 'no-transcript';

export const PHASE_LABEL: Record<NarrativePhase, string> = {
  setup:       '기',
  development: '승',
  turn:        '전',
  twist:       '반전',
  ending:      '결',
};

export const PHASE_STYLES: Record<NarrativePhase, { badge: string; dot: string; border: string }> = {
  setup:       { badge: 'text-sky-300/80 bg-sky-500/[0.08] border-sky-400/20',       dot: 'bg-sky-400/60',     border: 'border-sky-400/15' },
  development: { badge: 'text-white/50 bg-white/[0.04] border-white/[0.08]',          dot: 'bg-white/30',       border: 'border-white/[0.07]' },
  turn:        { badge: 'text-amber-300/80 bg-amber-500/[0.08] border-amber-400/20',  dot: 'bg-amber-400/60',   border: 'border-amber-400/15' },
  twist:       { badge: 'text-rose-300/80 bg-rose-500/[0.08] border-rose-400/20',     dot: 'bg-rose-400/60',    border: 'border-rose-400/15' },
  ending:      { badge: 'text-violet-300/80 bg-violet-500/[0.08] border-violet-400/20', dot: 'bg-violet-400/60', border: 'border-violet-400/15' },
};

export const SUMMARY_MODE_BADGE: Record<SummaryMode, { label: string; style: string }> = {
  'precise':       { label: '정밀 요약',  style: 'text-emerald-300/80 bg-emerald-500/[0.08] border-emerald-400/20' },
  'limited':       { label: '제한 요약',  style: 'text-amber-300/70 bg-amber-500/[0.06] border-amber-400/15' },
  'no-transcript': { label: '자막 없음',  style: 'text-white/35 bg-white/[0.04] border-white/[0.08]' },
};

// ── Escape Room tags ──────────────────────────────────────────────────────────

export const ESCAPE_ROOM_TAGS = [
  '숨겨진방', '폐쇄공간', '감시', '수집', '집착', '위장', '오해',
  '기록물', '실종', '타인의흔적', '밀실', '반전신분', '이중생활',
  '복수', '실험', '유언', '암호', '추적',
] as const;
export type EscapeRoomTag = typeof ESCAPE_ROOM_TAGS[number];

export const TAG_STYLES: Record<string, string> = {
  '숨겨진방':   'text-rose-300/70 border-rose-400/20 bg-rose-500/[0.06]',
  '폐쇄공간':   'text-rose-300/70 border-rose-400/20 bg-rose-500/[0.06]',
  '감시':       'text-amber-300/70 border-amber-400/20 bg-amber-500/[0.06]',
  '수집':       'text-amber-300/70 border-amber-400/20 bg-amber-500/[0.06]',
  '집착':       'text-rose-300/70 border-rose-400/20 bg-rose-500/[0.06]',
  '위장':       'text-sky-300/70 border-sky-400/20 bg-sky-500/[0.06]',
  '오해':       'text-sky-300/70 border-sky-400/20 bg-sky-500/[0.06]',
  '기록물':     'text-amber-300/70 border-amber-400/20 bg-amber-500/[0.06]',
  '실종':       'text-rose-300/70 border-rose-400/20 bg-rose-500/[0.06]',
  '타인의흔적': 'text-amber-300/70 border-amber-400/20 bg-amber-500/[0.06]',
  '밀실':       'text-rose-300/70 border-rose-400/20 bg-rose-500/[0.06]',
  '반전신분':   'text-violet-300/70 border-violet-400/20 bg-violet-500/[0.06]',
  '이중생활':   'text-violet-300/70 border-violet-400/20 bg-violet-500/[0.06]',
  '복수':       'text-rose-300/70 border-rose-400/20 bg-rose-500/[0.06]',
  '실험':       'text-sky-300/70 border-sky-400/20 bg-sky-500/[0.06]',
  '유언':       'text-white/45 border-white/15 bg-white/[0.04]',
  '암호':       'text-sky-300/70 border-sky-400/20 bg-sky-500/[0.06]',
  '추적':       'text-amber-300/70 border-amber-400/20 bg-amber-500/[0.06]',
};

// ── Core interfaces ───────────────────────────────────────────────────────────

export interface NarrativeCharacter {
  name:     string;  // 인물 이름 또는 역할명
  role:     string;  // 가해자 | 피해자 | 탐정 | 조력자 | 의문인물 등
  desire:   string;  // 이 인물이 원하는 것
  conflict: string;  // 이 인물이 직면한 갈등
}

export interface NarrativeTimelineEntry {
  phase:        NarrativePhase;
  timeRange:    string;  // "00:00-03:20" or "알 수 없음"
  event:        string;  // 실제로 벌어진 사건 (구체적 행동 중심)
  detail:       string;  // 추가 맥락
  emotion:      string;  // 인물 심리 변화 (예: "불신 → 공포 → 체념")
  clueOrObject: string;  // 단서나 오브제 (예: "혈흔 묻은 메모지")
  spaceChange:  string;  // 공간/상황 변화 (예: "지하실 발견")
}

export interface EscapeRoomUsefulPoints {
  coreConflict:       string;    // 핵심 갈등 한 줄
  hiddenSecret:       string;    // 숨겨진 비밀 한 줄
  investigationPoints: string[]; // 수사 포인트들
  spatialIdeas:       string[];  // 공간 아이디어
  propsIdeas:         string[];  // 소품 아이디어
  twistIdeas:         string[];  // 반전 아이디어
  tags:               string[];  // ESCAPE_ROOM_TAGS 중 해당 항목
}

export interface NarrativeQuality {
  transcriptAvailable: boolean;
  confidence:          ConfidenceLevel;
  warning:             string;
  summaryMode:         SummaryMode;
}

export interface NarrativeStructure {
  기:   string;  // 주인공/상황/결핍/이상징후 + 행동 + 계기
  승:   string;  // 갈등 확대, 집착/추적 누적 + 행동 + 계기
  전:   string;  // 돌이킬 수 없는 행동 발생 + 행동 + 계기
  반전: string;  // 진실이 뒤집히는 원인/숨겨진 동기 (없으면 "명확한 근거 부족")
  결:   string;  // 사건 종료 + 정서적 여운 + 최종 상태 변화
}

export interface NarrativeAnalysis {
  summaryShort:          string;
  storyLogline:          string;
  characters:            NarrativeCharacter[];
  timeline:              NarrativeTimelineEntry[];
  structure:             NarrativeStructure;
  escapeRoomUsefulPoints: EscapeRoomUsefulPoints;
  quality:               NarrativeQuality;
}
