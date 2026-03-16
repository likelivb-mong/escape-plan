import type { ThemeStep, StepDetail } from '../types/passmap';

export const MOCK_STEPS: ThemeStep[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // GDXC - 미스터리 하우스 (gdxc-t1)
  // ══════════════════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════════════════
  // NWXC - 침묵의 목격자 (nwxc-sw) — 실제 운영 데이터 30스텝
  // 좌표: 도면 기반 매핑 (800×550 캔버스)
  // ══════════════════════════════════════════════════════════════════════════

  // ── V 본리 수사실 입장 ────────────────────────────────────────────────────
  { id: 'sw-01', themeId: 'nwxc-sw', stepNumber: 1,  type: 'puzzle', label: '사건개요',       zone: '본리 수사실', x: 720, y: 310, status: 'unchecked' },

  // ── 민준/서준 공간 ────────────────────────────────────────────────────────
  { id: 'sw-02', themeId: 'nwxc-sw', stepNumber: 2,  type: 'lock',   label: '세가족 나이',     zone: '민준 공간',   x: 500, y: 325, status: 'unchecked' },
  { id: 'sw-03', themeId: 'nwxc-sw', stepNumber: 3,  type: 'puzzle', label: '그림 진단서',     zone: '민준 공간',   x: 500, y: 385, status: 'unchecked' },
  { id: 'sw-04', themeId: 'nwxc-sw', stepNumber: 4,  type: 'lock',   label: '그림 암호',       zone: '민준 공간',   x: 460, y: 440, status: 'unchecked' },
  { id: 'sw-05', themeId: 'nwxc-sw', stepNumber: 5,  type: 'lock',   label: '일기장 함',       zone: '민준 공간',   x: 560, y: 465, status: 'unchecked' },

  // ── V 집중치료실 입장 ─────────────────────────────────────────────────────
  { id: 'sw-06', themeId: 'nwxc-sw', stepNumber: 6,  type: 'puzzle', label: '자화상A',         zone: '집중치료실',  x: 470, y: 280, status: 'unchecked' },
  { id: 'sw-07', themeId: 'nwxc-sw', stepNumber: 7,  type: 'puzzle', label: '서준 모빌',       zone: '집중치료실',  x: 555, y: 265, status: 'unchecked' },
  { id: 'sw-08', themeId: 'nwxc-sw', stepNumber: 8,  type: 'device', label: '마음 청진기',     zone: '서준 공간',   x: 710, y: 190, status: 'unchecked' },
  { id: 'sw-09', themeId: 'nwxc-sw', stepNumber: 9,  type: 'device', label: '무빙 >1',         zone: '무빙 통로',   x: 600, y: 175, status: 'unchecked' },

  // ── V 할머니방 입장(1) ────────────────────────────────────────────────────
  { id: 'sw-10', themeId: 'nwxc-sw', stepNumber: 10, type: 'puzzle', label: '약봉투',           zone: '할머니방',    x: 255, y: 140, status: 'unchecked' },
  { id: 'sw-11', themeId: 'nwxc-sw', stepNumber: 11, type: 'lock',   label: '1번 함',           zone: '할머니방',    x: 85,  y: 95,  status: 'unchecked' },
  { id: 'sw-12', themeId: 'nwxc-sw', stepNumber: 12, type: 'device', label: '화재예방 TV-ON',   zone: '할머니방',    x: 200, y: 40,  status: 'unchecked' },
  { id: 'sw-13', themeId: 'nwxc-sw', stepNumber: 13, type: 'lock',   label: '엄마의 선물',     zone: '할머니방',    x: 85,  y: 180, status: 'unchecked' },
  { id: 'sw-14', themeId: 'nwxc-sw', stepNumber: 14, type: 'device', label: '창문 LED ON',      zone: '할머니방',    x: 435, y: 145, status: 'unchecked' },
  { id: 'sw-15', themeId: 'nwxc-sw', stepNumber: 15, type: 'lock',   label: '칭찬 나무',       zone: '할머니방',    x: 85,  y: 260, status: 'unchecked' },
  { id: 'sw-16', themeId: 'nwxc-sw', stepNumber: 16, type: 'device', label: '천장함 .1-ON',     zone: '할머니방',    x: 280, y: 230, status: 'unchecked' },
  { id: 'sw-17', themeId: 'nwxc-sw', stepNumber: 17, type: 'puzzle', label: '유치원 가방',     zone: '할머니방',    x: 310, y: 200, status: 'unchecked' },
  { id: 'sw-18', themeId: 'nwxc-sw', stepNumber: 18, type: 'device', label: '무빙 >2',         zone: '무빙 통로',   x: 700, y: 115, status: 'unchecked' },

  // ── V 금요일 입장 ─────────────────────────────────────────────────────────
  { id: 'sw-19', themeId: 'nwxc-sw', stepNumber: 19, type: 'puzzle', label: '게임기 문자',     zone: '게임기',      x: 385, y: 250, status: 'unchecked' },
  { id: 'sw-20', themeId: 'nwxc-sw', stepNumber: 20, type: 'puzzle', label: '구슬치기',         zone: '게임기',      x: 305, y: 310, status: 'unchecked' },
  { id: 'sw-21', themeId: 'nwxc-sw', stepNumber: 21, type: 'puzzle', label: '공중전화기',       zone: '게임기',      x: 305, y: 355, status: 'unchecked' },
  { id: 'sw-22', themeId: 'nwxc-sw', stepNumber: 22, type: 'device', label: '동전 넣기',       zone: '자판기',      x: 125, y: 360, status: 'unchecked' },
  { id: 'sw-23', themeId: 'nwxc-sw', stepNumber: 23, type: 'puzzle', label: '자판기 + 동전',   zone: '자판기',      x: 85,  y: 400, status: 'unchecked' },

  // ── V 공동 부엌 입장 ─────────────────────────────────────────────────────
  { id: 'sw-24', themeId: 'nwxc-sw', stepNumber: 24, type: 'lock',   label: '라면',             zone: '공동 부엌',   x: 325, y: 400, status: 'unchecked' },
  { id: 'sw-25', themeId: 'nwxc-sw', stepNumber: 25, type: 'device', label: '밸브링',           zone: '공동 부엌',   x: 335, y: 380, status: 'unchecked' },
  { id: 'sw-26', themeId: 'nwxc-sw', stepNumber: 26, type: 'device', label: '가스밸브',         zone: '공동 부엌',   x: 345, y: 440, status: 'unchecked' },

  // ── V 할머니방 입장(2) ────────────────────────────────────────────────────
  { id: 'sw-27', themeId: 'nwxc-sw', stepNumber: 27, type: 'device', label: '천장함 .2-ON',     zone: '할머니방',    x: 255, y: 195, status: 'unchecked' },
  { id: 'sw-28', themeId: 'nwxc-sw', stepNumber: 28, type: 'lock',   label: '민들레',           zone: '공동 부엌',   x: 350, y: 475, status: 'unchecked' },
  { id: 'sw-29', themeId: 'nwxc-sw', stepNumber: 29, type: 'puzzle', label: '골말 카드',       zone: '결말',        x: 85,  y: 465, status: 'unchecked' },
  { id: 'sw-30', themeId: 'nwxc-sw', stepNumber: 30, type: 'device', label: '결정적 단서',     zone: '결말',        x: 175, y: 495, status: 'unchecked' },
];

