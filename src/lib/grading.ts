import type { Question, QuestionResult, UserResponse } from "../types";

const SUPERSCRIPT_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

function toHalfWidth(value: string): string {
  return value
    .replace(/[\uFF01-\uFF5E]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    .replace(/\u3000/g, " ");
}

export function normalizeText(value: string): string {
  return toHalfWidth(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/，/g, ",")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/≠/g, "!=")
    .replace(/或/g, "or")
    .replace(/±/g, "+-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/");
}

/**
 * 解析学生输入的数值答案：
 * 支持小数、分数（3/4）、科学计数法（1.2e3、1.2×10³、1.2×10^3）、
 * 全角字符、千分位逗号和尾部单位（N、kg、% 等，单位里不允许再夹数字）。
 * 无法解析为单一数值时返回 null。
 */
export function parseNumericValue(raw: string): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;

  const normalized = toHalfWidth(raw)
    .replace(/\s+/g, "")
    .replace(/，/g, ",")
    .replace(/,/g, "")
    .replace(/[×·]10\^?([+-]?\d+)/g, "e$1")
    .replace(
      new RegExp(`[×·]10([⁺⁻]?[${SUPERSCRIPT_DIGITS}]+)`, "g"),
      (_match, sup: string) =>
        `e${[...sup]
          .map((ch) => {
            if (ch === "⁺") return "+";
            if (ch === "⁻") return "-";
            return String(SUPERSCRIPT_DIGITS.indexOf(ch));
          })
          .join("")}`
    );

  const fractionMatch = normalized.match(/^([+-]?\d*\.?\d+)\/(\d*\.?\d+)$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    if (
      Number.isFinite(numerator) &&
      Number.isFinite(denominator) &&
      denominator !== 0
    ) {
      return numerator / denominator;
    }
    return null;
  }

  const numberMatch = normalized.match(
    /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)(.*)$/
  );
  if (!numberMatch) return null;

  const value = Number(numberMatch[1]);
  if (!Number.isFinite(value)) return null;

  // 尾部允许单位字符（字母、%℃°、中文单位），但不允许再出现数字。
  if (/\d/.test(numberMatch[2])) return null;

  return value;
}

function extractSolutionSet(value: string): number[] {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/，/g, ",")
    .replace(/x[₁₂₃]|x[123]/g, "x")
    .replace(/±(\d+(?:\.\d+)?)/g, "$1or-$1")
    .replace(/或|or/g, ",");

  const matches = normalized.match(/[+-]?\d+(?:\.\d+)?/g);
  if (!matches) return [];

  const numbers = matches
    .map(Number)
    .filter(Number.isFinite)
    .sort((left, right) => left - right);

  return Array.from(new Set(numbers));
}

