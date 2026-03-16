import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import type { Genre, PlayTime } from '../types';

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

export default function ThemeDesignPage() {
  const navigate = useNavigate();
  const { projectName, setProjectName, setProjectBrief } = useProject();

  const [synopsis, setSynopsis] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedPlayTimes, setSelectedPlayTimes] = useState<PlayTime[]>([]);
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !synopsis.trim() || selectedGenres.length === 0 || selectedPlayTimes.length === 0) {
      alert('모든 필드를 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      // Save theme design to ProjectBrief
      setProjectBrief({
        source: 'manual',
        videoId: null,
        videoTitle: null,
        videoChannel: null,
        synopsis,
        beats: [],
        genres: selectedGenres,
        playTimes: selectedPlayTimes,
        investigation: { motives: [], methods: [], clues: [], techniques: [] },
      });

      // Navigate to story page
      navigate('/story');
    } catch (error) {
      console.error('Failed to save theme design:', error);
      alert('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      <div className="max-w-2xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-title1 font-bold text-white/90 mb-2">테마 설계</h1>
          <p className="text-body text-white/40">
            방탈출 테마의 기본 정보를 입력하세요. 이것이 모든 설계의 토대가 됩니다.
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

          {/* Synopsis */}
          <div>
            <label className="block text-body font-semibold text-white/70 mb-2">
              테마 배경 설정 (시놉시스) *
            </label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="테마의 배경, 시대, 상황, 플레이어의 역할 등을 설명하세요."
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white placeholder-white/20 focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04] transition-colors resize-none"
            />
          </div>

          {/* Genres */}
          <div>
            <label className="block text-body font-semibold text-white/70 mb-3">
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
            <label className="block text-body font-semibold text-white/70 mb-3">
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

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? '저장 중...' : '테마 설계 저장 → 스토리 단계로'}
            </button>
          </div>
        </form>

        {/* ── Design Principles ── */}
        <div className="mt-10 px-4 py-4 rounded-xl border border-white/[0.04] bg-white/[0.02]">
          <p className="text-caption text-white/20 leading-relaxed">
            <span className="text-white/35 font-medium">설계 원칙</span>
            <span className="mx-1.5 text-white/10">·</span>
            좋은 테마는 명확한 배경 설정(worldbuilding)에서 시작됩니다.
            플레이어가 들어갈 세계관, 그들의 역할, 주어진 제약들을 명확히 정의하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
