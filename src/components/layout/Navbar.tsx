import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';

// Design workflow stages — mirrors the escape room design pipeline
const WORKFLOW_STEPS = [
  { path: '/story', label: '스토리', shortLabel: '스토리' },
  { path: '/mandalart', label: '만다라트', shortLabel: '만다라트' },
  { path: '/puzzle-flow', label: '퍼즐 플로우', shortLabel: '플로우' },
  { path: '/puzzle-recommendations', label: '퍼즐 추천', shortLabel: '추천' },
  { path: '/floor-plan', label: '공간 배치', shortLabel: '공간' },
  { path: '/draft', label: '기획안', shortLabel: '기획안' },
];

// All paths that belong inside a project workflow
const PROJECT_PATHS = ['/story', '/mandalart', '/scenario', '/puzzle-flow', '/puzzle-recommendations', '/floor-plan', '/draft'];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectName } = useProject();

  const isProjectDashboard = location.pathname.startsWith('/projects/') && location.pathname !== '/projects';
  const isInsideProject = isProjectDashboard || PROJECT_PATHS.some((p) => location.pathname.startsWith(p));
  const isProjects = location.pathname === '/projects';
  const isHome = location.pathname === '/';

  // Find current workflow step index
  const currentStepIdx = WORKFLOW_STEPS.findIndex((s) => location.pathname.startsWith(s.path));

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-5 lg:px-6 h-12 border-b border-white/[0.06] backdrop-blur-2xl bg-[#08090c]/80">
      {/* Left: Brand + context */}
      <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-black leading-none">X</span>
          </div>
          <span className="text-subhead font-semibold tracking-wide text-white/80 hidden sm:inline">
            XCAPE
          </span>
        </Link>

        {isInsideProject && (
          <>
            <span className="text-white/15 text-caption">/</span>
            <button
              onClick={() => navigate('/projects')}
              className="text-caption text-white/30 hover:text-white/60 transition-colors truncate max-w-[100px]"
            >
              프로젝트
            </button>
            {projectName && projectName !== 'Untitled Theme Project' && (
              <>
                <span className="text-white/15 text-caption">/</span>
                <span className="text-caption text-white/50 font-medium truncate max-w-[140px]">
                  {projectName}
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Center: Workflow pipeline (only when inside a project) */}
      {isInsideProject && (
        <div className="hidden md:flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isActive = location.pathname.startsWith(step.path);
            const isPast = currentStepIdx > idx;
            return (
              <Link
                key={step.path}
                to={step.path}
                className={`px-2.5 py-1 rounded-md text-caption font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/[0.12] text-white'
                    : isPast
                    ? 'text-white/45 hover:text-white/70 hover:bg-white/[0.06]'
                    : 'text-white/25 hover:text-white/45 hover:bg-white/[0.04]'
                }`}
              >
                <span className="hidden lg:inline">{step.label}</span>
                <span className="lg:hidden">{step.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* PassMap — always visible */}
        <Link
          to="/passmap"
          className={`px-3 py-1 rounded-md text-caption font-medium transition-all ${
            location.pathname.startsWith('/passmap')
              ? 'text-violet-300/80 bg-violet-500/10'
              : 'text-white/35 hover:text-violet-300/70 hover:bg-white/[0.05]'
          }`}
        >
          PassMap
        </Link>

        {/* 내 프로젝트 — always visible when not on /projects */}
        {!isProjects && !isHome && (
          <Link
            to="/projects"
            className="px-3 py-1 rounded-md text-caption font-medium text-white/35 hover:text-white/60 hover:bg-white/[0.05] transition-all"
          >
            내 프로젝트
          </Link>
        )}

        {isHome && (
          <Link
            to="/projects"
            className="px-3 py-1.5 rounded-lg text-caption font-medium text-white/50 hover:text-white/70 border border-white/[0.08] hover:border-white/[0.15] transition-all"
          >
            내 프로젝트
          </Link>
        )}
      </div>
    </nav>
  );
}
