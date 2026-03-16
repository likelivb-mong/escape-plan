import type { ThemeStep, StepDetail } from '../types/passmap';

export const MOCK_STEPS: ThemeStep[] = [
  // GDXC - 미스터리 하우스 (gdxc-t1)
  { id: 's1', themeId: 'gdxc-t1', stepNumber: 1, type: 'puzzle', label: '숫자 퍼즐', zone: 'A구역', x: 120, y: 80, status: 'complete' },
  { id: 's2', themeId: 'gdxc-t1', stepNumber: 2, type: 'lock', label: '1번 자물쇠', zone: 'A구역', x: 200, y: 150, status: 'complete' },
  { id: 's3', themeId: 'gdxc-t1', stepNumber: 3, type: 'device', label: '무빙월', zone: 'B구역', x: 350, y: 120, status: 'warning' },
  { id: 's4', themeId: 'gdxc-t1', stepNumber: 4, type: 'puzzle', label: '거울 퍼즐', zone: 'B구역', x: 400, y: 200, status: 'unchecked' },
  { id: 's5', themeId: 'gdxc-t1', stepNumber: 5, type: 'lock', label: '2번 함', zone: 'C구역', x: 500, y: 100, status: 'unchecked' },
  { id: 's6', themeId: 'gdxc-t1', stepNumber: 6, type: 'device', label: '레이저 센서', zone: 'C구역', x: 550, y: 250, status: 'issue' },
  { id: 's7', themeId: 'gdxc-t1', stepNumber: 7, type: 'puzzle', label: '구슬 치기', zone: 'D구역', x: 650, y: 180, status: 'unchecked' },
  { id: 's8', themeId: 'gdxc-t1', stepNumber: 8, type: 'lock', label: '최종 문', zone: 'D구역', x: 700, y: 300, status: 'unchecked' },

  // GDXC - 타임 리프 (gdxc-t2)
  { id: 's9', themeId: 'gdxc-t2', stepNumber: 1, type: 'puzzle', label: '시계 퍼즐', zone: 'A구역', x: 100, y: 100, status: 'complete' },
  { id: 's10', themeId: 'gdxc-t2', stepNumber: 2, type: 'device', label: '타임머신', zone: 'A구역', x: 250, y: 150, status: 'complete' },
  { id: 's11', themeId: 'gdxc-t2', stepNumber: 3, type: 'lock', label: '과거의 문', zone: 'B구역', x: 400, y: 200, status: 'unchecked' },
  { id: 's12', themeId: 'gdxc-t2', stepNumber: 4, type: 'puzzle', label: '암호 해독', zone: 'B구역', x: 500, y: 120, status: 'unchecked' },
  { id: 's13', themeId: 'gdxc-t2', stepNumber: 5, type: 'device', label: '홀로그램', zone: 'C구역', x: 600, y: 250, status: 'unchecked' },

  // NWXC - 사라진 유산 (nwxc-t1)
  { id: 's14', themeId: 'nwxc-t1', stepNumber: 1, type: 'lock', label: '금고', zone: '서재', x: 150, y: 100, status: 'complete' },
  { id: 's15', themeId: 'nwxc-t1', stepNumber: 2, type: 'puzzle', label: '초상화 퍼즐', zone: '거실', x: 300, y: 180, status: 'warning' },
  { id: 's16', themeId: 'nwxc-t1', stepNumber: 3, type: 'device', label: '비밀 통로', zone: '서재', x: 200, y: 250, status: 'unchecked' },
  { id: 's17', themeId: 'nwxc-t1', stepNumber: 4, type: 'puzzle', label: '보석 배열', zone: '지하실', x: 450, y: 300, status: 'unchecked' },
  { id: 's18', themeId: 'nwxc-t1', stepNumber: 5, type: 'lock', label: '유산 금고', zone: '지하실', x: 550, y: 200, status: 'unchecked' },
];

export const MOCK_STEP_DETAILS: StepDetail[] = [
  { stepId: 's1', answer: '4-7-2-9', input: '벽면 숫자 힌트', output: '서랍 열림', resetMethod: '서랍 닫기', memo: '힌트가 잘 안 보일 수 있음' },
  { stepId: 's2', answer: '4729', input: '숫자 퍼즐 결과', output: 'B구역 문 열림', resetMethod: '자물쇠 잠금', memo: '' },
  { stepId: 's3', answer: '센서 작동', input: '버튼 누름', output: '벽 이동', resetMethod: '리셋 버튼', memo: '모터 점검 필요' },
  { stepId: 's4', answer: '거울 각도 45도', input: '레이저 빔', output: '숨겨진 번호 노출', resetMethod: '거울 원위치', memo: '' },
  { stepId: 's5', answer: '3-1-8', input: '거울 퍼즐 번호', output: '열쇠 획득', resetMethod: '함 잠금', memo: '' },
  { stepId: 's6', answer: '통과', input: '레이저 통과', output: '알람 해제', resetMethod: '센서 리셋', memo: '센서 오작동 빈번' },
  { stepId: 's7', answer: '3번 홀', input: '구슬', output: '힌트 카드 드롭', resetMethod: '구슬 회수', memo: '' },
  { stepId: 's8', answer: '최종 열쇠', input: '열쇠 사용', output: '탈출 성공', resetMethod: '문 잠금', memo: '' },
  { stepId: 's9', answer: '12:00', input: '시계 바늘 조정', output: '비밀 칸 열림', resetMethod: '시계 리셋', memo: '' },
  { stepId: 's10', answer: '레버 당김', input: '전원 ON', output: '시간 이동 연출', resetMethod: '전원 OFF', memo: '' },
  { stepId: 's11', answer: '1985', input: '연도 입력', output: '과거 방 진입', resetMethod: '문 잠금', memo: '' },
  { stepId: 's12', answer: 'PARADOX', input: '일기장 암호', output: '열쇠 획득', resetMethod: '일기장 원위치', memo: '' },
  { stepId: 's13', answer: '패턴 입력', input: '터치 패널', output: '최종 문 개방', resetMethod: '패널 리셋', memo: '' },
  { stepId: 's14', answer: '8-3-6-1', input: '다이얼', output: '서류 획득', resetMethod: '금고 잠금', memo: '' },
  { stepId: 's15', answer: '초상화 회전', input: '초상화 뒷면 힌트', output: '비밀 통로 개방', resetMethod: '초상화 원위치', memo: '프레임 흔들림 주의' },
  { stepId: 's16', answer: '레버', input: '벽면 레버', output: '지하실 계단 노출', resetMethod: '레버 원위치', memo: '' },
  { stepId: 's17', answer: '빨-파-초-노', input: '보석 4개', output: '유산 금고 힌트', resetMethod: '보석 분리', memo: '' },
  { stepId: 's18', answer: '최종 비밀번호', input: '보석 배열 결과', output: '유산 획득', resetMethod: '금고 잠금', memo: '' },
];
