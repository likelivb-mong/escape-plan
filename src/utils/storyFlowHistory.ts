import type { StoryProposal } from '../types/story';

// ── Types ────────────────────────────────────────────────────────────────────

export interface StoryFlowSnapshot {
  id: string;
  timestamp: string;
  selectedId: string;
  proposals: StoryProposal[];
  variantIndices: Record<string, number>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

function getHistoryKey(projectId: string | null, projectName: string): string {
  const key = projectId ?? projectName.replace(/\s+/g, '-').toLowerCase();
  return `xcape-storyflow-history-${key}`;
}

// ── Public API ───────────────────────────────────────────────────────────────

export function loadHistory(
  projectId: string | null,
  projectName: string,
): StoryFlowSnapshot[] {
  try {
    const raw = localStorage.getItem(getHistoryKey(projectId, projectName));
    if (!raw) return [];
    return JSON.parse(raw) as StoryFlowSnapshot[];
  } catch {
    return [];
  }
}

export function saveHistory(
  projectId: string | null,
  projectName: string,
  snapshots: StoryFlowSnapshot[],
): void {
  localStorage.setItem(
    getHistoryKey(projectId, projectName),
    JSON.stringify(snapshots),
  );
}

export function cleanExpiredSnapshots(
  snapshots: StoryFlowSnapshot[],
): StoryFlowSnapshot[] {
  const cutoff = Date.now() - EXPIRY_MS;
  return snapshots.filter((s) => new Date(s.timestamp).getTime() > cutoff);
}

export function createSnapshot(
  selectedId: string,
  proposals: StoryProposal[],
  variantIndices: Record<string, number>,
): StoryFlowSnapshot {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    selectedId,
    proposals,
    variantIndices,
  };
}
