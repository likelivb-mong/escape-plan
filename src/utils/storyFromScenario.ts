// ── 시나리오 → StoryProposal 변환 유틸 ─────────────────────────────────────

import type { ScenarioFormState, ScenarioBuildResult } from '../types/scenario';
import type { StoryProposal, StoryBeat, InvestigationFramework } from '../types/story';

/** 시나리오 폼에서 InvestigationFramework 생성 */
function buildInvestigation(form: ScenarioFormState, result: ScenarioBuildResult): InvestigationFramework {
  const offenders = form.characters.filter(c => c.role === '가해자' && c.name.trim()).map(c => c.name.trim());
  const victims   = form.characters.filter(c => c.role === '피해자' && c.name.trim()).map(c => c.name.trim());

  return {
    perpetrator: offenders.join(', ') || '미상',
    motive:      form.motive.item || '미상',
    victim:      victims.join(', ') || '미상',
    method:      form.crimeType.item || '미상',
    scene:       form.location || '미상',
    clue:        form.clue.item || '미상',
    technique:   form.method.item || '미상',
    formula:     result.scenarioText,
  };
}

/** 시나리오 데이터에서 3개의 StoryProposal 생성 */
export function generateStoryProposalsFromScenario(
  form: ScenarioFormState,
  result: ScenarioBuildResult,
): StoryProposal[] {
  const inv = buildInvestigation(form, result);
  const ts = Date.now();

  const offender = inv.perpetrator !== '미상' ? inv.perpetrator : '범인';
  const victim   = inv.victim !== '미상' ? inv.victim : '피해자';
  const motive   = inv.motive !== '미상' ? inv.motive : '알 수 없는 동기';
  const crime    = inv.method !== '미상' ? inv.method : '사건';
  const location = inv.scene  !== '미상' ? inv.scene : '사건 현장';
  const clue     = inv.clue   !== '미상' ? inv.clue : '결정적 단서';
  const tech     = inv.technique !== '미상' ? inv.technique : '수사 기법';

  // ── Slot 0: 추리 미스터리 (수사 관점) ──────────────────────────────────────

  const beats0: StoryBeat[] = [
    { label: '기', description: `${location}에서 ${crime} 사건이 발생한다. ${victim}이(가) 발견되고 수사가 시작된다.` },
    { label: '승', description: `수사 과정에서 ${clue}이(가) 발견되며 용의자가 좁혀진다.` },
    { label: '전', description: `${motive}이(가) 사건의 동기로 밝혀지며 새로운 증거가 나타난다.` },
    { label: '반전', description: `${offender}의 예상치 못한 정체와 진짜 목적이 드러난다.` },
    { label: '결', description: `${tech}을(를) 통해 결정적 증거를 확보하고 사건이 해결된다.` },
  ];

  const proposal0: StoryProposal = {
    id: `scenario-${ts}-0`,
    slot: 0,
    title: `${offender}의 완전범죄`,
    genre: '추리 미스터리',
    tone: '논리적 · 치밀함',
    logline: `${location}에서 발생한 ${crime} 사건. 플레이어들은 ${clue}을(를) 추적하며 ${offender}의 완전범죄를 파헤친다.`,
    synopsis: `${result.summary.caseOverview} 플레이어들은 수사관이 되어 현장에 남겨진 단서를 분석하고, ${tech}을(를) 활용해 사건의 진실에 다가간다.`,
    beats: beats0,
    meta: { playtime: '60분', playerCount: '2-6인', twistIntensity: 'medium' },
    investigation: inv,
  };

  // ── Slot 1: 심리 스릴러 (인물 심리 관점) ───────────────────────────────────

  const beats1: StoryBeat[] = [
    { label: '기', description: `${victim}의 실종 소식이 전해진다. ${location}에는 불안한 기운이 감돈다.` },
    { label: '승', description: `관계자들의 증언 속에서 ${motive}과(와) 얽힌 복잡한 인간관계가 드러난다.` },
    { label: '전', description: `${offender}의 과거가 밝혀지며, 사건의 숨겨진 감정선이 폭발한다.` },
    { label: '반전', description: `${victim}과(와) ${offender}의 관계에 충격적인 비밀이 존재했다.` },
    { label: '결', description: `진실이 밝혀지며, 참가자들은 선택의 기로에 선다.` },
  ];

  const proposal1: StoryProposal = {
    id: `scenario-${ts}-1`,
    slot: 1,
    title: `${location}의 비밀`,
    genre: '심리 스릴러',
    tone: '긴장감 · 몰입',
    logline: `${motive}에 의해 촉발된 사건. ${offender}와 ${victim} 사이의 숨겨진 관계가 밝혀질 때, 진짜 공포가 시작된다.`,
    synopsis: `플레이어들은 사건 관계자가 되어 ${location}에 갇힌 채 서로의 비밀을 파헤친다. ${clue}이(가) 발견될수록 불신이 커지고, 진실은 예상을 뛰어넘는다.`,
    beats: beats1,
    meta: { playtime: '60분', playerCount: '2-6인', twistIntensity: 'high' },
    investigation: inv,
  };

  // ── Slot 2: 서스펜스 (탈출/생존 관점) ──────────────────────────────────────

  const beats2: StoryBeat[] = [
    { label: '기', description: `플레이어들은 ${location}에 초대받지만, 곧 출구가 봉쇄된다.` },
    { label: '승', description: `${crime} 사건의 흔적을 발견하고, ${clue}을(를) 단서로 탈출 경로를 찾기 시작한다.` },
    { label: '전', description: `${offender}의 함정이 하나씩 드러나며 시간이 줄어든다.` },
    { label: '반전', description: `${motive}의 진짜 이유가 밝혀지고, 탈출 방법 자체가 함정이었음을 깨닫는다.` },
    { label: '결', description: `최종 퍼즐을 풀고 ${tech}을(를) 활용해 탈출에 성공한다.` },
  ];

  const proposal2: StoryProposal = {
    id: `scenario-${ts}-2`,
    slot: 2,
    title: `${location} 탈출`,
    genre: '서스펜스',
    tone: '긴박 · 스릴',
    logline: `${location}에 갇힌 플레이어들. ${offender}가 설계한 함정 속에서 ${clue}을(를) 찾아 탈출해야 한다.`,
    synopsis: `${crime} 사건이 발생한 ${location}. 플레이어들은 제한된 시간 안에 단서를 모아 탈출해야 한다. ${tech}을(를) 활용한 최종 퍼즐이 출구를 열어준다.`,
    beats: beats2,
    meta: { playtime: '60분', playerCount: '2-6인', twistIntensity: 'medium' },
    investigation: inv,
  };

  return [proposal0, proposal1, proposal2];
}
