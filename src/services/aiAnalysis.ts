import { GoogleGenerativeAI } from '@google/generative-ai';
import type { MandalartCellData } from '../types/mandalart';
import type { StoryProposal, InvestigationFramework } from '../types/story';
import type { NarrativeAnalysis } from '../types/narrative';
import {
  buildInvestigationPromptSection,
  buildQuestTaxonomyPromptSection,
} from '../data/xcapeKnowledge';
import {
  fetchYoutubeTranscript,
  formatTranscriptForPrompt,
} from '../utils/youtubeTranscript';

// ── Mandalart position mappings ───────────────────────────────────────────────

const SUBGOAL_POSITIONS: [number, number][] = [
  [3, 3], [3, 4], [3, 5],
  [4, 3],         [4, 5],
  [5, 3], [5, 4], [5, 5],
];

const EXPANSION_BLOCKS: [number, number][] = [
  [0, 0], [0, 1], [0, 2],
  [1, 0],         [1, 2],
  [2, 0], [2, 1], [2, 2],
];

function getActionCells(br: number, bc: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = br * 3; r <= br * 3 + 2; r++) {
    for (let c = bc * 3; c <= bc * 3 + 2; c++) {
      if (r === br * 3 + 1 && c === bc * 3 + 1) continue;
      cells.push([r, c]);
    }
  }
  return cells;
}

function isSubGoalCell(row: number, col: number): boolean {
  return row >= 3 && row <= 5 && col >= 3 && col <= 5 && !(row === 4 && col === 4);
}

// ── Public result type ────────────────────────────────────────────────────────

export interface AnalysisResult {
  cells: MandalartCellData[];
  projectName: string;
  stories: StoryProposal[];
  videoTitle: string;
  channelName: string;
  videoSynopsis: string;
  videoBeats: { label: '기' | '승' | '전' | '반전' | '결'; description: string }[];
  narrative?: NarrativeAnalysis;
}

// ── Retry helpers ─────────────────────────────────────────────────────────────

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];
const MAX_RETRIES = 4;

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return msg.includes('503') || msg.includes('429') || msg.includes('overloaded') || msg.includes('RESOURCE_EXHAUSTED');
}

// ── Video ID helper ───────────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) return u.pathname.slice(8).split('?')[0];
      return u.searchParams.get('v');
    }
  } catch { /* ignore */ }
  return null;
}

// ── Gemini call helper ────────────────────────────────────────────────────────

async function callGemini(
  genAI: GoogleGenerativeAI,
  prompt: string,
  maxOutputTokens: number,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const modelName = attempt < 2 ? MODELS[0] : MODELS[1];
    const model = genAI.getGenerativeModel({ model: modelName });
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens, responseMimeType: 'application/json' },
      });
      return result.response.text();
    } catch (err: unknown) {
      if (!isRetryableError(err) || attempt === MAX_RETRIES - 1) throw err;
      await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
    }
  }
  return '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJSON(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    throw new Error(`AI 응답 JSON 파싱에 실패했습니다. (응답 길이: ${raw.length}자)`);
  }
}

// ── Pass 1: Narrative extraction prompt ───────────────────────────────────────

