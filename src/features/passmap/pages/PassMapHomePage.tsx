import { useNavigate } from 'react-router-dom';
import BranchSelector from '../components/BranchSelector';
import { MOCK_BRANCHES } from '../mock/branches';

export default function PassMapHomePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-white/30 hover:text-white/60 text-sm mb-4 inline-block transition-colors"
        >
          ← Home
        </button>
        <h1 className="text-display text-white font-bold">PassMap Manager</h1>
        <p className="text-body text-white/50 mt-2">
          지점을 선택하여 테마별 MAP, FLOW, EDITOR를 관리합니다.
        </p>
      </div>

      {/* Branch Grid */}
      <div className="mb-6">
        <h2 className="text-title3 text-white/60 mb-4">지점 선택</h2>
        <BranchSelector branches={MOCK_BRANCHES} />
      </div>
    </div>
  );
}
