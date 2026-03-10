import { useState, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import { generateAIPuzzleRecommendations } from '../../services/aiPuzzleGeneration';
import { validatePuzzleResponse, formatValidationErrors } from '../../utils/puzzleValidation';
import type { PuzzleDesignResponse } from '../../types/puzzleRecommendation';
import { getMockPuzzleResponse } from '../../data/mockPuzzleResponses';
import AIGenerationModal from './AIGenerationModal';
import PuzzleDesignCard from './PuzzleDesignCard';
import DesignSummaryCard from './DesignSummaryCard';

export default function PuzzleRecommendationPanelWithAI() {
  const {
    projectName,
    cells,
    selectedStory,
    puzzleFlowPlan,
  } = useProject();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [response, setResponse] = useState<PuzzleDesignResponse | null>(null);
  const [selectedPuzzles, setSelectedPuzzles] = useState<Set<string>>(new Set());
  const [validation, setValidation] = useState<any>(null);
  const [useMock, setUseMock] = useState(false);

  // Story가 없으면 조기 반환
  if (!selectedStory) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        <div className="text-center p-8">
          <div className="text-5xl mb-4">📖</div>
          <p className="text-lg font-semibold text-white">스토리를 먼저 선택해주세요</p>
          <p className="text-sm text-slate-400 mt-2">Story 탭에서 스토리를 선택한 후 다시 돌아오세요</p>
        </div>
      </div>
    );
  }

  const handleGenerateAI = useCallback(async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setResponse(null);
    setValidation(null);

    try {
      // 프로젝트 데이터 구성
      const projectData = {
        title: projectName || '미제목',
        genre: selectedStory.genre || 'horror',
        tone: selectedStory.tone || 'suspense',
        playTime: 70, // 기본값
        difficulty: 'medium',
        playerCount: 2,
        roomCount: 1,
        availableDevices: ['조합자물쇠', '키보드'],
        preferredLockTypes: ['number4', 'keypad'],
      };

      // 만다라트에서 키워드 추출 (간단한 버전)
      const mandalartKeywords = extractKeywordsFromMandalart(cells);

      let result: PuzzleDesignResponse;

      if (useMock) {
        // Mock 데이터 사용 (테스트용)
        setGenerationStep('Mock 데이터 로드 중...');
        await new Promise(r => setTimeout(r, 1000));
        result = getMockPuzzleResponse(selectedStory.genre);
      } else {
        // 실제 AI 호출
        result = await generateAIPuzzleRecommendations(
          projectData,
          {
            title: selectedStory.title,
            synopsis: selectedStory.synopsis || '',
            genre: selectedStory.genre || '',
            tone: selectedStory.tone || '',
            acts: [
              { name: '기', description: 'Introduction' },
              { name: '승', description: 'Development' },
              { name: '전', description: 'Expansion' },
              { name: '반전', description: 'Twist' },
              { name: '결', description: 'Ending' },
            ],
            characters: [],
            twist: 'Unexpected turn',
            storyKeywords: [],
          },
          puzzleFlowPlan,
          mandalartKeywords,
          { onStep: setGenerationStep },
        );
      }

      // 응답 검증
      const validationResult = validatePuzzleResponse(result);

      setValidation(validationResult);

      if (!validationResult.isValid) {
        setGenerationError(formatValidationErrors(validationResult));
        return;
      }

      setResponse(result);
      // 모든 퍼즐을 기본으로 선택
      setSelectedPuzzles(new Set(result.puzzles.map((_, i) => `puzzle-${i}`)));
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError(error instanceof Error ? error.message : '알 수 없는 오류 발생');
    } finally {
      setIsGenerating(false);
    }
  }, [projectName, selectedStory, puzzleFlowPlan, cells, useMock]);

  const handleConfirmSelection = useCallback(() => {
    if (!response) return;

    const adoptedPuzzles = response.puzzles.filter((p, i) => selectedPuzzles.has(`puzzle-${i}`));

    alert(`✓ ${adoptedPuzzles.length}개의 퍼즐이 선택되었습니다!\n\n(실제 구현 시 ProjectContext에 저장됩니다)`);

    // 실제 구현:
    // updateGameFlowDesign({...});
    // saveProject();

    // UI 리셋
    setResponse(null);
    setSelectedPuzzles(new Set());
  }, [response, selectedPuzzles]);

  const handleTogglePuzzle = useCallback((id: string) => {
    setSelectedPuzzles(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 overflow-hidden">
      {/* 헤더 */}
      <div className="border-b border-slate-700/50 p-6 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">AI 퍼즐 추천</h2>
            <p className="text-sm text-slate-400 mt-1">
              선택한 스토리: <span className="font-semibold text-cyan-400">{selectedStory.title}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mock 토글 (테스트용) */}
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useMock}
                onChange={(e) => setUseMock(e.target.checked)}
                className="rounded accent-cyan-400"
              />
              Mock 데이터
            </label>

            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500
                         hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-600 disabled:to-slate-600
                         text-white font-semibold transition-all duration-200 flex items-center gap-2 flex-shrink-0"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">⏳</span>생성 중...
                </>
              ) : (
                <>
                  <span>✨</span>AI 퍼즐 생성
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 로딩/에러 모달 */}
      <AIGenerationModal
        isOpen={isGenerating || !!generationError}
        isLoading={isGenerating}
        currentStep={generationStep}
        error={generationError}
        onClose={() => {
          setIsGenerating(false);
          setGenerationError(null);
        }}
      />

      {/* 결과 영역 */}
      {response && !isGenerating && !generationError && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 프로젝트 요약 */}
          <DesignSummaryCard
            summary={response.projectSummary}
            validationWarnings={validation?.warnings || []}
          />

          {/* 퍼즐 카드 리스트 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-sm p-3 rounded-lg">
              <h3 className="text-lg font-semibold text-white">생성된 퍼즐 ({response.puzzles.length}개)</h3>
              <button
                onClick={handleConfirmSelection}
                disabled={selectedPuzzles.size === 0}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500
                           disabled:bg-slate-600 text-white text-sm font-medium transition-colors"
              >
                ✓ 확정 ({selectedPuzzles.size})
              </button>
            </div>

            {response.puzzles.map((puzzle, idx) => (
              <PuzzleDesignCard
                key={puzzle.id}
                puzzle={puzzle}
                isSelected={selectedPuzzles.has(`puzzle-${idx}`)}
                onSelect={() => handleTogglePuzzle(`puzzle-${idx}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 초기 상태 */}
      {!response && !isGenerating && !generationError && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">💡</div>
            <p className="text-xl text-white/80 font-semibold">AI 퍼즐 생성 준비 완료</p>
            <p className="text-sm text-slate-400 mt-3 max-w-sm">
              위의 "AI 퍼즐 생성" 버튼을 클릭하면 <br />
              선택한 스토리를 기반으로 설계된 퍼즐 플로우를 제안합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 만다라트에서 키워드 추출 (간단 버전)
 */
function extractKeywordsFromMandalart(cells: any[]): string[] {
  if (!cells || cells.length === 0) return [];

  // 첫 번째 줄의 처음 5개 셀만 키워드로 사용
  return cells
    .slice(0, 5)
    .map((cell: any) => cell?.content || '')
    .filter((content: string) => content.trim().length > 0);
}
