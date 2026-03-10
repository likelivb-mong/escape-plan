import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  PuzzleDesignResponse,
} from '../types/puzzleRecommendation';
import { PUZZLE_DESIGN_SYSTEM_PROMPT, buildUserPromptForPuzzleGeneration } from './puzzleDesignPrompts';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000]; // ms

export interface GenerationOptions {
  onStep?: (step: string) => void;
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

/**
 * 메인 AI 퍼즐 생성 함수
 * 프로젝트 데이터 + 선택된 스토리 → AI 퍼즐 설계안
 */
export async function generateAIPuzzleRecommendations(
  projectData: {
    title: string;
    genre: string;
    tone: string;
    playTime: number;
    difficulty: string;
    playerCount: number;
    roomCount: number;
    availableDevices: string[];
    preferredLockTypes: string[];
  },
  selectedStory: {
    title: string;
    synopsis: string;
    genre: string;
    tone: string;
    acts: Array<{ name: '기' | '승' | '전' | '반전' | '결'; description: string }>;
    characters: Array<{ name: string; role: string }>;
    twist: string;
    storyKeywords: string[];
  },
  puzzleFlowPlan: any,
  mandalartKeywords: string[],
  options: GenerationOptions = {},
): Promise<PuzzleDesignResponse> {
  const { onStep } = options;

  try {
    onStep?.('프로젝트 컨텍스트 구성 중...');

    // 1. 컨텍스트 빌드
    const context = {
      projectId: Date.now().toString(),
      themeTitle: projectData.title,
      genre: projectData.genre,
      tone: projectData.tone,
      playTime: projectData.playTime,
      difficulty: projectData.difficulty,
      playerCount: projectData.playerCount,
      roomCount: projectData.roomCount,
      availableDevices: projectData.availableDevices,
      preferredLockTypes: projectData.preferredLockTypes,
      selectedStory: {
        id: 'story-' + Date.now(),
        title: selectedStory.title,
        synopsis: selectedStory.synopsis,
        genre: selectedStory.genre,
        tone: selectedStory.tone,
        acts: selectedStory.acts,
        characters: selectedStory.characters,
        twist: selectedStory.twist,
        storyKeywords: selectedStory.storyKeywords,
      },
      puzzleFlowPlan,
      mandalartKeywords,
    };

    // 2. 프롬프트 생성
    onStep?.('AI 프롬프트 구성 중...');
    const userPrompt = buildUserPromptForPuzzleGeneration(context);

    // 3. AI 호출
    onStep?.('Gemini API 요청 중...');
    const rawResponse = await callGeminiWithRetry(userPrompt, onStep);

    // 4. 파싱 및 검증
    onStep?.('응답 검증 중...');
    const parsed = parseAiResponse(rawResponse);

    // 5. 엔리치먼트
    onStep?.('퍼즐 데이터 정규화 중...');
    const enriched = enrichPuzzleResponse(parsed);

    onStep?.('완료!');
    return enriched;
  } catch (error) {
    console.error('[AI Generation Error]', error);
    throw new Error(
      error instanceof Error ? error.message : 'AI 퍼즐 생성 중 알 수 없는 오류 발생',
    );
  }
}

/**
 * Gemini API 호출 (재시도 로직 포함)
 */
async function callGeminiWithRetry(
  userPrompt: string,
  onStep?: (msg: string) => void,
): Promise<string> {
  const apiKey = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_KEY;
  if (!apiKey) {
    throw new Error('Google Generative AI 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-2.0-flash', 'gemini-1.5-pro'];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const modelName = attempt < 1 ? models[0] : models[1];
    onStep?.(`요청 중... (${modelName}, 시도 ${attempt + 1}/${MAX_RETRIES})`);

    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: userPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 15000,
          temperature: 0.7,
          topP: 0.8,
          responseMimeType: 'application/json',
        },
        systemInstruction: PUZZLE_DESIGN_SYSTEM_PROMPT,
      });

      const responseText = result.response.text();
      if (!responseText) {
        throw new Error('빈 응답 받음');
      }

      return responseText;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[attempt];
        onStep?.(`오류 발생. ${delay}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('AI 요청 최대 재시도 초과');
}

/**
 * AI 응답 파싱 (JSON 추출 포함)
 */
export function parseAiResponse(rawText: string): PuzzleDesignResponse {
  let jsonString = rawText.trim();

  // JSON 코드 블록에서 추출
  const jsonBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    jsonString = jsonBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed as PuzzleDesignResponse;
  } catch (parseError) {
    console.error('[Parse Error]', parseError);
    throw new Error(
      `AI 응답 파싱 실패: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
    );
  }
}

/**
 * 응답 후 처리 (내부 링크 생성, 타임스탐프 등)
 */
function enrichPuzzleResponse(response: PuzzleDesignResponse): PuzzleDesignResponse {
  const timestamp = Date.now();
  const puzzles = response.puzzles.map((puzzle, index) => ({
    ...puzzle,
    id: `puzzle-${timestamp}-${index}`,
    generatedAt: new Date().toISOString(),
    variant: 0,
    predecessorPuzzleId: index > 0 ? response.puzzles[index - 1].id : undefined,
    successorPuzzleId: index < response.puzzles.length - 1 ? response.puzzles[index + 1].id : undefined,
  }));

  return {
    ...response,
    puzzles,
  };
}
