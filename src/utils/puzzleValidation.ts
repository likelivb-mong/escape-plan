import type { PuzzleDesignResponse } from '../types/puzzleRecommendation';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  data?: any;
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'critical' | 'high';
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

/**
 * 메인 검증 함수
 */
export function validatePuzzleResponse(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    // 1. 기본 구조 검증
    if (typeof data !== 'object' || !data) {
      return {
        isValid: false,
        errors: [
          {
            path: 'root',
            message: '유효한 JSON 객체여야 합니다',
            severity: 'critical',
          },
        ],
        warnings: [],
      };
    }

    // 2. 필수 필드 확인
    if (!('projectSummary' in data) || !('puzzles' in data)) {
      return {
        isValid: false,
        errors: [
          {
            path: 'root',
            message: 'projectSummary와 puzzles 필드가 필수입니다',
            severity: 'critical',
          },
        ],
        warnings: [],
      };
    }

    // 3. Zod 스키마 검증 대신 기본 검증
    try {
      const validated = data as PuzzleDesignResponse;

      // 4. 비즈니스 로직 검증
      const businessErrors = validateBusinessRules(validated);
      errors.push(...businessErrors);

      // 5. 경고 생성
      const businessWarnings = generateWarnings(validated);
      warnings.push(...businessWarnings);

      return {
        isValid: errors.filter(e => e.severity === 'critical').length === 0,
        errors,
        warnings,
        data: validated,
      };
    } catch (zodError) {
      return {
        isValid: false,
        errors: [
          {
            path: 'root',
            message: `검증 오류: ${zodError}`,
            severity: 'high',
          },
        ],
        warnings: [],
      };
    }
  } catch (error) {
    errors.push({
      path: 'root',
      message: `검증 중 예상치 못한 오류: ${error}`,
      severity: 'critical',
    });
    return { isValid: false, errors, warnings };
  }
}

/**
 * 비즈니스 규칙 검증
 */
function validateBusinessRules(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.puzzles || data.puzzles.length === 0) {
    errors.push({
      path: 'puzzles',
      message: '최소 1개 이상의 퍼즐이 필요합니다',
      severity: 'critical',
    });
    return errors;
  }

  // 각 퍼즐의 검증
  data.puzzles.forEach((puzzle: any, idx: number) => {
    if (!puzzle.answer || puzzle.answer.trim().length === 0) {
      errors.push({
        path: `puzzles[${idx}].answer`,
        message: '정답이 비어있습니다',
        severity: 'high',
      });
    }

    if (!puzzle.reward || puzzle.reward.trim().length < 3) {
      errors.push({
        path: `puzzles[${idx}].reward`,
        message: '보상이 명확하지 않습니다',
        severity: 'high',
      });
    }
  });

  return errors;
}

/**
 * 경고 생성
 */
function generateWarnings(data: any): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // 같은 유형의 퍼즐 반복
  const typeCount: Record<string, number> = {};
  data.puzzles.forEach((p: any) => {
    typeCount[p.puzzleType] = (typeCount[p.puzzleType] || 0) + 1;
  });

  Object.entries(typeCount).forEach(([type, count]) => {
    if ((count as number) > Math.ceil(data.puzzles.length / 2)) {
      warnings.push({
        path: 'puzzles',
        message: `퍼즐 유형 "${type}"이 ${(count as number)}개로 많습니다`,
        suggestion: '다른 유형의 퍼즐을 추가하는 것을 권장합니다',
      });
    }
  });

  // 난이도 분포
  const difficulties = data.puzzles.map((p: any) => p.estimatedDifficulty || 3);
  const avgDifficulty = difficulties.reduce((a: number, b: number) => a + b, 0) / difficulties.length;

  if (avgDifficulty > 4) {
    warnings.push({
      path: 'puzzles',
      message: `전체 평균 난이도가 ${avgDifficulty.toFixed(1)}/5로 높습니다`,
      suggestion: '초보자 친화적인 퍼즐을 추가하는 것을 고려하세요',
    });
  }

  // 시간 초과
  const totalTime = data.puzzles.reduce((sum: number, p: any) => sum + (p.estimatedTime || 5), 0);
  if (totalTime > 120) {
    warnings.push({
      path: 'puzzles',
      message: `예상 총 플레이 시간: ${totalTime}분 (장시간)`,
      suggestion: '일부 퍼즐을 제거하거나 시간을 단축하는 것을 검토하세요',
    });
  }

  return warnings;
}

/**
 * 에러 메시지 포맷팅
 */
export function formatValidationErrors(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push('❌ 오류:');
    result.errors.forEach(err => {
      lines.push(`  - [${err.path}] ${err.message}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push('\n⚠️ 경고:');
    result.warnings.forEach(warn => {
      lines.push(`  - [${warn.path}] ${warn.message}`);
      if (warn.suggestion) {
        lines.push(`    💡 ${warn.suggestion}`);
      }
    });
  }

  return lines.join('\n');
}
