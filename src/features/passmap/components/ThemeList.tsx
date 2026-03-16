import { useNavigate } from 'react-router-dom';
import type { Theme } from '../types/passmap';
import { getStepsByTheme } from '../utils/passmap-store';

interface ThemeListProps {
  themes: Theme[];
  branchCode: string;
}

export default function ThemeList({ themes, branchCode }: ThemeListProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      {themes.map((theme) => {
        const steps = getStepsByTheme(theme.id);
        const stepCount = steps.length;
        const completeCount = steps.filter((s) => s.status === 'complete').length;
        const pct = stepCount > 0 ? Math.round((completeCount / stepCount) * 100) : 0;

        return (
          <button
            key={theme.id}
            onClick={() => navigate(`/passmap/${branchCode}/${theme.id}`)}
            className="group w-full flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            <div className="flex-1 min-w-0">
              <div className="text-body text-white/75 font-medium">{theme.name}</div>
              <div className="text-caption text-white/30 mt-0.5">
                {stepCount}개 스텝 · {completeCount} 완료
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {stepCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/20">{pct}%</span>
                  <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/30 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
              <span className="text-white/15 group-hover:text-white/40 transition-colors text-caption">→</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
