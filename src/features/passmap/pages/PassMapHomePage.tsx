import { useNavigate } from 'react-router-dom';
import BranchSelector from '../components/BranchSelector';
import { MOCK_BRANCHES } from '../mock/branches';

export default function PassMapHomePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <button
          onClick={() => navigate('/')}
          className="text-white/25 hover:text-white/50 text-caption mb-4 inline-block transition-colors"
        >
          ← Home
        </button>
        <h1 className="text-title1 text-white/95 font-bold tracking-tight">PassMap</h1>
        <p className="text-subhead text-white/35 mt-1.5">
          지점별 테마 운영 데이터를 관리합니다.
        </p>
      </div>

      <BranchSelector branches={MOCK_BRANCHES} />
    </div>
  );
}
