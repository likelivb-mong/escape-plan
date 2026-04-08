import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import HistoryDrawer from './HistoryDrawer';

const WORKFLOW_STEPS = [
  { path: '/plan',       label: 'Plan',         mobileLabel: 'Plan' },
  { path: '/story',      label: 'Story',        mobileLabel: 'Story' },
  { path: '/mandalart',  label: 'Mandala Chart', mobileLabel: 'Mandala' },
  { path: '/game-flow',  label: 'Game Flow',    mobileLabel: 'Flow' },
  { path: '/setting',    label: 'Pass Map',     mobileLabel: 'PassMap' },
];

const PROJECT_PATHS = ['/story', '/mandalart', '/scenario', '/game-flow', '/flow-manual', '/setting', '/passmap-manual', '/plan', '/supplemental'];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectName, currentProjectId, projectBrief, selectedStory, cells, gameFlowDesign, floorPlanData } = useProject();
  const [historyOpen, setHistoryOpen] = useState(false);

  const isProjectDashboard = location.pathname.startsWith('/projects/') && location.pathname !== '/projects';
  const isInsideProject = isProjectDashboard || PROJECT_PATHS.some((p) => location.pathname.startsWith(p));
  const isProjects = location.pathname === '/projects';
  const isHome = location.pathname === '/';

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.06]">
      <div className="flex items-center justify-between px-3 sm:px-5 h-12 max-w-[1440px] mx-auto">
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

        {/* Center: intentionally empty on desktop — navigation is via WorkflowStepBar */}
        <div />

        {/* Right: Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isInsideProject && currentProjectId && (
            <button
              onClick={() => setHistoryOpen(true)}
              className="px-2.5 py-1.5 rounded-md text-caption font-medium text-white/30 hover:text-white/55 hover:bg-white/[0.04] transition-all"
              title="버전 히스토리"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
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

    {/* Mobile bottom workflow navigation */}
    {isInsideProject && (
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-white/[0.06]">
        <div className="flex items-stretch h-13">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isActive = location.pathname.startsWith(step.path);
            const currentMobileIdx = WORKFLOW_STEPS.findIndex((s) => location.pathname.startsWith(s.path));
            const mobileDone = [!!projectBrief, !!selectedStory, !!(cells?.some((c) => !c.isCenter && c.text.trim())), !!gameFlowDesign, !!floorPlanData][idx];
            const accessible = idx <= currentMobileIdx || mobileDone;
            return accessible ? (
              <Link
                key={step.path}
                to={step.path}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all ${
                  isActive
                    ? 'text-white bg-white/[0.07]'
                    : 'text-white/30 hover:text-white/55 hover:bg-white/[0.03]'
                }`}
              >
                {isActive && <div className="w-4 h-0.5 rounded-full bg-white mb-0.5" />}
                <span className="text-[9px] font-medium leading-tight tracking-wide">
                  {step.mobileLabel}
                </span>
              </Link>
            ) : (
              <div
                key={step.path}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-white/12 cursor-not-allowed"
              >
                <svg className="w-2.5 h-2.5 mb-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
                <span className="text-[9px] font-medium leading-tight tracking-wide">
                  {step.mobileLabel}
                </span>
              </div>
            );
          })}
        </div>
      </nav>
    )}

    <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}
