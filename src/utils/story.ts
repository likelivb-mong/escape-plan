import type { StoryProposal, KeywordCategory, KeywordItem } from '../types/story';
import type { MandalartCellData } from '../types/mandalart';
import type { ProjectBrief } from '../types';
import { STORY_VARIANTS } from '../data/mockStories';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Genre labels (shared) ────────────────────────────────────────────────────
const GENRE_MAP: Record<string, string> = {
  horror: '공포', mystery: '미스터리', adventure: '어드벤처', thriller: '스릴러',
  fantasy: '판타지', 'sci-fi': 'SF', romance: '로맨스', comedy: '코미디',
};

// ── Build context from ProjectBrief ──────────────────────────────────────────
export function buildBriefContext(brief: ProjectBrief, projectName: string): string {
  let ctx = `테마 이름: ${projectName}\n`;
  if (brief.genres.length) ctx += `장르: ${brief.genres.map(g => GENRE_MAP[g] ?? g).join(', ')}\n`;
  if (brief.playTimes.length) ctx += `플레이 시간: ${brief.playTimes.map(t => `${t}분`).join(', ')}\n`;
  if (brief.source === 'youtube' && brief.videoTitle) ctx += `원본 YouTube 영상: ${brief.videoTitle}\n`;
  if (brief.synopsis) ctx += `\n시놉시스:\n${brief.synopsis}\n`;
  if (brief.beats.length) {
    ctx += `\n스토리 구조 (기승전반결):\n`;
    brief.beats.forEach(b => { ctx += `  [${b.label}] ${b.description}\n`; });
  }
  const inv = brief.investigation;
  const parts: string[] = [];
  if (inv.motives.length) parts.push(`동기: ${inv.motives.join(', ')}`);
  if (inv.methods.length) parts.push(`수법: ${inv.methods.join(', ')}`);
  if (inv.clues.length) parts.push(`단서: ${inv.clues.join(', ')}`);
  if (inv.techniques?.length) parts.push(`기법: ${inv.techniques.join(', ')}`);
  if (parts.length) ctx += `\n수사 키워드:\n${parts.join('\n')}\n`;
  return ctx.trim();
}

// ── Keyword categorisation ────────────────────────────────────────────────────

export function extractKeywordsByCategory(cells: MandalartCellData[]): KeywordCategory[] {
  const items: KeywordItem[] = cells
    .filter((c) => !c.isCenter && c.text.trim())
    .map((c) => ({ id: c.id, text: c.text.trim(), theme: c.theme }));

  const rose    = items.filter((k) => k.theme === 'rose');
  const sky     = items.filter((k) => k.theme === 'sky');
  const amber   = items.filter((k) => k.theme === 'amber');
  const others  = items.filter((k) => !k.theme);

  const cats: KeywordCategory[] = [];
  if (rose.length)   cats.push({ label: '컨셉',    theme: 'rose',  keywords: rose });
  if (sky.length)    cats.push({ label: '연출/장치', theme: 'sky',   keywords: sky });
  if (amber.length)  cats.push({ label: '단서/소품', theme: 'amber', keywords: amber });
  if (others.length) cats.push({ label: '기타',     theme: null,    keywords: others });
  return cats;
}

// ── Story generators ──────────────────────────────────────────────────────────

/**
 * Generate 3 story proposals (one per slot).
 * `variantIndices` controls which variant is shown per slot.
 *
 * Note: initial load uses this synchronous mock. Regeneration uses the AI path below.
 */
export function generateStoryProposals(
  _keywords: KeywordItem[],
  _themeTitle: string,
  variantIndices: [number, number, number],
): StoryProposal[] {
  return STORY_VARIANTS.map((variants, slot) => {
    const idx = variantIndices[slot] % variants.length;
    return variants[idx];
  });
}

// ── AI story generation ───────────────────────────────────────────────────────

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];
const MAX_RETRIES = 4;

