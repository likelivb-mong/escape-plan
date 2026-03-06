import { useState } from 'react';
import type {
  GameFlowStep,
  ProblemMode,
  AnswerType,
  OutputType,
  DeviceSubtype,
} from '../../types/gameFlow';
import {
  ProblemModeBadge,
  AnswerTypeBadge,
  AnswerTypeVisual,
  OutputBadge,
  StageBadge,
  RoomBadge,
  DeviceSubtypeBadge,
} from './badges';
import { STAGE_LABELS } from '../../utils/gameFlow';

interface StepDetailPanelProps {
  step: GameFlowStep | null;
  rooms: string[];
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onUpdateStep?: (updates: Partial<GameFlowStep>) => void;
}

// ── Editable text field ───────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  onSave,
  mono = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onSave?: (v: string) => void;
  mono?: boolean;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (onSave && trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  };

  const inputBase = 'w-full bg-white/[0.06] border border-white/20 rounded-lg outline-none px-2 py-1.5 placeholder:text-white/20';

  return (
    <div>
      <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-1 flex items-center gap-1.5">
        {label}
        {onSave && !editing && (
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="text-white/15 hover:text-white/45 transition-colors text-[10px]"
          >
            ✎
          </button>
        )}
      </p>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === 'Escape' && (setDraft(value), setEditing(false))}
            className={`${inputBase} resize-none text-[11px] text-white/60`}
            rows={3}
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            className={`${inputBase} text-[11px] ${mono ? 'font-mono text-white/75' : 'text-white/60'}`}
          />
        )
      ) : (
        <p
          className={[
            'text-[11px] leading-snug',
            mono ? 'font-mono text-white/75' : 'text-white/60',
            onSave ? 'cursor-text hover:bg-white/[0.03] rounded px-1 -ml-1 transition-colors' : '',
          ].join(' ')}
          onClick={onSave ? () => { setDraft(value); setEditing(true); } : undefined}
        >
          {value || <span className="text-white/20 italic">—</span>}
        </p>
      )}
    </div>
  );
}

// ── Editable select field ─────────────────────────────────────────────────────

