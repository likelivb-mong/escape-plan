import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { listSavedProjects, type SavedProject, type CompletionLevel } from '../utils/projectStorage';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

const LEVEL_CONFIG: Record<CompletionLevel, { label: string; color: string; dot: string }> = {
  brief:  { label: '기획 단계',  color: 'text-amber-300/80',   dot: 'bg-amber-400/70' },
  story:  { label: '스토리 완성', color: 'text-sky-300/80',    dot: 'bg-sky-400/70' },
  flow:   { label: '플로우 설계', color: 'text-violet-300/80', dot: 'bg-violet-400/70' },
  draft:  { label: '드래프트 완성', color: 'text-emerald-300/80', dot: 'bg-emerald-400/70' },
};

const GENRE_KR: Record<string, string> = {
  horror: '공포', mystery: '미스터리', adventure: '어드벤처',
  thriller: '스릴러', fantasy: '판타지', 'sci-fi': 'SF',
  romance: '로맨스', comedy: '코미디',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function CompletionBadge({ level }: { level: CompletionLevel }) {
  const cfg = LEVEL_CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1.5 ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span className="text-footnote font-medium">{cfg.label}</span>
    </span>
  );
}

interface ProjectCardProps {
  project: SavedProject;
  onOpen: (project: SavedProject) => void;
  onDelete: (id: string) => void;
}

function ProjectCard({ project, onOpen, onDelete }: ProjectCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const genres = (project.genres ?? []).map((g) => GENRE_KR[g] ?? g).join(' · ');
  const playTimes = (project.playTimes ?? []).join('/');

  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-300 overflow-hidden">
      {/* Top accent bar based on completion */}
      <div
        className={`h-0.5 w-full ${
          project.completionLevel === 'draft'  ? 'bg-gradient-to-r from-emerald-500/0 via-emerald-400/60 to-emerald-500/0' :
          project.completionLevel === 'flow'   ? 'bg-gradient-to-r from-violet-500/0 via-violet-400/60 to-violet-500/0' :
          project.completionLevel === 'story'  ? 'bg-gradient-to-r from-sky-500/0 via-sky-400/60 to-sky-500/0' :
                                                  'bg-gradient-to-r from-amber-500/0 via-amber-400/60 to-amber-500/0'
        }`}
      />

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-title3 font-semibold text-white/90 truncate">{project.name}</h3>
            {project.storyTitle && (
              <p className="text-subhead text-white/45 truncate mt-0.5">{project.storyTitle}</p>
            )}
          </div>
          <CompletionBadge level={project.completionLevel} />
        </div>

        {/* Synopsis */}
        {project.synopsis && (
          <p className="text-footnote text-white/40 line-clamp-2 leading-relaxed">
            {project.synopsis}
          </p>
        )}

        {/* Meta tags */}
        <div className="flex flex-wrap gap-1.5">
          {genres && (
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-caption text-white/40">
              {genres}
            </span>
          )}
          {playTimes && (
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-caption text-white/40">
              {playTimes}분
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3 mt-auto">
        <span className="text-caption text-white/25">{formatDate(project.updatedAt)} 수정</span>

        <div className="flex items-center gap-2">
          {confirmDelete ? (
            <>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1 rounded-full text-caption text-white/40 hover:text-white/60 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => onDelete(project.id)}
                className="px-3 py-1 rounded-full bg-red-500/15 text-caption text-red-400/90 hover:bg-red-500/25 transition-all"
              >
                삭제 확인
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-full text-white/20 hover:text-red-400/60 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                title="프로젝트 삭제"
              >
                <TrashIcon />
              </button>
              <button
                onClick={() => onOpen(project)}
                className="px-4 py-1.5 rounded-full bg-white text-black text-subhead font-semibold hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                열기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { deleteProject } = useProject();
  const [projects, setProjects] = useState<SavedProject[]>([]);

  // Refresh list whenever page is shown
  useEffect(() => {
    setProjects(listSavedProjects());
  }, []);

  const handleOpen = (project: SavedProject) => {
    navigate(`/projects/${project.id}`);
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-title1 font-bold text-white/90">내 프로젝트</h1>
            <p className="text-body text-white/35 mt-1">
              {projects.length > 0
                ? `${projects.length}개의 저장된 프로젝트`
                : '저장된 프로젝트가 없습니다'}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-body font-semibold hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PlusIcon />
            새 프로젝트
          </button>
        </div>
      </div>

      {/* Grid or Empty state */}
      <div className="max-w-5xl mx-auto">
        {projects.length === 0 ? (
          <EmptyState onNewProject={() => navigate('/')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onNewProject: _ }: { onNewProject: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-2xl">
        🗂
      </div>
      <div>
        <p className="text-title3 font-semibold text-white/60">아직 저장된 프로젝트가 없어요</p>
        <p className="text-body text-white/30 mt-1.5">
          Draft 페이지에서 "Save Draft"를 누르면 여기에 저장됩니다
        </p>
      </div>
    </div>
  );
}
