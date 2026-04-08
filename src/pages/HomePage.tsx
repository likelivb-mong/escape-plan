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
import { importProjectFromMarkdown } from '../services/markdownImport';

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
    setSelectedStory,
    setPuzzleFlowPlan,
    setGameFlowDesign,
    setFloorPlanData,
    setProjectBrief,
    setOptionalSections,
    setImportMeta,
    setBranchCode: setCtxBranchCode,
    persistProject,
    projectBrief,
    resetForNewProject,
  } = useProject();

  const [shouldNavigateAfterSave, setShouldNavigateAfterSave] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>(MOCK_BRANCHES[0].code);
  const [markdownImporting, setMarkdownImporting] = useState(false);
  const [markdownError, setMarkdownError] = useState('');

  // ── YouTube state (선택사항) ─────────────────────────────────────────────
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeStep, setYoutubeStep] = useState('');
  const [youtubeProgress, setYoutubeProgress] = useState(0);
  const [youtubeError, setYoutubeError] = useState('');
  const [youtubeAnalysisResult, setYoutubeAnalysisResult] = useState<any>(null);
  const [analyzeFromYoutube, setAnalyzeFromYoutube] = useState(false);
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const STEP_PROGRESS: Record<string, number> = {
    '영상 정보 가져오는 중...': 12,
    '자막 분석 중...': 30,
    '내용 서사 구조 분석 중...': 58,
    'AI가 서사 구조 분석 중...': 58,
    '방탈출 테마 생성 중...': 82,
  };

  useEffect(() => {
    if (youtubeStep) setYoutubeProgress(STEP_PROGRESS[youtubeStep] ?? 50);
  }, [youtubeStep]);

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
      persistProject();
      setShouldNavigateAfterSave(false);
      navigate('/plan');
    }
  }, [shouldNavigateAfterSave, projectBrief, persistProject, navigate]);

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
    setYoutubeProgress(0);
    setYoutubeError('');
    try {
      const result = await analyzeYoutube(url, setYoutubeStep);
      setYoutubeProgress(100);
      setYoutubeAnalysisResult(result);

      // ── Auto-fill all form fields from analysis ──
      setProjectName(result.projectName || '');
      if (result.videoSynopsis) setSynopsis(result.videoSynopsis);
      if (result.videoBeats?.length) {
        const newBeats: Record<string, string> = { '기': '', '승': '', '전': '', '반전': '', '결': '' };
        for (const b of result.videoBeats) newBeats[b.label] = b.description;
        setBeats(newBeats);
      }

      // Infer genres from story proposals
      if (result.stories?.length) {
        const GENRE_MAP: Record<string, Genre> = {
          '공포': 'horror', '호러': 'horror',
          '미스터리': 'mystery', '추리': 'mystery',
          '어드벤처': 'adventure', '모험': 'adventure',
          '스릴러': 'thriller', '긴박': 'thriller', '심리': 'thriller',
          '판타지': 'fantasy',
          'sf': 'sci-fi', '사이파이': 'sci-fi',
          '로맨스': 'romance',
          '코미디': 'comedy',
        };
        const inferred = new Set<Genre>();
        for (const s of result.stories) {
          const g = (s.genre || '').toLowerCase();
          for (const [keyword, genre] of Object.entries(GENRE_MAP)) {
            if (g.includes(keyword)) inferred.add(genre);
          }
        }
        if (inferred.size > 0) setGenres([...inferred]);

        // Infer playtime from first story
        const ptMatch = result.stories[0]?.meta?.playtime?.match(/(\d+)/);
        if (ptMatch) {
          const mins = parseInt(ptMatch[1], 10);
          const closest = PLAY_TIMES.reduce((a, b) => Math.abs(b - mins) < Math.abs(a - mins) ? b : a);
          setPlayTimes([closest]);
        }
      }

      // Infer puzzle types from narrative tags
      const tags = result.narrative?.escapeRoomUsefulPoints?.tags ?? [];
      const tagsText = tags.join(' ').toLowerCase();
      const puzzleInferred: PuzzleType[] = [];
      if (tagsText.match(/추리|수사|탐정/)) puzzleInferred.push('추리');
      if (tagsText.match(/관찰|발견|탐색/)) puzzleInferred.push('관찰');
      if (tagsText.match(/수리|숫자|계산|암호/)) puzzleInferred.push('수리');
      if (tagsText.match(/협동|협력|팀/)) puzzleInferred.push('협동');
      if (tagsText.match(/활동|신체|움직/)) puzzleInferred.push('활동');
      if (tagsText.match(/오감|감각|소리|냄새/)) puzzleInferred.push('오감');
      if (puzzleInferred.length > 0) setPuzzleTypes(puzzleInferred);

      // Infer clue formats from narrative
      const clueInferred: ClueFormat[] = [];
      if (tagsText.match(/텍스트|문서|편지|일기|uv|영상|사진/)) clueInferred.push('평면');
      if (tagsText.match(/물품|장치|기계|열쇠|상자|입체/)) clueInferred.push('입체');
      if (tagsText.match(/공간|배치|동선|지도|방/)) clueInferred.push('공간');
      if (tagsText.match(/감각|시각|청각|촉각|소리|빛/)) clueInferred.push('감각');
      if (clueInferred.length > 0) setClueFormats(clueInferred);

      setAnalyzeFromYoutube(true);
    } catch (err) {
      setYoutubeError(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setYoutubeLoading(false);
      setYoutubeStep('');
    }
  };

  const togglePlayTime = (t: PlayTime) =>
    setPlayTimes([t]);

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

    // ── Build investigation from scenario form (if any) ──
    const hasScenario = scenarioResult != null;
    const investigation = hasScenario
      ? {
          motives: scenarioForm.motive.item ? [scenarioForm.motive.item] : [],
          methods: scenarioForm.crimeType.item ? [scenarioForm.crimeType.item] : [],
          clues: scenarioForm.clue.item ? [scenarioForm.clue.item] : [],
          techniques: scenarioForm.method.item ? [scenarioForm.method.item] : [],
        }
      : { motives: [], methods: [], clues: [], techniques: [] };

    // ── Determine source & cells/stories ──
    const useYoutube = youtubeAnalysisResult && analyzeFromYoutube;

    if (useYoutube) {
      setCells(youtubeAnalysisResult.cells);
      setAiStoryProposals(youtubeAnalysisResult.stories);
    } else if (hasScenario) {
      setCells(populateMandalartFromScenario(scenarioForm));
      setAiStoryProposals(generateStoryProposalsFromScenario(scenarioForm, scenarioResult!));
    } else {
      const freshCells = createInitialCells();
      setCells(freshCells.map((c) => (c.isCenter ? { ...c, text: name } : c)));
      setAiStoryProposals(null);
    }

    // ── Build beats: manual input takes priority, then YouTube/scenario fallback ──
    const BEAT_KEYS = ['기', '승', '전', '반전', '결'] as const;
    const hasManualBeats = BEAT_KEYS.some((k) => beats[k]?.trim());

    let finalBeats: { label: '기' | '승' | '전' | '반전' | '결'; description: string }[];
    if (hasManualBeats) {
      // User typed beats — use them, fill gaps from YouTube/scenario if available
      finalBeats = BEAT_KEYS.map((k) => {
        if (beats[k]?.trim()) return { label: k, description: beats[k] };
        // Fallback to YouTube beat for this label
        const ytBeat = useYoutube
          ? youtubeAnalysisResult.videoBeats?.find((b: any) => b.label === k)
          : null;
        if (ytBeat) return ytBeat;
        // Fallback to scenario beat
        if (hasScenario && k === '기') return { label: k, description: scenarioResult!.summary.caseOverview };
        if (hasScenario && k === '승') return { label: k, description: `핵심 단서: ${scenarioResult!.summary.coreClue}` };
        if (hasScenario && k === '전') return { label: k, description: scenarioResult!.summary.recommendedFocus };
        return { label: k, description: '' };
      }).filter((b) => b.description);
    } else if (useYoutube && youtubeAnalysisResult.videoBeats?.length) {
      finalBeats = youtubeAnalysisResult.videoBeats;
    } else if (hasScenario) {
      finalBeats = [
        { label: '기', description: scenarioResult!.summary.caseOverview },
        { label: '승', description: `핵심 단서: ${scenarioResult!.summary.coreClue}` },
        { label: '전', description: scenarioResult!.summary.recommendedFocus },
        { label: '반전', description: scenarioForm.memo || '(미입력)' },
        { label: '결', description: '만다라트에서 세부 기획 진행' },
      ];
    } else {
      finalBeats = [];
    }

    // ── Synopsis: manual takes priority ──
    const finalSynopsis = synopsis.trim()
      || (useYoutube ? youtubeAnalysisResult.videoSynopsis : '')
      || (hasScenario ? scenarioResult!.scenarioText : '')
      || '';

    // ── Assemble brief (all sources merged) ──
    setProjectBrief({
      source: useYoutube ? 'youtube' : hasScenario ? 'scenario' : 'manual',
      videoId: useYoutube ? (extractYouTubeId(youtubeUrl) ?? null) : null,
      videoTitle: useYoutube ? youtubeAnalysisResult.videoTitle : null,
      videoChannel: useYoutube ? youtubeAnalysisResult.channelName : null,
      synopsis: finalSynopsis,
      beats: finalBeats,
      genres,
      playTimes,
      investigation,
      puzzleTypes,
      clueFormats,
    });

    // 상태 업데이트 후 저장 및 네비게이션
    // 상태 업데이트 후 저장 및 네비게이션
    setShouldNavigateAfterSave(true);
  };

  const handleMarkdownImport = useCallback(async (file: File) => {
    setMarkdownImporting(true);
    setMarkdownError('');

    try {
      const content = await file.text();
      const imported = importProjectFromMarkdown(content, file.name);

      resetForNewProject();
      setCtxProjectName(imported.projectName);
      setCtxBranchCode(selectedBranch);
      setProjectBrief(imported.projectBrief);
      setAiStoryProposals(imported.aiStoryProposals);
      setSelectedStory(imported.selectedStory);
      setCells(imported.cells);
      setPuzzleFlowPlan(imported.puzzleFlowPlan);
      setGameFlowDesign(imported.gameFlowDesign);
      setFloorPlanData(imported.floorPlanData);
      setOptionalSections(imported.optionalSections);
      setImportMeta(imported.importMeta);

      setTimeout(() => {
        persistProject();
        navigate('/plan');
      }, 0);
    } catch (error) {
      setMarkdownError(error instanceof Error ? error.message : '마크다운 가져오기에 실패했습니다.');
    } finally {
      setMarkdownImporting(false);
    }
  }, [
    navigate,
    persistProject,
    resetForNewProject,
    selectedBranch,
    setAiStoryProposals,
    setCells,
    setCtxBranchCode,
    setCtxProjectName,
    setFloorPlanData,
    setGameFlowDesign,
    setImportMeta,
    setOptionalSections,
    setProjectBrief,
    setPuzzleFlowPlan,
    setSelectedStory,
  ]);

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
          youtubeProgress={youtubeProgress}
          youtubeError={youtubeError}
          onAnalyzeYoutube={handleYoutubeAnalyze}
          analyzeFromYoutube={analyzeFromYoutube}
          setAnalyzeFromYoutube={setAnalyzeFromYoutube}
          youtubeAnalysisResult={youtubeAnalysisResult}
          onMarkdownImport={handleMarkdownImport}
          markdownImporting={markdownImporting}
          markdownError={markdownError}
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
  youtubeProgress: number;
  youtubeError: string;
  onAnalyzeYoutube: () => void;
  analyzeFromYoutube: boolean;
  setAnalyzeFromYoutube: (v: boolean) => void;
  youtubeAnalysisResult: any;
  onMarkdownImport: (file: File) => void;
  markdownImporting: boolean;
  markdownError: string;
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
  preview, youtubeLoading, youtubeStep, youtubeProgress, youtubeError,
  onAnalyzeYoutube,
  analyzeFromYoutube, setAnalyzeFromYoutube,
  youtubeAnalysisResult,
  onMarkdownImport,
  markdownImporting,
  markdownError,
}: BuildTabProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ basic: true });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When YouTube analysis completes, open all sections to show auto-filled data
  const prevAnalysisRef = useRef(youtubeAnalysisResult);
  useEffect(() => {
    if (youtubeAnalysisResult && youtubeAnalysisResult !== prevAnalysisRef.current) {
      prevAnalysisRef.current = youtubeAnalysisResult;
      setOpenSections({ youtube: true, basic: true, scenario: true, puzzle: true, story: true });
    }
  }, [youtubeAnalysisResult]);

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Markdown 업로드"
        subtitle="기획 문서를 바로 프로젝트 파이프라인으로 변환"
        open={openSections['markdown'] ?? true}
        onToggle={() => toggle('markdown')}
      />
      {(openSections['markdown'] ?? true) && (
        <div className="flex flex-col gap-3 pl-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,text/markdown,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onMarkdownImport(file);
              e.currentTarget.value = '';
            }}
          />
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-body font-semibold text-white/82">기획용 `.md` 파일 업로드</p>
                <p className="text-footnote text-white/35 leading-relaxed mt-1">
                  문서의 핵심 내용으로 Plan, Story, Mandalart, Game Flow, Pass Map을 자동 생성하고,
                  일정/예산/리뷰 같은 부가 항목은 선택 추가 페이지로 붙입니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={markdownImporting}
                className="px-4 py-2.5 rounded-xl bg-white text-black text-subhead font-semibold hover:bg-white/90 transition-all disabled:opacity-40"
              >
                {markdownImporting ? '가져오는 중...' : 'Markdown 업로드'}
              </button>
            </div>
          </div>
          {markdownError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-footnote">
              {markdownError}
            </div>
          )}
        </div>
      )}

      {/* ── Section 0: 참고 자료 (YouTube) ── */}
      <SectionHeader
        title="📺 참고 자료 (선택사항)"
        subtitle="YouTube 영상을 기반으로 테마 기획하기"
        open={openSections['youtube']}
        onToggle={() => toggle('youtube')}
      />
      {openSections['youtube'] && (
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

          {/* ── Video preview card ── */}
          {preview && !preview.metaLoading && preview.title && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
              <div className="relative w-full aspect-video bg-black/40">
                <img
                  src={`https://img.youtube.com/vi/${preview.videoId}/mqdefault.jpg`}
                  alt={preview.title ?? ''}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-footnote font-semibold text-white leading-snug line-clamp-2">{preview.title}</p>
                  {preview.channel && (
                    <p className="text-caption text-white/50 mt-0.5">{preview.channel}</p>
                  )}
                </div>
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white/60 font-mono">
                  YouTube
                </span>
              </div>
            </div>
          )}

          {preview && preview.metaLoading && (
            <div className="h-8 flex items-center gap-2 text-caption text-white/30">
              <div className="w-3 h-3 border border-white/20 border-t-white/50 rounded-full animate-spin" />
              영상 정보 불러오는 중...
            </div>
          )}

          {/* ── Analyze button ── */}
          {!youtubeLoading && (
            <button
              onClick={onAnalyzeYoutube}
              disabled={!preview?.title || youtubeLoading}
              className="py-2.5 rounded-xl text-body font-semibold transition-all bg-white/[0.08] text-white/80 hover:bg-white/[0.13] hover:text-white active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              📊 영상 분석하기
            </button>
          )}

          {/* ── Progress bar (loading) ── */}
          {youtubeLoading && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-footnote text-white/50">{youtubeStep || '분석 준비 중...'}</span>
                <span className="text-footnote font-mono text-white/40">{youtubeProgress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-700 ease-out"
                  style={{ width: `${youtubeProgress}%` }}
                />
              </div>
              <div className="flex gap-1.5">
                {['영상 정보', '자막 분석', '서사 분석', '테마 생성'].map((label, i) => {
                  const thresholds = [12, 30, 58, 82];
                  const done = youtubeProgress >= thresholds[i];
                  const active = youtubeProgress >= (thresholds[i - 1] ?? 0) && youtubeProgress < thresholds[i];
                  return (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full h-0.5 rounded-full transition-all duration-500 ${
                        done ? 'bg-violet-400/70' : active ? 'bg-violet-400/30' : 'bg-white/[0.07]'
                      }`} />
                      <span className={`text-[9px] text-center leading-tight transition-colors duration-300 ${
                        done ? 'text-violet-300/70' : active ? 'text-white/50' : 'text-white/20'
                      }`}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {youtubeError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-footnote">
              {youtubeError}
            </div>
          )}

          {youtubeAnalysisResult && !youtubeLoading && (
            <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-green-500/20 bg-green-500/[0.06] hover:bg-green-500/[0.09] transition-all">
              <input
                type="checkbox"
                checked={analyzeFromYoutube}
                onChange={(e) => setAnalyzeFromYoutube(e.target.checked)}
                className="w-4 h-4 rounded accent-green-400"
              />
              <div>
                <p className="text-footnote font-medium text-green-300/80">✅ 분석 완료 — 이 영상으로 테마 설계 시작</p>
                <p className="text-caption text-white/30 mt-0.5">체크 후 하단 "테마 설계 시작 →" 버튼을 눌러주세요</p>
              </div>
            </label>
          )}
        </div>
      )}

      {/* ── Section 1: 기본 정보 ── */}
      <SectionHeader
        title="기본 정보"
        subtitle="프로젝트명, 시간, 장르"
        open={openSections['basic']}
        onToggle={() => toggle('basic')}
      />
      {openSections['basic'] && (
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
        open={openSections['scenario']}
        onToggle={() => toggle('scenario')}
      />
      {openSections['scenario'] && (
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
        open={openSections['puzzle']}
        onToggle={() => toggle('puzzle')}
      />
      {openSections['puzzle'] && (
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
        open={openSections['story']}
        onToggle={() => toggle('story')}
      />
      {openSections['story'] && (
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