function buildNarrativeExtractionPrompt(
  videoTitle: string,
  channelName: string,
  transcriptText: string,
  hasTranscript: boolean,
): string {
  const transcriptSection = hasTranscript
    ? `\n## 자막 텍스트\n\n${transcriptText}\n`
    : '';

  return `당신은 YouTube 영상 서사 구조 분석 전문가이자 방탈출(Escape Room) 테마 기획자입니다.
아래 YouTube 영상을 분석하여 서사 구조를 추출하고, 방탈출 기획에 활용 가능한 요소를 JSON으로 반환하세요.

영상 제목: ${videoTitle}
채널: ${channelName || '알 수 없음'}${transcriptSection}

## 분석 지침
${hasTranscript
  ? '자막 텍스트를 기반으로 정밀하게 분석하세요. 실제 대사와 사건 흐름을 따르세요.'
  : '제목과 채널명만으로 추론하세요. 장르 유사 콘텐츠를 참고해 서사를 재구성하세요.'}

### 타임라인 작성 규칙
- 각 phase(setup/development/turn/twist/ending)에 1~3개의 timeline entry 작성
- phase: "setup"(기), "development"(승), "turn"(전), "twist"(반전), "ending"(결)
- timeRange: 자막 있으면 실제 구간(예: "00:00-03:20"), 없으면 "알 수 없음"
- event: 실제로 벌어진 사건과 구체적 행동 중심으로 기술
- emotion: 인물 심리 변화 흐름 (예: "의심 → 불안 → 공포")
- clueOrObject: 단서나 오브제 (없으면 빈 문자열)
- spaceChange: 공간/상황 변화 (없으면 빈 문자열)

### 구조(structure) 작성 규칙
- 각 단계: 주요 행동 + 심리 변화 + 다음 단계로의 계기를 포함
- 반전: 진실이 뒤집히는 원인과 숨겨진 동기 (명확하지 않으면 "명확한 근거 부족")
- 추상적 설명 금지 — 구체적 인물/행동/장소 언급 필수

### 방탈출 태그 (escapeRoomUsefulPoints.tags)
아래 목록에서 해당하는 것만 선택하세요:
숨겨진방, 폐쇄공간, 감시, 수집, 집착, 위장, 오해, 기록물, 실종, 타인의흔적, 밀실, 반전신분, 이중생활, 복수, 실험, 유언, 암호, 추적

반드시 유효한 JSON으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.

## JSON 구조

{
  "summaryShort": "STRING — 영상 내용을 1-2문장으로 압축 요약",
  "storyLogline": "STRING — 방탈출 테마로서의 한 줄 로그라인",
  "characters": [
    {
      "name": "인물 이름 또는 역할명",
      "role": "가해자|피해자|탐정|조력자|의문인물 등",
      "desire": "이 인물이 원하는 것",
      "conflict": "이 인물이 직면한 갈등"
    }
  ],
  "timeline": [
    {
      "phase": "setup",
      "timeRange": "00:00-03:20",
      "event": "구체적인 사건 기술",
      "detail": "추가 맥락",
      "emotion": "심리 변화 흐름",
      "clueOrObject": "",
      "spaceChange": ""
    }
  ],
  "structure": {
    "기": "주인공/상황/결핍/이상징후 + 행동 + 계기",
    "승": "갈등 확대, 집착/추적 누적 + 행동 + 계기",
    "전": "돌이킬 수 없는 행동 발생 + 행동 + 계기",
    "반전": "진실이 뒤집히는 원인/숨겨진 동기 (없으면 '명확한 근거 부족')",
    "결": "사건 종료 + 정서적 여운 + 최종 상태 변화"
  },
  "escapeRoomUsefulPoints": {
    "coreConflict": "핵심 갈등 한 줄",
    "hiddenSecret": "숨겨진 비밀 한 줄",
    "investigationPoints": ["수사 포인트 1", "수사 포인트 2"],
    "spatialIdeas": ["공간 아이디어 1", "공간 아이디어 2"],
    "propsIdeas": ["소품 아이디어 1", "소품 아이디어 2"],
    "twistIdeas": ["반전 아이디어 1", "반전 아이디어 2"],
    "tags": ["숨겨진방", "감시"]
  },
  "quality": {
    "confidence": "high"
  }
}`;
}

// ── Pass 2: Story + Mandalart generation prompt ───────────────────────────────

