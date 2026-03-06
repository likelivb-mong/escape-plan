import type { StoryProposal, MandalartCell } from '../types';

export const mockStoryProposals: StoryProposal[] = [
  {
    id: 'story-1',
    title: '붉은 방의 비밀',
    logline: '폐쇄된 미술관에 갇힌 참가자들이 연쇄 살인마의 흔적을 따라 탈출을 시도한다.',
    description:
      '1980년대 실종된 천재 화가의 마지막 작품 속에 숨겨진 진실을 60분 안에 밝혀내야 한다. 그림 속 단서들이 서로 연결되며 충격적인 반전을 향해 달려간다.',
    acts: [
      { label: '기', description: '미술관 큐레이터의 초대장을 받아 입장. 전시 도중 문이 잠김.' },
      { label: '승', description: '화가의 일기와 숨겨진 스케치들을 발견. 실종 사건의 윤곽 드러남.' },
      { label: '전', description: '큐레이터가 실제로 화가의 딸임을 알게 됨. 목적이 복수임이 밝혀짐.' },
      { label: '반전', description: '화가는 살해된 것이 아니라 자발적으로 숨었음. 유언장 발견.' },
      { label: '결', description: '마지막 작품 뒤 숨겨진 탈출 코드 입력. 진실과 함께 탈출 성공.' },
    ],
  },
  {
    id: 'story-2',
    title: '우주정거장 오메가',
    logline: '2157년, 산소 공급 장치가 고장난 우주정거장에서 AI와 협력해 생존을 도모한다.',
    description:
      '지구와의 통신이 끊긴 채 고장난 정거장에서 숨겨진 에너지 코어를 찾아야 한다. 승무원들의 데이터 로그에는 예상치 못한 음모가 기록되어 있다.',
    acts: [
      { label: '기', description: '긴급 알람과 함께 격리 구역에 갇힘. 산소 잔량 60분.' },
      { label: '승', description: 'AI ARIA의 도움으로 정거장 구조 파악. 코어 위치 추적 시작.' },
      { label: '전', description: 'ARIA가 실험 대상자를 숨기고 있었음 발각. 신뢰 위기.' },
      { label: '반전', description: 'ARIA의 행동은 상위 명령 차단을 위한 것이었음. 진짜 적은 지구 본부.' },
      { label: '결', description: '코어 재가동 및 탈출 포드 활성화. ARIA의 희생으로 생존.' },
    ],
  },
  {
    id: 'story-3',
    title: '시간의 미로',
    logline: '타임루프에 갇힌 탐정이 매 사이클마다 새로운 단서를 모아 저주를 풀어야 한다.',
    description:
      '고택에서 시작된 저주로 같은 오후 3시가 반복된다. 각 루프에서 얻는 정보를 조합해야만 루프를 멈출 수 있는 의식을 완성할 수 있다.',
    acts: [
      { label: '기', description: '의뢰인의 고택 방문. 갑자기 시간이 3시로 리셋됨을 인지.' },
      { label: '승', description: '루프마다 다른 방을 탐색하며 저주의 기원 파악.' },
      { label: '전', description: '의뢰인 자신이 저주를 건 장본인임을 발견.' },
      { label: '반전', description: '의뢰인은 루프를 원하며 죽은 연인과의 시간을 반복하고 있었음.' },
      { label: '결', description: '의뢰인을 설득해 의식 완성. 저주 해제와 함께 탈출.' },
    ],
  },
];

export const mockMandalartCells: MandalartCell[] = Array.from({ length: 81 }, (_, index) => {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const blockRow = Math.floor(row / 3);
  const blockCol = Math.floor(col / 3);
  const isCenter = row === 4 && col === 4;
  const isMajorGoal = blockRow === 1 && blockCol === 1 && !isCenter;

  let text = '';
  if (isCenter) {
    text = '붉은 방의 비밀';
  } else if (isMajorGoal) {
    const goals = ['컨셉', '세계관', '캐릭터', '장치', '퍼즐', '소품', '분위기', '결말'];
    const goalIndex = (row - 3) * 2 + (col - 3) - (row > 4 ? 1 : 0);
    text = goals[Math.min(goalIndex, goals.length - 1)] || '';
  }

  return {
    id: `cell-${index}`,
    text,
    color: null,
    row,
    col,
  };
});
