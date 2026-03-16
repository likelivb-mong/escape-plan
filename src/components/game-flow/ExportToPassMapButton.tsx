import { useState, useRef, useEffect } from 'react';
import type { GameFlowPlan } from '../../types/gameFlow';
import { gameFlowToExchange, downloadExchangeJson } from '../../features/passmap/utils/passmap-exchange';
import { MOCK_BRANCHES } from '../../features/passmap/mock/branches';

interface ExportToPassMapButtonProps {
  plan: GameFlowPlan;
}

export default function ExportToPassMapButton({ plan }: ExportToPassMapButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [exported, setExported] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const handleExport = (branchCode: string) => {
    const data = gameFlowToExchange(plan, branchCode);
    downloadExchangeJson(data);
    setShowPicker(false);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={[
          'px-4 py-2 rounded-full border text-subhead font-medium transition-all',
          exported
            ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300/80'
            : 'border-violet-400/25 text-violet-300/70 hover:border-violet-400/40 hover:text-violet-300',
        ].join(' ')}
      >
        {exported ? '✓ Exported' : 'Export to PassMap'}
      </button>

      {/* Branch picker dropdown */}
      {showPicker && (
        <div className="absolute bottom-full mb-2 right-0 w-56 rounded-xl border border-white/10 bg-[#1a1a1f] shadow-xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-white/5 text-caption text-white/40">
            지점 선택 후 JSON 다운로드
          </div>
          {MOCK_BRANCHES.map((b) => (
            <button
              key={b.code}
              onClick={() => handleExport(b.code)}
              className="w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5 transition-colors flex items-center justify-between"
            >
              <span>{b.name}</span>
              <span className="text-white/25 font-mono text-xs">{b.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
