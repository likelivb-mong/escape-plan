import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { loadProjectById, type SavedProject, type CompletionLevel } from '../utils/projectStorage';

// ── Stage definitions ─────────────────────────────────────────────────────────

interface Stage {
  key: string;
  label: string;
  description: string;
  path: string;
  requiredLevel: CompletionLevel | null; // null = always available
  icon: string;
}

const STAGES: Stage[] = [
  {
    key: 'mandalart',
    label: '만다라트 보드',
    description: '사건 키워드를 만다라트 보드로 구조화',
    path: '/mandalart',
    requiredLevel: null,
    icon: '🧩',
  },
  {
    key: 'story',
    label: '스토리 제안',
    description: 'AI 스토리 제안을 검토하고 선택',
    path: '/story',
    requiredLevel: null,
    icon: '📖',
  },
  {
    key: 'puzzle-flow',
    label: '퍼즐 플로우',
    description: '퍼즐 배치와 게임 흐름 설계',
    path: '/puzzle-flow',
    requiredLevel: 'story',
    icon: '🔀',
  },
  {
    key: 'puzzle-recommendations',
    label: '퍼즐 추천',
    description: 'AI 기반 퍼즐 추천 확인',
    path: '/puzzle-recommendations',
    requiredLevel: 'story',
    icon: '💡',
  },
  {
    key: 'floor-plan',
    label: '공간 배치도',
    description: '방 구조와 동선 설계',
    path: '/floor-plan',
    requiredLevel: 'flow',
    icon: '🗺️',
  },
  {
    key: 'draft',
    label: '드래프트',
    description: '최종 기획안 정리 및 내보내기',
    path: '/draft',
    requiredLevel: 'flow',
    icon: '📋',
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
  draft:  { label: '드래프트 완성', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
};

const GENRE_KR: Record<string, string> = {
  horror: '공포', mystery: '미스터리', adventure: '어드벤처',
  thriller: '스릴러', fantasy: '판타지', 'sci-fi': 'SF',
  romance: '로맨스', comedy: '코미디',
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
    if (!saved) {
      navigate('/projects');
      return;
    }
    setProject(saved);
    loadProject(id);
    setLoaded(true);
  }, [id, navigate, loadProject]);

  if (!loaded || !project) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-body text-white/40">프로젝트를 불러오는 중...</p>
      </div>
    );
  }

  const levelCfg = LEVEL_CONFIG[project.completionLevel];
  const genres = (project.genres ?? []).map((g) => GENRE_KR[g] ?? g);
  const playTimes = (project.playTimes ?? []).join('/');

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate('/projects')}
          className="text-subhead text-white/40 hover:text-white/70 transition-colors mb-8 inline-flex items-center gap-1.5"
        >
          ← 내 프로젝트
        </button>

        {/* Project Header */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 sm:p-8 mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-title1 font-bold text-white/90 mb-1">{project.name}</h1>
              {project.storyTitle && (
                <p className="text-body text-white/45">{project.storyTitle}</p>
              )}
            </div>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${levelCfg.bgColor} ${levelCfg.color} text-subhead font-medium`}>
              {levelCfg.label}
            </span>
          </div>

          {/* Synopsis */}
          {project.synopsis && (
            <p className="text-body text-white/50 leading-relaxed mb-4">
              {project.synopsis}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <span key={g} className="px-2.5 py-1 rounded-full bg-white/[0.06] text-caption text-white/40">
                {g}
              </span>
            ))}
            {playTimes && (
              <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-caption text-white/40">
                {playTimes}분
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-title3 font-semibold text-white/80">진행 단계</h2>
          </div>
          <div className="flex gap-1">
            {LEVEL_ORDER.map((level) => {
              const reached = isLevelReached(project.completionLevel, level);
              const cfg = LEVEL_CONFIG[level];
              return (
                <div key={level} className="flex-1 flex flex-col gap-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      reached ? cfg.bgColor.replace('/10', '/50') : 'bg-white/[0.06]'
                    }`}
                  />
                  <span className={`text-caption ${reached ? cfg.color : 'text-white/20'}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage cards */}
        <div>
          <h2 className="text-title3 font-semibold text-white/80 mb-4">작업 단계</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STAGES.map((stage) => {
              const available = !stage.requiredLevel || isLevelReached(project.completionLevel, stage.requiredLevel);

              return (
                <button
                  key={stage.key}
                  onClick={() => available && navigate(stage.path)}
                  disabled={!available}
                  className={`group text-left rounded-xl border p-4 transition-all duration-200 ${
                    available
                      ? 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] cursor-pointer'
                      : 'border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">{stage.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-body font-semibold mb-0.5 ${available ? 'text-white/80 group-hover:text-white' : 'text-white/30'}`}>
                        {stage.label}
                      </h3>
                      <p className={`text-footnote ${available ? 'text-white/40' : 'text-white/15'}`}>
                        {stage.description}
                      </p>
                    </div>
                    {available && (
                      <span className="text-white/20 group-hover:text-white/50 transition-colors mt-1 text-body">
                        →
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
