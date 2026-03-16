import { useNavigate } from 'react-router-dom';
import type { Branch } from '../types/passmap';

interface BranchSelectorProps {
  branches: Branch[];
}

export default function BranchSelector({ branches }: BranchSelectorProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {branches.map((branch) => (
        <button
          key={branch.code}
          onClick={() => navigate(`/passmap/${branch.code}`)}
          className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
        >
          <span className="text-caption text-white/25 font-mono w-10 flex-shrink-0">{branch.code}</span>
          <span className="text-body text-white/75 font-medium flex-1">{branch.name}</span>
          <span className="text-white/15 group-hover:text-white/40 transition-colors text-caption">→</span>
        </button>
      ))}
    </div>
  );
}