function buildStoryGenerationPrompt(
  videoTitle: string,
  channelName: string,
  narrative: NarrativeAnalysis,
): string {
  const investigationRef = buildInvestigationPromptSection();
  const questRef = buildQuestTaxonomyPromptSection();

  const structureText = [
    `기: ${narrative.structure.기}`,
    `승: ${narrative.structure.승}`,
    `전: ${narrative.structure.전}`,
    `반전: ${narrative.structure.반전}`,
    `결: ${narrative.structure.결}`,
  ].join('\n');

  const charactersText = narrative.characters
    .map((c) => `- ${c.name}(${c.role}): ${c.desire} / ${c.conflict}`)
    .join('\n') || '- 정보 없음';

  const ep = narrative.escapeRoomUsefulPoints;

  return `당신은 XCAPE 방탈출 테마 기획 전문가입니다. 아래 YouTube 영상 서사 분석 결과를 바탕으로 방탈출 게임 기획 데이터를 JSON으로 생성하세요.

영상 제목: ${videoTitle}
채널: ${channelName || '알 수 없음'}

## 서사 분석 요약
- ${narrative.summaryShort}
- 로그라인: ${narrative.storyLogline}

### 서사 구조
${structureText}

### 등장인물
${charactersText}

### 방탈출 활용 포인트
- 핵심 갈등: ${ep.coreConflict}
- 숨겨진 비밀: ${ep.hiddenSecret}
- 수사 포인트: ${ep.investigationPoints.join(', ')}
- 공간 아이디어: ${ep.spatialIdeas.join(', ')}
- 소품 아이디어: ${ep.propsIdeas.join(', ')}
- 반전 아이디어: ${ep.twistIdeas.join(', ')}

${investigationRef}

${questRef}

반드시 유효한 JSON으로만 응답하세요. markdown 코드블록 없이 순수 JSON만 출력하세요.

## 만다라트 8개 세부목표 구조 (반드시 이 순서와 이름으로)

subGoals 배열의 8개 항목은 아래 순서를 따르세요:
| # | name (세부목표) | theme | 설명 |
|---|----------------|-------|------|
| 0 | 범행동기 | rose | 수사백과 [A] 기반, 영상 소재에 맞는 동기 |
| 1 | 범행방법 | amber | 수사백과 [B] 기반, 구체적 방법 |
| 2 | 수사단서 | amber | 수사백과 [C] 기반, 현장/신체/소지품 단서 |
| 3 | 인물 | rose | 등장인물 관계, 캐릭터 배경, 가해자/피해자/조력자/증인 설정 |
| 4 | 퍼즐유형 | sky | 퀘스트 대분류(평면/입체/공간/감각) 기반 |
| 5 | 연출요소 | sky | 인테리어/조명/소품/BGM 등 연출 |
| 6 | 공간구성 | rose | 방 구조, 동선, 비밀 공간 |
| 7 | 반전설계 | rose | 스토리 반전 장치, 복선, 트위스트 |

각 세부목표의 actions 8개는 서사 분석 결과를 방탈출로 구체적으로 재해석한 항목이어야 합니다. actions의 theme은 부모 subGoal의 theme을 따르세요.

## JSON 구조

{
  "videoContext": {
    "synopsis": "STRING — 2-3문장 원본 콘텐츠 설명",
    "beats": [
      {"label": "기", "description": "STRING"},
      {"label": "승", "description": "STRING"},
      {"label": "전", "description": "STRING"},
      {"label": "반전", "description": "STRING"},
      {"label": "결", "description": "STRING"}
    ]
  },
  "mandalart": {
    "mainTheme": "5글자 이내 핵심 제목",
    "subGoals": [
      {
        "name": "범행동기",
        "theme": "rose",
        "actions": [
          {"text": "4-8글자 실행방안", "theme": "rose"}
        ]
      }
    ]
  },
  "stories": [
    {
      "slot": 0,
      "title": "스토리 제목",
      "genre": "장르",
      "tone": "분위기",
      "logline": "한 줄 요약",
      "synopsis": "2-3문장 시놉시스",
      "beats": [
        {"label": "기", "description": "도입 설명"},
        {"label": "승", "description": "전개 설명"},
        {"label": "전", "description": "전환 설명"},
        {"label": "반전", "description": "반전 설명"},
        {"label": "결", "description": "결말 설명"}
      ],
      "meta": {
        "playtime": "60분",
        "playerCount": "2-6인",
        "twistIntensity": "medium"
      },
      "investigation": {
        "perpetrator": "가해자 이름/역할",
        "motive": "동기 (수사백과 [A] 참고)",
        "victim": "피해자 이름/역할",
        "method": "범행 방법 (수사백과 [B] 참고)",
        "scene": "사건 장소",
        "clue": "핵심 수사 단서 (수사백과 [C] 참고)",
        "technique": "수사 기법 (수사백과 [D] 참고)",
        "formula": "[가]가 [A]를 이유로 [나]에게 [B]로 사건을 일으킨다. [다]에서 [C]가 발견되고, [D]로 진실이 밝혀진다."
      }
    }
  ]
}

## 규칙
- subGoals 정확히 8개 (위 표의 순서대로), 각각 actions 정확히 8개
- stories 정확히 3개 (slot: 0, 1, 2), 각각 다른 장르와 분위기
- Slot 0: 추리 미스터리(수사 관점), Slot 1: 심리 스릴러(인물 심리 관점), Slot 2: 서스펜스(탈출/생존 관점)
- 각 스토리에 investigation 객체 반드시 포함 (수사 조합 공식에 따라)
- theme 값: "rose"=컨셉/인물/공간/스토리, "sky"=연출/기술/장치/퍼즐, "amber"=단서/소품/증거/물건
- twistIntensity: "low", "medium", "high" 중 하나
- 모든 문자열 값에 큰따옴표만 사용
- 서사 분석 결과를 충실히 반영하여 방탈출 테마로 창의적이고 구체적으로 재해석할 것
- investigation.formula는 실제 스토리 내용을 반영한 완성된 문장이어야 함`;
}

