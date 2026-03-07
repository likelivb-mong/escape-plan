# XCAPE AI - 방탈출 테마 기획 도구

방탈출(Escape Room) 테마를 AI 기반으로 기획하고 설계하는 웹 애플리케이션입니다.

## 🎯 주요 기능

### 1. 홈 (3가지 시작 방식)
- **YouTube로 시작**: YouTube 영상 URL을 입력하면 AI가 분석해 테마 제안
- **새 프로젝트 생성**: 직접 장르, 플레이타임, 수사 키워드 선택으로 시작
- **사건 구성**: 가해자, 피해자, 범행 동기, 수사 단서 등으로 시나리오 작성

### 2. 스토리 (AI 제안)
사건 구성 또는 기본 정보로부터 3가지 스토리 제안 생성:
- 추리 미스터리 (수사 관점)
- 심리 스릴러 (인물 심리 관점)
- 서스펜스 (탈출/생존 관점)

### 3. 만다라트 (9×9 보드)
- 선택한 스토리를 기반으로 9×9 만다라트 보드 자동 생성
- 세 가지 색상으로 요소 분류:
  - 🌹 Rose: 컨셉
  - 🌊 Sky: 연출/장치
  - 🟠 Amber: 단서/소품
- 직접 편집 및 커스터마이징 가능

### 4. 퍼즐 설계 (Game Flow)
- 5단계 게임 플로우 (기/승/전/반전/결)
- 각 단계별 퍼즐 추천
- 스토리 연결고리 확인

## 🛠️ 기술 스택

- **Frontend**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS v4
- **Routing**: React Router v7
- **Deployment**: Vercel

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm preview
```

## 🌐 배포

- **레포지토리**: https://github.com/likelivb-mong/escape-plan
- **배포 URL**: https://escape-plan-tool.vercel.app

## 📝 흐름 통합

```
홈 (3가지 시작) → 스토리 (3가지 제안) → 만다라트 (편집) → 퍼즐 설계 (Game Flow)
```

---

**개발**: Claude Opus 4.6
