import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import type { ProjectBrief, Genre, PlayTime, PuzzleType, ClueFormat } from '../types';
import { analyzeYoutube } from '../services/aiAnalysis';
import { fetchYouTubeMetadata } from '../utils/youtubeMetadata';
import WorkflowStepBar from '../components/layout/WorkflowStepBar';

const GENRE_LABELS: Record<string, string> = {
  horror: '공포', mystery: '미스터리', adventure: '어드벤처', thriller: '스릴러',
  fantasy: '판타지', 'sci-fi': 'SF', romance: '로맨스', comedy: '코미디',
};
const ALL_GENRES: Genre[] = ['horror', 'mystery', 'adventure', 'thriller', 'fantasy', 'sci-fi', 'romance', 'comedy'];
const ALL_PLAY_TIMES: PlayTime[] = [60, 70, 80, 90];
const ALL_PUZZLE_TYPES: PuzzleType[] = ['추리', '관찰', '수리', '협동', '활동', '오감'];
const ALL_CLUE_FORMATS: ClueFormat[] = ['평면', '입체', '공간', '감각'];
const BEAT_LABELS: ('기' | '승' | '전' | '반전' | '결')[] = ['기', '승', '전', '반전', '결'];

const STAGES = [
  { key: 'plan',     label: 'Plan',     shortLabel: 'Plan',    path: '/plan' },
  { key: 'story',    label: 'Story',    shortLabel: 'Story',   path: '/story' },
  { key: 'mandalart',label: 'Mandalart',shortLabel: 'Mandala', path: '/mandalart' },
  { key: 'gameflow', label: 'Game Flow',shortLabel: 'Flow',    path: '/game-flow' },
  { key: 'setting',  label: 'Pass Map', shortLabel: 'PassMap', path: '/setting' },
] as const;

