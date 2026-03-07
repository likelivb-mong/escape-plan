// ── Story types ───────────────────────────────────────────────────────────────
import type { NarrativeAnalysis } from './narrative';

export type TwistIntensity = 'low' | 'medium' | 'high';

export interface StoryBeat {
  /** Korean story-structure label: 기 / 승 / 전 / 반전 / 결 */
  label: '기' | '승' | '전' | '반전' | '결';
  description: string;
}

/** XCAPE 수사 프레임워크 — 조합 공식 기반 */
export interface InvestigationFramework {
  perpetrator: string;  // [가] 가해자
  motive: string;       // [A] 범행 동기
  victim: string;       // [나] 피해자
  method: string;       // [B] 범행 방법
  scene: string;        // [다] 사건 장소
  clue: string;         // [C] 수사 단서
  technique: string;    // [D] 수사 기법
  formula: string;      // 완성 조합 문장
}

export interface StoryProposal {
  id: string;
  /** Slot index (0–2) — which column this proposal occupies */
  slot: number;
  title: string;
  /** e.g. "심리 스릴러" */
  genre: string;
  /** e.g. "긴박 · 어두움" */
  tone: string;
  /** One-liner pitch */
  logline: string;
  /** 2–3 sentence synopsis */
  synopsis: string;
  /** 기/승/전/반전/결 beats */
  beats: StoryBeat[];
  meta: {
    playtime: string;        // e.g. "60분"
    playerCount: string;     // e.g. "2–6인"
    twistIntensity: TwistIntensity;
  };
  /** XCAPE 수사 프레임워크 (AI 분석 시 생성, optional) */
  investigation?: InvestigationFramework;
  /** YouTube 서사 구조 분석 결과 (YouTube 분석 시 생성, optional) */
  narrative?: NarrativeAnalysis;
}

// ── Keyword category (for summary strip) ─────────────────────────────────────

export interface KeywordItem {
  id: string;
  text: string;
  theme: 'rose' | 'sky' | 'amber' | null;
}

export interface KeywordCategory {
  label: string;        // "컨셉", "연출/장치", "단서/소품", "기타"
  theme: 'rose' | 'sky' | 'amber' | null;
  keywords: KeywordItem[];
}
