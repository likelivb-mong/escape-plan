import type { PassMapEntry } from '../../types/floorPlan';
import type { GameFlowPlan } from '../../types/gameFlow';
import { computePassMapEntries, groupEntriesByRoom } from '../../utils/floorPlan';

interface PassMapTableProps {
  plan: GameFlowPlan;
  projectName: string;
}

// ── Answer type icons ────────────────────────────────────────────────────────

const ANSWER_ICONS: Record<string, string> = {
  key: '🗝',
  number_4: '🔢',
  number_3: '🔢',
  alphabet_5: '🔤',
  keypad: '⌨️',
  xkit: '📱',
  auto: '⚡',
};

export default function PassMapTable({ plan, projectName }: PassMapTableProps) {
  const entries = computePassMapEntries(plan);
  const groups = groupEntriesByRoom(entries, plan.rooms);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Print header (visible in print only) ── */}
      <div className="hidden print:block print:mb-4">
        <h1 className="text-title2 font-bold text-black">{projectName} — PassMap</h1>
        <p className="text-body text-gray-500 mt-1">
          XCAPE Internal | {new Date().toLocaleDateString('ko-KR')}
        </p>
      </div>

      {/* ── Screen header ── */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <h2 className="text-body font-semibold text-white/80">PassMap — 잠금장치 정답표</h2>
          <span className="text-caption text-white/35">
            {plan.rooms.length}개 공간 · {plan.steps.length}개 스텝
          </span>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.10] text-footnote text-white/45 hover:border-white/20 hover:text-white/70 transition-all"
        >
          🖨 인쇄하기
        </button>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-white/[0.07] overflow-hidden print:border-gray-300 print:rounded-none">
        <table className="w-full text-left print:text-black">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02] print:bg-gray-100 print:border-gray-300">
              <th className="px-4 py-2.5 text-caption font-bold uppercase tracking-wider text-white/30 print:text-gray-600 w-[110px]">
                공간
              </th>
              <th className="px-3 py-2.5 text-caption font-bold uppercase tracking-wider text-white/30 print:text-gray-600 w-[50px] text-center">
                스텝
              </th>
              <th className="px-3 py-2.5 text-caption font-bold uppercase tracking-wider text-white/30 print:text-gray-600">
                문제 제목
              </th>
              <th className="px-3 py-2.5 text-caption font-bold uppercase tracking-wider text-white/30 print:text-gray-600 w-[100px]">
                잠금장치
              </th>
              <th className="px-3 py-2.5 text-caption font-bold uppercase tracking-wider text-white/30 print:text-gray-600 w-[120px]">
                정답
              </th>
              <th className="px-3 py-2.5 text-caption font-bold uppercase tracking-wider text-white/30 print:text-gray-600">
                입력 위치
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, gi) => (
              group.entries.map((entry, ei) => (
                <tr
                  key={`${group.room}-${entry.stepNumber}`}
                  className={[
                    'border-b border-white/[0.04] print:border-gray-200',
                    ei === 0 && gi > 0 ? 'border-t border-white/[0.08] print:border-t-gray-400' : '',
                  ].join(' ')}
                >
                  {/* Room name — only show on first row of group */}
                  <td className="px-4 py-2 align-top">
                    {ei === 0 && (
                      <span className="text-footnote font-semibold text-white/60 print:text-black print:font-bold">
                        {group.room}
                      </span>
                    )}
                  </td>

                  {/* Step number */}
                  <td className="px-3 py-2 text-center">
                    <span className="text-footnote text-white/40 font-mono tabular-nums print:text-gray-700">
                      {String(entry.stepNumber).padStart(2, '0')}
                    </span>
                  </td>

                  {/* Clue title */}
                  <td className="px-3 py-2">
                    <span className="text-footnote text-white/55 print:text-black">
                      {entry.clueTitle}
                    </span>
                  </td>

                  {/* Lock type */}
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 text-caption text-white/50 print:text-gray-700">
                      <span>{ANSWER_ICONS[entry.answerType] ?? ''}</span>
                      {entry.answerTypeLabel}
                    </span>
                  </td>

                  {/* Answer */}
                  <td className="px-3 py-2">
                    <span className="text-subhead font-mono font-bold text-white/75 tracking-wider print:text-black">
                      {entry.answer}
                    </span>
                  </td>

                  {/* Input location */}
                  <td className="px-3 py-2">
                    <span className="text-caption text-white/35 print:text-gray-600">
                      {entry.inputLabel}
                    </span>
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Print footer ── */}
      <div className="hidden print:block print:mt-4 print:pt-3 print:border-t print:border-gray-300">
        <p className="text-subhead text-gray-400 text-center">
          {projectName} — PassMap | XCAPE Internal | Generated {new Date().toISOString().split('T')[0]}
        </p>
      </div>
    </div>
  );
}
