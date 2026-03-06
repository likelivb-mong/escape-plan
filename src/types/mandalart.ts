export type MandalartTheme = 'rose' | 'sky' | 'amber' | null;

export interface MandalartCellData {
  id: string;
  row: number;
  col: number;
  text: string;
  theme: MandalartTheme;
  isCenter?: boolean;    // main theme cell (row=4, col=4)
  isSubGoal?: boolean;   // 8 ring cells around center in center block (소목표)
  questTag?: string;     // 퀘스트 분류 태그 (선택적, AI 분석 시 생성)
}
