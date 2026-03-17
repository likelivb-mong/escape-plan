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
  /** Called before navigating to a past step (use to save in-progress edits) */
  onBeforeNavigate?: () => void;
}

export default function WorkflowStepBar({ onBeforeNavigate }: WorkflowStepBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectBrief, selectedStory, cells, gameFlowDesign, floorPlanData, saveCurrentProject } = useProject();

  const currentIdx = STEPS.findIndex((s) => location.pathname.startsWith(s.path));

  const done: Record<StepKey, boolean> = {
    plan:      !!projectBrief,
    story:     !!selectedStory,
    mandalart: !!(cells?.some((c) => !c.isCenter && c.text.trim())),
    gameflow:  !!gameFlowDesign,
    passmap:   !!floorPlanData,
  };

  const handleNavigate = (path: string, idx: number) => {
    if (idx >= currentIdx) return;
    onBeforeNavigate?.();
    saveCurrentProject();
    navigate(path);
  };

  return (
    <div className="flex items-center gap-0 px-3 sm:px-6 py-2.5 border-b border-white/[0.04] bg-white/[0.012] overflow-x-auto flex-shrink-0">
      {/* Step indicators */}
      <div className="flex items-center gap-0 min-w-0">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentIdx;
          const isPast   = idx < currentIdx;
          const isDone   = done[step.key];

          return (
            <div key={step.key} className="flex items-center flex-shrink-0">
              {/* Connector line between steps */}
              {idx > 0 && (
                <div
                  className={`w-4 sm:w-7 h-px flex-shrink-0 mx-0.5 transition-colors ${
                    isPast ? 'bg-white/[0.18]' : isActive ? 'bg-white/[0.10]' : 'bg-white/[0.05]'
                  }`}
                />
              )}

              {/* Step button */}
              <button
                onClick={() => handleNavigate(step.path, idx)}
                disabled={!isPast}
                className={[
                  'flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg transition-all duration-150 flex-shrink-0',
                  isActive
                    ? 'bg-white/[0.10] text-white font-semibold'
                    : isPast
                      ? 'text-white/30 hover:text-white/60 hover:bg-white/[0.05] cursor-pointer font-medium'
                      : 'text-white/14 cursor-default font-medium',
                ].join(' ')}
              >
                {/* Number / check circle */}
                <span
                  className={[
                    'w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all',
                    isActive
                      ? 'bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                      : isDone
                        ? 'bg-emerald-500/20 text-emerald-300/80 ring-1 ring-emerald-400/30'
                        : isPast
                          ? 'bg-white/[0.10] text-white/35'
                          : 'bg-white/[0.04] text-white/18',
                  ].join(' ')}
                >
                  {isDone && !isActive ? '✓' : idx + 1}
                </span>

                {/* Label — always visible for active, sm+ for others */}
                <span
                  className={[
                    'text-caption leading-tight',
                    isActive ? '' : 'hidden sm:inline',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Auto-save hint — only on wider screens */}
      <p className="ml-auto flex-shrink-0 hidden lg:flex items-center gap-1 text-micro text-white/14 pl-4">
        <span className="text-[11px]">💾</span>
        다음 단계 진행 시 자동 저장
      </p>
    </div>
  );
}
