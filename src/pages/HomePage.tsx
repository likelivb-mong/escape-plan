import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlayTime, Genre, PuzzleType, ClueFormat } from '../types';
import type { ScenarioFormState, ScenarioBuildResult } from '../types/scenario';
import { INITIAL_FORM_STATE } from '../types/scenario';
import { useProject } from '../context/ProjectContext';
import { analyzeYoutube } from '../services/aiAnalysis';
import { fetchYouTubeMetadata } from '../utils/youtubeMetadata';
import { createInitialCells } from '../data/mockMandalart';
import { buildScenarioResult } from '../utils/scenario';
import { populateMandalartFromScenario } from '../utils/mandalartFromScenario';
import { generateStoryProposalsFromScenario } from '../utils/storyFromScenario';
import ScenarioForm from '../components/scenario/ScenarioForm';
import StoryBeatsInput from '../components/home/StoryBeatsInput';
import { MOCK_BRANCHES } from '../features/passmap/mock/branches';

// ── YouTube URL 파싱 ──────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) return u.pathname.slice(8).split('?')[0];
      return u.searchParams.get('v');
    }
  } catch {}
  return null;
}

interface VideoPreview {
  videoId: string;
  title: string | null;
  channel: string | null;
  metaLoading: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PLAY_TIMES: PlayTime[] = [60, 70, 80, 90];

const GENRES: { value: Genre; label: string }[] = [
  { value: 'horror', label: '공포' },
  { value: 'mystery', label: '미스터리' },
  { value: 'adventure', label: '어드벤처' },
  { value: 'thriller', label: '스릴러' },
  { value: 'fantasy', label: '판타지' },
  { value: 'sci-fi', label: 'SF' },
  { value: 'romance', label: '로맨스' },
  { value: 'comedy', label: '코미디' },
];

const PUZZLE_TYPES: PuzzleType[] = ['추리', '관찰', '수리', '협동', '활동', '오감'];
const CLUE_FORMATS: ClueFormat[] = ['평면', '입체', '공간', '감각'];

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const {
    setProjectName: setCtxProjectName,
    setCells,
    setAiStoryProposals,
    setProjectBrief,
    setBranchCode: setCtxBranchCode,
    saveCurrentProject,
    projectBrief,
    resetForNewProject,
  } = useProject();

  const [shouldNavigateAfterSave, setShouldNavigateAfterSave] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>(MOCK_BRANCHES[0].code);

