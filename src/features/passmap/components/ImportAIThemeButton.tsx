import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PassMapExchangeData } from '../utils/passmap-exchange';
import { validateExchangeData, exchangeToPassMapSteps } from '../utils/passmap-exchange';
import type { Theme } from '../types/passmap';
import { MOCK_THEMES } from '../mock/themes';
import { MOCK_STEPS, MOCK_STEP_DETAILS } from '../mock/steps';

interface ImportAIThemeButtonProps {
  branchCode: string;
  onImported?: (theme: Theme) => void;
}

type ConflictAction = 'overwrite' | 'duplicate' | null;

export default function ImportAIThemeButton({ branchCode, onImported }: ImportAIThemeButtonProps) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{
    data: PassMapExchangeData;
    existingTheme: Theme;
  } | null>(null);

  const handleFileSelect = () => {
    setError(null);
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);

        if (!validateExchangeData(raw)) {
          setError('유효하지 않은 PassMap JSON 형식입니다.');
          return;
        }

        const data = raw as PassMapExchangeData;

        // Verify branchCode matches
        if (data.branchCode !== branchCode) {
          setError(`지점 코드가 일치하지 않습니다. (파일: ${data.branchCode}, 현재: ${branchCode})`);
          return;
        }

        // Check for existing theme with same name
        const existing = MOCK_THEMES.find(
          (t) => t.branchCode === branchCode && t.name === data.themeName,
        );

        if (existing) {
          setConflict({ data, existingTheme: existing });
        } else {
          processImport(data, 'duplicate');
        }
      } catch {
        setError('JSON 파싱에 실패했습니다.');
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const processImport = (data: PassMapExchangeData, action: ConflictAction) => {
    let themeId: string;

    if (action === 'overwrite' && conflict?.existingTheme) {
      // Overwrite: reuse existing theme ID, remove old steps
      themeId = conflict.existingTheme.id;
      conflict.existingTheme.name = data.themeName;

      // Remove old steps for this theme
      const oldStepIds = new Set(
        MOCK_STEPS.filter((s) => s.themeId === themeId).map((s) => s.id),
      );
      // Mutate mock arrays (fine for mock data)
      for (let i = MOCK_STEPS.length - 1; i >= 0; i--) {
        if (MOCK_STEPS[i].themeId === themeId) MOCK_STEPS.splice(i, 1);
      }
      for (let i = MOCK_STEP_DETAILS.length - 1; i >= 0; i--) {
        if (oldStepIds.has(MOCK_STEP_DETAILS[i].stepId)) MOCK_STEP_DETAILS.splice(i, 1);
      }
    } else {
      // Create new theme
      themeId = `imported-${branchCode.toLowerCase()}-${Date.now()}`;
      const newTheme: Theme = {
        id: themeId,
        branchCode,
        name: data.themeName,
        mapImage: '',
      };
      MOCK_THEMES.push(newTheme);
      onImported?.(newTheme);
    }

    // Generate steps and details
    const { steps, details } = exchangeToPassMapSteps(data, themeId);
    MOCK_STEPS.push(...steps);
    MOCK_STEP_DETAILS.push(...details);

    setConflict(null);
    setError(null);

    // Navigate to the imported theme
    navigate(`/passmap/${branchCode}/${themeId}`);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={handleFileSelect}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-violet-400/30 bg-violet-500/5 text-violet-300/70 hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-violet-300 transition-all text-sm font-medium"
      >
        <span className="text-base">↑</span>
        Import AI Theme
      </button>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm shadow-xl">
          <div className="flex items-start gap-2">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-300/50 hover:text-rose-300 transition-colors">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Conflict dialog */}
      {conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-[#1a1a1f] shadow-2xl p-6 space-y-4">
            <h3 className="text-title3 text-white font-bold">테마 충돌 감지</h3>
            <p className="text-body text-white/60">
              <span className="text-white font-medium">"{conflict.data.themeName}"</span> 테마가 이미 존재합니다.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => processImport(conflict.data, 'overwrite')}
                className="flex-1 px-4 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-medium hover:bg-amber-500/20 transition-all"
              >
                덮어쓰기
              </button>
              <button
                onClick={() => processImport(conflict.data, 'duplicate')}
                className="flex-1 px-4 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium hover:bg-indigo-500/20 transition-all"
              >
                복제 생성
              </button>
              <button
                onClick={() => setConflict(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/40 text-sm hover:text-white/60 transition-all"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
