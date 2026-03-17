import type { SavedProject } from './projectStorage';

const HISTORY_PREFIX = 'xcape-project-history-';
const RETENTION_DAYS = 7;

export interface HistorySnapshot {
  id: string;
  projectId: string;
  savedAt: string; // ISO timestamp
  label: string;   // human-readable page/action label
  data: SavedProject;
}

function storageKey(projectId: string): string {
  return `${HISTORY_PREFIX}${projectId}`;
}

/**
 * Save a snapshot of the current project state to history.
 */
export function saveHistorySnapshot(
  project: SavedProject,
  label: string = '자동 저장',
): void {
  const key = storageKey(project.id);
  const existing = listHistorySnapshots(project.id);

  const snapshot: HistorySnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    projectId: project.id,
    savedAt: new Date().toISOString(),
    label,
    data: project,
  };

  // Prepend (newest first)
  existing.unshift(snapshot);

  // Purge entries older than 7 days
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const pruned = existing.filter((s) => new Date(s.savedAt).getTime() > cutoff);

  try {
    localStorage.setItem(key, JSON.stringify(pruned));
  } catch {
    // If localStorage is full, keep only last 20
    const trimmed = pruned.slice(0, 20);
    localStorage.setItem(key, JSON.stringify(trimmed));
  }
}

/**
 * List all history snapshots for a project (newest first).
 * Auto-purges entries older than 7 days.
 */
export function listHistorySnapshots(projectId: string): HistorySnapshot[] {
  const key = storageKey(projectId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const snapshots = JSON.parse(raw) as HistorySnapshot[];

    // Auto-purge old entries
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const valid = snapshots.filter((s) => new Date(s.savedAt).getTime() > cutoff);

    // Persist purge if needed
    if (valid.length < snapshots.length) {
      localStorage.setItem(key, JSON.stringify(valid));
    }

    return valid;
  } catch {
    return [];
  }
}

/**
 * Get a specific snapshot by ID.
 */
export function getHistorySnapshot(projectId: string, snapshotId: string): HistorySnapshot | null {
  return listHistorySnapshots(projectId).find((s) => s.id === snapshotId) ?? null;
}

/**
 * Delete all history for a project.
 */
export function clearProjectHistory(projectId: string): void {
  localStorage.removeItem(storageKey(projectId));
}

/**
 * Format a timestamp for display.
 */
export function formatSnapshotTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 2) return '어제';
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get a summary of what changed between two snapshots.
 */
export function getSnapshotSummary(snapshot: HistorySnapshot): {
  cellsFilled: number;
  hasStory: boolean;
  hasGameFlow: boolean;
  hasFloorPlan: boolean;
  roomCount: number;
  stepCount: number;
} {
  const d = snapshot.data;
  return {
    cellsFilled: d.cells.filter((c) => c.text.trim()).length,
    hasStory: !!d.selectedStory,
    hasGameFlow: !!d.gameFlowDesign,
    hasFloorPlan: !!d.floorPlanData,
    roomCount: d.gameFlowDesign?.rooms?.length ?? 0,
    stepCount: d.gameFlowDesign?.steps?.length ?? 0,
  };
}
