// TODO: Replace mock logic with real API calls / DB persistence as needed.
// All functions are pure and serialisable — ready for Supabase / Notion / PDF export.

import type { DraftDocument, DraftBeat, DraftAdoptedPuzzlesByStage, DraftStatus, StageLabel } from '../types/draft';
import type { MandalartCellData } from '../types/mandalart';
import type { StoryProposal } from '../types/story';
import type { PuzzleFlowPlan } from '../types/puzzleFlow';
import type { PuzzleRecommendationGroup } from '../types/puzzleRecommendation';

// ── Keyword extraction ────────────────────────────────────────────────────────

export function getConceptSummaryFromCells(cells: MandalartCellData[]) {
  const active = cells.filter((c) => !c.isCenter && c.text.trim());
  const conceptKeywords = active.filter((c) => c.theme === 'rose').map((c) => c.text.trim());
  const effectsKeywords = active.filter((c) => c.theme === 'sky').map((c) => c.text.trim());
  const clueKeywords    = active.filter((c) => c.theme === 'amber').map((c) => c.text.trim());
  return { conceptKeywords, effectsKeywords, clueKeywords };
}

// ── Adopted puzzle extraction ─────────────────────────────────────────────────

export function getAdoptedRecommendationsByStage(
  groups: PuzzleRecommendationGroup[],
): DraftAdoptedPuzzlesByStage[] {
  return groups
    .map((g) => ({
      stageKey:   g.stageKey,
      stageLabel: g.stageLabel as StageLabel,
      stageTitle: g.stageTitle,
      puzzles: g.recommendations
        .filter((r) => r.status === 'adopted' || r.status === 'edited')
        .map((r) => ({
          id:                r.id,
          title:             r.title,
          type:              r.type,
          difficulty:        r.difficulty,
          estimatedMinutes:  r.estimatedMinutes,
          description:       r.description,
          recommendedBecause: r.recommendedBecause,
          clueUsage:         r.clueUsage,
          deviceUsage:       r.deviceUsage,
          expectedOutput:    r.expectedOutput,
        })),
    }))
    .filter((s) => s.puzzles.length > 0);
}

// ── Primary builder ───────────────────────────────────────────────────────────

export function buildDraftDocument({
  projectName,
  cells,
  story,
  puzzleFlowPlan,
  puzzleRecommendationGroups,
}: {
  projectName: string;
  cells: MandalartCellData[];
  story: StoryProposal;
  puzzleFlowPlan: PuzzleFlowPlan;
  puzzleRecommendationGroups: PuzzleRecommendationGroup[];
}): DraftDocument {
  const { conceptKeywords, effectsKeywords, clueKeywords } = getConceptSummaryFromCells(cells);
  const adoptedByStage = getAdoptedRecommendationsByStage(puzzleRecommendationGroups);
  const totalAdopted = adoptedByStage.reduce((s, g) => s + g.puzzles.length, 0);

  // Main theme: center cell text, fallback to project name
  const centerCell = cells.find((c) => c.isCenter);
  const mainTheme = centerCell?.text?.trim() || story.title;

  // Parse numeric playtime from string like "60분" or "60~75분"
  const playTimeMatch = story.meta.playtime.match(/\d+/);
  const playTime = playTimeMatch ? parseInt(playTimeMatch[0], 10) : puzzleFlowPlan.totalPlayTime;

  const beats: DraftBeat[] = puzzleFlowPlan.stages.map((stage) => ({
    label:            stage.label as StageLabel,
    title:            stage.title,
    description:      stage.description,
    estimatedMinutes: stage.estimatedMinutes,
    objective:        stage.objective,
  }));

  return {
    projectName,
    mainTheme,
    generatedAt: new Date().toISOString(),
    storyTitle:       story.title,
    logline:          story.logline,
    synopsis:         story.synopsis,
    genre:            story.genre,
    tone:             story.tone,
    playTime,
    playerCount:      story.meta.playerCount,
    twistIntensity:   story.meta.twistIntensity,
    conceptKeywords,
    effectsKeywords,
    clueKeywords,
    beats,
    totalPlayTime:    puzzleFlowPlan.totalPlayTime,
    adoptedPuzzlesByStage: adoptedByStage,
    totalAdoptedCount: totalAdopted,
  };
}

// ── Status / completeness ─────────────────────────────────────────────────────

export function calcDraftStatus(doc: DraftDocument): DraftStatus {
  const adoptedCount        = doc.totalAdoptedCount;
  const conceptKeywordCount = doc.conceptKeywords.length;
  const clueCount           = doc.clueKeywords.length;
  const deviceCount         = doc.effectsKeywords.length;

  // Weighted completeness: story(20) + flow(20) + keywords(20) + puzzles(40)
  const storyScore    = doc.storyTitle ? 20 : 0;
  const flowScore     = doc.beats.length > 0 ? 20 : 0;
  const kwScore       = Math.min((conceptKeywordCount + clueCount + deviceCount) * 2, 20);
  const puzzleScore   = Math.min(adoptedCount * 4, 40);
  const completenessScore = storyScore + flowScore + kwScore + puzzleScore;

  return {
    hasStory:  !!doc.storyTitle,
    hasFlow:   doc.beats.length > 0,
    adoptedCount,
    conceptKeywordCount,
    clueCount,
    deviceCount,
    completenessScore,
  };
}

// ── Suggested next steps ──────────────────────────────────────────────────────

export function getSuggestedNextSteps(status: DraftStatus): string[] {
  const steps: string[] = [];

  if (!status.hasStory) {
    steps.push('Story 페이지에서 스토리를 선택하세요.');
  }
  if (!status.hasFlow) {
    steps.push('Puzzle Flow 페이지에서 플로우를 완성하세요.');
  }
  if (status.adoptedCount === 0) {
    steps.push('퍼즐 추천 페이지에서 최소 1개 이상의 퍼즐을 채택하세요.');
  } else if (status.adoptedCount < 5) {
    steps.push(`더 많은 퍼즐을 채택해 풍성한 기획안을 만들어보세요. (현재 ${status.adoptedCount}개)`);
  }
  if (status.conceptKeywordCount === 0) {
    steps.push('Mandalart에서 컨셉 키워드(분홍색)를 추가하세요.');
  }
  if (status.clueCount === 0) {
    steps.push('Mandalart에서 단서/소품 키워드(주황색)를 추가하세요.');
  }
  if (status.deviceCount === 0) {
    steps.push('Mandalart에서 연출/장치 키워드(하늘색)를 추가하세요.');
  }
  if (status.completenessScore >= 80) {
    steps.push('기획안 완성도가 높습니다. 팀 내부 검토를 위해 Export하세요.');
  }

  return steps.slice(0, 4); // max 4 suggestions
}

// ── Mock export handlers ──────────────────────────────────────────────────────
// TODO: Replace with real export implementations (PDF.js, Notion API, Supabase)

export function mockExportPDF(doc: DraftDocument): void {
  console.log('[Draft] Export PDF →', doc.projectName, new Date().toISOString());
  // Future: use @react-pdf/renderer or puppeteer server-side
}

export function mockExportNotion(doc: DraftDocument): void {
  console.log('[Draft] Export Notion →', doc.projectName, new Date().toISOString());
  // Future: POST to /api/notion/export with doc payload
}

export function mockSaveDraft(doc: DraftDocument): void {
  console.log('[Draft] Save Draft →', doc.projectName, new Date().toISOString());
  // Future: upsert to Supabase drafts table
  // supabase.from('drafts').upsert({ project_name: doc.projectName, content: doc })
}
