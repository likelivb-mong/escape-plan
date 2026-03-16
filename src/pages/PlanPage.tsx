import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { buildDraftDocument, calcDraftStatus } from '../utils/draft';
import type { ProjectBrief, Genre, PlayTime } from '../types';

import DraftHeader from '../components/draft/DraftHeader';
import DraftOverviewSection from '../components/draft/DraftOverviewSection';
import DraftConceptSummary from '../components/draft/DraftConceptSummary';
import DraftStorySection from '../components/draft/DraftStorySection';
import DraftFlowSection from '../components/draft/DraftFlowSection';
import DraftPuzzleSection from '../components/draft/DraftPuzzleSection';
import DraftSidebar from '../components/draft/DraftSidebar';
import DraftDocumentActions from '../components/draft/DraftDocumentActions';
import DraftGameFlowSection from '../components/draft/DraftGameFlowSection';

const GENRE_LABELS: Record<string, string> = {
  horror: '공포', mystery: '미스터리', adventure: '어드벤처', thriller: '스릴러',
  fantasy: '판타지', 'sci-fi': 'SF', romance: '로맨스', comedy: '코미디',
};
const ALL_GENRES: Genre[] = ['horror', 'mystery', 'adventure', 'thriller', 'fantasy', 'sci-fi', 'romance', 'comedy'];
const ALL_PLAY_TIMES: PlayTime[] = [60, 70, 80, 90];
const BEAT_LABELS: ('기' | '승' | '전' | '반전' | '결')[] = ['기', '승', '전', '반전', '결'];