// ── Fallback prompt (no narrative) ───────────────────────────────────────────

function buildPrompt(videoTitle: string, channelName: string): string {
  const investigationRef = buildInvestigationPromptSection();
  const questRef = buildQuestTaxonomyPromptSection();

  return `당신은 XCAPE 방탈출 테마 기획 전문가입니다. 아래 YouTube 영상 정보를 방탈출 게임으로 재해석하여 기획 데이터를 JSON으로 생성하세요.

영상 제목: ${videoTitle}
채널: ${channelName || '알 수 없음'}

${investigationRef}

${questRef}

반드시 유효한 JSON으로만 응답하세요. markdown 코드블록 없이 순수 JSON만 출력하세요.

## 만다라트 8개 세부목표 구조 (반드시 이 순서와 이름으로)

subGoals 배열의 8개 항목은 아래 순서를 따르세요:
| # | name (세부목표) | theme | 설명 |
|---|----------------|-------|------|
| 0 | 범행동기 | rose | 수사백과 [A] 기반, 영상 소재에 맞는 동기 |
| 1 | 범행방법 | amber | 수사백과 [B] 기반, 구체적 방법 |
| 2 | 수사단서 | amber | 수사백과 [C] 기반, 현장/신체/소지품 단서 |
| 3 | 인물 | rose | 등장인물 관계, 캐릭터 배경, 가해자/피해자/조력자/증인 설정 |
| 4 | 퍼즐유형 | sky | 퀘스트 대분류(평면/입체/공간/감각) 기반 |
| 5 | 연출요소 | sky | 인테리어/조명/소품/BGM 등 연출 |
| 6 | 공간구성 | rose | 방 구조, 동선, 비밀 공간 |
| 7 | 반전설계 | rose | 스토리 반전 장치, 복선, 트위스트 |

각 세부목표(subGoal)의 actions 8개는 해당 카테고리에서 영상 소재를 방탈출로 구체적으로 재해석한 항목이어야 합니다. actions의 theme은 부모 subGoal의 theme을 따르세요.

## JSON 구조

{
  "videoContext": {
    "synopsis": "STRING — 영상 제목·채널 기반으로 원본 콘텐츠가 어떤 내용인지 2-3문장",
    "beats": [
      {"label": "기", "description": "STRING — 도입부 내용"},
      {"label": "승", "description": "STRING — 전개 내용"},
      {"label": "전", "description": "STRING — 전환점 내용"},
      {"label": "반전", "description": "STRING — 반전 내용"},
      {"label": "결", "description": "STRING — 결말 내용"}
    ]
  },
  "mandalart": {
    "mainTheme": "5글자 이내 핵심 제목",
    "subGoals": [
      {
        "name": "범행동기",
        "theme": "rose",
        "actions": [
          {"text": "4-8글자 실행방안", "theme": "rose"}
        ]
      }
    ]
  },
  "stories": [
    {
      "slot": 0,
      "title": "스토리 제목",
      "genre": "장르",
      "tone": "분위기",
      "logline": "한 줄 요약",
      "synopsis": "2-3문장 시놉시스",
      "beats": [
        {"label": "기", "description": "도입 설명"},
        {"label": "승", "description": "전개 설명"},
        {"label": "전", "description": "전환 설명"},
        {"label": "반전", "description": "반전 설명"},
        {"label": "결", "description": "결말 설명"}
      ],
      "meta": {
        "playtime": "60분",
        "playerCount": "2-6인",
        "twistIntensity": "medium"
      },
      "investigation": {
        "perpetrator": "가해자 이름/역할",
        "motive": "동기 (수사백과 [A] 참고)",
        "victim": "피해자 이름/역할",
        "method": "범행 방법 (수사백과 [B] 참고)",
        "scene": "사건 장소",
        "clue": "핵심 수사 단서 (수사백과 [C] 참고)",
        "technique": "수사 기법 (수사백과 [D] 참고)",
        "formula": "[가]가 [A]를 이유로 [나]에게 [B]로 사건을 일으킨다. [다]에서 [C]가 발견되고, [D]로 진실이 밝혀진다."
      }
    }
  ]
}

## 규칙
- subGoals 정확히 8개 (위 표의 순서대로), 각각 actions 정확히 8개
- stories 정확히 3개 (slot: 0, 1, 2), 각각 다른 장르와 분위기
- 각 스토리에 investigation 객체 반드시 포함 (수사 조합 공식에 따라)
- theme 값: "rose"=컨셉/인물/공간/스토리, "sky"=연출/기술/장치/퍼즐, "amber"=단서/소품/증거/물건
- twistIntensity: "low", "medium", "high" 중 하나
- 모든 문자열 값에 큰따옴표만 사용
- 영상 소재를 XCAPE 전문 프레임워크에 맞춰 방탈출 테마로 창의적이고 구체적으로 재해석할 것
- investigation.formula는 실제 스토리 내용을 반영한 완성된 문장이어야 함`;
}

