import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ThemeList from '../components/ThemeList';
import ImportAIThemeButton from '../components/ImportAIThemeButton';
import { MOCK_BRANCHES } from '../mock/branches';
import { getThemesByBranch } from '../utils/passmap-store';

export default function PassMapBranchPage() {
  const { branchCode } = useParams<{ branchCode: string }>();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const branch = MOCK_BRANCHES.find((b) => b.code === branchCode);

  if (!branch) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-white/40 text-center py-20">
          지점을 찾을 수 없습니다.
          <button
            onClick={() => navigate('/passmap')}
            className="block mx-auto mt-4 text-white/50 hover:text-white/70 transition-colors"
          >
            ← 지점 목록으로
          </button>
        </div>
      </div>
    );
  }

  // Re-read from store on every render / refreshKey change
  const themes = getThemesByBranch(branch.code);
  void refreshKey; // used to force re-render

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <button
          onClick={() => navigate('/passmap')}
          className="text-white/20 hover:text-white/50 text-caption mb-4 inline-block transition-colors"
        >
          ← 지점 목록
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title1 text-white/90 font-bold tracking-tight">{branch.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-caption text-white/20 font-mono">{branch.code}</span>
              <span className="text-caption text-white/30">{themes.length}개 테마</span>
            </div>
          </div>
          <ImportAIThemeButton
            branchCode={branch.code}
            onImported={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </div>

      {/* Theme List */}
      {themes.length > 0 ? (
        <ThemeList themes={themes} branchCode={branch.code} />
      ) : (
        <div className="text-white/30 text-center py-12 border border-white/[0.06] rounded-xl bg-white/[0.02]">
          등록된 테마가 없습니다. AI Flow JSON을 Import 해보세요.
        </div>
      )}
    </div>
  );
}