function buildKeywordContext(keywords: KeywordItem[], themeTitle: string): string {
  // Prefer themed keywords; cap each bucket to keep prompt lean
  const themed = keywords.filter((k) => k.theme !== null);
  const others = keywords.filter((k) => k.theme === null);
  // Use themed first, fill up to 40 total with unthemed if needed
  const selected = [...themed, ...others].slice(0, 40);

  const byTheme: Record<string, string[]> = { '컨셉/인물': [], '연출/장치': [], '단서/소품': [], '기타': [] };
  selected.forEach((k) => {
    if (k.theme === 'rose')       byTheme['컨셉/인물'].push(k.text);
    else if (k.theme === 'sky')   byTheme['연출/장치'].push(k.text);
    else if (k.theme === 'amber') byTheme['단서/소품'].push(k.text);
    else                          byTheme['기타'].push(k.text);
  });
  let ctx = `메인 테마: ${themeTitle}\n`;
  for (const [label, kws] of Object.entries(byTheme)) {
    if (kws.length) ctx += `${label}: ${kws.join(', ')}\n`;
  }
  return ctx.trim();
}

function buildStoryPrompt(keywords: KeywordItem[], themeTitle: string, count: number, slotIndex?: number, briefCtx?: string): string {
  const kwCtx = keywords.length > 0 ? buildKeywordContext(keywords, themeTitle) : '';
  const slotSpec = count === 1
    ? `슬롯 ${slotIndex ?? 0}번 스토리 1개를 생성하세요. JSON의 slot 값은 ${slotIndex ?? 0}이어야 합니다.`
    : '서로 완전히 다른 장르와 분위기의 스토리 3개를 생성하세요. slot은 0, 1, 2 순서로.';

  const contextSection = briefCtx
    ? `[기획안 정보]\n${briefCtx}${kwCtx ? `\n\n[만다라트 키워드]\n${kwCtx}` : ''}`
    : kwCtx
      ? `[만다라트 키워드]\n${kwCtx}`
      : `메인 테마: ${themeTitle}`;

  return `당신은 XCAPE 방탈출 테마 기획 전문가입니다. 아래 기획안을 토대로, 실제 방탈출 카페에서 인기 있을 만한 오프라인 방탈출 게임 시나리오 스토리를 제안하세요.

${contextSection}

위 기획안의 세계관, 캐릭터, 사건 설정에서 영감을 받되, 방탈출 게임으로 재구성하여 플레이어가 직접 체험할 수 있는 몰입감 있고 인기 있을 시나리오를 만드세요.

반드시 유효한 JSON으로만 응답하세요. markdown 코드블록 없이 순수 JSON만 출력하세요.

${slotSpec}

{
  "stories": [
    {
      "slot": 0,
      "title": "스토리 제목",
      "genre": "장르",
      "tone": "분위기 · 감성",
      "logline": "한 줄 요약",
      "synopsis": "2-3문장 시놉시스",
      "beats": [
        {"label": "기", "description": "도입"},
        {"label": "승", "description": "전개"},
        {"label": "전", "description": "전환"},
        {"label": "반전", "description": "반전"},
        {"label": "결", "description": "결말"}
      ],
      "meta": {
        "playtime": "60분",
        "playerCount": "2-6인",
        "twistIntensity": "medium"
      },
      "investigation": {
        "perpetrator": "가해자",
        "motive": "동기",
        "victim": "피해자",
        "method": "방법",
        "scene": "장소",
        "clue": "핵심 단서",
        "technique": "수사기법",
        "formula": "완성 조합 문장"
      }
    }
  ]
}

규칙:
- stories 정확히 ${count}개
- 기획안의 세계관과 설정을 활용한 오프라인 방탈출 게임 시나리오여야 함
- 각 스토리는 서로 다른 관점, 장르 변주, 또는 플레이 컨셉을 시도할 것
- 실제 방탈출 카페에서 인기 있을 만한 매력적인 스토리일 것
- twistIntensity: "low", "medium", "high" 중 하나
- 모든 문자열에 큰따옴표만 사용`;
}

