import type { ClueFormat, Genre, PlayTime, ProjectBrief, PuzzleType } from '../types';
import type { StoryBeat, StoryProposal, TwistIntensity } from '../types/story';
import type { OptionalSectionData, OptionalSectionKey, OptionalSectionsMap } from '../types/optionalSections';
import type { PuzzleFlowPlan } from '../types/puzzleFlow';
import type { GameFlowPlan } from '../types/gameFlow';
import type { FloorPlanData } from '../types/floorPlan';
import type { MandalartCellData } from '../types/mandalart';
import { populateMandalartFromStory } from '../utils/mandalartFromStory';
import { generatePuzzleFlowFromStory } from '../utils/puzzleFlow';
import { generateGameFlowFromStory } from '../utils/gameFlow';
import { generateInitialLayout } from '../utils/floorPlan';
import type { MarkdownImportMeta } from '../types/optionalSections';

const BEAT_LABELS: StoryBeat['label'][] = ['기', '승', '전', '반전', '결'];

const SECTION_KEYWORDS: Record<OptionalSectionKey, string[]> = {
  schedule: ['일정', '로드맵', 'phase', 'timeline'],
  budget: ['예산', '투자', '비용', '견적'],
  operations: ['운영', '리셋', '회차', '오픈', '테스트', '체크포인트'],
  executiveReport: ['경영진', '투자', '타당성', '최종 의견', '보고서', '결과 요약'],
  externalReview: ['리뷰', '평가', '플레이어 대표', '몽이', '후기'],
};

export interface MarkdownPipelineImportResult {
  projectName: string;
  projectBrief: ProjectBrief;
  aiStoryProposals: StoryProposal[];
  selectedStory: StoryProposal;
  cells: MandalartCellData[];
  puzzleFlowPlan: PuzzleFlowPlan;
  gameFlowDesign: GameFlowPlan;
  floorPlanData: FloorPlanData;
  optionalSections: OptionalSectionsMap;
  importMeta: MarkdownImportMeta;
}

interface MarkdownSection {
  heading: string;
  level: number;
  content: string;
}

function normalizeText(md: string): string {
  return md.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSections(md: string): MarkdownSection[] {
  const lines = md.split('\n');
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = {
        heading: stripMarkdown(headingMatch[2]),
        level: headingMatch[1].length,
        content: '',
      };
      continue;
    }

    if (!current) {
      current = { heading: '개요', level: 1, content: '' };
    }
    current.content += `${line}\n`;
  }

  if (current) sections.push(current);
  return sections.filter((section) => section.content.trim() || section.heading.trim());
}

