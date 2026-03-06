import { GoogleGenerativeAI } from '@google/generative-ai';
import type { MandalartCellData } from '../types/mandalart';
import type { StoryProposal, InvestigationFramework } from '../types/story';
import {
  buildInvestigationPromptSection,
  buildQuestTaxonomyPromptSection,
} from '../data/xcapeKnowledge';

// ── Mandalart position mappings ───────────────────────────────────────────────

// Sub-goal (row, col) in center block, in the order we pass to the AI
const SUBGOAL_POSITIONS: [number, number][] = [
  [3, 3], [3, 4], [3, 5],
  [4, 3],         [4, 5],
  [5, 3], [5, 4], [5, 5],
];

// Expansion block (br, bc) that corresponds to each sub-goal index above
const EXPANSION_BLOCKS: [number, number][] = [
  [0, 0], [0, 1], [0, 2],
  [1, 0],         [1, 2],
  [2, 0], [2, 1], [2, 2],
];

/** Returns 8 action-cell positions for expansion block (br, bc), row-major order. */
function getActionCells(br: number, bc: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = br * 3; r <= br * 3 + 2; r++) {
    for (let c = bc * 3; c <= bc * 3 + 2; c++) {
      if (r === br * 3 + 1 && c === bc * 3 + 1) continue; // skip linked-center
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
}

// ── Retry helpers ─────────────────────────────────────────────────────────────

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];
const MAX_RETRIES = 4;

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return msg.includes('503') || msg.includes('429') || msg.includes('overloaded') || msg.includes('RESOURCE_EXHAUSTED');
}

// ── Prompt builder ────────────────────────────────────────────────────────────

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

// ── Main entry point ──────────────────────────────────────────────────────────

export async function analyzeYoutube(youtubeUrl: string): Promise<AnalysisResult> {
  // 1. Fetch video metadata via noembed (CORS-safe, no auth required)
  let videoTitle = '알 수 없는 영상';
  let channelName = '';
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(youtubeUrl)}`,
    );
    const meta = await res.json();
    if (meta.title)       videoTitle  = meta.title;
    if (meta.author_name) channelName = meta.author_name;
  } catch {
    // Continue with URL-only info
  }

  // 2. Call Gemini API
  const apiKey = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_KEY as string | undefined;
  if (!apiKey) throw new Error('VITE_GOOGLE_GENERATIVE_AI_KEY가 설정되어 있지 않습니다.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt(videoTitle, channelName);

  // Retry loop with model fallback
  let rawText = '';
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // 처음 2번은 Flash, 이후 Pro로 전환
    const modelName = attempt < 2 ? MODELS[0] : MODELS[1];
    const model = genAI.getGenerativeModel({ model: modelName });
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 16000,
          responseMimeType: 'application/json',
        },
      });
      rawText = result.response.text();
      break; // 성공 시 루프 탈출
    } catch (err: unknown) {
      if (!isRetryableError(err) || attempt === MAX_RETRIES - 1) throw err;
      // 재시도 전 대기 (2초, 4초, 6초)
      await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
    }
  }

  // 3. Parse JSON — responseMimeType 덕분에 대부분 직접 파싱 가능
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    // Fallback: extract JSON from response (code block, extra text 등)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.');
    try {
      data = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error(`AI 응답 JSON 파싱에 실패했습니다. (응답 길이: ${rawText.length}자)`);
    }
  }

  // 4. Map to MandalartCellData[]
  const cellMap = new Map<string, { text: string; theme: MandalartCellData['theme']; questTag?: string }>();

  // Center cell
  cellMap.set('4-4', { text: data.mandalart.mainTheme ?? '무제', theme: null });

  // Sub-goals → center block + expansion block linked center + action cells
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subGoals: any[] = (data.mandalart.subGoals ?? []).slice(0, 8);
  subGoals.forEach((sg, i) => {
    const [row, col] = SUBGOAL_POSITIONS[i];
    const [br, bc]   = EXPANSION_BLOCKS[i];

    // Center-block sub-goal
    cellMap.set(`${row}-${col}`, { text: sg.name, theme: sg.theme ?? null });

    // Expansion-block linked center (mirror)
    const lr = br * 3 + 1;
    const lc = bc * 3 + 1;
    cellMap.set(`${lr}-${lc}`, { text: sg.name, theme: sg.theme ?? null });

    // Action cells
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

  // Build full 81-cell array
  const cells: MandalartCellData[] = Array.from({ length: 81 }, (_, idx) => {
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
      text:     entry?.text     ?? '',
      theme:    entry?.theme    ?? null,
      isCenter,
      isSubGoal: isSub,
      ...(entry?.questTag ? { questTag: entry.questTag } : {}),
    };
  });

  // 5. Map stories (with investigation framework)
  const stories: StoryProposal[] = (data.stories ?? []).slice(0, 3).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any, i: number) => {
      // Parse investigation framework (optional — backward compatible)
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
      };
    },
  );

  return {
    cells,
    projectName: data.mandalart.mainTheme ?? '무제',
    stories,
    videoTitle,
    channelName,
    videoSynopsis: data.videoContext?.synopsis ?? '',
    videoBeats: (data.videoContext?.beats ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => ({ label: b.label, description: b.description ?? '' }),
    ),
  };
}
