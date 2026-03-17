import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';

const STEPS = [
  { key: 'plan',      label: 'Plan',      path: '/plan'      },
  { key: 'story',     label: 'Story',     path: '/story'     },
  { key: 'mandalart', label: 'Mandala',   path: '/mandalart' },
  { key: 'gameflow',  label: 'Game Flow', path: '/game-flow' },
  { key: 'passmap',   label: 'Pass Map',  path: '/setting'   },
] as const;

type StepKey = typeof STEPS[number]['key'];

interface WorkflowStepBarProps {
  onBeforeNavigate?: () => void;
}

export default function WorkflowStepBar({ onBeforeNavigate }: WorkflowStepBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectBrief, selectedStory, cells, gameFlowDesign, floorPlanData, persistProject } = useProject();

  const currentIdx = STEPS.findIndex((s) => location.pathname.startsWith(s.path));

  const done: Record<StepKey, boolean> = {
    plan:      !!projectBrief,
    story:     !!selectedStory,
    mandalart: !!(cells?.some((c) => !c.isCenter && c.text.trim())),
    gameflow:  !!gameFlowDesign,
    passmap:   !!floorPlanData,
  };

  // Auto-save when all steps are complete
  const allDone = Object.values(done).every(Boolean);
  const autoSavedRef = useRef(false);
  useEffect(() => {
    if (allDone && !autoSavedRef.current) {
      autoSavedRef.current = true;
      persistProject();
    }
    if (!allDone) autoSavedRef.current = false;
  }, [allDone, persistProject]);

  // A step is accessible if it's current/past in this session, OR if it has saved data (visited before)
  const isAccessible = (idx: number) => idx <= currentIdx || done[STEPS[idx].key];

  const handleNavigate = (path: string, idx: number) => {
    if (!isAccessible(idx)) return;
    if (idx === currentIdx) return; // already here
    onBeforeNavigate?.();
    persistProject();
    navigate(path);
  };

  return (
    <div className="flex items-center gap-0 px-3 sm:px-6 py-2.5 border-b border-white/[0.04] bg-white/[0.012] overflow-x-auto flex-shrink-0">
      <div className="flex items-center gap-0 min-w-0">
        {STEPS.map((step, idx) => {
          const isActive   = idx === currentIdx;
          const isPast     = idx < currentIdx;
          const isFuture   = idx > currentIdx;
          const isDone     = done[step.key];
          const accessible = isAccessible(idx);

          return (
            <div key={step.key} className="flex items-center flex-shrink-0">
              {/* Connector */}
              {idx > 0 && (
                <div
                  className={`w-4 sm:w-7 h-px flex-shrink-0 mx-0.5 transition-colors ${
                    isPast ? 'bg-white/[0.20]' : isActive ? 'bg-white/[0.10]' : 'bg-white/[0.04]'
                  }`}
                />
              )}

              {/* Step button */}
              <button
                onClick={() => handleNavigate(step.path, idx)}
                disabled={!accessible || isActive}
                title={isFuture && !isDone ? '이전 단계를 먼저 완료하세요' : step.label}
                className={[
                  'flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg transition-all duration-150 flex-shrink-0 group',
                  isActive
                    ? 'bg-white/[0.10] text-white font-semibold cursor-default'
                    : accessible
                      ? 'text-white/40 hover:text-white/75 hover:bg-white/[0.06] cursor-pointer font-medium'
                      : 'text-white/15 cursor-not-allowed font-medium',
                ].join(' ')}
              >
                {/* Number / check / lock */}
                <span
                  className={[
                    'w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all',
                    isActive
                      ? 'bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                      : isDone && !isActive
                        ? 'bg-emerald-500/25 text-emerald-300/90 ring-1 ring-emerald-400/40'
                        : accessible
                          ? 'bg-white/[0.10] text-white/40'
                          : 'bg-white/[0.04] text-white/15',
                  ].join(' ')}
                >
                  {isFuture && !isDone ? (
                    // Lock only if truly not done yet
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                  ) : isDone && !isActive ? (
                    '✓'
                  ) : (
                    idx + 1
                  )}
                </span>

                {/* Label */}
                <span className={['text-caption leading-tight', isActive ? '' : 'hidden sm:inline'].join(' ')}>
                  {step.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Right hint */}
      <p className="ml-auto flex-shrink-0 hidden lg:flex items-center gap-1.5 text-micro text-white/20 pl-4">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        완료된 단계만 이동 가능 · 자동 저장
      </p>
    </div>
  );
}