async function callGeminiForStories(
  keywords: KeywordItem[],
  themeTitle: string,
  count: number,
  slotIndex?: number,
  briefCtx?: string,
): Promise<StoryProposal[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_KEY as string | undefined;
  if (!apiKey) throw new Error('VITE_GOOGLE_GENERATIVE_AI_KEY가 설정되어 있지 않습니다.');

  const genAI  = new GoogleGenerativeAI(apiKey);
  const prompt = buildStoryPrompt(keywords, themeTitle, count, slotIndex, briefCtx);

  let rawText = '';
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const modelName = attempt < 2 ? MODELS[0] : MODELS[1];
    const model     = genAI.getGenerativeModel({ model: modelName });
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 10000, responseMimeType: 'application/json' },
      });
      rawText = result.response.text();
      break;
    } catch (err: unknown) {
      const isRetryable =
        err instanceof Error &&
        (err.message.includes('503') || err.message.includes('429') ||
          err.message.includes('overloaded') || err.message.includes('RESOURCE_EXHAUSTED'));
      if (!isRetryable || attempt === MAX_RETRIES - 1) throw err;
      await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    const m = rawText.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.');
    data = JSON.parse(m[0]);
  }

  const ts = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.stories ?? []).map((s: any, i: number): StoryProposal => ({
    id:         `ai-${ts}-${i}`,
    slot:       s.slot ?? i,
    title:      s.title      ?? '무제',
    genre:      s.genre      ?? '미스터리',
    tone:       s.tone       ?? '',
    logline:    s.logline    ?? '',
    synopsis:   s.synopsis   ?? '',
    beats:      s.beats      ?? [],
    meta: {
      playtime:        s.meta?.playtime        ?? '60분',
      playerCount:     s.meta?.playerCount     ?? '2-6인',
      twistIntensity:  s.meta?.twistIntensity  ?? 'medium',
    },
    ...(s.investigation ? { investigation: s.investigation } : {}),
  }));
}

// ── Public regeneration functions ─────────────────────────────────────────────

/**
 * Regenerate a single story slot using project keywords via Gemini.
 * Falls back to mock rotation if no API key or network error.
 */
export async function regenerateSingleProposal(
  slot: number,
  currentVariantIndex: number,
  keywords: KeywordItem[],
  themeTitle: string,
  briefCtx?: string,
): Promise<{ newVariantIndex: number; proposal: StoryProposal }> {
  if (keywords.length > 0 || briefCtx) {
    try {
      const stories  = await callGeminiForStories(keywords, themeTitle, 1, slot, briefCtx);
      const proposal = stories[0];
      if (proposal) {
        return { newVariantIndex: 0, proposal: { ...proposal, slot } };
      }
    } catch (err) {
      console.warn('[story] AI regeneration failed, falling back to mock:', err);
    }
  }

  // Fallback: mock rotation
  await new Promise((res) => setTimeout(res, 900 + Math.random() * 600));
  const variants = STORY_VARIANTS[slot];
  const newIdx   = (currentVariantIndex + 1) % variants.length;
  return { newVariantIndex: newIdx, proposal: variants[newIdx] };
}

/**
 * Regenerate all 3 proposals using project keywords via Gemini.
 * Falls back to mock rotation if no API key or network error.
 */
export async function regenerateAllProposals(
  currentVariantIndices: [number, number, number],
  keywords: KeywordItem[],
  themeTitle: string,
  briefCtx?: string,
): Promise<{ newVariantIndices: [number, number, number]; proposals: StoryProposal[] }> {
  if (keywords.length > 0 || briefCtx) {
    try {
      // Generate each story separately to avoid JSON truncation from large responses
      const [r0, r1, r2] = await Promise.all([
        callGeminiForStories(keywords, themeTitle, 1, 0, briefCtx),
        callGeminiForStories(keywords, themeTitle, 1, 1, briefCtx),
        callGeminiForStories(keywords, themeTitle, 1, 2, briefCtx),
      ]);
      const stories = [r0[0], r1[0], r2[0]].filter(Boolean) as StoryProposal[];
      if (stories.length > 0) {
        const ts        = Date.now();
        const proposals = [0, 1, 2].map((i) => ({
          ...(stories[i] ?? stories[0]),
          slot: i,
          id:   `ai-${ts}-${i}`,
        }));
        return { newVariantIndices: [0, 0, 0], proposals };
      }
    } catch (err) {
      console.warn('[story] AI batch generation failed, falling back to mock:', err);
    }
  }

  // Fallback: mock rotation
  await new Promise((res) => setTimeout(res, 1200 + Math.random() * 300));
  const newIndices = currentVariantIndices.map(
    (idx, slot) => (idx + 1) % STORY_VARIANTS[slot].length,
  ) as [number, number, number];
  const proposals  = STORY_VARIANTS.map((variants, slot) => variants[newIndices[slot]]);
  return { newVariantIndices: newIndices, proposals };
}
