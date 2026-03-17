import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import type { Genre, PlayTime, PuzzleType, ClueFormat } from '../types';
import { analyzeYoutube } from '../services/aiAnalysis';
import { fetchYouTubeMetadata } from '../utils/youtubeMetadata';

const GENRES: { label: string; value: Genre }[] = [
  { label: '공포', value: 'horror' },
  { label: '미스터리', value: 'mystery' },
  { label: '어드벤처', value: 'adventure' },
  { label: '스릴러', value: 'thriller' },
  { label: '판타지', value: 'fantasy' },
  { label: 'SF', value: 'sci-fi' },
  { label: '로맨스', value: 'romance' },
  { label: '코미디', value: 'comedy' },
];

const PLAY_TIMES: PlayTime[] = [60, 70, 80, 90];
const PUZZLE_TYPES: PuzzleType[] = ['추리', '관찰', '수리', '협동', '활동', '오감'];
const CLUE_FORMATS: ClueFormat[] = ['평면', '입체', '공간', '감각'];
const BEAT_LABELS: ('기' | '승' | '전' | '반전' | '결')[] = ['기', '승', '전', '반전', '결'];

interface VideoPreview {
  videoId: string;
  title: string | null;
  channel: string | null;
  metaLoading: boolean;
}

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

export default function ThemeDesignPage() {
  const navigate = useNavigate();
  const { projectName, setProjectName, setProjectBrief, setCells, setAiStoryProposals, saveCurrentProject } = useProject();

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeStep, setYoutubeStep] = useState('');
  const [youtubeProgress, setYoutubeProgress] = useState(0);
  const [youtubeError, setYoutubeError] = useState('');
  const [youtubeAnalysisResult, setYoutubeAnalysisResult] = useState<any>(null);
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [synopsis, setSynopsis] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedPlayTimes, setSelectedPlayTimes] = useState<PlayTime[]>([]);
  const [selectedPuzzleTypes, setSelectedPuzzleTypes] = useState<PuzzleType[]>([]);
  const [selectedClueFormats, setSelectedClueFormats] = useState<ClueFormat[]>([]);
  const [beats, setBeats] = useState<Record<string, string>>({
    '기': '', '승': '', '전': '', '반전': '', '결': '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Progress tracking
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
      // 자동으로 분석 결과를 폼에 반영
      setProjectName(result.projectName || projectName);
      setSynopsis(result.videoSynopsis || '');
      // 기승전결 자동 입력
      const beatsMap: Record<string, string> = { '기': '', '승': '', '전': '', '반전': '', '결': '' };
      result.videoBeats?.forEach((beat: any) => {
        beatsMap[beat.label] = beat.description;
      });
      setBeats(beatsMap);
    } catch (err) {
      setYoutubeError(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setYoutubeLoading(false);
      setYoutubeStep('');
    }
  };

  const handleGenreToggle = (genre: Genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handlePlayTimeToggle = (time: PlayTime) => {
    setSelectedPlayTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handlePuzzleTypeToggle = (type: PuzzleType) => {
    setSelectedPuzzleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClueFormatToggle = (format: ClueFormat) => {
    setSelectedClueFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  };

  const handleBeatChange = (label: string, value: string) => {
    setBeats((prev) => ({ ...prev, [label]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('테마 이름을 입력해주세요');
      return;
    }
    if (selectedGenres.length === 0) {
      alert('장르를 선택해주세요');
      return;
    }
    if (selectedPlayTimes.length === 0) {
      alert('플레이 시간을 선택해주세요');
      return;
    }

    setSaving(true);
    try {
      const videoId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;
      setProjectBrief({
        source: youtubeAnalysisResult ? 'youtube' : 'manual',
        videoId,
        videoTitle: youtubeAnalysisResult?.videoTitle || (preview?.title ?? null),
        videoChannel: youtubeAnalysisResult?.channelName || (preview?.channel ?? null),
        synopsis,
        beats: BEAT_LABELS
          .filter((l) => beats[l]?.trim())
          .map((l) => ({ label: l, description: beats[l].trim() })),
        genres: selectedGenres,
        playTimes: selectedPlayTimes,
        investigation: { motives: [], methods: [], clues: [], techniques: [] },
        puzzleTypes: selectedPuzzleTypes.length > 0 ? selectedPuzzleTypes : undefined,
        clueFormats: selectedClueFormats.length > 0 ? selectedClueFormats : undefined,
      });

      if (youtubeAnalysisResult) {
        setCells(youtubeAnalysisResult.cells);
        setAiStoryProposals(youtubeAnalysisResult.stories);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      saveCurrentProject('plan');
      setSaved(true);
      setTimeout(() => navigate('/plan'), 800);
    } catch (error) {
      console.error('Failed to save theme design:', error);
      alert('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-title1 font-bold text-white/90 mb-2">테마 설계</h1>
          <p className="text-body text-white/40">
            YouTube 영상 또는 직접 입력으로 방탈출 테마를 설계하세요.
            자동으로 분석되거나 편집 가능합니다.
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Theme Name */}
          <div>
            <label className="block text-body font-semibold text-white/70 mb-2">
              테마 이름 *
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="예: 비밀의 도서관, 유령 저택 탐사..."
              className="w-full px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white placeholder-white/20 focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04] transition-colors"
            />
          </div>

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

            {youtubeAnalysisResult && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-caption text-emerald-300/80">
                  ✓ 영상 분석 완료! 아래 필드가 자동으로 채워졌습니다.
                </p>
              </div>
            )}
          </div>

          {/* Synopsis */}
          <div>
            <label className="block text-body font-semibold text-white/70 mb-2">
              테마 배경 설정 (시놉시스)
            </label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="테마의 배경, 시대, 상황, 플레이어의 역할 등을 설명하세요."
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white placeholder-white/20 focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04] transition-colors resize-none"
            />
          </div>

          {/* 기본정보 */}
          <div>
            <h3 className="text-body font-semibold text-white/70 mb-3">기본정보</h3>

            {/* Genres */}
            <div className="mb-4">
              <label className="block text-subhead font-medium text-white/50 mb-2">
                장르 선택 (다중 선택 가능) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GENRES.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleGenreToggle(value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedGenres.includes(value)
                        ? 'border-violet-400 bg-violet-400/10 text-violet-300'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:border-white/[0.12] hover:bg-white/[0.04]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Play Times */}
            <div>
              <label className="block text-subhead font-medium text-white/50 mb-2">
                플레이 시간 (다중 선택 가능) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLAY_TIMES.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handlePlayTimeToggle(time)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedPlayTimes.includes(time)
                        ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:border-white/[0.12] hover:bg-white/[0.04]'
                    }`}
                  >
                    {time}분
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 문제 유형 */}
          <div>
            <h3 className="text-body font-semibold text-white/70 mb-3">문제 유형 (선택사항)</h3>

            <div className="mb-4">
              <label className="block text-subhead font-medium text-white/50 mb-2">
                문제 유형
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PUZZLE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handlePuzzleTypeToggle(type)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedPuzzleTypes.includes(type)
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:border-white/[0.12] hover:bg-white/[0.04]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-subhead font-medium text-white/50 mb-2">
                힌트 포맷
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CLUE_FORMATS.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => handleClueFormatToggle(format)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedClueFormats.includes(format)
                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/60 hover:border-white/[0.12] hover:bg-white/[0.04]'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 스토리 흐름 (기승전반결) */}
          <div>
            <h3 className="text-body font-semibold text-white/70 mb-3">스토리 흐름 (선택사항)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {BEAT_LABELS.map((label) => (
                <div key={label}>
                  <p className="text-caption font-bold text-white/30 mb-1">{label}</p>
                  <textarea
                    value={beats[label] ?? ''}
                    onChange={(e) => handleBeatChange(label, e.target.value)}
                    rows={3}
                    placeholder={`${label} 단계...`}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-footnote text-white placeholder:text-white/15 outline-none focus:border-white/[0.20] transition-all resize-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saved ? '✓ 저장됨' : saving ? '저장 중...' : '테마 설계 저장 → Plan'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-lg border border-white/[0.10] text-white/60 hover:text-white/80 font-semibold transition-all"
            >
              취소
            </button>
          </div>
        </form>

        {/* ── Design Principles ── */}
        <div className="mt-10 px-4 py-4 rounded-xl border border-white/[0.04] bg-white/[0.02]">
          <p className="text-caption text-white/20 leading-relaxed">
            <span className="text-white/35 font-medium">설계 원칙</span>
            <span className="mx-1.5 text-white/10">·</span>
            YouTube 영상을 분석하면 자동으로 기본 정보가 채워집니다.
            필요에 따라 편집하세요. 모든 데이터는 자동으로 Plan 페이지에 반영됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
