import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import type { ScenarioFormState, ScenarioBuildResult } from '../types/scenario';
import { INITIAL_FORM_STATE } from '../types/scenario';
import { buildScenarioResult, randomizeForm, resetScenarioForm } from '../utils/scenario';
import { populateMandalartFromScenario } from '../utils/mandalartFromScenario';
import { generateStoryProposalsFromScenario } from '../utils/storyFromScenario';
import ScenarioForm from '../components/scenario/ScenarioForm';
import ScenarioResult from '../components/scenario/ScenarioResult';

export default function ScenarioPage() {
  const navigate = useNavigate();
  const { setProjectName, setCells, setProjectBrief, setAiStoryProposals } = useProject();

  const [form, setForm] = useState<ScenarioFormState>(INITIAL_FORM_STATE);

  // 실시간 블록 기반 시나리오 생성
  const result: ScenarioBuildResult | null = useMemo(() => {
    const hasAny = form.motive.item || form.crimeType.item || form.clue.item || form.method.item
      || form.characters.some(c => c.name.trim()) || form.location;
    if (!hasAny) return null;

    return buildScenarioResult(form);
  }, [form.characters, form.location, form.motive, form.crimeType, form.clue, form.method]);

  const handleRandom = () => setForm((prev) => ({ ...randomizeForm(), memo: prev.memo }));
  const handleReset = () => setForm(resetScenarioForm());

  const handleContinue = () => {
    if (!result) return;

    // 프로젝트 이름 설정
    const firstOffender = form.characters.find(c => c.role === '가해자' && c.name.trim());
    const name = firstOffender?.name
      ? `${firstOffender.name}의 사건`
      : form.crimeType.item
        ? `${form.crimeType.item} 사건`
        : '사건 시나리오';

    setProjectName(name);

    // 시나리오 기반 만다라트 셀 생성
    setCells(populateMandalartFromScenario(form));

    // ProjectBrief에 시나리오 정보 저장
    setProjectBrief({
      source: 'scenario',
      videoId: null,
      videoTitle: null,
      videoChannel: null,
      synopsis: result.scenarioText,
      beats: [
        { label: '기', description: result.summary.caseOverview },
        { label: '승', description: `핵심 단서: ${result.summary.coreClue}` },
        { label: '전', description: result.summary.recommendedFocus },
        { label: '반전', description: form.memo || '(메모 없음)' },
        { label: '결', description: '만다라트에서 세부 기획 진행' },
      ],
      genres: [],
      playTimes: [],
      investigation: {
        motives: form.motive.item ? [form.motive.item] : [],
        methods: form.crimeType.item ? [form.crimeType.item] : [],
        clues: form.clue.item ? [form.clue.item] : [],
        techniques: form.method.item ? [form.method.item] : [],
      },
    });

    // 시나리오에서 3개 스토리 제안 생성
    const proposals = generateStoryProposalsFromScenario(form, result);
    setAiStoryProposals(proposals);

    navigate('/story');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">사건 구성 생성하기</h1>
          <p className="text-[11px] text-white/35 mt-0.5">
            범행동기, 범행방법, 수사단서, 수사기법을 조합해 사건 개요를 만듭니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRandom}
            className="px-4 py-2 rounded-xl border border-white/10 text-xs font-medium text-white/50 hover:text-white/80 hover:border-white/25 transition-all"
          >
            랜덤 생성
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl border border-white/10 text-xs font-medium text-white/50 hover:text-white/80 hover:border-white/25 transition-all"
          >
            초기화
          </button>
          <button
            onClick={handleContinue}
            disabled={!result}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            스토리 제안 보기 &rarr;
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-4">
              사건 요소 입력
            </p>
            <ScenarioForm form={form} onChange={setForm} />
          </div>

          {/* Right: Result */}
          <div>
            <ScenarioResult
              result={result}
              memo={form.memo}
              onMemoChange={(memo) => setForm((prev) => ({ ...prev, memo }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