function EditableSelect<T extends string>({
  label,
  value,
  options,
  onSave,
  renderBadge,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onSave?: (v: T) => void;
  renderBadge: (v: T) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div>
        <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-1">{label}</p>
        <select
          autoFocus
          value={value}
          onChange={e => { onSave?.(e.target.value as T); setEditing(false); }}
          onBlur={() => setEditing(false)}
          className="px-2 py-1 rounded-lg border border-white/20 bg-[#111] text-[11px] text-white/70 outline-none cursor-pointer"
        >
          {options.map(o => (
            <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      className={onSave ? 'cursor-pointer group/sel' : ''}
      onClick={onSave ? () => setEditing(true) : undefined}
      title={onSave ? '클릭하여 변경' : undefined}
    >
      <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-1 flex items-center gap-1.5">
        {label}
        {onSave && (
          <span className="text-white/15 group-hover/sel:text-white/40 text-[10px] transition-colors">✎</span>
        )}
      </p>
      {renderBadge(value)}
    </div>
  );
}

// ── Editable tags (comma-separated) ──────────────────────────────────────────

function EditableTags({
  label,
  tags,
  color,
  onSave,
}: {
  label: string;
  tags: string[];
  color: 'amber' | 'sky';
  onSave?: (tags: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tags.join(', '));

  const badgeClass = color === 'amber'
    ? 'text-amber-300/65 border-amber-400/20 bg-amber-500/[0.06]'
    : 'text-sky-300/65 border-sky-400/20 bg-sky-500/[0.06]';

  const commit = () => {
    setEditing(false);
    const parsed = draft.split(',').map(t => t.trim()).filter(Boolean);
    onSave?.(parsed);
  };

  return (
    <div>
      <p className="text-[9px] font-semibold text-white/15 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        {label}
        {onSave && !editing && (
          <button
            onClick={() => { setDraft(tags.join(', ')); setEditing(true); }}
            className="text-white/15 hover:text-white/40 text-[10px] transition-colors"
          >
            ✎
          </button>
        )}
      </p>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(tags.join(', ')); setEditing(false); }
          }}
          placeholder="쉼표로 구분 (예: 혈흔, 지문)"
          className="w-full bg-white/[0.06] border border-white/20 rounded-lg px-2 py-1.5 text-[11px] text-white/60 outline-none placeholder:text-white/20"
        />
      ) : tags.length > 0 ? (
        <div
          className={`flex flex-wrap gap-1.5 ${onSave ? 'cursor-text hover:bg-white/[0.02] rounded p-0.5 -m-0.5 transition-colors' : ''}`}
          onClick={onSave ? () => { setDraft(tags.join(', ')); setEditing(true); } : undefined}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded border text-[9px] font-medium ${badgeClass}`}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : onSave ? (
        <button
          onClick={() => { setDraft(''); setEditing(true); }}
          className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
        >
          + 태그 추가
        </button>
      ) : null}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StepDetailPanel({
  step,
  rooms,
  totalSteps,
  onPrev,
  onNext,
  onUpdateStep,
}: StepDetailPanelProps) {
  if (!step) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-3 text-center px-8">
        <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-xl">
          🎲
        </div>
        <p className="text-[12px] text-white/35 leading-relaxed">
          좌측에서 스텝을 선택하면<br />상세 설계 내용이 표시됩니다.
        </p>
      </div>
    );
  }

  const upd = onUpdateStep;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/25">
              STEP {String(step.stepNumber).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
            </span>
            <StageBadge label={step.stageLabel} />
            {/* Editable room */}
            {upd ? (
              <select
                value={step.room}
                onChange={e => upd({ room: e.target.value })}
                className="px-2 py-0.5 rounded border border-white/[0.09] bg-transparent text-[10px] text-white/45 cursor-pointer appearance-none hover:border-white/20 transition-colors outline-none"
              >
                {rooms.map(r => (
                  <option key={r} value={r} className="bg-[#111] text-white/70">{r}</option>
                ))}
              </select>
            ) : (
              <RoomBadge room={step.room} rooms={rooms} />
            )}
          </div>
          {/* Prev / Next */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              disabled={step.stepNumber <= 1}
              className="w-6 h-6 flex items-center justify-center rounded border border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/20 transition-all disabled:opacity-20 text-xs"
            >
              ‹
            </button>
            <button
              onClick={onNext}
              disabled={step.stepNumber >= totalSteps}
              className="w-6 h-6 flex items-center justify-center rounded border border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/20 transition-all disabled:opacity-20 text-xs"
            >
              ›
            </button>
          </div>
        </div>
        {/* Editable clueTitle */}
        {upd ? (
          <EditableField
            label=""
            value={step.clueTitle}
            onSave={v => upd({ clueTitle: v })}
            mono={false}
          />
        ) : (
          <h2 className="text-sm font-semibold text-white/90 leading-snug">{step.clueTitle}</h2>
        )}
        <p className="text-[10px] text-white/30 mt-0.5">{STAGE_LABELS[step.stageLabel]}</p>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Problem Mode + Answer Type */}
        <Section label="문제 방식 / 정답 유형">
          <div className="flex items-start gap-4 flex-wrap">
            <EditableSelect<ProblemMode>
              label="문제 방식"
              value={step.problemMode}
              options={[
                { value: 'clue', label: '단서 해석' },
                { value: 'device', label: '장치 조작' },
                { value: 'clue_device', label: '단서+장치' },
              ]}
              onSave={upd ? v => upd({ problemMode: v }) : undefined}
              renderBadge={v => <ProblemModeBadge mode={v} />}
            />
            <EditableSelect<AnswerType>
              label="정답 유형"
              value={step.answerType}
              options={[
                { value: 'key', label: '열쇠' },
                { value: 'number_4', label: '숫자 4자리' },
                { value: 'number_3', label: '숫자 3자리' },
                { value: 'alphabet_5', label: '알파벳 5자리' },
                { value: 'keypad', label: '키패드' },
                { value: 'xkit', label: 'X-KIT' },
                { value: 'auto', label: '자동' },
              ]}
              onSave={upd ? v => upd({ answerType: v }) : undefined}
              renderBadge={v => <AnswerTypeBadge type={v} />}
            />
            {step.deviceSubtype && (
              <EditableSelect<DeviceSubtype>
                label="장치 유형"
                value={step.deviceSubtype}
                options={[
                  { value: 'electronic_pen', label: '전자 펜' },
                  { value: 'magnet', label: '자석' },
                  { value: 'tagging', label: '태깅' },
                  { value: 'sensor', label: '센서' },
                  { value: 'light', label: '빛' },
                  { value: 'tv', label: 'TV' },
                  { value: 'moving_room', label: '이동 방' },
                  { value: 'hidden_door', label: '비밀 문' },
                  { value: 'auto_trigger', label: '자동 트리거' },
                  { value: 'keypad_device', label: '키패드 장치' },
                  { value: 'phone_device', label: '폰 장치' },
                  { value: 'other', label: '기타' },
                ]}
                onSave={upd ? v => upd({ deviceSubtype: v }) : undefined}
                renderBadge={v => <DeviceSubtypeBadge subtype={v} />}
              />
            )}
          </div>
          <div className="mt-3">
            <AnswerTypeVisual type={step.answerType} answer={step.answer} />
          </div>
        </Section>

        {/* Input / Answer */}
        <Section label="입력 / 정답">
          <div className="grid grid-cols-2 gap-3">
            <EditableField
              label="INPUT"
              value={step.inputLabel}
              onSave={upd ? v => upd({ inputLabel: v }) : undefined}
            />
            <EditableField
              label="ANSWER"
              value={step.answer}
              onSave={upd ? v => upd({ answer: v }) : undefined}
              mono
            />
          </div>
        </Section>

        {/* xkit fields */}
        {step.answerType === 'xkit' && (
          <Section label="X-KIT 설정">
            <div className="flex flex-col gap-2.5">
              {(step.xkitPrompt !== undefined || upd) && (
                <EditableField
                  label="X-KIT PROMPT"
                  value={step.xkitPrompt ?? ''}
                  onSave={upd ? v => upd({ xkitPrompt: v }) : undefined}
                  multiline
                />
              )}
              {(step.xkitAnswer !== undefined || upd) && (
                <EditableField
                  label="X-KIT ANSWER"
                  value={step.xkitAnswer ?? ''}
                  onSave={upd ? v => upd({ xkitAnswer: v }) : undefined}
                  mono
                />
              )}
              {(step.xkitNextGuide !== undefined || upd) && (
                <div>
                  <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    NEXT GUIDE
                    {upd && (
                      <button
                        onClick={() => {/* handled by EditableField below */}}
                        className="hidden"
                      />
                    )}
                  </p>
                  <div className="px-2.5 py-2 rounded-lg border border-purple-400/20 bg-purple-500/[0.06]">
                    <EditableField
                      label=""
                      value={step.xkitNextGuide ?? ''}
                      onSave={upd ? v => upd({ xkitNextGuide: v }) : undefined}
                      multiline
                    />
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Output */}
        <Section label="출력 (Output)">
          <EditableSelect<OutputType>
            label="출력 유형"
            value={step.output}
            options={[
              { value: 'door_open', label: '문 열림' },
              { value: 'hidden_compartment_open', label: '숨겨진 공간 열림' },
              { value: 'led_on', label: 'LED 점등' },
              { value: 'tv_on', label: 'TV 재생' },
              { value: 'xkit_guide_revealed', label: 'X-KIT 가이드 공개' },
              { value: 'item_acquired', label: '아이템 획득' },
              { value: 'next_room_open', label: '다음 방 이동' },
              { value: 'ending_video', label: '엔딩 영상' },
              { value: 'escape_clear', label: '탈출 완료' },
            ]}
            onSave={upd ? v => upd({ output: v }) : undefined}
            renderBadge={v => <OutputBadge output={v} />}
          />
        </Section>

        {/* Clue + Device tags */}
        <Section label="사용 단서 / 장치">
          <div className="flex flex-col gap-2.5">
            <EditableTags
              label="CLUE"
              tags={step.clueTags}
              color="amber"
              onSave={upd ? v => upd({ clueTags: v }) : undefined}
            />
            <EditableTags
              label="DEVICE"
              tags={step.deviceTags}
              color="sky"
              onSave={upd ? v => upd({ deviceTags: v }) : undefined}
            />
          </div>
        </Section>

        {/* Notes */}
        <Section label="연출 메모">
          {upd ? (
            <EditableField
              label=""
              value={step.notes ?? ''}
              onSave={v => upd({ notes: v })}
              multiline
            />
          ) : step.notes ? (
            <p className="text-[11px] text-white/45 leading-relaxed italic border-l-2 border-white/[0.08] pl-3">
              {step.notes}
            </p>
          ) : null}
        </Section>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-4 border-b border-white/[0.05]">
      {label && (
        <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-2.5">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}