export default function PlanPage() {
  const navigate = useNavigate();
  const {
    projectName, setProjectName,
    cells,
    selectedStory,
    puzzleFlowPlan,
    puzzleRecommendationGroups,
    gameFlowDesign,
    setGameFlowDesign,
    projectBrief, setProjectBrief,
    branchCode,
    saveCurrentProject,
  } = useProject();

  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Local edit state (draft while editing) ─────────────────────────────────
  const [editName, setEditName]       = useState(projectName);
  const [editSynopsis, setEditSynopsis] = useState(projectBrief?.synopsis ?? '');
  const [editGenres, setEditGenres]   = useState<Genre[]>(projectBrief?.genres ?? []);
  const [editTimes, setEditTimes]     = useState<PlayTime[]>(projectBrief?.playTimes ?? [60]);
  const [editBeats, setEditBeats]     = useState<Record<string, string>>(() => {
    const map: Record<string, string> = { '기': '', '승': '', '전': '', '반전': '', '결': '' };
    projectBrief?.beats.forEach((b) => { map[b.label] = b.description; });
    return map;
  });

  const startEdit = () => {
    setEditName(projectName);
    setEditSynopsis(projectBrief?.synopsis ?? '');
    setEditGenres(projectBrief?.genres ?? []);
    setEditTimes(projectBrief?.playTimes ?? [60]);
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

  // ── Build draft document ────────────────────────────────────────────────────
  const doc = useMemo(() => {
    if (!selectedStory || !puzzleFlowPlan) return null;
    return buildDraftDocument({
      projectName,
      cells,
      story: selectedStory,
      puzzleFlowPlan,
      puzzleRecommendationGroups,
    });
  }, [projectName, cells, selectedStory, puzzleFlowPlan, puzzleRecommendationGroups]);

  const status = doc ? calcDraftStatus(doc) : null;

  // ── Empty state ─────────────────────────────────────────────────────────────
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

  // ── Shared header ───────────────────────────────────────────────────────────
  const header = (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.07] flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/')}
          className="text-white/30 hover:text-white/60 transition-colors text-subhead"
        >
          ← 홈
        </button>
        <span className="h-3.5 w-px bg-white/10" />
        <h1 className="text-body font-semibold text-white/85">{projectName}</h1>
        <span className="h-3.5 w-px bg-white/10" />
        <span className="text-footnote text-white/35 font-medium tracking-wide">Plan</span>
      </div>
      <div className="flex items-center gap-2">
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
          {saved ? '✓ 저장됨' : isEditing ? '저장' : '저장'}
        </button>
        <button
          onClick={() => navigate('/story')}
          className="px-4 py-1.5 rounded-lg bg-white text-black text-footnote font-semibold hover:bg-white/90 transition-colors"
        >
          Story →
        </button>
      </div>
    </div>
  );

  // ── Edit mode ───────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {header}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-2xl space-y-6">
            <p className="text-caption text-white/25 uppercase tracking-widest">테마 설계 편집</p>

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
                        ? 'bg-white text-black border-white'
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
                        ? 'bg-white text-black border-white'
                        : 'text-white/40 border-white/10 hover:border-white/25 hover:text-white/60'
                    }`}
                  >
                    {t}분
                  </button>
                ))}
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

            {/* 기승전반결 */}
            <div>
              <label className="text-subhead text-white/40 font-medium uppercase tracking-wide block mb-2">기승전반결</label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {BEAT_LABELS.map((label) => (
                  <div key={label}>
                    <p className="text-caption font-bold text-white/30 mb-1">{label}</p>
                    <textarea
                      value={editBeats[label] ?? ''}
                      onChange={(e) => setEditBeats((prev) => ({ ...prev, [label]: e.target.value }))}
                      rows={4}
                      placeholder={`${label} 단계...`}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-footnote text-white placeholder:text-white/15 outline-none focus:border-white/20 transition-all resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl bg-white text-black text-body font-semibold hover:bg-white/90 transition-colors"
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

  // ── Story 미선택 상태 ─────────────────────────────────────────────────────────
  if (!selectedStory) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {header}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-3xl">
            {projectBrief && <ThemeBriefSection brief={projectBrief} branchCode={branchCode} />}
            <NextStepBanner
              message="스토리를 생성하고 선택하면 기획서가 이어서 채워집니다."
              buttonLabel="Story 생성 →"
              onClick={() => navigate('/story')}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Story 선택 완료, GameFlow 미완성 ─────────────────────────────────────────
  if (!puzzleFlowPlan && !gameFlowDesign) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {header}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-3xl">
            {projectBrief && <ThemeBriefSection brief={projectBrief} branchCode={branchCode} />}
            <SelectedStorySection story={selectedStory} />
            <NextStepBanner
              message="만다라트를 완성하면 기획서가 이어서 채워집니다."
              buttonLabel="만다라트 편집 →"
              onClick={() => navigate('/mandalart')}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Story 선택 완료, GameFlow 있음, PuzzleFlow 미완성 ────────────────────────
  if (!doc || !status) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {header}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-3xl">
            {projectBrief && <ThemeBriefSection brief={projectBrief} branchCode={branchCode} />}
            {selectedStory && <SelectedStorySection story={selectedStory} />}
            {gameFlowDesign && (
              <DraftGameFlowSection
                plan={gameFlowDesign}
                onUpdatePlan={setGameFlowDesign}
              />
            )}
            <NextStepBanner
              message="Setting에서 룸 구성을 완성하면 기획서가 마무리됩니다."
              buttonLabel="Setting →"
              onClick={() => navigate('/setting')}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── 전체 완성 상태 ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {header}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-3xl">
            {projectBrief && <ThemeBriefSection brief={projectBrief} branchCode={branchCode} compact />}
            <DraftOverviewSection doc={doc} />
            <DraftConceptSummary doc={doc} />
            <DraftStorySection doc={doc} />
            <DraftFlowSection doc={doc} />
            <DraftPuzzleSection doc={doc} />
            {gameFlowDesign && (
              <DraftGameFlowSection
                plan={gameFlowDesign}
                onUpdatePlan={setGameFlowDesign}
              />
            )}
            <div className="mt-6 mb-8 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.05]" />
              <span className="text-micro font-bold uppercase tracking-widest text-white/15">
                XCAPE Internal · Theme Draft
              </span>
              <div className="h-px flex-1 bg-white/[0.05]" />
            </div>
          </div>
        </div>
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col overflow-hidden">
          <DraftSidebar doc={doc} status={status} />
        </div>
      </div>
      <DraftDocumentActions doc={doc} />
    </div>
  );
}

// ── 테마 설계 요약 섹션 ──────────────────────────────────────────────────────────

function ThemeBriefSection({
  brief,
  branchCode,
  compact = false,
}: {
  brief: ProjectBrief;
  branchCode: string | null;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="mb-6 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <p className="text-caption text-white/25 uppercase tracking-widest mb-2">테마 설계</p>
        <div className="flex flex-wrap gap-1.5">
          {brief.genres.map((g) => (
            <span key={g} className="px-2 py-0.5 rounded-full text-caption bg-white/[0.06] text-white/50">
              {GENRE_LABELS[g] ?? g}
            </span>
          ))}
          {brief.playTimes.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full text-caption bg-white/[0.06] text-white/50">
              {t}분
            </span>
          ))}
          {branchCode && (
            <span className="px-2 py-0.5 rounded-full text-caption bg-white/[0.06] text-white/50 font-mono">
              {branchCode}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <p className="text-caption text-white/25 uppercase tracking-widest mb-4">테마 설계 기획서</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {brief.genres.map((g) => (
          <span key={g} className="px-2.5 py-1 rounded-full text-subhead bg-white/[0.06] text-white/55 border border-white/[0.06]">
            {GENRE_LABELS[g] ?? g}
          </span>
        ))}
        {brief.playTimes.map((t) => (
          <span key={t} className="px-2.5 py-1 rounded-full text-subhead bg-white/[0.06] text-white/55 border border-white/[0.06]">
            {t}분
          </span>
        ))}
        {branchCode && (
          <span className="px-2.5 py-1 rounded-full text-subhead bg-white/[0.06] text-white/55 border border-white/[0.06] font-mono">
            {branchCode}
          </span>
        )}
        {brief.source === 'youtube' && brief.videoTitle && (
          <span className="px-2.5 py-1 rounded-full text-subhead bg-white/[0.06] text-white/55 border border-white/[0.06]">
            📺 {brief.videoTitle}
          </span>
        )}
      </div>
      {brief.synopsis && (
        <div className="mb-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <p className="text-caption text-white/25 uppercase tracking-widest mb-2">시놉시스</p>
          <p className="text-body text-white/65 leading-relaxed">{brief.synopsis}</p>
        </div>
      )}
      {brief.beats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {brief.beats.map((beat) => (
            <div key={beat.label} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <p className="text-caption font-bold text-white/30 mb-1">{beat.label}</p>
              <p className="text-footnote text-white/55 leading-relaxed line-clamp-4">{beat.description}</p>
            </div>
          ))}
        </div>
      )}
      {(brief.investigation.motives.length > 0 ||
        brief.investigation.methods.length > 0 ||
        brief.investigation.clues.length > 0) && (
        <div className="mt-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <p className="text-caption text-white/25 uppercase tracking-widest mb-3">사건 요소</p>
          <div className="grid grid-cols-2 gap-3">
            {brief.investigation.motives.length > 0 && (
              <div>
                <p className="text-caption text-white/25 mb-1">동기</p>
                <div className="flex flex-wrap gap-1">
                  {brief.investigation.motives.map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded text-caption bg-white/[0.04] text-white/45">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {brief.investigation.methods.length > 0 && (
              <div>
                <p className="text-caption text-white/25 mb-1">수법</p>
                <div className="flex flex-wrap gap-1">
                  {brief.investigation.methods.map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded text-caption bg-white/[0.04] text-white/45">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {brief.investigation.clues.length > 0 && (
              <div>
                <p className="text-caption text-white/25 mb-1">단서</p>
                <div className="flex flex-wrap gap-1">
                  {brief.investigation.clues.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded text-caption bg-white/[0.04] text-white/45">{c}</span>
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

// ── 선택된 스토리 섹션 ────────────────────────────────────────────────────────────

function SelectedStorySection({ story }: { story: import('../types/story').StoryProposal }) {
  return (
    <div className="mb-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03]">
      <p className="text-caption text-emerald-400/50 uppercase tracking-widest mb-2">선택된 스토리</p>
      <p className="text-body font-semibold text-white/80 mb-1">{story.title}</p>
      <p className="text-subhead text-white/45 leading-relaxed mb-3">{story.logline}</p>
      {story.beats && story.beats.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5">
          {story.beats.map((beat) => (
            <div key={beat.label} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <p className="text-caption font-bold text-white/25 mb-0.5">{beat.label}</p>
              <p className="text-[10px] text-white/45 leading-snug line-clamp-3">{beat.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 다음 단계 안내 배너 ──────────────────────────────────────────────────────────

function NextStepBanner({
  message, buttonLabel, onClick,
}: {
  message: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <p className="text-subhead text-white/40 leading-relaxed">{message}</p>
      <button
        onClick={onClick}
        className="flex-shrink-0 px-4 py-2 rounded-lg bg-white text-black text-subhead font-semibold hover:bg-white/90 transition-colors"
      >
        {buttonLabel}
      </button>
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
