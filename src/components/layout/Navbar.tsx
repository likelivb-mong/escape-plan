import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';

// Pages that belong to a project workflow
const PROJECT_PATHS = ['/story', '/mandalart', '/scenario', '/puzzle-flow', '/puzzle-recommendations', '/floor-plan', '/draft'];

const projectNavItems = [
  { path: '/story', label: '스토리' },
  { path: '/mandalart', label: '만다라트' },
];

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { projectName } = useProject();

  const isInsideProject = PROJECT_PATHS.some((p) => location.pathname.startsWith(p));
  const isProjects = location.pathname === '/projects';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-white/10 backdrop-blur-xl bg-black/60">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/90 flex items-center justify-center">
            <span className="text-black text-subhead font-bold">X</span>
          </div>
          <span className="text-body font-semibold tracking-wide text-white/90">XCAPE AI</span>
        </Link>

        {/* Back to projects when inside workflow */}
        {isInsideProject && (
          <>
            <span className="h-4 w-px bg-white/10" />
            <button
              onClick={() => navigate('/projects')}
              className="text-subhead text-white/40 hover:text-white/70 transition-colors"
            >
              ← 내 프로젝트
            </button>
            {projectName && projectName !== 'Untitled Theme Project' && (
              <>
                <span className="h-4 w-px bg-white/10" />
                <span className="text-footnote text-white/30 font-medium truncate max-w-[160px]">
                  {projectName}
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Right: Nav items + theme toggle */}
      <div className="flex items-center gap-1">
        {/* Project-internal tabs */}
        {isInsideProject && (
          <>
            {projectNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-1.5 rounded-full text-body font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-black'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <span className="mx-1.5 h-4 w-px bg-white/15" />
          </>
        )}

        {/* 내 프로젝트 link — always visible (except when already on /projects) */}
        {!isProjects && (
          <Link
            to="/projects"
            className="px-4 py-1.5 rounded-full text-body font-medium text-white/50 hover:text-white/80 hover:bg-white/10 transition-all duration-200"
          >
            내 프로젝트
          </Link>
        )}

        {/* Divider */}
        <span className="mx-1 h-4 w-px bg-white/15" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          className="p-2 rounded-full text-white/45 hover:text-white/80 hover:bg-white/10 transition-all duration-200"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </nav>
  );
}