function findTitle(md: string, fallback = 'Markdown Imported Theme'): string {
  const firstHeading = md.match(/^#\s+(.+)$/m)?.[1];
  if (firstHeading) {
    return stripMarkdown(firstHeading)
      .replace(/^[^"]*"([^"]+)".*$/, '$1')
      .replace(/\s+—.*$/, '')
      .trim();
  }
  return fallback;
}

function findQuotedTitle(md: string): string | null {
  const match = md.match(/\|\s*\*\*게임 제목\*\*\s*\|\s*([^|]+)\|/);
  if (!match) return null;
  return stripMarkdown(match[1]).replace(/\s+—.*$/, '').trim();
}

function parsePlayTime(md: string): PlayTime[] {
  const match = md.match(/플레이\s*시간[^0-9]*(\d{2,3})\s*분/);
  const raw = match ? Number(match[1]) : 60;
  const closest = [60, 70, 80, 90].reduce((prev, cur) =>
    Math.abs(cur - raw) < Math.abs(prev - raw) ? cur : prev,
  ) as PlayTime;
  return [closest];
}

function detectGenres(text: string): Genre[] {
  const haystack = text.toLowerCase();
  const genres: Genre[] = [];
  const mappings: Array<[Genre, string[]]> = [
    ['horror', ['공포', '호러', 'dark']],
    ['mystery', ['미스터리', '수사', '추리', 'crime']],
    ['adventure', ['어드벤처', '모험']],
    ['thriller', ['스릴러', '긴장', '심리']],
    ['fantasy', ['판타지', '환상']],
    ['sci-fi', ['sf', 'sci-fi', '사이파이']],
    ['romance', ['로맨스']],
    ['comedy', ['코미디']],
  ];

  for (const [genre, keywords] of mappings) {
    if (keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
      genres.push(genre);
    }
  }

  return genres.length > 0 ? genres : ['mystery'];
}

function parsePlayerCount(md: string): string {
  const match = md.match(/권장\s*인원[^0-9]*(\d+\s*[~-]\s*\d+명|\d+\s*~\s*\d+명|\d+\s*명)/);
  return match ? match[1].replace(/\s+/g, '') : '2-6인';
}

function parseTwistIntensity(text: string): TwistIntensity {
  if (/충격|강한\s*반전|극적/.test(text)) return 'high';
  if (/약한\s*반전|가벼운/.test(text)) return 'low';
  return 'medium';
}

function extractSynopsis(sections: MarkdownSection[], rawText: string): string {
  const summarySection = sections.find((section) =>
    /프로젝트 결과 요약|요약|핵심 요약|개요/.test(section.heading),
  );
  if (summarySection?.content.trim()) {
    return stripMarkdown(summarySection.content).slice(0, 380);
  }

  const firstParagraph = rawText
    .split('\n\n')
    .map((paragraph) => stripMarkdown(paragraph))
    .find((paragraph) => paragraph.length > 50);

  return firstParagraph?.slice(0, 380) ?? '';
}

function inferBeats(rawText: string, sections: MarkdownSection[], synopsis: string): StoryBeat[] {
  const text = stripMarkdown(rawText);
  const snippets = {
    기: synopsis || text.slice(0, 120),
    승: findSentence(text, ['단서', '몰입', '구조', '퍼즐']) ?? synopsis,
    전: findSentence(text, ['재방문', '전환', '숨겨진', '재해석']) ?? synopsis,
    반전: findSentence(text, ['반전', '진실', '뒤집', '재방문']) ?? synopsis,
    결: findSentence(text, ['최종', '엔딩', '탈출', '질문']) ?? synopsis,
  };

  const headingMatches = new Map<string, string>();
  for (const section of sections) {
    const heading = section.heading.trim();
    if (BEAT_LABELS.includes(heading as StoryBeat['label'])) {
      headingMatches.set(heading, stripMarkdown(section.content).slice(0, 140));
    }
  }

  return BEAT_LABELS.map((label) => ({
    label,
    description: headingMatches.get(label) || snippets[label] || synopsis || `${label} 단계`,
  }));
}

function findSentence(text: string, keywords: string[]): string | null {
  const sentences = text
    .split(/(?<=[.!?。다])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences.find((sentence) => keywords.some((keyword) => sentence.includes(keyword))) ?? null;
}

function inferInvestigation(rawText: string) {
  const perpetrator = matchAfterLabel(rawText, ['가해자', '범인', '죄인']) ?? '소비 구조의 공범';
  const victim = matchAfterLabel(rawText, ['피해자', '희생자']) ?? '아일라';
  const motive = matchAfterLabel(rawText, ['핵심 갈등', '동기', '본질']) ?? '착취 구조의 폭로';
  const method = matchAfterLabel(rawText, ['범행', '구조', '장치']) ?? '오디오와 공간 단서를 통한 진실 추적';
  const clue = matchAfterLabel(rawText, ['단서', '핵심 단서', '증거']) ?? '마지막 녹음과 현장 기록';
  const technique = matchAfterLabel(rawText, ['수사기법', '풀이', '해결']) ?? '오디오 해석과 공간 탐색';
  const scene = matchAfterLabel(rawText, ['공간 구역', '현장', '장소']) ?? inferRoomNames(rawText)[0] ?? '녹음실';

  return {
    perpetrator,
    motive,
    victim,
    method,
    scene,
    clue,
    technique,
    formula: `${scene}에서 ${victim}의 비밀을 추적해 ${perpetrator}의 ${motive}를 밝혀낸다.`,
  };
}

function matchAfterLabel(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(`${label}[^\\n:：]*[:：]?\\s*([^\\n|]{2,80})`);
    const match = text.match(re);
    if (match?.[1]) {
      return stripMarkdown(match[1]);
    }
  }
  return null;
}

function inferRoomNames(md: string): string[] {
  const lines = md.split('\n').map((line) => line.trim()).filter(Boolean);
  const names = new Set<string>();

  for (const line of lines) {
    const roomMatch = line.match(/(\d+번방|\d+개 방|보이스룸|녹음실|믹싱룸|대기실|운영실|편집실|아카이브|복도|부스)/g);
    roomMatch?.forEach((item) => {
      const cleaned = item.replace(/\d+개 방/, '').trim();
      if (cleaned) names.add(cleaned);
    });
  }

  const explicitList = Array.from(md.matchAll(/["“]?([가-힣A-Za-z0-9 ]{2,20}(?:룸|실|방|부스|복도))["”]?/g))
    .map((match) => match[1].trim());
  explicitList.forEach((item) => names.add(item));

  const roomCountMatch = md.match(/공간\s*구역[^0-9]*(\d+)/);
  const targetCount = roomCountMatch ? Math.min(8, Math.max(3, Number(roomCountMatch[1]))) : 5;

  const result = Array.from(names).slice(0, targetCount);
  if (result.length >= 3) return result;

  return ['보이스룸', '녹음실', '믹싱룸', '아카이브', '대기실'].slice(0, targetCount);
}

function inferPuzzleTypes(text: string): PuzzleType[] {
  const result: PuzzleType[] = [];
  if (/추리|수사|증거/.test(text)) result.push('추리');
  if (/관찰|탐색|발견/.test(text)) result.push('관찰');
  if (/암호|숫자|계산/.test(text)) result.push('수리');
  if (/협업|팀|역할/.test(text)) result.push('협동');
  if (/조작|움직|장치/.test(text)) result.push('활동');
  if (/오디오|감정|청각|어둠|감각/.test(text)) result.push('오감');
  return result;
}

function inferClueFormats(text: string): ClueFormat[] {
  const result: ClueFormat[] = [];
  if (/문서|텍스트|대본|녹취|사진/.test(text)) result.push('평면');
  if (/콘솔|장치|오브제|소품|헤드셋/.test(text)) result.push('입체');
  if (/공간|방|동선|재방문/.test(text)) result.push('공간');
  if (/오디오|청각|감정|어둠|감각/.test(text)) result.push('감각');
  return result;
}

function buildStoryProposals(
  projectName: string,
  synopsis: string,
  beats: StoryBeat[],
  playtime: string,
  playerCount: string,
  genres: Genre[],
  investigation: StoryProposal['investigation'],
  rawText: string,
): StoryProposal[] {
  const baseGenre = genres[0] ?? 'mystery';
  const twistIntensity = parseTwistIntensity(rawText);
  const toneBase = /감정/.test(rawText) ? '감정 몰입 · 서늘함' : '몰입형 · 미스터리';
  const variants: Array<{ suffix: string; genre: string; tone: string; loglineTail: string }> = [
    { suffix: '', genre: genreLabel(baseGenre), tone: toneBase, loglineTail: '희생자의 마지막 기록을 따라 사건의 본질에 다가간다.' },
    { suffix: ' : 다른 시선', genre: '심리 스릴러', tone: '긴장 · 심리 압박', loglineTail: '같은 공간을 다른 의미로 재해석하며 숨겨진 공모 구조를 드러낸다.' },
    { suffix: ' : 마지막 녹음', genre: '감정 수사극', tone: '서정 · 비극', loglineTail: '플레이어가 감정적으로 진실을 이해해야만 탈출할 수 있다.' },
  ];

  return variants.map((variant, index) => ({
    id: `markdown-story-${index}`,
    slot: index,
    title: `${projectName}${variant.suffix}`,
    genre: variant.genre,
    tone: variant.tone,
    logline: `${projectName}에서 플레이어는 ${variant.loglineTail}`,
    synopsis,
    beats,
    meta: {
      playtime,
      playerCount,
      twistIntensity,
    },
    investigation,
  }));
}

function genreLabel(genre: Genre): string {
  const map: Record<Genre, string> = {
    horror: '공포',
    mystery: '미스터리',
    adventure: '어드벤처',
    thriller: '스릴러',
    fantasy: '판타지',
    'sci-fi': 'SF',
    romance: '로맨스',
    comedy: '코미디',
  };
  return map[genre];
}

function extractOptionalSections(sections: MarkdownSection[]): OptionalSectionsMap {
  const result: OptionalSectionsMap = {};

  for (const section of sections) {
    const heading = section.heading.toLowerCase();
    const content = stripMarkdown(section.content);
    if (!content) continue;

    for (const [key, keywords] of Object.entries(SECTION_KEYWORDS) as Array<[OptionalSectionKey, string[]]>) {
      if (result[key]) continue;
      if (keywords.some((keyword) => heading.includes(keyword.toLowerCase()) || content.includes(keyword))) {
        result[key] = {
          key,
          title: section.heading,
          summary: content.slice(0, 160),
          content,
          sourceHeadings: [section.heading],
        };
      }
    }
  }

  return result;
}

export function importProjectFromMarkdown(markdown: string, fileName: string): MarkdownPipelineImportResult {
  const normalized = normalizeText(markdown);
  const sections = splitSections(normalized);
  const projectName = findQuotedTitle(normalized) ?? findTitle(normalized);
  const synopsis = extractSynopsis(sections, normalized);
  const beats = inferBeats(normalized, sections, synopsis);
  const genres = detectGenres(normalized);
  const playTimes = parsePlayTime(normalized);
  const playerCount = parsePlayerCount(normalized);
  const investigation = inferInvestigation(normalized);
  const puzzleTypes = inferPuzzleTypes(normalized);
  const clueFormats = inferClueFormats(normalized);
  const aiStoryProposals = buildStoryProposals(
    projectName,
    synopsis,
    beats,
    `${playTimes[0]}분`,
    playerCount,
    genres,
    investigation,
    normalized,
  );
  const selectedStory = aiStoryProposals[0];
  const cells = populateMandalartFromStory(selectedStory);
  const roomNames = inferRoomNames(normalized);
  const puzzleFlowPlan = generatePuzzleFlowFromStory(selectedStory, cells);
  const gameFlowDesign = generateGameFlowFromStory(selectedStory, cells, roomNames);
  const floorPlanData = generateInitialLayout(gameFlowDesign.rooms);
  const optionalSections = extractOptionalSections(sections);
  const inferredFields: string[] = [];

  if (!normalized.includes('기승전')) inferredFields.push('beats');
  if (!/권장\s*인원/.test(normalized)) inferredFields.push('playerCount');
  if (Object.keys(optionalSections).length === 0) inferredFields.push('optionalSections');

  return {
    projectName,
    projectBrief: {
      source: 'markdown',
      videoId: null,
      videoTitle: null,
      videoChannel: null,
      synopsis,
      beats,
      genres,
      playTimes,
      investigation: {
        motives: [investigation.motive],
        methods: [investigation.method],
        clues: [investigation.clue],
        techniques: [investigation.technique],
      },
      puzzleTypes: puzzleTypes.length > 0 ? puzzleTypes : undefined,
      clueFormats: clueFormats.length > 0 ? clueFormats : undefined,
    },
    aiStoryProposals,
    selectedStory,
    cells,
    puzzleFlowPlan,
    gameFlowDesign,
    floorPlanData,
    optionalSections,
    importMeta: {
      sourceType: 'markdown',
      fileName,
      importedAt: new Date().toISOString(),
      inferredFields,
      detectedSections: Object.keys(optionalSections) as OptionalSectionKey[],
    },
  };
}