export default function PlanPage() {
  const navigate = useNavigate();
  const {
    projectName, setProjectName,
    selectedStory,
    gameFlowDesign,
    cells,
    floorPlanData,
    projectBrief, setProjectBrief,
    branchCode,
    saveCurrentProject,
  } = useProject();

  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // YouTube state for editing
  const [youtubeUrl, setYoutubeUrl] = useState(projectBrief?.videoId ? `https://www.youtube.com/watch?v=${projectBrief.videoId}` : '');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeStep, setYoutubeStep] = useState('');
  const [youtubeProgress, setYoutubeProgress] = useState(0);
  const [youtubeError, setYoutubeError] = useState('');
  const [preview, setPreview] = useState<{ videoId: string; title: string | null; channel: string | null; metaLoading: boolean } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Local edit state ──────────────────────────────────────────────────────
  const [editName, setEditName]       = useState(projectName);
  const [editSynopsis, setEditSynopsis] = useState(projectBrief?.synopsis ?? '');
  const [editGenres, setEditGenres]   = useState<Genre[]>(projectBrief?.genres ?? []);
  const [editTimes, setEditTimes]     = useState<PlayTime[]>(projectBrief?.playTimes ?? [60]);
  const [editPuzzleTypes, setEditPuzzleTypes] = useState<PuzzleType[]>(projectBrief?.puzzleTypes ?? []);
  const [editClueFormats, setEditClueFormats] = useState<ClueFormat[]>(projectBrief?.clueFormats ?? []);
  const [editBeats, setEditBeats]     = useState<Record<string, string>>(() => {
    const map: Record<string, string> = { '기': '', '승': '', '전': '', '반전': '', '결': '' };
    projectBrief?.beats.forEach((b) => { map[b.label] = b.description; });
    return map;
  });

  // Debounce YouTube URL fetching
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      setPreview(null);
      return;
    }
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
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [youtubeUrl]);

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

  const handleYoutubeAnalyze = async () => {
    const url = youtubeUrl.trim();
    if (!url) return;
    setYoutubeLoading(true);
    setYoutubeProgress(0);
    setYoutubeError('');
    try {
      const result = await analyzeYoutube(url, setYoutubeStep);
      setYoutubeProgress(100);
      // 자동으로 분석 결과를 폼에 반영
      setEditSynopsis(result.videoSynopsis || editSynopsis);
      // 기승전결 자동 입력
      const beatsMap: Record<string, string> = { '기': '', '승': '', '전': '', '반전': '', '결': '' };
      result.videoBeats?.forEach((beat: any) => {
        beatsMap[beat.label] = beat.description;
      });
      setEditBeats(beatsMap);
    } catch (err) {
      setYoutubeError(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setYoutubeLoading(false);
      setYoutubeStep('');
    }
  };

  const startEdit = () => {
    setEditName(projectName);
    setEditSynopsis(projectBrief?.synopsis ?? '');
    setEditGenres(projectBrief?.genres ?? []);
    setEditTimes(projectBrief?.playTimes ?? [60]);
    setEditPuzzleTypes(projectBrief?.puzzleTypes ?? []);
    setEditClueFormats(projectBrief?.clueFormats ?? []);
    setYoutubeUrl(projectBrief?.videoId ? `https://www.youtube.com/watch?v=${projectBrief.videoId}` : '');
    const map: Record<string, string> = { '기': '', '승': '', '전': '', '반전': '', '결': '' };
    projectBrief?.beats.forEach((b) => { map[b.label] = b.description; });
    setEditBeats(map);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setProjectName(editName.trim() || projectName);
    setProjectBrief({
      ...(projectBrief ?? {
        source: 'manual' as const,
        videoId: null, videoTitle: null, videoChannel: null,
        investigation: { motives: [], methods: [], clues: [], techniques: [] },
      }),
      synopsis: editSynopsis,
      genres: editGenres.length > 0 ? editGenres : (projectBrief?.genres ?? []),
      playTimes: editTimes.length > 0 ? editTimes : (projectBrief?.playTimes ?? [60]),
      puzzleTypes: editPuzzleTypes.length > 0 ? editPuzzleTypes : undefined,
      clueFormats: editClueFormats.length > 0 ? editClueFormats : undefined,
      beats: BEAT_LABELS
        .filter((l) => editBeats[l]?.trim())
        .map((l) => ({ label: l, description: editBeats[l].trim() })),
    });
    setIsEditing(false);
  };

  const handleSave = () => {
    if (isEditing) handleSaveEdit();
    saveCurrentProject();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // ── Progress tracking ─────────────────────────────────────────────────────
  const stageStatus = {
    plan: !!projectBrief,
    story: !!selectedStory,
    mandalart: !!selectedStory && !!(cells && cells.length > 0),
    gameflow: !!gameFlowDesign,
    setting: !!floorPlanData,
  };

  // Find the next incomplete stage to guide the user
  const nextStage = STAGES.find((s) => !stageStatus[s.key]) ?? STAGES[STAGES.length - 1];

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!projectBrief && projectName === 'Untitled Theme Project') {
    return (
      <EmptyState
        icon="📐"
        title="프로젝트가 없습니다."
        message="홈에서 테마를 설계하면 기획서가 자동으로 채워집니다."
        actions={[{ label: '← 테마 설계', onClick: () => navigate('/') }]}
      />
    );
  }

  // ── Shared header ─────────────────────────────────────────────────────────
  const header = (
    <>
    <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/[0.07] flex-shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={() => navigate('/')}
          className="text-white/30 hover:text-white/60 transition-colors text-subhead flex-shrink-0"
        >
          ← 홈
        </button>
        <span className="h-3.5 w-px bg-white/10 flex-shrink-0" />
        <h1 className="text-body font-semibold text-white/85 truncate">{projectName}</h1>
        <span className="hidden sm:block h-3.5 w-px bg-white/10 flex-shrink-0" />
        <span className="hidden sm:block text-footnote text-white/35 font-medium tracking-wide flex-shrink-0">Plan</span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isEditing ? (
          <button
            onClick={startEdit}
            className="px-3 py-1.5 rounded-lg border border-white/[0.10] text-footnote font-medium text-white/45 hover:border-white/20 hover:text-white/70 transition-all"
          >
            ✏ 편집
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 rounded-lg border border-white/[0.10] text-footnote font-medium text-white/35 hover:text-white/55 transition-all"
          >
            취소
          </button>
        )}
        <button
          onClick={handleSave}
          className={`px-3 py-1.5 rounded-lg border text-footnote font-medium transition-all ${
            saved
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300/80'
              : 'border-white/[0.10] text-white/45 hover:border-white/20 hover:text-white/70'
          }`}
        >
          {saved ? '✓ 저장됨' : '저장'}
        </button>
        <button
          onClick={() => { handleSave(); navigate('/story'); }}
          className="px-4 py-1.5 rounded-lg bg-white text-black text-footnote font-semibold hover:bg-white/90 transition-colors"
        >
          Story →
        </button>
      </div>
    </div>
    <WorkflowStepBar onBeforeNavigate={handleSave} />
    </>
  );

  // ── Edit mode ─────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {header}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10 max-w-5xl mx-auto space-y-6">
            <p className="text-caption text-white/25 uppercase tracking-widest">테마 설계 편집</p>

            {/* YouTube URL Input */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <label className="block text-body font-semibold text-white/70 mb-3">
                📺 YouTube 영상 (선택사항)
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
                className="w-full px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white placeholder-white/20 focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04] transition-colors mb-3"
              />

              {/* Video preview */}
              {preview && !preview.metaLoading && preview.title && (
                <div className="rounded-lg border border-white/[0.08] bg-black/20 overflow-hidden mb-3">
                  <div className="relative w-full aspect-video bg-black/40">
                    <img
                      src={`https://img.youtube.com/vi/${preview.videoId}/mqdefault.jpg`}
                      alt={preview.title ?? ''}
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <p className="text-footnote font-semibold text-white leading-snug line-clamp-2">
                        {preview.title}
                      </p>
                      {preview.channel && (
                        <p className="text-caption text-white/50 mt-0.5">{preview.channel}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {preview && preview.metaLoading && (
                <div className="h-8 flex items-center gap-2 text-caption text-white/30 mb-3">
                  <div className="w-3 h-3 border border-white/20 border-t-white/50 rounded-full animate-spin" />
                  영상 정보 불러오는 중...
                </div>
              )}

              {/* YouTube Analysis Progress */}
              {youtubeLoading && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-caption text-white/40">{youtubeStep}</p>
                    <p className="text-caption text-white/30">{youtubeProgress}%</p>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${youtubeProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {youtubeError && (
                <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-caption text-red-300/80">{youtubeError}</p>
                </div>
              )}

              {/* Analyze button */}
              {!youtubeLoading && (
                <button
                  type="button"
                  onClick={handleYoutubeAnalyze}
                  disabled={!preview?.title || youtubeLoading}
                  className="w-full py-2.5 rounded-lg text-body font-semibold transition-all bg-white/[0.08] text-white/80 hover:bg-white/[0.13] active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  📊 영상 분석하기
                </button>
              )}
            </div>

            {/* 프로젝트 이름 */}
            <div>
              <label className="text-subhead text-white/40 font-medium uppercase tracking-wide block mb-1.5">테마 이름</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-body text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-all"
              />
            </div>

            {/* 기본정보 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 장르 */}
              <div>
                <label className="text-subhead text-white/40 font-medium uppercase tracking-wide block mb-2">장르</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_GENRES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEditGenres((prev) =>
                        prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
                      )}
                      className={`px-3 py-1.5 rounded-full text-subhead font-medium border transition-all ${
                        editGenres.includes(g)
                          ? 'bg-violet-400/20 text-violet-300 border-violet-400/40'
                          : 'text-white/40 border-white/10 hover:border-white/25 hover:text-white/60'
                      }`}
                    >
                      {GENRE_LABELS[g]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 플레이 시간 */}
              <div>
                <label className="text-subhead text-white/40 font-medium uppercase tracking-wide block mb-2">플레이 시간</label>
                <div className="flex gap-2">
                  {ALL_PLAY_TIMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditTimes((prev) =>
                        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                      )}
                      className={`flex-1 py-2.5 rounded-xl text-body font-medium border transition-all ${
                        editTimes.includes(t)
                          ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                          : 'text-white/40 border-white/10 hover:border-white/25 hover:text-white/60'
                      }`}
                    >
                      {t}분
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 시놉시스 */}
            <div>
              <label className="text-subhead text-white/40 font-medium uppercase tracking-wide block mb-1.5">시놉시스</label>
              <textarea
                value={editSynopsis}
                onChange={(e) => setEditSynopsis(e.target.value)}
                rows={5}
                placeholder="테마의 배경, 시대, 상황, 플레이어 역할..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-body text-white placeholder:text-white/20 outline-none focus:border-white/20 transition-all resize-none"
              />
            </div>

            {/* 문제 유형 & 힌트 포맷 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="text-subhead text-white/40 font-medium uppercase tracking-wide block mb-2">문제 유형</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_PUZZLE_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditPuzzleTypes((prev) =>
                        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                      )}
                      className={`px-3 py-1.5 rounded-full text-subhead font-medium border transition-all ${
                        editPuzzleTypes.includes(t)
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                          : 'text-white/40 border-white/10 hover:border-white/25 hover:text-white/60'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-subhead text-white/40 font-medium uppercase tracking-wide block mb-2">힌트 포맷</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_CLUE_FORMATS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setEditClueFormats((prev) =>
                        prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
                      )}
                      className={`px-3 py-1.5 rounded-full text-subhead font-medium border transition-all ${
                        editClueFormats.includes(f)
                          ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40'
                          : 'text-white/40 border-white/10 hover:border-white/25 hover:text-white/60'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 기승전반결 */}
            <div>
              <label className="text-subhead text-white/40 font-medium uppercase tracking-wide block mb-2">기승전반결</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {BEAT_LABELS.map((label) => (
                  <div key={label}>
                    <p className="text-caption font-bold text-white/30 mb-2">{label}</p>
                    <textarea
                      value={editBeats[label] ?? ''}
                      onChange={(e) => setEditBeats((prev) => ({ ...prev, [label]: e.target.value }))}
                      rows={5}
                      placeholder={`${label} 단계...`}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-footnote text-white placeholder:text-white/15 outline-none focus:border-white/20 transition-all resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-body font-semibold hover:from-violet-600 hover:to-indigo-600 transition-all"
              >
                저장하고 닫기
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-xl border border-white/[0.10] text-body text-white/45 hover:text-white/70 transition-all"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal view: Brief + Progress ─────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {header}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10 max-w-5xl mx-auto">

          {/* Theme Brief */}
          {projectBrief && <ThemeBriefSection brief={projectBrief} branchCode={branchCode} />}

          {/* Progress tracker */}
          <div className="mt-12 mb-8">
            <p className="text-caption text-white/25 uppercase tracking-widest mb-4">진행 현황</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {STAGES.map((stage) => {
                const done = stageStatus[stage.key];
                const isCurrent = stage.key === 'plan';
                return (
                  <button
                    key={stage.key}
                    onClick={() => navigate(stage.path)}
                    className={`py-3 px-2 rounded-lg text-center transition-all border font-medium text-sm ${
                      isCurrent
                        ? 'border-white/25 bg-white/[0.08] text-white/80'
                        : done
                        ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300/70 hover:border-emerald-500/30'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/30 hover:border-white/12 hover:text-white/50'
                    }`}
                  >
                    {done && !isCurrent && '✓ '}{stage.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next step guidance */}
          {nextStage.key === 'setting' && !stageStatus.setting ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-subhead text-white/40 leading-relaxed">
                Setting에서 룸 구성을 완성하면 기획이 마무리됩니다.
              </p>
              <button
                onClick={() => navigate(nextStage.path)}
                className="flex-shrink-0 px-4 py-2 rounded-lg bg-white text-black text-subhead font-semibold hover:bg-white/90 transition-colors"
              >
                Setting →
              </button>
            </div>
          ) : nextStage.key !== 'plan' && !stageStatus[nextStage.key] ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-subhead text-white/40 leading-relaxed">
                {nextStage.key === 'story' && '스토리를 생성하고 선택하면 다음 단계로 진행됩니다.'}
                {nextStage.key === 'mandalart' && '만다라트 차트를 완성하면 다음 단계로 진행됩니다.'}
              </p>
              <button
                onClick={() => navigate(nextStage.path)}
                className="flex-shrink-0 px-4 py-2 rounded-lg bg-white text-black text-subhead font-semibold hover:bg-white/90 transition-colors"
              >
                {nextStage.label} →
              </button>
            </div>
          ) : stageStatus.setting ? (
            <div className="flex items-center justify-center p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06]">
              <p className="text-subhead text-emerald-300/80 font-medium">
                ✓ 모든 단계가 완성되었습니다. 기획서를 내보내거나 다시 편집할 수 있습니다.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── 테마 설계 요약 섹션 ──────────────────────────────────────────────────────────

function ThemeBriefSection({
  brief,
  branchCode,
}: {
  brief: ProjectBrief;
  branchCode: string | null;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-caption text-white/25 uppercase tracking-widest">테마 설계 기획서</p>
      </div>

      {/* 기본 정보 태그 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {brief.genres.map((g) => (
          <span key={g} className="px-3 py-1.5 rounded-full text-subhead bg-violet-500/10 text-violet-300 border border-violet-500/20 font-medium">
            {GENRE_LABELS[g] ?? g}
          </span>
        ))}
        {brief.playTimes.map((t) => (
          <span key={t} className="px-3 py-1.5 rounded-full text-subhead bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
            {t}분
          </span>
        ))}
        {brief.puzzleTypes && brief.puzzleTypes.length > 0 && brief.puzzleTypes.map((t) => (
          <span key={t} className="px-3 py-1.5 rounded-full text-subhead bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
            {t}
          </span>
        ))}
        {brief.clueFormats && brief.clueFormats.length > 0 && brief.clueFormats.map((f) => (
          <span key={f} className="px-3 py-1.5 rounded-full text-subhead bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
            {f}
          </span>
        ))}
        {branchCode && (
          <span className="px-3 py-1.5 rounded-full text-subhead bg-white/[0.06] text-white/55 border border-white/[0.06] font-mono">
            {branchCode}
          </span>
        )}
        {brief.source === 'youtube' && brief.videoTitle && (
          <span className="px-3 py-1.5 rounded-full text-subhead bg-red-500/10 text-red-300 border border-red-500/20 font-medium">
            📺 {brief.videoTitle}
          </span>
        )}
      </div>

      {/* 시놉시스 */}
      {brief.synopsis && (
        <div className="mb-6 p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <p className="text-caption text-white/25 uppercase tracking-widest font-semibold mb-2">시놉시스</p>
          <p className="text-body text-white/70 leading-relaxed">{brief.synopsis}</p>
        </div>
      )}

      {/* 기승전반결 */}
      {brief.beats.length > 0 && (
        <div className="mb-6">
          <p className="text-caption text-white/25 uppercase tracking-widest font-semibold mb-3">스토리 구조</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {brief.beats.map((beat) => (
              <div key={beat.label} className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <p className="text-caption font-bold text-white/40 mb-2 uppercase">{beat.label}</p>
                <p className="text-footnote text-white/65 leading-relaxed">{beat.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 사건 요소 */}
      {(brief.investigation.motives.length > 0 ||
        brief.investigation.methods.length > 0 ||
        brief.investigation.clues.length > 0 ||
        brief.investigation.techniques.length > 0) && (
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <p className="text-caption text-white/25 uppercase tracking-widest font-semibold mb-4">사건 요소</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {brief.investigation.motives.length > 0 && (
              <div>
                <p className="text-caption text-white/30 font-semibold mb-2">동기</p>
                <div className="flex flex-wrap gap-1.5">
                  {brief.investigation.motives.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-full text-caption bg-white/[0.06] text-white/60 border border-white/[0.08]">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {brief.investigation.methods.length > 0 && (
              <div>
                <p className="text-caption text-white/30 font-semibold mb-2">수법</p>
                <div className="flex flex-wrap gap-1.5">
                  {brief.investigation.methods.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-full text-caption bg-white/[0.06] text-white/60 border border-white/[0.08]">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {brief.investigation.clues.length > 0 && (
              <div>
                <p className="text-caption text-white/30 font-semibold mb-2">단서</p>
                <div className="flex flex-wrap gap-1.5">
                  {brief.investigation.clues.map((c) => (
                    <span key={c} className="px-2.5 py-1 rounded-full text-caption bg-white/[0.06] text-white/60 border border-white/[0.08]">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {brief.investigation.techniques.length > 0 && (
              <div>
                <p className="text-caption text-white/30 font-semibold mb-2">기법</p>
                <div className="flex flex-wrap gap-1.5">
                  {brief.investigation.techniques.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full text-caption bg-white/[0.06] text-white/60 border border-white/[0.08]">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  icon, title, message, actions,
}: {
  icon: string;
  title: string;
  message: string;
  actions: { label: string; onClick: () => void }[];
}) {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4 px-6">
      <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-title2">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-body font-semibold text-white/70 mb-1">{title}</p>
        <p className="text-subhead text-white/35 leading-relaxed max-w-xs">{message}</p>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="px-4 py-2 rounded-full border border-white/[0.12] text-subhead text-white/50 hover:border-white/25 hover:text-white/70 transition-all"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
