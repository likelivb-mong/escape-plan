interface AIGenerationModalProps {
  isOpen: boolean;
  isLoading: boolean;
  currentStep: string;
  error: string | null;
  onClose: () => void;
}

export default function AIGenerationModal({
  isOpen,
  isLoading,
  currentStep,
  error,
  onClose,
}: AIGenerationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800/95 border border-slate-700 rounded-xl p-8 max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">AI 퍼즐 생성</h2>

        {/* 로딩 상태 */}
        {isLoading && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-sm text-slate-300">{currentStep || '준비 중...'}</p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600
                         text-white text-sm font-medium transition-colors"
            >
              취소
            </button>
          </>
        )}

        {/* 에러 상태 */}
        {error && (
          <>
            <div className="bg-rose-500/10 border border-rose-400/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-rose-300 font-semibold mb-2">❌ 오류 발생</p>
              <p className="text-xs text-rose-200/80 mb-4 whitespace-pre-wrap font-mono">{error.substring(0, 200)}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600
                           text-white text-sm font-medium transition-colors"
              >
                닫기
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500
                           text-white text-sm font-medium transition-colors"
              >
                다시 시도
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
