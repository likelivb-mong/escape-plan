import { useNavigate } from 'react-router-dom';
import type { Branch } from '../types/passmap';

interface BranchSelectorProps {
  branches: Branch[];
}

export default function BranchSelector({ branches }: BranchSelectorProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {branches.map((branch) => (
        <button
          key={branch.code}
          onClick={() => navigate(`/passmap/${branch.code}`)}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all hover:border-indigo-500/50 hover:bg-white/10"
        >
          <div className="text-caption text-white/40 font-mono">{branch.code}</div>
          <div className="text-title2 text-white mt-1">{branch.name}</div>
          <div className="absolute top-4 right-4 text-white/20 group-hover:text-indigo-400 transition-colors text-2xl">
            →
          </div>
        </button>
      ))}
    </div>
  );
}
