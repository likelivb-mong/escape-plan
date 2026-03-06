import type { StoryProposal } from '../types/story';

// ── STORY_VARIANTS[slot][variantIndex] ────────────────────────────────────────
// 3 slots × 2 variants each = 6 story objects.
// "Regenerate" for a slot increments variantIndex mod 2.
// Replace generateStoryProposals() with a real API call when ready.

export const STORY_VARIANTS: StoryProposal[][] = [
  // ── Slot 0 ──────────────────────────────────────────────────────────────────
  [
    {
      id: 'slot0-v0',
      slot: 0,
      title: '붉은 미술관의 저주',
      genre: '심리 스릴러',
      tone: '긴박 · 어두움',
      logline: '갤러리 큐레이터의 갑작스러운 실종, 그 뒤에 숨겨진 금지된 예술의 비밀을 풀어라.',
      synopsis:
        '1980년대 철거된 것으로 알려진 붉은 미술관에 갇힌 플레이어들. 벽마다 걸린 초상화들이 사라진 큐레이터의 마지막 메시지를 담고 있다. UV 잉크로 숨겨진 단서와 뒤틀린 액자 속 암호를 해독해 탈출구를 찾아야 한다.',
      beats: [
        { label: '기', description: '미술관 폐쇄 이후 홀로 남겨진 플레이어, 빛이 꺼지며 문이 잠긴다.' },
        { label: '승', description: 'UV 플래시로 벽화 속 숨겨진 단서를 발견, 큐레이터의 일지를 조각 모음.' },
        { label: '전', description: '일지 마지막 장: 이 미술관은 인간을 가두기 위해 설계되었다.' },
        { label: '반전', description: '탈출구라 믿었던 비밀 방은 또 다른 전시실 — 플레이어가 전시품이 된다.' },
        { label: '결', description: '큐레이터의 마지막 암호를 해독해 진짜 비상구를 개방한다.' },
      ],
      meta: { playtime: '60분', playerCount: '2–6인', twistIntensity: 'high' },
    },
    {
      id: 'slot0-v1',
      slot: 0,
      title: '망각의 복도',
      genre: '미스터리 호러',
      tone: '공포 · 억압',
      logline: '기억을 잃은 채 깨어난 당신, 이 미술관에서 나온 적이 있다는 기록이 없다.',
      synopsis:
        '아무런 기억 없이 미술관 지하에서 눈을 뜬 플레이어. 벽마다 붙어있는 종이에는 이전 탈출 시도자들의 메모가 가득하다. 시간이 지날수록 새로운 기억이 주입되고, 그 기억 속 단서로만 탈출이 가능하다.',
      beats: [
        { label: '기', description: '공백의 기억, 사진 속 자신의 얼굴을 발견하지만 기억이 없다.' },
        { label: '승', description: '이전 방문자들의 메모를 조합해 자신의 과거 행동 경로를 재구성.' },
        { label: '전', description: '기억이 돌아올수록 밝혀지는 진실 — 나는 이 미술관을 설계한 사람이다.' },
        { label: '반전', description: '탈출 코드는 내가 직접 잠금장치에 입력했다. 기억 속 숫자를 역산해야 한다.' },
        { label: '결', description: '진짜 자아를 회복하고 자신이 설계한 탈출구를 통해 빠져나간다.' },
      ],
      meta: { playtime: '70분', playerCount: '2–4인', twistIntensity: 'high' },
    },
  ],

  // ── Slot 1 ──────────────────────────────────────────────────────────────────
  [
    {
      id: 'slot1-v0',
      slot: 1,
      title: '비밀결사 오퍼레이션',
      genre: '스파이 액션',
      tone: '긴장 · 유쾌',
      logline: '에이전트로 위장한 당신, 60분 안에 핵 코드를 탈취하고 흔적을 지워라.',
      synopsis:
        '냉전 시대 스파이 본부를 배경으로, 3중 잠금장치와 가짜 단서가 가득한 작전실에 플레이어가 투입된다. 각 요원마다 서로 다른 부분 정보를 가지며, 협력과 정보 공유 없이는 최종 금고를 열 수 없다.',
      beats: [
        { label: '기', description: '요원 브리핑 — 각자에게 다른 기밀 문서가 배부되고 작전이 시작된다.' },
        { label: '승', description: '암호 해독기, 마이크로필름, 도청 장치로 적 요원의 움직임을 역추적.' },
        { label: '전', description: '아군이라 믿었던 요원 중 한 명의 배지가 가짜임을 발견.' },
        { label: '반전', description: '진짜 코드는 배신자의 물건 속에 숨겨져 있었다 — 처음부터 그가 키를 갖고 있었다.' },
        { label: '결', description: '배신자의 암호를 역이용해 금고를 열고 코드를 탈취, 작전 완료.' },
      ],
      meta: { playtime: '60분', playerCount: '3–8인', twistIntensity: 'medium' },
    },
    {
      id: 'slot1-v1',
      slot: 1,
      title: '프로젝트 블랙아웃',
      genre: '사이버 스릴러',
      tone: '냉철 · 첨단',
      logline: '전 세계 전력망을 마비시킬 바이러스, 백신 코드를 찾기 위한 60분의 레이스.',
      synopsis:
        '미래 도시 해킹 센터를 배경으로, 이미 바이러스가 시스템에 침투한 상태에서 플레이어는 단서를 역추적해야 한다. 키보드 타이핑, 이진법 해독, 네트워크 맵 분석 등 다양한 논리 퍼즐이 연결된다.',
      beats: [
        { label: '기', description: '터미널 경고 — 바이러스 침투 60분 후 전력망 완전 차단 카운트다운.' },
        { label: '승', description: '감염된 서버 로그를 역추적, 바이러스 작성자의 디지털 지문을 수집.' },
        { label: '전', description: '바이러스 작성자는 내부자 — 센터 직원 ID가 로그에서 발견된다.' },
        { label: '반전', description: '백신 코드는 존재하지 않는다. 직접 카운터 코드를 작성해야만 막을 수 있다.' },
        { label: '결', description: '수집한 단서로 카운터 코드를 완성, 바이러스를 격리하고 전력망을 복구한다.' },
      ],
      meta: { playtime: '60분', playerCount: '2–6인', twistIntensity: 'medium' },
    },
  ],

  // ── Slot 2 ──────────────────────────────────────────────────────────────────
  [
    {
      id: 'slot2-v0',
      slot: 2,
      title: '사라진 탐정의 서재',
      genre: '추리 미스터리',
      tone: '고전 · 지적',
      logline: '명탐정이 마지막으로 남긴 사건 파일, 그것이 바로 당신을 탈출시킬 열쇠다.',
      synopsis:
        '빅토리아 시대 탐정 사무소를 재현한 공간. 사라진 탐정이 해결하지 못한 세 가지 미결 사건의 단서들이 서재 곳곳에 흩어져 있다. 각 사건을 해결할수록 탐정이 왜 사라졌는지가 밝혀지며, 최종 금고 코드가 완성된다.',
      beats: [
        { label: '기', description: '탐정 실종 신고 전보, 세 개의 미결 사건 파일이 책상 위에 펼쳐져 있다.' },
        { label: '승', description: '첫 번째 사건(독살) → 두 번째 사건(절도) → 세 번째 사건(실종) 순서로 단서 연결.' },
        { label: '전', description: '세 사건은 모두 동일 인물과 연루되어 있음을 발견 — 탐정이 쫓던 바로 그 인물.' },
        { label: '반전', description: '탐정은 사라진 게 아니라, 용의자에게 붙잡혀 이 서재에 갇혀 있다.' },
        { label: '결', description: '탐정의 숨겨진 메시지를 해독해 서재 비밀문을 열고 함께 탈출한다.' },
      ],
      meta: { playtime: '75분', playerCount: '2–5인', twistIntensity: 'medium' },
    },
    {
      id: 'slot2-v1',
      slot: 2,
      title: '13번 병실',
      genre: '심리 공포',
      tone: '음산 · 긴박',
      logline: '정신병원에서 사라진 의사, 남겨진 환자 기록만이 진실을 말한다.',
      synopsis:
        '폐쇄된 정신병원 13번 병실에 갇힌 플레이어들. 의사가 남긴 환자 기록과 치료 일지를 조합하면 사라진 이유가 드러난다. 하지만 단서를 파고들수록 의사와 환자의 경계가 흐려지며 충격적인 결말을 맞는다.',
      beats: [
        { label: '기', description: '병실 입원 — 철문이 잠기고, 의사의 마지막 기록 날짜가 오늘과 같다.' },
        { label: '승', description: '5명의 환자 기록을 분류, 이상 징후와 치료 일지의 모순점을 발견.' },
        { label: '전', description: '모든 환자 기록에 공통 코드가 삽입되어 있다 — 의사 본인이 작성한 자기 진단서.' },
        { label: '반전', description: '의사는 자신이 가장 위험한 환자임을 알고 스스로를 13번 병실에 가뒀다.' },
        { label: '결', description: '의사의 자기 처방 코드를 역산해 잠금을 해제하고 병실 밖으로 탈출한다.' },
      ],
      meta: { playtime: '60분', playerCount: '2–6인', twistIntensity: 'high' },
    },
  ],
];