// ── Map Gemini output to MandalartCellData[] ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMandalartCells(data: any): MandalartCellData[] {
  const cellMap = new Map<string, { text: string; theme: MandalartCellData['theme']; questTag?: string }>();

  cellMap.set('4-4', { text: data.mandalart.mainTheme ?? '무제', theme: null });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subGoals: any[] = (data.mandalart.subGoals ?? []).slice(0, 8);
  subGoals.forEach((sg, i) => {
    const [row, col] = SUBGOAL_POSITIONS[i];
    const [br, bc]   = EXPANSION_BLOCKS[i];

    cellMap.set(`${row}-${col}`, { text: sg.name, theme: sg.theme ?? null });

    const lr = br * 3 + 1;
    const lc = bc * 3 + 1;
    cellMap.set(`${lr}-${lc}`, { text: sg.name, theme: sg.theme ?? null });

    const actionPositions = getActionCells(br, bc);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actions: any[] = (sg.actions ?? []).slice(0, 8);
    actions.forEach((act, j) => {
      if (j < actionPositions.length) {
        const [ar, ac] = actionPositions[j];
        cellMap.set(`${ar}-${ac}`, {
          text: act.text,
          theme: act.theme ?? null,
          questTag: act.questTag ?? undefined,
        });
      }
    });
  });

  return Array.from({ length: 81 }, (_, idx) => {
    const row      = Math.floor(idx / 9);
    const col      = idx % 9;
    const key      = `${row}-${col}`;
    const isCenter = row === 4 && col === 4;
    const isSub    = isSubGoalCell(row, col);
    const entry    = cellMap.get(key);
    return {
      id: `cell-${row}-${col}`,
      row,
      col,
      text:      entry?.text     ?? '',
      theme:     entry?.theme    ?? null,
      isCenter,
      isSubGoal: isSub,
      ...(entry?.questTag ? { questTag: entry.questTag } : {}),
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStories(data: any, narrative?: NarrativeAnalysis): StoryProposal[] {
  return (data.stories ?? []).slice(0, 3).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any, i: number) => {
      let investigation: InvestigationFramework | undefined;
      if (s.investigation) {
        investigation = {
          perpetrator: s.investigation.perpetrator ?? '',
          motive:      s.investigation.motive      ?? '',
          victim:      s.investigation.victim       ?? '',
          method:      s.investigation.method       ?? '',
          scene:       s.investigation.scene        ?? '',
          clue:        s.investigation.clue         ?? '',
          technique:   s.investigation.technique    ?? '',
          formula:     s.investigation.formula      ?? '',
        };
      }

      return {
        id:       `ai-slot${i}-v0`,
        slot:     i,
        title:    s.title    ?? `스토리 ${i + 1}`,
        genre:    s.genre    ?? '미스터리',
        tone:     s.tone     ?? '긴박',
        logline:  s.logline  ?? '',
        synopsis: s.synopsis ?? '',
        beats:    s.beats    ?? [],
        meta: {
          playtime:       s.meta?.playtime       ?? '60분',
          playerCount:    s.meta?.playerCount    ?? '2–6인',
          twistIntensity: s.meta?.twistIntensity ?? 'medium',
        },
        ...(investigation ? { investigation } : {}),
        ...(narrative     ? { narrative }     : {}),
      };
    },
  );
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function analyzeYoutube(
  youtubeUrl: string,
  onStep?: (step: string) => void,
): Promise<AnalysisResult> {
  const step = (msg: string) => onStep?.(msg);

  // 1. Fetch video metadata
  step('영상 정보 가져오는 중...');
  let videoTitle = '알 수 없는 영상';
  let channelName = '';
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(youtubeUrl)}`);
    const meta = await res.json();
    if (meta.title)       videoTitle  = meta.title;
    if (meta.author_name) channelName = meta.author_name;
  } catch { /* continue */ }

  // 2. Fetch YouTube transcript
  step('자막 분석 중...');
  const videoId = extractVideoId(youtubeUrl);
  let transcriptAvailable = false;
  let transcriptText = '';
  if (videoId) {
    try {
      const tr = await fetchYoutubeTranscript(videoId);
      if (tr.available && tr.segments.length > 0) {
        transcriptAvailable = true;
        transcriptText = formatTranscriptForPrompt(tr.segments);
      }
    } catch { /* continue without transcript */ }
  }

  // 3. Setup Gemini
  const apiKey = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_KEY as string | undefined;
  if (!apiKey) throw new Error('VITE_GOOGLE_GENERATIVE_AI_KEY가 설정되어 있지 않습니다.');
  const genAI = new GoogleGenerativeAI(apiKey);

  // 4. Pass 1 — Narrative extraction
  step(transcriptAvailable ? '서사 구조 분석 중 (자막 기반)...' : 'AI가 서사 구조 분석 중...');
  let narrative: NarrativeAnalysis | undefined;
  try {
    const narrativePrompt = buildNarrativeExtractionPrompt(
      videoTitle, channelName, transcriptText, transcriptAvailable,
    );
    const narrativeRaw = await callGemini(genAI, narrativePrompt, 8000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nd: any = parseJSON(narrativeRaw);
    narrative = {
      summaryShort:          nd.summaryShort           ?? '',
      storyLogline:          nd.storyLogline            ?? '',
      characters:            Array.isArray(nd.characters) ? nd.characters : [],
      timeline:              Array.isArray(nd.timeline)   ? nd.timeline   : [],
      structure: {
        기:   nd.structure?.기   ?? '',
        승:   nd.structure?.승   ?? '',
        전:   nd.structure?.전   ?? '',
        반전: nd.structure?.반전 ?? '',
        결:   nd.structure?.결   ?? '',
      },
      escapeRoomUsefulPoints: {
        coreConflict:        nd.escapeRoomUsefulPoints?.coreConflict        ?? '',
        hiddenSecret:        nd.escapeRoomUsefulPoints?.hiddenSecret         ?? '',
        investigationPoints: nd.escapeRoomUsefulPoints?.investigationPoints  ?? [],
        spatialIdeas:        nd.escapeRoomUsefulPoints?.spatialIdeas         ?? [],
        propsIdeas:          nd.escapeRoomUsefulPoints?.propsIdeas           ?? [],
        twistIdeas:          nd.escapeRoomUsefulPoints?.twistIdeas           ?? [],
        tags:                nd.escapeRoomUsefulPoints?.tags                 ?? [],
      },
      quality: {
        transcriptAvailable,
        confidence:  nd.quality?.confidence ?? (transcriptAvailable ? 'high' : 'low'),
        warning:     transcriptAvailable ? '' : '자막 없음 — 제목·채널명 기반 추론',
        summaryMode: transcriptAvailable ? 'precise' : 'no-transcript',
      },
    };
  } catch {
    // Narrative extraction failed — continue with fallback prompt
    narrative = undefined;
  }

  // 5. Pass 2 — Story + Mandalart generation
  step('방탈출 테마 생성 중...');
  const storyPrompt = narrative
    ? buildStoryGenerationPrompt(videoTitle, channelName, narrative)
    : buildPrompt(videoTitle, channelName);

  const rawText = await callGemini(genAI, storyPrompt, 16000);
  const data = parseJSON(rawText);

  // 6. Map results
  const cells   = mapMandalartCells(data);
  const stories = mapStories(data, narrative);

  return {
    cells,
    projectName:  data.mandalart.mainTheme ?? '무제',
    stories,
    videoTitle,
    channelName,
    videoSynopsis: data.videoContext?.synopsis ?? narrative?.summaryShort ?? '',
    videoBeats: (data.videoContext?.beats ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => ({ label: b.label, description: b.description ?? '' }),
    ),
    narrative,
  };
}
