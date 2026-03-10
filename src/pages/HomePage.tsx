import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlayTime, Genre, PuzzleType, ClueFormat } from '../types';
import type { ScenarioFormState, ScenarioBuildResult } from '../types/scenario';
import { INITIAL_FORM_STATE } from '../types/scenario';
import { useProject } from '../context/ProjectContext';
import { analyzeYoutube } from '../services/aiAnalysis';
import { createInitialCells } from '../data/mockMandalart';
import { buildScenarioResult } from '../utils/scenario';
import { populateMandalartFromScenario } from '../utils/mandalartFromScenario';
import { generateStoryProposalsFromScenario } from '../utils/storyFromScenario';
import ScenarioForm from '../components/scenario/ScenarioForm';
import StoryBeatsInput from '../components/home/StoryBeatsInput';

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

type TabKey = 'youtube' | 'build';

// ── Main ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const {
    setProjectName: setCtxProjectName,
    setCells,
    setAiStoryProposals,
    setProjectBrief,
    saveCurrentProject,
    projectBrief,
    setSelectedStory,
    setPuzzleFlowPlan,
    setPuzzleRecommendationGroups,
    setGameFlowDesign,
    setFloorPlanData,
  } = useProject();

  const [activeTab, setActiveTab] = useState<TabKey>('build');
  const [shouldNavigateAfterSave, setShouldNavigateAfterSave] = useState(false);

  // ── YouTube state ────────────────────────────────────────────────────────
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeStep, setYoutubeStep] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) { setPreview(null); return; }
    setPreview({ videoId, title: null, channel: null, metaLoading: true });
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://noembed.com/embed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)}`,
        );
        const meta = await res.json();
        setPreview({ videoId, title: meta.title ?? null, channel: meta.author_name ?? null, metaLoading: false });
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
      navigate('/story');
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

  const handleYoutubeGenerate = async () => {
    const url = youtubeUrl.trim();
    if (!url) return;
    setYoutubeLoading(true);
    setYoutubeError('');
    try {
      // ── Reset previous project state ──
      setSelectedStory(null);
      setPuzzleFlowPlan(null);
      setPuzzleRecommendationGroups([]);
      setGameFlowDesign(null);
      setFloorPlanData(null);

      const result = await analyzeYoutube(url, setYoutubeStep);
      setYoutubeStep('보드 생성 중...');
      await new Promise((r) => setTimeout(r, 200));
      setCtxProjectName(result.projectName);
      setCells(result.cells);
      setAiStoryProposals(result.stories);
      setProjectBrief({
        source: 'youtube',
        videoId: extractYouTubeId(url) ?? null,
        videoTitle: result.videoTitle,
        videoChannel: result.channelName,
        synopsis: result.videoSynopsis,
        beats: result.videoBeats,
        genres: [],
        playTimes: [],
        investigation: { motives: [], methods: [], clues: [], techniques: [] },
      });
      setYoutubeStep('프로젝트 저장 중...');
      setShouldNavigateAfterSave(true);
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

    // ── Reset previous project state ──
    setSelectedStory(null);
    setPuzzleFlowPlan(null);
    setPuzzleRecommendationGroups([]);
    setGameFlowDesign(null);
    setFloorPlanData(null);

    setCtxProjectName(name);

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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start px-4 sm:px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-subhead font-semibold tracking-[0.2em] uppercase text-white/30 mb-3">
          XCAPE Internal Tool
        </p>
        <h1 className="text-display font-semibold tracking-tight text-white mb-3">
          방탈출 테마 기획 AI
        </h1>
        <p className="text-white/40 text-body leading-relaxed">
          YouTube 영상 분석 또는 직접 사건을 구성하여 새 테마를 시작하세요
        </p>
      </div>

      {/* Main card — wider for build tab */}
      <div
        className={`w-full rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all duration-300 ${
          activeTab === 'build' ? 'max-w-2xl lg:max-w-4xl' : 'max-w-lg sm:max-w-xl lg:max-w-2xl'
        }`}
      >
        {/* Tab bar */}
        <div className="flex border-b border-white/10">
          <TabButton active={activeTab === 'youtube'} onClick={() => setActiveTab('youtube')}>
            YouTube로 시작
          </TabButton>
          <TabButton active={activeTab === 'build'} onClick={() => setActiveTab('build')}>
            사건 구성하기
          </TabButton>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'youtube' ? (
            <YouTubeTab
              youtubeUrl={youtubeUrl}
              setYoutubeUrl={setYoutubeUrl}
              preview={preview}
              youtubeLoading={youtubeLoading}
              youtubeStep={youtubeStep}
              youtubeError={youtubeError}
              onGenerate={handleYoutubeGenerate}
            />
          ) : (
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
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab Button ──────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3.5 text-body font-medium transition-all duration-200 ${
        active
          ? 'text-white border-b-2 border-white bg-white/[0.03]'
          : 'text-white/35 hover:text-white/55 hover:bg-white/[0.02]'
      }`}
    >
      {children}
    </button>
  );
}

// ── YouTube Tab ─────────────────────────────────────────────────────────────

interface YouTubeTabProps {
  youtubeUrl: string;
  setYoutubeUrl: (v: string) => void;
  preview: VideoPreview | null;
  youtubeLoading: boolean;
  youtubeStep: string;
  youtubeError: string;
  onGenerate: () => void;
}

function YouTubeTab({ youtubeUrl, setYoutubeUrl, preview, youtubeLoading, youtubeStep, youtubeError, onGenerate }: YouTubeTabProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-subhead text-white/40 font-medium tracking-wide uppercase">
        YouTube URL
      </label>
      <input
        type="url"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        placeholder="https://youtube.com/watch?v=..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-body text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-200"
      />

      {preview && (
        <div className="flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="flex-shrink-0 w-24 h-[54px] rounded-lg overflow-hidden bg-white/[0.06]">
            <img
              src={`https://img.youtube.com/vi/${preview.videoId}/mqdefault.jpg`}
              alt="thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            {preview.metaLoading ? (
              <>
                <div className="h-3 w-32 rounded bg-white/10 animate-pulse mb-1.5" />
                <div className="h-2.5 w-20 rounded bg-white/[0.06] animate-pulse" />
              </>
            ) : (
              <>
                <p className="text-subhead font-medium text-white/80 leading-snug line-clamp-2 mb-1">
                  {preview.title ?? '제목을 불러올 수 없습니다'}
                </p>
                {preview.channel && (
                  <p className="text-caption text-white/35 truncate">{preview.channel}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={!youtubeUrl.trim() || youtubeLoading}
        className="mt-2 w-full py-3 rounded-xl text-body font-medium transition-all duration-200 bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {youtubeLoading ? (
          <>
            <Spinner />
            {youtubeStep || 'AI 분석 중...'}
          </>
        ) : (
          'AI 테마 생성'
        )}
      </button>

      {youtubeLoading && youtubeStep && (
        <p className="text-footnote text-white/30 text-center animate-pulse">{youtubeStep}</p>
      )}
      {youtubeError && (
        <p className="text-footnote text-red-400/70 leading-relaxed bg-red-500/[0.06] border border-red-500/20 rounded-lg px-3 py-2">
          {youtubeError}
        </p>
      )}
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
}: BuildTabProps) {
  const [openSection, setOpenSection] = useState<string>('basic');

  const toggle = (key: string) =>
    setOpenSection((prev) => (prev === key ? '' : key));

  return (
    <div className="flex flex-col gap-4">
      {/* ── Section 1: 기본 정보 ── */}
      <SectionHeader
        title="기본 정보"
        subtitle="프로젝트명, 시간, 장르"
        open={openSection === 'basic'}
        onToggle={() => toggle('basic')}
      />
      {openSection === 'basic' && (
        <div className="flex flex-col gap-4 pl-1">
          <Field label="프로젝트 이름">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="테마 이름을 입력하세요"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-body text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-200"
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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-body text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-200 resize-none"
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
        className="mt-2 w-full py-3 rounded-xl text-body font-medium transition-all duration-200 bg-white text-black hover:bg-white/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        스토리 제안 보기 →
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

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
