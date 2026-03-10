import type { PuzzleDesign } from '../../types/puzzleRecommendation';

interface PuzzleDesignCardProps {
  puzzle: PuzzleDesign;
  isSelected: boolean;
  onSelect: () => void;
}

export default function PuzzleDesignCard({
  puzzle,
  isSelected,
  onSelect,
}: PuzzleDesignCardProps) {
  const phaseEmoji: Record<string, string> = {
    기: '🌅',
    승: '⛰️',
    전: '🔥',
    반전: '⚡',
    결: '🎬',
  };

  const engagementEmoji: Record<string, string> = {
    cognitive: '🧠',
    physical: '💪',
    collaborative: '👥',
    sensory: '👁️',
    mixed: '⚙️',
  };

  const typeColor: Record<string, string> = {
    clue: 'from-amber-500 to-orange-500',
    device: 'from-purple-500 to-pink-500',
    'clue+device': 'from-cyan-500 to-blue-500',
  };

  const lockTypeLabel: Record<string, string> = {
    key: '물리적 열쇠',
    number3: '3자리 숫자',
    number4: '4자리 숫자',
    alphabet5: '5글자 영문',
    keypad: '키패드',
    xkit: 'X-kit',
  };

  return (
    <div
      className={`border-2 rounded-lg p-5 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
          : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
      }`}
      onClick={onSelect}
    >
      {/* 제목 & 선택 체크박스 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-5 h-5 rounded cursor-pointer accent-cyan-400"
            onClick={e => e.stopPropagation()}
          />
          <div>
            <h4 className="font-bold text-white text-lg">{puzzle.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
              <span>{phaseEmoji[puzzle.phase]} {puzzle.phase}</span>
              <span>•</span>
              <span>
                <span className={`inline-block px-2 py-0.5 rounded-full bg-gradient-to-r ${typeColor[puzzle.puzzleType]} text-white text-xs font-semibold`}>
                  {puzzle.puzzleType}
                </span>
              </span>
              <span>•</span>
              <span>{engagementEmoji[puzzle.playerEngagement]}</span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <p className="text-xs text-slate-400 mb-1">난이도</p>
          <p className="text-lg font-bold text-cyan-400">{puzzle.estimatedDifficulty}/5</p>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-sm text-slate-300 mb-4 leading-relaxed">{puzzle.description}</p>

      {/* 스토리 연계 */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 mb-4">
        <p className="text-xs text-slate-400 font-semibold mb-1">📖 스토리 역할</p>
        <p className="text-sm text-white/80">{puzzle.narrativeRole}</p>
      </div>

      {/* 정보 그리드 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* 정답 */}
        <div className="bg-slate-800/50 rounded p-3 border border-slate-700/30">
          <p className="text-xs text-slate-400 mb-1">정답</p>
          <p className="font-mono text-white font-bold text-sm">{puzzle.answer}</p>
          {puzzle.answerHint && (
            <p className="text-xs text-slate-400 mt-1">💡 {puzzle.answerHint}</p>
          )}
        </div>

        {/* 자물쇠 */}
        <div className="bg-slate-800/50 rounded p-3 border border-slate-700/30">
          <p className="text-xs text-slate-400 mb-1">자물쇠</p>
          <p className="text-sm text-white font-semibold">{lockTypeLabel[puzzle.lockType]}</p>
        </div>

        {/* 보상 */}
        <div className="bg-emerald-900/30 rounded p-3 border border-emerald-700/30 col-span-2">
          <p className="text-xs text-emerald-400 mb-1">🎁 보상</p>
          <p className="text-sm text-white">{puzzle.reward}</p>
        </div>

        {/* 시간 & 연결 */}
        <div className="bg-slate-800/50 rounded p-3 border border-slate-700/30">
          <p className="text-xs text-slate-400 mb-1">예상 시간</p>
          <p className="text-white font-semibold">{puzzle.estimatedTime}분</p>
        </div>

        <div className="bg-slate-800/50 rounded p-3 border border-slate-700/30">
          <p className="text-xs text-slate-400 mb-1">다음 연결</p>
          <p className="text-xs text-white/80 truncate">{puzzle.nextConnection.substring(0, 20)}</p>
        </div>
      </div>

      {/* 설치 & 제작 */}
      <div className="space-y-2 text-xs">
        <div className="bg-slate-800/50 rounded p-2">
          <p className="text-slate-400 mb-1">🔧 설치</p>
          <p className="text-slate-300 line-clamp-2">{puzzle.setupDescription.substring(0, 80)}</p>
        </div>
        <div className="bg-slate-800/50 rounded p-2">
          <p className="text-slate-400 mb-1">📝 제작 노트</p>
          <p className="text-slate-300">{puzzle.productionNote}</p>
        </div>
      </div>
    </div>
  );
}
