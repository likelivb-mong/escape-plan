import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { loadProjectById, loadProjectByIdFromSupabase, type SavedProject, type CompletionLevel } from '../utils/projectStorage';
import { MOCK_BRANCHES } from '../features/passmap/mock/branches';

// ── Stage definitions — mirrors escape room design pipeline ──────────────────

interface Stage {
  key: string;
  label: string;
  description: string;
  designerNote: string; // why this step matters
  path: string;
  requiredLevel: CompletionLevel | null;
  stepNumber: number;
  accentColor: string;
}

const STAGES: Stage[] = [
  {
    key: 'plan',
    label: '기획안',
    description: '테마 설계 기획서 작성 및 편집',
    designerNote: '장르·시놉시스·기승전반결 구조로 테마의 뼈대를 완성',
    path: '/plan',
    requiredLevel: null,
    stepNumber: 1,
    accentColor: 'indigo',
  },
  {
    key: 'story',
    label: '스토리 제안',
    description: 'AI 스토리 제안을 검토하고 선택',
    designerNote: '기승전반결 구조로 플레이어 감정 곡선을 설계',
    path: '/story',
    requiredLevel: null,
    stepNumber: 2,
    accentColor: 'sky',
  },
  {
    key: 'mandalart',
    label: '만다라트 보드',
    description: '사건 키워드를 만다라트 보드로 구조화',
    designerNote: '세계관의 핵심 요소를 시각적으로 펼쳐 빠짐없이 정리',
    path: '/mandalart',
    requiredLevel: null,
    stepNumber: 3,
    accentColor: 'amber',
  },
  {
    key: 'game-flow',
    label: '게임 플로우',
    description: '퍼즐 배치와 게임 흐름 설계',
    designerNote: '단서 발견 → 해석 → 연결의 자연스러운 흐름',
    path: '/game-flow',
    requiredLevel: null,
    stepNumber: 4,
    accentColor: 'violet',
  },
  {
    key: 'passmap',
    label: 'Pass Map',
    description: '공간 배치 · 운영 매뉴얼 · 스텝 상태 관리',
    designerNote: '플레이어 동선과 현장 운영 데이터를 통합 관리',
    path: '/setting',
    requiredLevel: null,
    stepNumber: 5,
    accentColor: 'emerald',
  },
];

const LEVEL_ORDER: CompletionLevel[] = ['brief', 'story', 'flow', 'draft'];

function isLevelReached(current: CompletionLevel, required: CompletionLevel): boolean {
  return LEVEL_ORDER.indexOf(current) >= LEVEL_ORDER.indexOf(required);
}

