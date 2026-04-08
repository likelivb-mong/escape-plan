import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import type { PassMapManualCategory, PassMapManualItem } from '../types/manual';
import { buildPassMapManual, updatePassMapManualOverride } from '../utils/passMapManual';
import WorkflowStepBar from '../components/layout/WorkflowStepBar';

const CATEGORY_STYLES: Record<PassMapManualCategory, string> = {
  key: 'bg-[#fff2bf] text-[#7a5b00] border-[#e4cd73]',
  xkit: 'bg-[#dfe8ff] text-[#3350a8] border-[#a8baf6]',
  device: 'bg-[#ffdfe7] text-[#a53d67] border-[#ebb0c2]',
  output: 'bg-[#ede7ff] text-[#6442aa] border-[#c1b2f3]',
};

export default function PassMapManualPage() {
  const navigate = useNavigate();
  const {
    projectName,
    gameFlowDesign,
    floorPlanData,
    manualOverrides,
    setManualOverrides,
    persistProject,
  } = useProject();

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const items = useMemo(() => {
    if (!gameFlowDesign || !floorPlanData) return [];
    return buildPassMapManual(gameFlowDesign, floorPlanData, manualOverrides.passMapManualByStepId);
  }, [gameFlowDesign, floorPlanData, manualOverrides.passMapManualByStepId]);

  const selectedItem = items.find((item) => item.stepId === selectedStepId) ?? items[0] ?? null;

  const handlePatch = (stepId: string, patch: Partial<PassMapManualItem>) => {
    setManualOverrides({
      ...manualOverrides,
      passMapManualByStepId: updatePassMapManualOverride(
        stepId,
        patch,
        manualOverrides.passMapManualByStepId,
      ),
    });
  };

  const handleSave = () => {
    persistProject();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!gameFlowDesign || !floorPlanData) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4 px-6">
        <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-title2">
          🗺
        </div>
        <div className="text-center">
          <p className="text-body font-semibold text-white/70 mb-1">Pass Map Manual을 만들 데이터가 없습니다.</p>
          <p className="text-subhead text-white/35 leading-relaxed">
            Pass Map을 먼저 설계하면 현장용 매뉴얼 맵이 자동 생성됩니다.
          </p>
        </div>
        <button
          onClick={() => navigate('/setting')}
          className="px-4 py-2 rounded-full border border-white/[0.12] text-subhead text-white/50 hover:border-white/25 hover:text-white/70 transition-all"
        >
          ← Pass Map으로
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#f7f4ef] text-black">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-black/10 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={() => navigate('/setting')}
            className="text-black/45 hover:text-black/70 transition-colors text-subhead"
          >
            ← Pass Map
          </button>
          <span className="h-3.5 w-px bg-black/10" />
          <h1 className="text-body font-semibold text-black/85 truncate">{projectName}</h1>
          <span className="h-3.5 w-px bg-black/10" />
          <span className="text-footnote text-black/45 font-medium tracking-wide">Pass Map Manual</span>
        </div>
        <button
          onClick={handleSave}
          className={`px-3 py-1.5 rounded-lg border text-footnote font-medium transition-all ${
            saved
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
              : 'border-black/10 text-black/55 hover:border-black/20 hover:text-black/75'
          }`}
        >
          {saved ? '저장됨' : '저장'}
        </button>
      </div>

      <div className="print:hidden">
        <WorkflowStepBar onBeforeNavigate={persistProject} />
      </div>

      <div className="px-4 sm:px-6 py-4 flex items-center gap-4 flex-wrap border-b border-black/10">
        <Legend />
        <span className="ml-auto text-[11px] text-black/45 font-mono">{items.length} items</span>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_320px]">
        <div className="overflow-auto p-4">
          <ManualCanvas
            rooms={floorPlanData.rooms}
            items={items}
            selectedStepId={selectedItem?.stepId ?? null}
            onSelectStep={setSelectedStepId}
          />
        </div>
        <div className="border-t xl:border-t-0 xl:border-l border-black/10 bg-white/50">
          {selectedItem ? (
            <PassMapInspector item={selectedItem} onPatch={(patch) => handlePatch(selectedItem.stepId, patch)} />
          ) : (
            <div className="p-6 text-sm text-black/45">맵에서 Step을 선택하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManualCanvas({
  rooms,
  items,
  selectedStepId,
  onSelectStep,
}: {
  rooms: { roomName: string; x: number; y: number; width: number; height: number }[];
  items: PassMapManualItem[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}) {
  return (
    <div className="relative w-full min-h-[640px] rounded-2xl border border-black/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.05)] overflow-hidden">
      {rooms.map((room) => (
        <div
          key={room.roomName}
          className="absolute border border-black/15 bg-[#fbf8f3] rounded-xl"
          style={{
            left: `${room.x}%`,
            top: `${room.y}%`,
            width: `${room.width}%`,
            height: `${room.height}%`,
          }}
        >
          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/5 text-[11px] font-semibold text-black/60">
            {room.roomName}
          </div>
        </div>
      ))}

      {items.map((item) => (
        <button
          key={item.stepId}
          onClick={() => onSelectStep(item.stepId)}
          className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shadow-sm transition-transform hover:scale-[1.02] ${
            CATEGORY_STYLES[item.category]
          } ${selectedStepId === item.stepId ? 'ring-2 ring-black/20' : ''}`}
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
        >
          <div className="font-mono">{String(item.stepNumber).padStart(2, '0')}</div>
          <div className="max-w-[120px] truncate">{item.label}</div>
        </button>
      ))}
    </div>
  );
}

function PassMapInspector({
  item,
  onPatch,
}: {
  item: PassMapManualItem;
  onPatch: (patch: Partial<PassMapManualItem>) => void;
}) {
  return (
    <div className="p-5 space-y-4">
      <div>
        <p className="text-caption text-black/35 uppercase tracking-widest mb-2">Step {item.stepNumber}</p>
        <p className="text-body font-semibold text-black/85">{item.label}</p>
      </div>

      <ManualField label="Label" value={item.label} onChange={(value) => onPatch({ label: value })} />
      <ManualField label="Output" value={item.output} onChange={(value) => onPatch({ output: value })} />
      <div>
        <label className="block text-[10px] text-black/35 font-semibold uppercase tracking-widest mb-1.5">Category</label>
        <select
          value={item.category}
          onChange={(e) => onPatch({ category: e.target.value as PassMapManualCategory })}
          className="w-full bg-white border border-black/10 rounded-lg px-3 py-2 text-[13px] text-black/80 outline-none"
        >
          <option value="key">Key</option>
          <option value="xkit">X-KIT</option>
          <option value="device">Device</option>
          <option value="output">Output</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ManualField label="X %" value={String(Math.round(item.x))} onChange={(value) => onPatch({ x: Number(value) || 0 })} />
        <ManualField label="Y %" value={String(Math.round(item.y))} onChange={(value) => onPatch({ y: Number(value) || 0 })} />
      </div>
      <ManualField label="Note" value={item.note} onChange={(value) => onPatch({ note: value })} multiline />
    </div>
  );
}

function ManualField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] text-black/35 font-semibold uppercase tracking-widest mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-white border border-black/10 rounded-lg px-3 py-2 text-[13px] text-black/80 outline-none resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-black/10 rounded-lg px-3 py-2 text-[13px] text-black/80 outline-none"
        />
      )}
    </div>
  );
}

function Legend() {
  const items: Array<{ key: PassMapManualCategory; label: string }> = [
    { key: 'key', label: 'Key' },
    { key: 'xkit', label: 'XKIT' },
    { key: 'device', label: 'Device' },
    { key: 'output', label: 'Output' },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {items.map((item) => (
        <span key={item.key} className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${CATEGORY_STYLES[item.key]}`}>
          {item.label}
        </span>
      ))}
    </div>
  );
}