  // ── YouTube state (선택사항) ─────────────────────────────────────────────
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeStep, setYoutubeStep] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [youtubeAnalysisResult, setYoutubeAnalysisResult] = useState<any>(null);
  const [analyzeFromYoutube, setAnalyzeFromYoutube] = useState(false);
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) { setPreview(null); return; }
    setPreview({ videoId, title: null, channel: null, metaLoading: true });
    debounceRef.current = setTimeout(async () => {
      try {
        const metadata = await fetchYouTubeMetadata(videoId);
        setPreview({
          videoId,
          title: metadata?.title ?? null,
          channel: metadata?.channelName ?? null,
          metaLoading: false,
        });
      } catch {
        setPreview((p) => p ? { ...p, metaLoading: false } : null);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [youtubeUrl]);

  // ── Build (사건 구성하기) state ──────────────────────────────────────────
  const [projectName, setProjectName] = useState('');
  const [playTimes, setPlayTimes] = useState<PlayTime[]>([60]);
  const [genres, setGenres] = useState<Genre[]>(['mystery']);
  const [puzzleTypes, setPuzzleTypes] = useState<PuzzleType[]>([]);
  const [clueFormats, setClueFormats] = useState<ClueFormat[]>([]);
  const [synopsis, setSynopsis] = useState('');
  const [beats, setBeats] = useState<Record<string, string>>({
    '기': '', '승': '', '전': '', '반전': '', '결': '',
  });
  const [scenarioForm, setScenarioForm] = useState<ScenarioFormState>(INITIAL_FORM_STATE);

  // 자동 저장 후 네비게이션 처리
  useEffect(() => {
    if (shouldNavigateAfterSave && projectBrief) {
      saveCurrentProject();
      setShouldNavigateAfterSave(false);
      navigate('/theme-design');
    }
  }, [shouldNavigateAfterSave, projectBrief, saveCurrentProject, navigate]);

  // Live scenario result
  const scenarioResult: ScenarioBuildResult | null = useMemo(() => {
    const f = scenarioForm;
    const hasAny =
      f.motive.item || f.crimeType.item || f.clue.item || f.method.item ||
      f.characters.some((c) => c.name.trim()) || f.location;
    if (!hasAny) return null;
    return buildScenarioResult(f);
  }, [scenarioForm]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleYoutubeAnalyze = async () => {
    const url = youtubeUrl.trim();
    if (!url) return;
    setYoutubeLoading(true);
    setYoutubeError('');
    try {
      const result = await analyzeYoutube(url, setYoutubeStep);
      setYoutubeAnalysisResult(result);
      // AI 분석에서 나온 프로젝트명 자동으로 설정
      setProjectName(result.projectName || '');
    } catch (err) {
      setYoutubeError(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setYoutubeLoading(false);
      setYoutubeStep('');
    }
  };

  const togglePlayTime = (t: PlayTime) =>
    setPlayTimes((prev) =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter((v) => v !== t) : prev) : [...prev, t],
    );

  const toggleGenre = (g: Genre) =>
    setGenres((prev) =>
      prev.includes(g) ? (prev.length > 1 ? prev.filter((v) => v !== g) : prev) : [...prev, g],
    );

  const togglePuzzleType = (t: PuzzleType) =>
    setPuzzleTypes((prev) =>
      prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t],
    );

  const toggleClueFormat = (f: ClueFormat) =>
    setClueFormats((prev) =>
      prev.includes(f) ? prev.filter((v) => v !== f) : [...prev, f],
    );

  const handleBuildSubmit = () => {
    const name = projectName.trim();
    if (!name) return;

    // ── Reset previous project state (새 프로젝트로 시작) ──
    resetForNewProject();

    setCtxProjectName(name);
    setCtxBranchCode(selectedBranch);

    // If YouTube analysis was selected, use that as base
    if (youtubeAnalysisResult && analyzeFromYoutube) {
      setCells(youtubeAnalysisResult.cells);
      setAiStoryProposals(youtubeAnalysisResult.stories);
      setProjectBrief({
        source: 'youtube',
        videoId: extractYouTubeId(youtubeUrl) ?? null,
        videoTitle: youtubeAnalysisResult.videoTitle,
        videoChannel: youtubeAnalysisResult.channelName,
        synopsis: youtubeAnalysisResult.videoSynopsis,
        beats: youtubeAnalysisResult.videoBeats,
        genres,
        playTimes,
        investigation: { motives: [], methods: [], clues: [], techniques: [] },
        puzzleTypes,
        clueFormats,
      });
      setShouldNavigateAfterSave(true);
      return;
    }

    // If scenario form has data, use scenario-based generation
    if (scenarioResult) {
      setCells(populateMandalartFromScenario(scenarioForm));
      const proposals = generateStoryProposalsFromScenario(scenarioForm, scenarioResult);
      setAiStoryProposals(proposals);
      setProjectBrief({
        source: 'scenario',
        videoId: null,
        videoTitle: null,
        videoChannel: null,
        synopsis: synopsis || scenarioResult.scenarioText,
        beats: [
          { label: '기', description: beats['기'] || scenarioResult.summary.caseOverview },
          { label: '승', description: beats['승'] || `핵심 단서: ${scenarioResult.summary.coreClue}` },
          { label: '전', description: beats['전'] || scenarioResult.summary.recommendedFocus },
          { label: '반전', description: beats['반전'] || scenarioForm.memo || '(미입력)' },
          { label: '결', description: beats['결'] || '만다라트에서 세부 기획 진행' },
        ],
        genres,
        playTimes,
        investigation: {
          motives: scenarioForm.motive.item ? [scenarioForm.motive.item] : [],
          methods: scenarioForm.crimeType.item ? [scenarioForm.crimeType.item] : [],
          clues: scenarioForm.clue.item ? [scenarioForm.clue.item] : [],
          techniques: scenarioForm.method.item ? [scenarioForm.method.item] : [],
        },
        puzzleTypes,
        clueFormats,
      });
    } else {
      // Manual-only flow
      const freshCells = createInitialCells();
      setCells(freshCells.map((c) => (c.isCenter ? { ...c, text: name } : c)));
      setAiStoryProposals(null);
      setProjectBrief({
        source: 'manual',
        videoId: null,
        videoTitle: null,
        videoChannel: null,
        synopsis,
        beats: (['기', '승', '전', '반전', '결'] as const)
          .filter((l) => beats[l])
          .map((l) => ({ label: l, description: beats[l] })),
        genres,
        playTimes,
        investigation: { motives: [], methods: [], clues: [], techniques: [] },
        puzzleTypes,
        clueFormats,
      });
    }

    // 상태 업데이트 후 저장 및 네비게이션
    setShouldNavigateAfterSave(true);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-start px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-hero font-bold tracking-tight text-white/95 mb-3">
          테마 설계
        </h1>
        <p className="text-white/30 text-body leading-relaxed max-w-sm mx-auto">
          사건을 정의하고, 플레이어 경험을 설계하세요.
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-2xl lg:max-w-4xl rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-300 shadow-card p-6 sm:p-8">
        <BuildTab
          projectName={projectName}
          setProjectName={setProjectName}
          playTimes={playTimes}
          togglePlayTime={togglePlayTime}
          genres={genres}
          toggleGenre={toggleGenre}
          puzzleTypes={puzzleTypes}
          togglePuzzleType={togglePuzzleType}
          clueFormats={clueFormats}
          toggleClueFormat={toggleClueFormat}
          scenarioForm={scenarioForm}
          setScenarioForm={setScenarioForm}
          scenarioResult={scenarioResult}
          synopsis={synopsis}
          setSynopsis={setSynopsis}
          beats={beats}
          setBeats={setBeats}
          onSubmit={handleBuildSubmit}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          youtubeUrl={youtubeUrl}
          setYoutubeUrl={setYoutubeUrl}
          preview={preview}
          youtubeLoading={youtubeLoading}
          youtubeStep={youtubeStep}
          youtubeError={youtubeError}
          onAnalyzeYoutube={handleYoutubeAnalyze}
          analyzeFromYoutube={analyzeFromYoutube}
          setAnalyzeFromYoutube={setAnalyzeFromYoutube}
          youtubeAnalysisResult={youtubeAnalysisResult}
        />
      </div>
    </div>
  );
}

// ── Build Tab (사건 구성하기) ────────────────────────────────────────────────

interface BuildTabProps {
  projectName: string;
  setProjectName: (v: string) => void;
  playTimes: PlayTime[];
  togglePlayTime: (t: PlayTime) => void;
  genres: Genre[];
  toggleGenre: (g: Genre) => void;
  puzzleTypes: PuzzleType[];
  togglePuzzleType: (t: PuzzleType) => void;
  clueFormats: ClueFormat[];
  toggleClueFormat: (f: ClueFormat) => void;
  scenarioForm: ScenarioFormState;
  setScenarioForm: (fn: ScenarioFormState | ((prev: ScenarioFormState) => ScenarioFormState)) => void;
  scenarioResult: ScenarioBuildResult | null;
  synopsis: string;
  setSynopsis: (v: string) => void;
  beats: Record<string, string>;
  setBeats: (b: Record<string, string>) => void;
  onSubmit: () => void;
  selectedBranch: string;
  setSelectedBranch: (v: string) => void;
  youtubeUrl: string;
  setYoutubeUrl: (v: string) => void;
  preview: VideoPreview | null;
  youtubeLoading: boolean;
  youtubeStep: string;
  youtubeError: string;
  onAnalyzeYoutube: () => void;
  analyzeFromYoutube: boolean;
  setAnalyzeFromYoutube: (v: boolean) => void;
  youtubeAnalysisResult: any;
}

function BuildTab({
  projectName, setProjectName,
  playTimes, togglePlayTime,
  genres, toggleGenre,
  puzzleTypes, togglePuzzleType,
  clueFormats, toggleClueFormat,
  scenarioForm, setScenarioForm,
  scenarioResult,
  synopsis, setSynopsis,
  beats, setBeats,
  onSubmit,
  selectedBranch, setSelectedBranch,
  youtubeUrl, setYoutubeUrl,
  preview, youtubeLoading, youtubeStep, youtubeError,
  onAnalyzeYoutube,
  analyzeFromYoutube, setAnalyzeFromYoutube,
  youtubeAnalysisResult,
}: BuildTabProps) {
  const [openSection, setOpenSection] = useState<string>('basic');

  const toggle = (key: string) =>
    setOpenSection((prev) => (prev === key ? '' : key));

  return (
    <div className="flex flex-col gap-4">
      {/* ── Section 0: 참고 자료 (YouTube) ── */}
      <SectionHeader
        title="📺 참고 자료 (선택사항)"
        subtitle="YouTube 영상을 기반으로 테마 기획하기"
        open={openSection === 'youtube'}
        onToggle={() => toggle('youtube')}
      />
      {openSection === 'youtube' && (
        <div className="flex flex-col gap-4 pl-1">
          <Field label="YouTube 링크">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-body text-white placeholder:text-white/20 outline-none focus:border-white/[0.20] focus:bg-white/[0.06] transition-all"
            />
          </Field>

          {preview && preview.title && (
            <div className="flex items-center gap-3 bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
              <div className="flex-shrink-0 w-10 h-10 rounded bg-white/[0.08] overflow-hidden">
                <img
                  src={`https://img.youtube.com/vi/${preview.videoId}/mqdefault.jpg`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-footnote font-medium text-white/70 truncate">{preview.title}</p>
                {preview.channel && <p className="text-caption text-white/40 truncate">{preview.channel}</p>}
              </div>
            </div>
          )}

          <button
            onClick={onAnalyzeYoutube}
            disabled={!youtubeUrl.trim() || youtubeLoading}
            className="py-2 rounded-lg text-body font-medium transition-all bg-white/[0.08] text-white hover:bg-white/[0.12] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {youtubeLoading ? `분석 중... ${youtubeStep ? `(${youtubeStep})` : ''}` : '📊 영상 분석하기'}
          </button>

          {youtubeError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-footnote">
              {youtubeError}
            </div>
          )}

          {youtubeAnalysisResult && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-footnote">
              ✅ 분석 완료! 아래에서 "이 영상으로 시작" 옵션을 선택하세요.
            </div>
          )}

          {youtubeAnalysisResult && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={analyzeFromYoutube}
                onChange={(e) => setAnalyzeFromYoutube(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-footnote text-white/60">이 YouTube 영상을 기반으로 테마 설계 시작</span>
            </label>
          )}
        </div>
      )}

      {/* ── Section 1: 기본 정보 ── */}
      <SectionHeader
        title="기본 정보"
        subtitle="프로젝트명, 시간, 장르"
        open={openSection === 'basic'}
        onToggle={() => toggle('basic')}
      />
      {openSection === 'basic' && (
        <div className="flex flex-col gap-4 pl-1">
          <BranchSelector selectedBranch={selectedBranch} setSelectedBranch={setSelectedBranch} />
          <Field label="프로젝트 이름">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="테마 이름을 입력하세요"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-body text-white placeholder:text-white/20 outline-none focus:border-white/[0.20] focus:bg-white/[0.06] transition-all"
            />
          </Field>

          <Field label="플레이 시간">
            <div className="flex gap-2">
              {PLAY_TIMES.map((t) => (
                <ToggleChip key={t} active={playTimes.includes(t)} onClick={() => togglePlayTime(t)}>
                  {t}m
                </ToggleChip>
              ))}
            </div>
          </Field>

          <Field label="장르">
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <TogglePill key={g.value} active={genres.includes(g.value)} onClick={() => toggleGenre(g.value)}>
                  {g.label}
                </TogglePill>
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* ── Section 2: 사건 요소 ── */}
      <SectionHeader
        title="사건 요소"
        subtitle="인물, 장소, 범행동기, 수사단서"
        open={openSection === 'scenario'}
        onToggle={() => toggle('scenario')}
      />
      {openSection === 'scenario' && (
        <div className="pl-1">
          <ScenarioForm form={scenarioForm} onChange={setScenarioForm} />
          {scenarioResult && (
            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="text-caption text-white/25 uppercase tracking-widest mb-2">사건 개요</p>
              <p className="text-subhead text-white/60 leading-relaxed">
                {scenarioResult.scenarioText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Section 3: 문제 유형 (QD 분류) ── */}
      <SectionHeader
        title="문제 유형"
        subtitle="퍼즐 유형 + 클루 형태"
        open={openSection === 'puzzle'}
        onToggle={() => toggle('puzzle')}
      />
      {openSection === 'puzzle' && (
        <div className="flex flex-col gap-4 pl-1">
          <Field label="퍼즐 유형">
            <div className="flex flex-wrap gap-1.5">
              {PUZZLE_TYPES.map((t) => (
                <TogglePill key={t} active={puzzleTypes.includes(t)} onClick={() => togglePuzzleType(t)}>
                  {t}
                </TogglePill>
              ))}
            </div>
          </Field>

          <Field label="클루 대분류">
            <div className="flex flex-wrap gap-1.5">
              {CLUE_FORMATS.map((f) => (
                <TogglePill key={f} active={clueFormats.includes(f)} onClick={() => toggleClueFormat(f)}>
                  {f}
                </TogglePill>
              ))}
            </div>
            <p className="text-caption text-white/20 mt-2 leading-relaxed">
              평면(텍스트·UV·영상) · 입체(물품·장치·가구·기계) · 공간(배치·동선) · 감각(시각~촉각)
            </p>
          </Field>
        </div>
      )}

      {/* ── Section 4: 스토리 흐름 (선택) ── */}
      <SectionHeader
        title="스토리 흐름"
        subtitle="시놉시스 + 기승전반결 (선택사항)"
        open={openSection === 'story'}
        onToggle={() => toggle('story')}
      />
      {openSection === 'story' && (
        <div className="flex flex-col gap-4 pl-1">
          <Field label="스토리 핵심 흐름">
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="생성하려는 스토리의 핵심 주제와 방향을 입력하세요"
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-body text-white placeholder:text-white/20 outline-none focus:border-white/[0.20] focus:bg-white/[0.06] transition-all resize-none"
            />
          </Field>
          <Field label="기승전반결">
            <StoryBeatsInput beats={beats} onChange={setBeats} />
          </Field>
        </div>
      )}

      {/* ── Submit ── */}
      <button
        onClick={onSubmit}
        disabled={!projectName.trim()}
        className="mt-3 w-full py-3 rounded-xl text-body font-semibold transition-all duration-200 bg-white text-black hover:bg-white/90 active:scale-[0.99] disabled:opacity-25 disabled:cursor-not-allowed"
      >
        테마 설계 시작 →
      </button>
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────

function SectionHeader({ title, subtitle, open, onToggle }: {
  title: string; subtitle: string; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-3 border-b border-white/[0.06] group"
    >
      <div className="text-left">
        <span className="text-body font-semibold text-white/80">{title}</span>
        <span className="text-footnote text-white/30 ml-2">{subtitle}</span>
      </div>
      <span className={`text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
        ▾
      </span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-subhead text-white/40 font-medium tracking-wide uppercase block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-body font-medium transition-all duration-200 border ${
        active
          ? 'bg-white text-black border-white'
          : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white/60'
      }`}
    >
      {children}
    </button>
  );
}

function TogglePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-subhead font-medium transition-all duration-200 border ${
        active
          ? 'bg-white text-black border-white'
          : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white/60'
      }`}
    >
      {children}
    </button>
  );
}

function BranchSelector({ selectedBranch, setSelectedBranch }: { selectedBranch: string; setSelectedBranch: (v: string) => void }) {
  return (
    <Field label="지점">
      <div className="flex flex-wrap gap-1.5">
        {MOCK_BRANCHES.map((b) => (
          <button
            key={b.code}
            type="button"
            onClick={() => setSelectedBranch(b.code)}
            className={`px-3 py-1.5 rounded-full text-subhead font-mono font-medium transition-all duration-200 border ${
              selectedBranch === b.code
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white/60'
            }`}
          >
            {b.code}
          </button>
        ))}
      </div>
    </Field>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
