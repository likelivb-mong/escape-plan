import { useNavigate } from 'react-router-dom';
import type { Theme } from '../types/passmap';
import { MOCK_STEPS } from '../mock/steps';

interface ThemeListProps {
  themes: Theme[];
  branchCode: string;
}

export default function ThemeList({ themes, branchCode }: ThemeListProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {themes.map((theme) => {
        const stepCount = MOCK_STEPS.filter((s) => s.themeId === theme.id).length;
        const completeCount = MOCK_STEPS.filter(
          (s) => s.themeId === theme.id && s.status === 'complete'
        ).length;

        return (
          <button
            key={theme.id}
            onClick={() => navigate(`/passmap/${branchCode}/${theme.id}`)}
            className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-sky-500/50 hover:bg-white/10"
          >
            <div>
              <div className="text-body text-white font-medium">{theme.name}</div>
              <div className="text-caption text-white/40 mt-1">
                {stepCount} steps · {completeCount} 완료
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stepCount > 0 && (
                <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${(completeCount / stepCount) * 100}%` }}
                  />
                </div>
              )}
              <span className="text-white/30 text-lg">→</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
