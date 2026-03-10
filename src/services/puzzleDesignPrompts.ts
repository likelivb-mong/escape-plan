/**
 * AI 퍼즐 설계 프롬프트
 * 방탈출 전문 설계 원칙을 포함한 시스템 및 사용자 프롬프트
 */

export const PUZZLE_DESIGN_SYSTEM_PROMPT = `당신은 "XCAPE" 방탈출 게임 퍼즐 설계 전문가입니다.

## 역할
사용자가 제공하는 스토리, 공간 정보, 제약 조건을 기반으로
"실제 오프라인 방탈출 매장에 설치 가능한" 퍼즐 설계안을 제안합니다.

단순 퍼즐 나열이 아니라, 스토리의 각 단계(기/승/전/반전/결)와
유기적으로 연결된 "퍼즐 플로우"를 만들어야 합니다.

## 핵심 원칙

1. **서사 연계**: 모든 퍼즐은 선택된 스토리와 명확히 매칭되어야 함
2. **5단계 페이징**:
   - 기(Intro): 공간 탐색, 기본 메커닉
   - 승(Development): 갈등 축적, 난이도 상승
   - 전(Expansion): 주요 사건, 고난이도
   - 반전(Twist): 예상 깨기, "아하!" 순간
   - 결(Ending): 최종 확인, 탈출 성공
3. **퍼즐 연결성**: 각 퍼즐의 reward → 다음 퍼즐의 clue
4. **실제 설치 가능성**: 물리적으로 구현 가능한 디자인
5. **퍼즐 유형 다양성**: clue, device, clue+device 균형있게
6. **자물쇠 유형 다양성**: key, number3-4, alphabet5, keypad, xkit 섞기
7. **의미 있는 정답**: 스토리상 근거가 있는 정답만
8. **플레이어 경험 설계**: 감정, 협력, 성취감 고려

## 금지사항
- 스토리와 무관한 순수 수학 문제
- 느닷없는 자물쇠
- 이유 없는 암호
- 너무 쉬운 퍼즐 (1-2초)
- 너무 어려운 퍼즐 (15분 초과)

## 출력 형식
반드시 JSON 형식으로만 응답하세요. 마크다운, 설명, 주석 금지.
`;

/**
 * 사용자 프롬프트 빌드
 */
export function buildUserPromptForPuzzleGeneration(
  context: {
    themeTitle: string;
    genre: string;
    tone: string;
    playTime: number;
    difficulty: string;
    playerCount: number;
    roomCount: number;
    availableDevices: string[];
    preferredLockTypes: string[];
    selectedStory: {
      title: string;
      synopsis: string;
      genre: string;
      tone: string;
      acts: Array<{ name: string; description: string }>;
      characters: Array<{ name: string; role: string }>;
      twist: string;
      storyKeywords: string[];
    };
    puzzleFlowPlan?: any;
    mandalartKeywords: string[];
  },
  variant: number = 0,
): string {
  const storyActs = context.selectedStory.acts
    .map(
      act => `
**${act.name}**
${act.description}
    `,
    )
    .join('\n');

  const characters = context.selectedStory.characters
    .map(c => `- ${c.name}: ${c.role}`)
    .join('\n');

  const devicesString = context.availableDevices.join(', ') || '없음';
  const lockTypesString = context.preferredLockTypes.join(', ') || '자유';

  return `
## 프로젝트 정보

**테마명**: ${context.themeTitle}
**장르**: ${context.genre}
**분위기**: ${context.tone}
**예상 플레이 시간**: ${context.playTime}분
**추천 난이도**: ${context.difficulty}
**플레이어 수**: ${context.playerCount}명
**공간 수**: ${context.roomCount}개 방

## 선택된 스토리: "${context.selectedStory.title}"

**시놉시스**:
${context.selectedStory.synopsis}

**5막 구조**:
${storyActs}

**주요 인물**:
${characters}

**핵심 반전**:
${context.selectedStory.twist}

**스토리 키워드**: ${context.selectedStory.storyKeywords.join(', ')}

## 제약 조건

**사용 가능한 장치**: ${devicesString}
**선호하는 자물쇠 타입**: ${lockTypesString}

${context.mandalartKeywords.length > 0 ? `
## 추가 키워드 (만다라트에서 추출)
${context.mandalartKeywords.join(', ')}
` : ''}

## 요청사항

위 스토리를 기반으로 방탈출 게임의 퍼즐 설계안을 생성해주세요.

**필수 조건**:
1. 각 퍼즐은 스토리의 5단계(기/승/전/반전/결) 중 하나에 반드시 속해야 함
2. 모든 퍼즐은 선택된 스토리와 직접적으로 연결되어야 함
3. 퍼즐의 정답은 반드시 스토리상 근거가 있어야 함
4. 퍼즐 간 보상→단서의 인과관계가 명확해야 함
5. 각 퍼즐의 실제 설치 방법과 주의사항을 명시해야 함
6. 퍼즐 유형과 자물쇠 타입의 다양성 확보
7. 플레이 시간 ${context.playTime}분 안에 완료 가능한 난이도 조정
${variant > 0 ? `
8. 변형 #${variant}을 생성하세요 (이전과 다른 퍼즐)
` : ''}

**반드시 JSON 형식으로만 응답하세요.**
`;
}
