import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlayTime, Genre, InvestigationSelection } from '../types';
import { useProject } from '../context/ProjectContext';
import { analyzeYoutube } from '../services/aiAnalysis';
import { createInitialCells } from '../data/mockMandalart';
import InvestigationPicker from '../components/home/InvestigationPicker';
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

// ── 미리보기 상태 타입 ────────────────────────────────────────────────────────

interface VideoPreview {
  videoId: string;
  title: string | null;
  channel: string | null;
  metaLoading: boolean;
}

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

type TabKey = 'youtube' | 'manual' | 'scenario';

export default function HomePage() {
  const navigate = useNavigate();
  const { setProjectName: setCtxProjectName, setCells, setAiStoryProposals, setProjectBrief } = useProject();

  // Tab
  const [activeTab, setActiveTab] = useState<TabKey>('youtube');

  // ── YouTube tab state ──────────────────────────────────────────────────────
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeStep, setYoutubeStep] = useState<string>('');
  const [youtubeError, setYoutubeError] = useState<string>('');
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

  // ── Manual tab state ───────────────────────────────────────────────────────
  const [projectName, setProjectName] = useState('');
  const [playTimes, setPlayTimes] = useState<PlayTime[]>([60]);
  const [genres, setGenres] = useState<Genre[]>(['mystery']);
  const [synopsis, setSynopsis] = useState('');
  const [beats, setBeats] = useState<Record<string, string>>({
    '기': '', '승': '', '전': '', '반전': '', '결': '',
  });
  const [investigation, setInvestigation] = useState<InvestigationSelection>({
    motives: [], methods: [], clues: [], techniques: [],
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleYoutubeGenerate = async () => {
    const url = youtubeUrl.trim();
    if (!url) return;
    setYoutubeLoading(true);
    setYoutubeError('');
    try {
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
      navigate('/story');
    } catch (err) {
      setYoutubeError(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setYoutubeLoading(false);
      setYoutubeStep('');
    }
  };

  const togglePlayTime = (t: PlayTime) => {
    setPlayTimes((prev) =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter((v) => v !== t) : prev) : [...prev, t],
    );
  };

  const toggleGenre = (g: Genre) => {
    setGenres((prev) =>
      prev.includes(g) ? (prev.length > 1 ? prev.filter((v) => v !== g) : prev) : [...prev, g],
    );
  };

  const handleNewProject = () => {
    const name = projectName.trim();
    if (!name) return;
    setCtxProjectName(name);
    const freshCells = createInitialCells();
    setCells(freshCells.map((c) => (c.isCenter ? { ...c, text: name } : c)));
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
      investigation,
    });
    navigate('/story');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start px-6 py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/30 mb-3">
          XCAPE Internal Tool
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">
          방탈출 테마 기획 AI
        </h1>
        <p className="text-white/40 text-sm leading-relaxed">
          YouTube 영상, 직접 입력 또는 사건 구성으로 새 테마를 시작하세요
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-white/10">
          <TabButton active={activeTab === 'youtube'} onClick={() => setActiveTab('youtube')}>
            YouTube로 시작
          </TabButton>
          <TabButton active={activeTab === 'manual'} onClick={() => setActiveTab('manual')}>
            새 프로젝트 생성
          </TabButton>
          <TabButton active={activeTab === 'scenario'} onClick={() => setActiveTab('scenario')}>
            사건 구성
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
          ) : activeTab === 'manual' ? (
            <ManualTab
              projectName={projectName}
              setProjectName={setProjectName}
              playTimes={playTimes}
              togglePlayTime={togglePlayTime}
              genres={genres}
              toggleGenre={toggleGenre}
              investigation={investigation}
              setInvestigation={setInvestigation}
              synopsis={synopsis}
              setSynopsis={setSynopsis}
              beats={beats}
              setBeats={setBeats}
              onSubmit={handleNewProject}
            />
          ) : (
            <ScenarioEntryTab onStart={() => navigate('/scenario')} />
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
      className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 ${
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
      <label className="text-xs text-white/40 font-medium tracking-wide uppercase">
        YouTube URL
      </label>
      <input
        type="url"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        placeholder="https://youtube.com/watch?v=..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-200"
      />

      {/* Preview */}
      {preview && (
        <div className="flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 animate-[fadeIn_0.2s_ease]">
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
                <p className="text-[12px] font-medium text-white/80 leading-snug line-clamp-2 mb-1">
                  {preview.title ?? '제목을 불러올 수 없습니다'}
                </p>
                {preview.channel && (
                  <p className="text-[10px] text-white/35 truncate">{preview.channel}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={!youtubeUrl.trim() || youtubeLoading}
        className="mt-2 w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        <p className="text-[11px] text-white/30 text-center animate-pulse">{youtubeStep}</p>
      )}
      {youtubeError && (
        <p className="text-[11px] text-red-400/70 leading-relaxed bg-red-500/[0.06] border border-red-500/20 rounded-lg px-3 py-2">
          {youtubeError}
        </p>
      )}
    </div>
  );
}

// ── Manual Tab ──────────────────────────────────────────────────────────────

interface ManualTabProps {
  projectName: string;
  setProjectName: (v: string) => void;
  playTimes: PlayTime[];
  togglePlayTime: (t: PlayTime) => void;
  genres: Genre[];
  toggleGenre: (g: Genre) => void;
  investigation: InvestigationSelection;
  setInvestigation: (sel: InvestigationSelection) => void;
  synopsis: string;
  setSynopsis: (v: string) => void;
  beats: Record<string, string>;
  setBeats: (b: Record<string, string>) => void;
  onSubmit: () => void;
}

function ManualTab({
  projectName, setProjectName,
  playTimes, togglePlayTime,
  genres, toggleGenre,
  investigation, setInvestigation,
  synopsis, setSynopsis,
  beats, setBeats,
  onSubmit,
}: ManualTabProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Project name */}
      <Field label="프로젝트 이름">
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="테마 이름을 입력하세요"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-200"
        />
      </Field>

      {/* Play time (multi-select) */}
      <Field label="플레이 시간">
        <div className="flex gap-2">
          {PLAY_TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => togglePlayTime(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                playTimes.includes(t)
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white/60'
              }`}
            >
              {t}m
            </button>
          ))}
        </div>
      </Field>

      {/* Genre (multi-select) */}
      <Field label="장르">
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => toggleGenre(g.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                genres.includes(g.value)
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white/40 border-white/10 hover:border-white/30 hover:text-white/60'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Investigation picker */}
      <Field label="수사 키워드 조합">
        <InvestigationPicker selection={investigation} onChange={setInvestigation} />
      </Field>

      {/* Synopsis */}
      <Field label="스토리 핵심 흐름">
        <textarea
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          placeholder="생성하려는 스토리의 핵심 주제와 방향을 입력하세요"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-200 resize-none"
        />
      </Field>

      {/* Story beats */}
      <Field label="기승전반결">
        <StoryBeatsInput beats={beats} onChange={setBeats} />
      </Field>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!projectName.trim()}
        className="mt-1 w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        프로젝트 생성
      </button>
    </div>
  );
}

// ── Scenario Entry Tab ──────────────────────────────────────────────────────

function ScenarioEntryTab({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col gap-5 items-center py-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/[0.08] border border-amber-400/20 flex items-center justify-center">
        <span className="text-2xl">🔍</span>
      </div>
      <div className="text-center max-w-sm">
        <h3 className="text-sm font-semibold text-white/80 mb-2">사건 구성으로 시작</h3>
        <p className="text-[12px] text-white/35 leading-relaxed">
          가해자, 피해자, 범행 동기, 수사 단서 등 사건 요소를 조합하여
          방탈출 시나리오를 구성하고 스토리를 생성합니다.
        </p>
      </div>
      <button
        onClick={onStart}
        className="mt-1 w-full max-w-xs py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-white text-black hover:bg-white/90"
      >
        사건 구성 시작
      </button>
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-white/40 font-medium tracking-wide uppercase block mb-1.5">
        {label}
      </label>
      {children}
    </div>
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
