import { useState } from 'react';
import type { ScenarioBuildResult } from '../../types/scenario';
import { copyToClipboard } from '../../utils/scenario';
import ScenarioFlow from './ScenarioFlow';

interface ScenarioResultProps {
  result: ScenarioBuildResult | null;
  memo: string;
  onMemoChange: (memo: string) => void;
}

const SUMMARY_BADGE_STYLES: Record<string, string> = {
  overview: 'text-rose-300/70 border-rose-400/25 bg-rose-500/[0.06]',
  clue: 'text-amber-300/70 border-amber-400/25 bg-amber-500/[0.06]',
  method: 'text-sky-300/70 border-sky-400/25 bg-sky-500/[0.06]',
};

export default function ScenarioResult({ result, memo, onMemoChange }: ScenarioResultProps) {
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-body text-white/20 text-center">
          입력 항목을 선택하면 사건 구성이 생성됩니다
        </p>
      </div>
    );
  }

  const handleCopy = async () => {
    const blockLines = result.blocks
      .filter((b) => !b.isEmpty)
      .map((b) => `[${b.badge}] ${b.label}: ${b.value}`)
      .join('\n');

    const fullText = [
      '[ 사건 구성 ]',
      blockLines,
      '',
      '[ 최종 사건 문장 ]',
      result.scenarioText,
      '',
      '[ 사건 개요 ]',
      result.summary.caseOverview,
      '',
      '[ 핵심 단서 ]',
      result.summary.coreClue,
      '',
      '[ 추천 수사 포인트 ]',
      result.summary.recommendedFocus,
      memo ? `\n[ 기획 메모 ]\n${memo}` : '',
    ].join('\n');

    const ok = await copyToClipboard(fullText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ① 사건 구성 생성하기 — 블록 흐름 UI */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
          <p className="text-caption font-semibold text-white/25 uppercase tracking-widest">
            사건 구성 블록
          </p>
          <button
            onClick={handleCopy}
            className="px-3 py-1 rounded-lg border border-white/10 text-caption font-medium text-white/40 hover:text-white/70 hover:border-white/25 transition-all"
          >
            {copied ? '복사됨!' : '전체 복사'}
          </button>
        </div>
        <div className="px-5 py-4">
          <ScenarioFlow blocks={result.blocks} />
        </div>
      </div>

      {/* ② 최종 사건 문장 */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.05]">
          <p className="text-caption font-semibold text-white/25 uppercase tracking-widest">
            최종 사건 문장
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-subhead text-white/70 leading-relaxed">{result.scenarioText}</p>
        </div>
      </div>

      {/* ③④⑤ 사건 개요 / 핵심 단서 / 추천 수사 포인트 */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.05]">
          <p className="text-caption font-semibold text-white/25 uppercase tracking-widest">
            자동 요약
          </p>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <SummaryRow label="사건 개요" value={result.summary.caseOverview} badgeStyle={SUMMARY_BADGE_STYLES.overview} />
          <SummaryRow label="핵심 단서" value={result.summary.coreClue} badgeStyle={SUMMARY_BADGE_STYLES.clue} />
          <SummaryRow label="추천 수사 포인트" value={result.summary.recommendedFocus} badgeStyle={SUMMARY_BADGE_STYLES.method} />
        </div>
      </div>

      {/* ⑥ 기획 메모 */}
      <div>
        <label className="text-subhead text-white/40 font-medium tracking-wide uppercase block mb-1.5">
          기획 메모
        </label>
        <textarea
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="이 시나리오를 방탈출 테마로 발전시킬 아이디어를 메모하세요..."
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-body text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all resize-none"
        />
      </div>
    </div>
  );
}

function SummaryRow({ label, value, badgeStyle }: { label: string; value: string; badgeStyle: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`flex-shrink-0 px-2 py-0.5 rounded-md border text-micro font-medium mt-0.5 ${badgeStyle}`}>
        {label}
      </span>
      <p className="text-footnote text-white/45 leading-relaxed">{value}</p>
    </div>
  );
}
