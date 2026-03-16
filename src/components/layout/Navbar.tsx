import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';

const WORKFLOW_STEPS = [
  { path: '/story', label: 'Story' },
  { path: '/mandalart', label: 'Mandala Chart' },
  { path: '/game-flow', label: 'Game Flow' },
  { path: '/setting', label: 'Setting' },
  { path: '/plan', label: 'Plan' },
];

const PROJECT_PATHS = ['/story', '/mandalart', '/scenario', '/game-flow', '/setting', '/plan'];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectName } = useProject();

  const isProjectDashboard = location.pathname.startsWith('/projects/') && location.pathname !== '/projects';
  const isInsideProject = isProjectDashboard || PROJECT_PATHS.some((p) => location.pathname.startsWith(p));
  const isProjects = location.pathname === '/projects';
  const isHome = location.pathname === '/';
  const currentStepIdx = WORKFLOW_STEPS.findIndex((s) => location.pathname.startsWith(s.path));

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.06]">
      <div className="flex items-center justify-between px-5 h-12 max-w-[1440px] mx-auto">
        {/* Left: Brand */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-[22px] h-[22px] rounded-md bg-indigo-500 flex items-center justify-center">
              <span className="text-white text-[9px] font-black leading-none tracking-tight">X</span>
            </div>
            <span className="text-subhead font-semibold tracking-wide text-white/70 hidden sm:inline">
              XCAPE
            </span>
          </Link>

          {isInsideProject && (
            <>
              <span className="text-white/10 text-caption">/</span>
              <button
                onClick={() => navigate('/projects')}
                className="text-caption text-white/25 hover:text-white/50 transition-colors"
              >
                프로젝트
              </button>
              {projectName && projectName !== 'Untitled Theme Project' && (
                <>
                  <span className="text-white/10 text-caption">/</span>
                  <span className="text-caption text-white/45 font-medium truncate max-w-[160px]">
                    {projectName}
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {/* Center: Workflow pipeline */}
        {isInsideProject && (
          <div className="hidden md:flex items-center gap-0.5 px-1 py-0.5 rounded-lg">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isActive = location.pathname.startsWith(step.path);
              const isPast = currentStepIdx > idx;
              return (
                <Link
                  key={step.path}
                  to={step.path}
                  className={`px-3 py-1.5 rounded-md text-caption font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.10] text-white'
                      : isPast
                      ? 'text-white/40 hover:text-white/60 hover:bg-white/[0.05]'
                      : 'text-white/20 hover:text-white/40 hover:bg-white/[0.03]'
                  }`}
                >
                  {step.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isProjects && !isHome && (
            <Link
              to="/projects"
              className="px-3 py-1.5 rounded-md text-caption font-medium text-white/30 hover:text-white/55 hover:bg-white/[0.04] transition-all"
            >
              프로젝트
            </Link>
          )}

          {isHome && (
            <Link
              to="/projects"
              className="px-3 py-1.5 rounded-md text-caption font-medium text-white/40 hover:text-white/60 border border-white/[0.08] hover:border-white/[0.15] transition-all"
            >
              내 프로젝트
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