function isSameSolutionSet(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function gradeQuestion(
  question: Question,
  response: UserResponse | undefined
): QuestionResult {
  const userAnswer = response?.value?.trim() ?? "";
  const base = {
    questionId: question.id,
    userAnswer,
    score: 0,
    maxScore: 1,
  };

  if (!userAnswer) {
    return {
      ...base,
      status: "skipped",
      correctAnswer: getCorrectAnswerText(question),
      errorType: "blank",
    };
  }

  if (question.type === "single-choice") {
    const status = userAnswer.toUpperCase() === question.answer ? "correct" : "wrong";
    return {
      ...base,
      status,
      score: status === "correct" ? 1 : 0,
      correctAnswer: question.answer,
      errorType: status === "correct" ? "none" : "concept",
    };
  }

  if (question.type === "multi-choice") {
    const normalizedUser = [
      ...new Set(userAnswer.toUpperCase().replace(/[^A-Z]/g, "").split("")),
    ]
      .sort()
      .join("");
    const normalizedAnswer = [
      ...new Set(question.answer.toUpperCase().replace(/[^A-Z]/g, "").split("")),
    ]
      .sort()
      .join("");

    const status =
      normalizedUser && normalizedUser === normalizedAnswer ? "correct" : "wrong";

    return {
      ...base,
      status,
      score: status === "correct" ? 1 : 0,
      correctAnswer: normalizedAnswer,
      errorType: status === "correct" ? "none" : "concept",
    };
  }

  if (question.type === "solution") {
    let stepAnswers: unknown[] = [];
    try {
      const parsed = JSON.parse(userAnswer);
      stepAnswers = Array.isArray(parsed) ? parsed : [];
    } catch {
      stepAnswers = [];
    }

    const results = question.steps.map((step, index) => {
      const raw = String(stepAnswers[index] ?? "").trim();
      const numeric = parseNumericValue(raw);
      const tolerance = step.tolerance ?? 0.0001;
      return {
        raw,
        correct:
          numeric !== null && Math.abs(numeric - step.answer) <= tolerance,
      };
    });

    const score = question.steps.reduce(
      (sum, step, index) => sum + (results[index].correct ? step.score : 0),
      0
    );
    const maxScore = question.steps.reduce((sum, step) => sum + step.score, 0);
    const answeredCount = results.filter((r) => r.raw !== "").length;
    const status =
      answeredCount === 0 ? "skipped" : score === maxScore ? "correct" : "wrong";

    return {
      ...base,
      status,
      score,
      maxScore,
      correctAnswer: question.steps
        .map((step, i) => `${"①②③④⑤⑥⑦⑧⑨⑩"[i] ?? ""}${step.prompt}：${step.answer}`)
        .join("；"),
      errorType: status === "correct" ? "none" : answeredCount === 0 ? "blank" : "calculation",
    };
  }

  if (question.type === "numeric") {
    const numeric = parseNumericValue(userAnswer);
    const tolerance = question.tolerance ?? 0.0001;
    const status =
      numeric !== null && Math.abs(numeric - question.answer) <= tolerance
        ? "correct"
        : "wrong";
    return {
      ...base,
      status,
      score: status === "correct" ? 1 : 0,
      correctAnswer: String(question.answer),
      errorType: status === "correct" ? "none" : "calculation",
    };
  }

  const normalizedUser = normalizeText(userAnswer);
  const answerKind = question.answerKind ?? "solution-set";

  if (answerKind === "solution-set") {
    const userSolutionSet = extractSolutionSet(userAnswer);
    const matched = userSolutionSet.length > 0
      ? question.acceptedAnswers.some((answer) => {
          const acceptedSolutionSet = extractSolutionSet(answer);
          return isSameSolutionSet(userSolutionSet, acceptedSolutionSet);
        })
      : question.acceptedAnswers.some((answer) => {
          const normalizedAnswer = normalizeText(answer);
          return normalizedUser === normalizedAnswer;
        });

    return {
      ...base,
      status: matched ? "correct" : "wrong",
      score: matched ? 1 : 0,
      correctAnswer: question.acceptedAnswers[0],
      errorType: matched ? "none" : "concept",
    };
  }

  const matched = question.acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalizeText(answer);
    return normalizedUser === normalizedAnswer;
  });

  return {
    ...base,
    status: matched ? "correct" : "wrong",
      score: matched ? 1 : 0,
    correctAnswer: question.acceptedAnswers[0],
    errorType: matched ? "none" : "concept",
  };
}

export function gradeQuestions(
  questions: Question[],
  responses: Record<string, string>
): QuestionResult[] {
  return questions.map((question) =>
    gradeQuestion(question, {
      questionId: question.id,
      value: responses[question.id] ?? "",
    })
  );
}

export function getCorrectAnswerText(question: Question): string {
  if (question.type === "single-choice") return question.answer;
  if (question.type === "multi-choice") {
    return [...question.answer.toUpperCase()].sort().join("");
  }
  if (question.type === "solution") {
    return question.steps
      .map((step, i) => `${"①②③④⑤⑥⑦⑧⑨"[i] ?? ""}${step.answer}`)
      .join("；");
  }
  if (question.type === "numeric") return String(question.answer);
  return question.acceptedAnswers[0];
}