export const MOCK_STEP_DETAILS: StepDetail[] = [
  // ── GDXC - 미스터리 하우스 ────────────────────────────────────────────────
  { stepId: 's1', answer: '4-7-2-9', input: '벽면 숫자 힌트', output: '서랍 열림', resetMethod: '서랍 닫기', memo: '힌트가 잘 안 보일 수 있음' },
  { stepId: 's2', answer: '4729', input: '숫자 퍼즐 결과', output: 'B구역 문 열림', resetMethod: '자물쇠 잠금', memo: '' },
  { stepId: 's3', answer: '센서 작동', input: '버튼 누름', output: '벽 이동', resetMethod: '리셋 버튼', memo: '모터 점검 필요' },
  { stepId: 's4', answer: '거울 각도 45도', input: '레이저 빔', output: '숨겨진 번호 노출', resetMethod: '거울 원위치', memo: '' },
  { stepId: 's5', answer: '3-1-8', input: '거울 퍼즐 번호', output: '열쇠 획득', resetMethod: '함 잠금', memo: '' },
  { stepId: 's6', answer: '통과', input: '레이저 통과', output: '알람 해제', resetMethod: '센서 리셋', memo: '센서 오작동 빈번' },
  { stepId: 's7', answer: '3번 홀', input: '구슬', output: '힌트 카드 드롭', resetMethod: '구슬 회수', memo: '' },
  { stepId: 's8', answer: '최종 열쇠', input: '열쇠 사용', output: '탈출 성공', resetMethod: '문 잠금', memo: '' },

  // ── GDXC - 타임 리프 ─────────────────────────────────────────────────────
  { stepId: 's9', answer: '12:00', input: '시계 바늘 조정', output: '비밀 칸 열림', resetMethod: '시계 리셋', memo: '' },
  { stepId: 's10', answer: '레버 당김', input: '전원 ON', output: '시간 이동 연출', resetMethod: '전원 OFF', memo: '' },
  { stepId: 's11', answer: '1985', input: '연도 입력', output: '과거 방 진입', resetMethod: '문 잠금', memo: '' },
  { stepId: 's12', answer: 'PARADOX', input: '일기장 암호', output: '열쇠 획득', resetMethod: '일기장 원위치', memo: '' },
  { stepId: 's13', answer: '패턴 입력', input: '터치 패널', output: '최종 문 개방', resetMethod: '패널 리셋', memo: '' },

  // ── NWXC - 사라진 유산 ────────────────────────────────────────────────────
  { stepId: 's14', answer: '8-3-6-1', input: '다이얼', output: '서류 획득', resetMethod: '금고 잠금', memo: '' },
  { stepId: 's15', answer: '초상화 회전', input: '초상화 뒷면 힌트', output: '비밀 통로 개방', resetMethod: '초상화 원위치', memo: '프레임 흔들림 주의' },
  { stepId: 's16', answer: '레버', input: '벽면 레버', output: '지하실 계단 노출', resetMethod: '레버 원위치', memo: '' },
  { stepId: 's17', answer: '빨-파-초-노', input: '보석 4개', output: '유산 금고 힌트', resetMethod: '보석 분리', memo: '' },
  { stepId: 's18', answer: '최종 비밀번호', input: '보석 배열 결과', output: '유산 획득', resetMethod: '금고 잠금', memo: '' },

  // ══════════════════════════════════════════════════════════════════════════
  // NWXC - 침묵의 목격자 (nwxc-sw) — 실제 운영 데이터
  // ══════════════════════════════════════════════════════════════════════════

  // ── V 본리 수사실 입장 ────────────────────────────────────────────────────
  { stepId: 'sw-01', answer: '20010509', input: '(입장)', output: '본리 수사실 입장', resetMethod: '', memo: '' },

  // ── 민준/서준 공간 ────────────────────────────────────────────────────────
  { stepId: 'sw-02', answer: '4974', input: '신문스크랩', output: '5/8 일기장 (검은일장)', resetMethod: '일기장 원위치', memo: '봉메탄 일기장' },
  { stepId: 'sw-03', answer: '짜장면', input: '봉메탄 일기장', output: '본리수사 녹음정황', resetMethod: '', memo: '' },
  { stepId: 'sw-04', answer: '287', input: '전자펜', output: '5/7 일기장', resetMethod: '함 잠금', memo: '초(2)이보카드(2)밤(8)체리(6)딸기(2)느(7)바나나(7)' },
  { stepId: 'sw-05', answer: '토끼와거북이', input: '자물쇠', output: '5/7 일기장 편', resetMethod: '자물쇠 잠금', memo: '' },

  // ── V 집중치료실 입장 ─────────────────────────────────────────────────────
  { stepId: 'sw-06', answer: '각자 자화상 + 약수', input: '자화상 그룹', output: '본리문 오픈', resetMethod: '자화상 원위치', memo: '자화상B도 확인' },
  { stepId: 'sw-07', answer: 'GET', input: '마을 진단', output: '(+) 천장함 오픈', resetMethod: '', memo: '하트 표식 그림 확인' },
  { stepId: 'sw-08', answer: 'AUTO', input: '청진기', output: '무빙문 오픈', resetMethod: '청진기 원위치', memo: '[1]손혜자>[2]연말>[3]마스크>[4]양난교골>[5]발마니>[6]큰은길' },
  { stepId: 'sw-09', answer: '자석', input: '민준 얼굴, 서준 얼굴, 할머니 손, 집 창문', output: '무빙-1 통과 → 풀러그림찾아서', resetMethod: '자석 원위치', memo: '' },

  // ── V 할머니방 입장(1) ────────────────────────────────────────────────────
  { stepId: 'sw-10', answer: '치매', input: '할머니 메모', output: '5/5 일기장', resetMethod: '약봉투 원위치', memo: '우편물 약봉지' },
  { stepId: 'sw-11', answer: '오,아이,원원원', input: '부탄가스', output: '부탄가스 + 5/4 일기장', resetMethod: '함 잠금', memo: '' },
  { stepId: 'sw-12', answer: 'AUTO', input: 'TV', output: '(+) TV나 ON', resetMethod: 'TV OFF', memo: 'Auto=TV-ON' },
  { stepId: 'sw-13', answer: '9167', input: '선풍기, 멀티탭, 전기방석', output: '5/3 일기장 (1)', resetMethod: '함 잠금', memo: '착한아이 9167 [+선풍기] Auto=창문-ON' },
  { stepId: 'sw-14', answer: 'AUTO', input: '태극 문양', output: '(+) 창문 불 열', resetMethod: '창문 닫기', memo: '' },
  { stepId: 'sw-15', answer: '62301289221', input: '스티커판', output: '형제의 우애', resetMethod: '스티커 원위치', memo: '도망처 (사과>포도>바나나) Auto=천장함-ON' },
  { stepId: 'sw-16', answer: 'AUTO', input: '유치원 가방', output: '(+) 천장+가방안 자석', resetMethod: '천장함 닫기', memo: '' },
  { stepId: 'sw-17', answer: '자석도장', input: '자석', output: '5/3 일기장 (2)', resetMethod: '도장 원위치', memo: '' },
  { stepId: 'sw-18', answer: '2-4 / 2-7 / 3-2 / 3-5 / 4-6 / 6-3', input: '자석', output: '무빙-2 통과', resetMethod: '자석 원위치', memo: '' },

  // ── V 금요일 입장 ─────────────────────────────────────────────────────────
  { stepId: 'sw-19', answer: '47928', input: '벽면 광고 스티커', output: '게임기', resetMethod: '게임기 리셋', memo: '' },
  { stepId: 'sw-20', answer: '8-5-9-10-4', input: '구슬 점수 표시', output: '피카추 지갑', resetMethod: '구슬 회수', memo: '전화카드/동전' },
  { stepId: 'sw-21', answer: '전화카드', input: '전화카드를 넣고 통화', output: '공중전화 통화내역', resetMethod: '전화카드 회수', memo: '' },
  { stepId: 'sw-22', answer: '동전 투입', input: '1동전을 자판기에 넣는다', output: '심부름 복지', resetMethod: '동전 회수', memo: '' },
  { stepId: 'sw-23', answer: '박,쌍,빅,라,앙,앙', input: '심부름 목지', output: '공동 부엌 오픈', resetMethod: '자판기 리셋', memo: '가스충전카드' },

  // ── V 공동 부엌 입장 ─────────────────────────────────────────────────────
  { stepId: 'sw-24', answer: '437', input: '밀 과 라면', output: '금을 밸브링', resetMethod: '라면 원위치', memo: '라면 3개' },
  { stepId: 'sw-25', answer: '풀리면', input: '가스밸', output: '싱크대 Door 오픈', resetMethod: '밸브 잠금', memo: '싱크 히든 오픈' },
  { stepId: 'sw-26', answer: '밸브: 2 / 4', input: '가스밸브', output: '할머니방 천장함 오픈', resetMethod: '밸브 원위치', memo: '135 동시에 잠들어야 안되는 가스 밸브 돌리기 (→1,3번 동시X / →1,4번 동시X)' },

  // ── V 할머니방 입장(2) ────────────────────────────────────────────────────
  { stepId: 'sw-27', answer: '>보험금', input: '영장사진 로봇기 타 대경단', output: '유언장', resetMethod: '천장함 닫기', memo: '붉타는 할마 영상사진' },
  { stepId: 'sw-28', answer: '576294', input: '민들레 (존속방관살해)', output: '사진 카드', resetMethod: '금고 잠금', memo: '전말카드+1 / 부엌 싱크대' },
  { stepId: 'sw-29', answer: '김진경 / 조순애+김서준 / 가스누출', input: '수거를 위에', output: '비하인드 영상', resetMethod: '카드 원위치', memo: '골말 카드' },
  { stepId: 'sw-30', answer: '가스렌지·3', input: '부탄가스를 틀리면', output: '탈출', resetMethod: '가스렌지 OFF', memo: '결정적 단서 (부탄가스)' },
];
