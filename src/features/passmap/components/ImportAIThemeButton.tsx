import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PassMapExchangeData } from '../utils/passmap-exchange';
import { validateExchangeData, exchangeToPassMapSteps } from '../utils/passmap-exchange';
import type { Theme } from '../types/passmap';
import {
  findDuplicateTheme,
  generateUniqueThemeName,
  importThemeData,
  type ImportResult,
} from '../utils/passmap-store';

interface ImportAIThemeButtonProps {
  branchCode: string;
  onImported?: () => void;
}

export default function ImportAIThemeButton({ branchCode, onImported }: ImportAIThemeButtonProps) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ImportResult | null>(null);
  const [conflict, setConflict] = useState<{
    data: PassMapExchangeData;
    existingTheme: Theme;
  } | null>(null);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const handleFileSelect = () => {
    setError(null);
    setSuccess(null);
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
          setError('유효하지 않은 PassMap JSON 형식입니다. themeName, branchCode, steps 필드를 확인하세요.');
          return;
        }

        const data = raw as PassMapExchangeData;

        // Verify branchCode matches
        if (data.branchCode !== branchCode) {
          setError(`지점 코드 불일치 — 파일: ${data.branchCode}, 현재: ${branchCode}`);
          return;
        }

        if (data.steps.length === 0) {
          setError('steps 배열이 비어있습니다.');
          return;
        }

        // Check for duplicate
        const existing = findDuplicateTheme(branchCode, data.themeName);
        if (existing) {
          setConflict({ data, existingTheme: existing });
        } else {
          processImport(data, false);
        }
      } catch {
        setError('JSON 파싱 실패 — 올바른 JSON 파일인지 확인하세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const processImport = (data: PassMapExchangeData, overwrite: boolean) => {
    let themeId: string;
    let themeName: string;

    if (overwrite && conflict?.existingTheme) {
      themeId = conflict.existingTheme.id;
      themeName = data.themeName;
    } else {
      themeId = `imported-${branchCode.toLowerCase()}-${Date.now()}`;
      themeName = overwrite ? data.themeName : generateUniqueThemeName(branchCode, data.themeName);
    }

    const theme: Theme = {
      id: themeId,
      branchCode,
      name: themeName,
      mapImage: '',
    };

    const { steps, details } = exchangeToPassMapSteps(data, themeId);

    const result = importThemeData(theme, steps, details, overwrite && !!conflict?.existingTheme);

    setConflict(null);
    setError(null);
    setSuccess(result);
    onImported?.();

    // Navigate to the new theme
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
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.10] bg-white/[0.04] text-white/50 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white/70 transition-all text-[12px] font-medium"
      >
        <span className="text-sm">↑</span>
        Import
      </button>

      {/* Success toast */}
      {success && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm shadow-xl animate-[fadeIn_200ms]">
          <div className="flex items-start gap-2">
            <span className="flex-1">
              <strong>"{success.themeName}"</strong> {success.action === 'overwritten' ? '덮어쓰기' : '생성'} 완료 — {success.stepCount}개 Step
            </span>
            <button onClick={() => setSuccess(null)} className="text-emerald-300/50 hover:text-emerald-300 transition-colors">
              ×
            </button>
          </div>
        </div>
      )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-white/[0.08] bg-[#161618] shadow-2xl p-6 space-y-4">
            <h3 className="text-body text-white/90 font-bold">테마 충돌 감지</h3>
            <p className="text-subhead text-white/50">
              <span className="text-white/80 font-medium">"{conflict.data.themeName}"</span> 테마가
              이 지점에 이미 존재합니다.
            </p>
            <p className="text-caption text-white/30 leading-relaxed">
              덮어쓰기: 기존 Step을 모두 교체합니다.<br />
              복제 생성: "{conflict.data.themeName} (2)" 이름으로 새로 만듭니다.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => processImport(conflict.data, true)}
                className="flex-1 px-4 py-2 rounded-lg bg-white text-black text-[12px] font-semibold hover:bg-white/90 transition-all"
              >
                덮어쓰기
              </button>
              <button
                onClick={() => processImport(conflict.data, false)}
                className="flex-1 px-4 py-2 rounded-lg border border-white/[0.10] bg-white/[0.06] text-white/70 text-[12px] font-medium hover:bg-white/[0.10] transition-all"
              >
                복제 생성
              </button>
              <button
                onClick={() => setConflict(null)}
                className="px-4 py-2 rounded-lg text-white/30 text-[12px] hover:text-white/50 transition-all"
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
