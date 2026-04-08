import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import type { FlowManualRow } from '../types/manual';
import { buildFlowManual, updateFlowManualOverride } from '../utils/flowManual';
import WorkflowStepBar from '../components/layout/WorkflowStepBar';

export default function FlowManualPage() {
  const navigate = useNavigate();
  const {
    projectName,
    gameFlowDesign,
    manualOverrides,
    setManualOverrides,
    persistProject,
  } = useProject();

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [mode, setMode] = useState<'all' | 'xkit' | 'device'>('all');
  const [saved, setSaved] = useState(false);

  const rows = useMemo(() => {
    if (!gameFlowDesign) return [];
    return buildFlowManual(gameFlowDesign, manualOverrides.flowManualByStepId);
  }, [gameFlowDesign, manualOverrides.flowManualByStepId]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    if (stageFilter !== 'all' && row.stageLabel !== stageFilter) return false;
    if (roomFilter !== 'all' && row.room !== roomFilter) return false;
    if (mode === 'xkit' && !row.xkit) return false;
    if (mode === 'device' && !row.device) return false;
    return true;
  }), [rows, roomFilter, stageFilter, mode]);

  const selectedRow = filteredRows.find((row) => row.stepId === selectedStepId)
    ?? rows.find((row) => row.stepId === selectedStepId)
    ?? filteredRows[0]
    ?? null;

  const rooms = useMemo(() => Array.from(new Set(rows.map((row) => row.room))), [rows]);

  const handlePatch = (stepId: string, patch: Partial<FlowManualRow>) => {
    setManualOverrides({
      ...manualOverrides,
      flowManualByStepId: updateFlowManualOverride(
        stepId,
        patch,
        manualOverrides.flowManualByStepId,
      ),
    });
  };

  const handleSave = () => {
    persistProject();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!gameFlowDesign) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center gap-4 px-6">
        <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-title2">
          📋
        </div>
        <div className="text-center">
          <p className="text-body font-semibold text-white/70 mb-1">Flow Manual을 만들 Game Flow가 없습니다.</p>
          <p className="text-subhead text-white/35 leading-relaxed">
            Game Flow를 먼저 설계하면 운영용 매뉴얼이 자동 생성됩니다.
          </p>
        </div>
        <button
          onClick={() => navigate('/game-flow')}
          className="px-4 py-2 rounded-full border border-white/[0.12] text-subhead text-white/50 hover:border-white/25 hover:text-white/70 transition-all"
        >
          ← Game Flow로
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.07] flex-shrink-0 gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={() => navigate('/game-flow')}
            className="text-white/30 hover:text-white/60 transition-colors text-subhead"
          >
            ← Game Flow
          </button>
          <span className="h-3.5 w-px bg-white/10" />
          <h1 className="text-body font-semibold text-white/85 truncate">{projectName}</h1>
          <span className="h-3.5 w-px bg-white/10" />
          <span className="text-footnote text-white/35 font-medium tracking-wide">Flow Manual</span>
        </div>

        <button
          onClick={handleSave}
          className={`px-3 py-1.5 rounded-lg border text-footnote font-medium transition-all ${
            saved
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300/80'
              : 'border-white/[0.10] text-white/45 hover:border-white/20 hover:text-white/70'
          }`}
        >
          {saved ? '저장됨' : '저장'}
        </button>
      </div>

      <WorkflowStepBar onBeforeNavigate={persistProject} />

      <div className="px-4 sm:px-6 py-4 flex items-center gap-3 flex-wrap border-b border-white/[0.05]">
        <FilterSelect value={stageFilter} onChange={setStageFilter} options={['all', '기', '승', '전', '반전', '결']} />
        <FilterSelect value={roomFilter} onChange={setRoomFilter} options={['all', ...rooms]} />
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {(['all', 'xkit', 'device'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all ${
                mode === value ? 'bg-white text-black shadow-sm' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {value === 'all' ? '전체' : value === 'xkit' ? 'X-KIT만' : 'Device만'}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-white/30 font-mono">
          {filteredRows.length} rows
        </span>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-0">
        <div className="overflow-auto border-r border-white/[0.05]">
          <table className="w-full min-w-[980px] border-collapse text-[12px]">
            <thead className="sticky top-0 z-10 bg-[#171719]">
              <tr className="border-b border-white/[0.08] text-white/45">
                {['Step', 'Stage', 'Room', 'Clue', 'Input', 'XKIT', 'Key', 'Dev', 'Output'].map((label) => (
                  <th key={label} className="px-3 py-2 text-left font-semibold tracking-wide">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.stepId}
                  onClick={() => setSelectedStepId(row.stepId)}
                  className={`border-b border-white/[0.05] cursor-pointer transition-colors ${
                    selectedRow?.stepId === row.stepId ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-white/60">{row.stepNumber}</td>
                  <td className="px-3 py-2 text-white/55">{row.stageLabel}</td>
                  <td className="px-3 py-2 text-white/55">{row.room}</td>
                  <td className="px-3 py-2 text-white/85 font-medium">{row.clue}</td>
                  <td className="px-3 py-2 text-white/45">{row.input}</td>
                  <td className="px-3 py-2">{row.xkit ? <Badge tone="sky">✓</Badge> : ''}</td>
                  <td className="px-3 py-2">{row.key ? <Badge tone="amber">✓</Badge> : ''}</td>
                  <td className="px-3 py-2">{row.device ? <Badge tone="rose">✓</Badge> : ''}</td>
                  <td className="px-3 py-2 text-white/55">{row.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t xl:border-t-0 border-white/[0.05] bg-white/[0.015]">
          {selectedRow ? (
            <FlowInspector row={selectedRow} onPatch={(patch) => handlePatch(selectedRow.stepId, patch)} />
          ) : (
            <div className="p-6 text-sm text-white/30">왼쪽 표에서 Step을 선택하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FlowInspector({
  row,
  onPatch,
}: {
  row: FlowManualRow;
  onPatch: (patch: Partial<FlowManualRow>) => void;
}) {
  return (
    <div className="p-5 space-y-4">
      <div>
        <p className="text-caption text-white/25 uppercase tracking-widest mb-2">Step {row.stepNumber}</p>
        <p className="text-body font-semibold text-white/85">{row.clue}</p>
      </div>

      <EditorField label="Clue" value={row.clue} onChange={(value) => onPatch({ clue: value })} />
      <EditorField label="Input" value={row.input} onChange={(value) => onPatch({ input: value })} />
      <EditorField label="Output" value={row.output} onChange={(value) => onPatch({ output: value })} />
      <EditorField label="State Change" value={row.stateChange} onChange={(value) => onPatch({ stateChange: value })} multiline />
      <EditorField label="Hint" value={row.hint} onChange={(value) => onPatch({ hint: value })} multiline />
      <EditorField label="Reset" value={row.reset} onChange={(value) => onPatch({ reset: value })} multiline />
    </div>
  );
}

function EditorField({
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
      <label className="block text-[10px] text-white/35 font-semibold uppercase tracking-widest mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-white/[0.20] resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-white/[0.20]"
        />
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/65 outline-none"
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-[#111] text-white">
          {option === 'all' ? '전체' : option}
        </option>
      ))}
    </select>
  );
}

function Badge({ tone, children }: { tone: 'sky' | 'amber' | 'rose'; children: React.ReactNode }) {
  const cls = {
    sky: 'bg-sky-500/12 text-sky-300 border-sky-400/20',
    amber: 'bg-amber-500/12 text-amber-300 border-amber-400/20',
    rose: 'bg-rose-500/12 text-rose-300 border-rose-400/20',
  }[tone];
  return <span className={`px-2 py-0.5 rounded border text-[11px] ${cls}`}>{children}</span>;
}
