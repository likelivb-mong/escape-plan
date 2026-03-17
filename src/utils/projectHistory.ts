import type { SavedProject } from './projectStorage';

const HISTORY_PREFIX = 'xcape-project-history-';
const RETENTION_DAYS = 7;

/** Pages that can have independent history */
export type HistoryPage = 'plan' | 'story' | 'mandalart' | 'gameFlow' | 'setting';

export const PAGE_LABELS: Record<HistoryPage, string> = {
  plan: 'Plan',
  story: 'Story',
  mandalart: '만다라트',
  gameFlow: 'Game Flow',
  setting: 'Pass Map',
};

export interface HistorySnapshot {
  id: string;
  projectId: string;
  savedAt: string; // ISO timestamp
  page: HistoryPage;
  data: SavedProject;
}

function storageKey(projectId: string): string {
  return `${HISTORY_PREFIX}${projectId}`;
}

/**
 * Save a snapshot of the current project state to history, tagged with a page.
 */
export function saveHistorySnapshot(
  project: SavedProject,
  page: HistoryPage = 'mandalart',
): void {
  const key = storageKey(project.id);
  const existing = listHistorySnapshots(project.id);

  const snapshot: HistorySnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    projectId: project.id,
    savedAt: new Date().toISOString(),
    page,
    data: project,
  };

  existing.unshift(snapshot);

  // Purge entries older than 7 days
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const pruned = existing.filter((s) => new Date(s.savedAt).getTime() > cutoff);

  try {
    localStorage.setItem(key, JSON.stringify(pruned));
  } catch {
    const trimmed = pruned.slice(0, 20);
    localStorage.setItem(key, JSON.stringify(trimmed));
  }
}

/**
 * List all history snapshots for a project (newest first).
 * Optionally filter by page.
 */
export function listHistorySnapshots(projectId: string, page?: HistoryPage): HistorySnapshot[] {
  const key = storageKey(projectId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const snapshots = JSON.parse(raw) as HistorySnapshot[];

    // Auto-purge old entries
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const valid = snapshots.filter((s) => new Date(s.savedAt).getTime() > cutoff);

    if (valid.length < snapshots.length) {
      localStorage.setItem(key, JSON.stringify(valid));
    }

    if (page) return valid.filter((s) => s.page === page);
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
 * Get a summary of the snapshot's data, scoped to a specific page.
 */
export function getSnapshotSummary(snapshot: HistorySnapshot): string {
  const d = snapshot.data;
  switch (snapshot.page) {
    case 'plan': {
      const genres = d.projectBrief?.genres?.join(', ') ?? '';
      return genres ? `장르: ${genres}` : '기획 데이터';
    }
    case 'story': {
      return d.selectedStory?.title ?? '스토리 없음';
    }
    case 'mandalart': {
      const filled = d.cells.filter((c) => c.text.trim()).length;
      return `${filled}/81 칸 작성`;
    }
    case 'gameFlow': {
      const steps = d.gameFlowDesign?.steps?.length ?? 0;
      const rooms = d.gameFlowDesign?.rooms?.length ?? 0;
      return steps > 0 ? `${steps}스텝 · ${rooms}룸` : 'Flow 없음';
    }
    case 'setting': {
      return d.floorPlanData ? '배치도 있음' : '배치도 없음';
    }
  }
}

/**
 * Restore only the data belonging to a specific page from a snapshot.
 * Returns partial state setters to call.
 */
export function extractPageData(snapshot: HistorySnapshot): {
  page: HistoryPage;
  data: Partial<SavedProject>;
} {
  const d = snapshot.data;
  switch (snapshot.page) {
    case 'plan':
      return { page: 'plan', data: { projectBrief: d.projectBrief } };
    case 'story':
      return { page: 'story', data: { selectedStory: d.selectedStory } };
    case 'mandalart':
      return { page: 'mandalart', data: { cells: d.cells } };
    case 'gameFlow':
      return { page: 'gameFlow', data: { gameFlowDesign: d.gameFlowDesign } };
    case 'setting':
      return { page: 'setting', data: { floorPlanData: d.floorPlanData } };
  }
}
