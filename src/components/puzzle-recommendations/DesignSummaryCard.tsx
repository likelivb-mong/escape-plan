interface DesignSummaryCardProps {
  summary: {
    themeTitle: string;
    genre: string;
    tone: string;
    recommendedPuzzleCount: number;
    flowSummary: string;
    designWarnings: string[];
    spaceNotes: string[];
  };
  validationWarnings?: Array<{
    path: string;
    message: string;
    suggestion?: string;
  }>;
}

export default function DesignSummaryCard({
  summary,
  validationWarnings = [],
}: DesignSummaryCardProps) {
  return (
    <div className="border border-slate-700 rounded-lg p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 space-y-4">
      {/* 헤더 */}
      <div className="border-b border-slate-700 pb-4">
        <h3 className="text-xl font-bold text-white mb-2">{summary.themeTitle}</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-300 text-sm font-semibold">
            {summary.genre}
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-sm font-semibold">
            {summary.tone}
          </span>
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-sm font-semibold">
            퍼즐 {summary.recommendedPuzzleCount}개
          </span>
        </div>
      </div>

      {/* 플로우 설명 */}
      <div>
        <p className="text-xs text-slate-400 font-semibold mb-2">📊 퍼즐 플로우</p>
        <p className="text-sm text-slate-300 leading-relaxed">{summary.flowSummary}</p>
      </div>

      {/* 공간 배치 */}
      {summary.spaceNotes.length > 0 && (
        <div className="bg-slate-900/50 rounded p-3 border border-slate-700/50">
          <p className="text-xs text-slate-400 font-semibold mb-2">🗺️ 공간 배치</p>
          <ul className="space-y-1">
            {summary.spaceNotes.map((note, idx) => (
              <li key={idx} className="text-xs text-slate-300">
                • {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 설계 경고 */}
      {summary.designWarnings.length > 0 && (
        <div className="bg-amber-900/30 rounded p-3 border border-amber-700/50">
          <p className="text-xs text-amber-400 font-semibold mb-2">⚠️ 설계 주의사항</p>
          <ul className="space-y-1">
            {summary.designWarnings.map((warning, idx) => (
              <li key={idx} className="text-xs text-amber-200">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 검증 경고 */}
      {validationWarnings.length > 0 && (
        <div className="bg-rose-900/30 rounded p-3 border border-rose-700/50">
          <p className="text-xs text-rose-400 font-semibold mb-2">⚠️ 검증 경고</p>
          <ul className="space-y-1">
            {validationWarnings.map((warning, idx) => (
              <li key={idx} className="text-xs text-rose-200">
                • {warning.message}
                {warning.suggestion && <div className="text-xs text-rose-100/70 mt-0.5">💡 {warning.suggestion}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