const LEVEL_CONFIG: Record<CompletionLevel, { label: string; color: string; bgColor: string }> = {
  brief:  { label: '기획 단계',    color: 'text-amber-400',   bgColor: 'bg-amber-400/10' },
  story:  { label: '스토리 완성',  color: 'text-sky-400',     bgColor: 'bg-sky-400/10' },
  flow:   { label: '플로우 설계',  color: 'text-violet-400',  bgColor: 'bg-violet-400/10' },
  draft:  { label: '기획안 완성',  color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
};

const GENRE_KR: Record<string, string> = {
  horror: '공포', mystery: '미스터리', adventure: '어드벤처',
  thriller: '스릴러', fantasy: '판타지', 'sci-fi': 'SF',
  romance: '로맨스', comedy: '코미디',
};

const ACCENT_CLASSES: Record<string, { border: string; text: string; bg: string; dot: string }> = {
  amber:   { border: 'border-white/[0.06]',   text: 'text-amber-400',   bg: 'bg-white/[0.03]',   dot: 'bg-amber-400' },
  sky:     { border: 'border-white/[0.06]',   text: 'text-sky-400',     bg: 'bg-white/[0.03]',   dot: 'bg-sky-400' },
  violet:  { border: 'border-white/[0.06]',   text: 'text-violet-400',  bg: 'bg-white/[0.03]',   dot: 'bg-violet-400' },
  rose:    { border: 'border-white/[0.06]',   text: 'text-rose-400',    bg: 'bg-white/[0.03]',   dot: 'bg-rose-400' },
  emerald: { border: 'border-white/[0.06]',   text: 'text-emerald-400', bg: 'bg-white/[0.03]',   dot: 'bg-emerald-400' },
  indigo:  { border: 'border-white/[0.06]',   text: 'text-indigo-400',  bg: 'bg-white/[0.03]',   dot: 'bg-indigo-400' },
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadProject } = useProject();
  const [project, setProject] = useState<SavedProject | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    const saved = loadProjectById(id);
    if (saved) {
      setProject(saved);
      loadProject(id);
      setLoaded(true);
      return;
    }
    // Not in localStorage — try Supabase
    loadProjectByIdFromSupabase(id).then((remote) => {
      if (!remote) {
        navigate('/projects');
        return;
      }
      setProject(remote);
      loadProject(id);
      setLoaded(true);
    });
  }, [id, navigate, loadProject]);

  if (!loaded || !project) {
    return (
      <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <p className="text-body text-white/40">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const levelCfg = LEVEL_CONFIG[project.completionLevel];
  const genres = (project.genres ?? []).map((g) => GENRE_KR[g] ?? g);
  const playTimes = (project.playTimes ?? []).join('/');
  const branchName = project.branchCode
    ? MOCK_BRANCHES.find((b) => b.code === project.branchCode)?.name
    : null;
  const progressPct = ((LEVEL_ORDER.indexOf(project.completionLevel) + 1) / LEVEL_ORDER.length) * 100;

  return (
    <div className="min-h-[calc(100vh-3rem)] px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto">

        {/* ── Project Header Card ── */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7 mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-title1 font-bold text-white/90 truncate">{project.name}</h1>
              </div>
              {project.storyTitle && (
                <p className="text-body text-white/40 truncate">{project.storyTitle}</p>
              )}
            </div>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${levelCfg.bgColor} ${levelCfg.color} text-caption font-semibold flex-shrink-0`}>
              {levelCfg.label}
            </span>
          </div>

          {project.synopsis && (
            <p className="text-subhead text-white/35 leading-relaxed mb-4 line-clamp-2">
              {project.synopsis}
            </p>
          )}

          {/* Meta tags + progress */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1.5">
              {branchName && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-caption text-white/50 font-medium">
                  {branchName}
                </span>
              )}
              {genres.map((g) => (
                <span key={g} className="px-2 py-0.5 rounded-md bg-white/[0.05] text-caption text-white/35 font-medium">
                  {g}
                </span>
              ))}
              {playTimes && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-caption text-white/35 font-medium">
                  {playTimes}분
                </span>
              )}
            </div>

            {/* Compact progress bar */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-caption text-white/25">{Math.round(progressPct)}%</span>
              <div className="w-20 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Design Pipeline Header ── */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-body font-semibold text-white/60 flex-shrink-0">테마 설계 파이프라인</h2>
          <div className="h-px flex-1 bg-white/[0.05]" />
          <span className="hidden sm:block text-caption text-white/20 flex-shrink-0">
            기획안 → 스토리 → 만다라트 → 게임 플로우 → Pass Map
          </span>
        </div>

        {/* ── Stage Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STAGES.map((stage) => {
            const available = !stage.requiredLevel || isLevelReached(project.completionLevel, stage.requiredLevel);
            const accent = ACCENT_CLASSES[stage.accentColor];

            return (
              <button
                key={stage.key}
                onClick={() => available && navigate(stage.path)}
                disabled={!available}
                className={`group text-left rounded-xl border p-4 transition-all duration-200 ${
                  available
                    ? `${accent.border} bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] cursor-pointer`
                    : 'border-white/[0.03] bg-white/[0.01] opacity-30 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      available ? `${accent.bg} ${accent.text}` : 'bg-white/[0.04] text-white/20'
                    }`}>
                      {stage.stepNumber}
                    </span>
                    <h3 className={`text-body font-semibold ${available ? 'text-white/80 group-hover:text-white' : 'text-white/25'}`}>
                      {stage.label}
                    </h3>
                  </div>
                  {available && (
                    <span className="text-white/15 group-hover:text-white/40 transition-colors text-caption">
                      →
                    </span>
                  )}
                </div>

                <p className={`text-caption mb-1.5 ${available ? 'text-white/35' : 'text-white/15'}`}>
                  {stage.description}
                </p>

                {available && (
                  <p className={`text-caption italic ${accent.text} opacity-50 group-hover:opacity-80 transition-opacity`}>
                    {stage.designerNote}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Designer tip ── */}
        <div className="mt-8 px-4 py-3 rounded-xl border border-white/[0.04] bg-white/[0.02]">
          <p className="text-caption text-white/20 leading-relaxed">
            <span className="text-white/35 font-medium">설계 원칙</span>
            <span className="mx-1.5 text-white/10">·</span>
            퍼즐은 "이 퍼즐이 왜 이 스토리에서 필요한가?"라는 질문에 답할 수 있어야 합니다.
            모든 퍼즐은 단서 발견, 사건 해석, 공간 탐색 중 하나의 역할을 가져야 합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
