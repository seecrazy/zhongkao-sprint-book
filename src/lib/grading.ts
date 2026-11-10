import type {
  EssayQuestion,
  EssayRubricDimension,
  Question,
  QuestionResult,
  ShortAnswerQuestion,
  UserResponse,
} from "../types";
import { areExpressionsEquivalent } from "./expression";

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

/** 短答题匹配前的归一化：全角转半角、去空白与常见标点，保留文字本身。 */
function normalizeForMatching(value: string): string {
  return toHalfWidth(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。！？；：、,.!?;:()'’"“”]/g, "");
}

export interface EssayAnswerPayload {
  text: string;
  selfScores: Record<string, number>;
}

const TRANSITION_WORDS = [
  "首先", "其次", "然后", "接着", "最后", "总之", "因此", "然而",
  "但是", "不仅", "一方面", "另一方面", "例如", "与此同时", "换句话说",
  "事实上", "由此可见", "或者说", "甚至",
];

export interface EssayAutoMetrics {
  charCount: number;
  paragraphCount: number;
  transitionHits: string[];
  meetsParagraphExpectation: boolean;
}

export function analyzeEssayText(text: string): EssayAutoMetrics {
  const trimmed = (text ?? "").trim();
  const charCount = trimmed.replace(/\s+/g, "").length;
  const paragraphs = trimmed
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const lowered = trimmed.toLowerCase();
  const transitionHits = TRANSITION_WORDS.filter((word) => lowered.includes(word));

  return {
    charCount,
    paragraphCount: paragraphs.length,
    transitionHits,
    // 记叙文/议论文至少"开头—主体—结尾"三段结构。
    meetsParagraphExpectation: paragraphs.length >= 3,
  };
}

export function parseEssayAnswer(userAnswer: string): EssayAnswerPayload {
  try {
    const parsed = JSON.parse(userAnswer) as Partial<EssayAnswerPayload>;
    return {
      text: typeof parsed.text === "string" ? parsed.text : "",
      selfScores:
        typeof parsed.selfScores === "object" && parsed.selfScores !== null
          ? parsed.selfScores
          : {},
    };
  } catch {
    return { text: userAnswer ?? "", selfScores: {} };
  }
}

function clampSelfScores(
  payload: EssayAnswerPayload,
  rubric: EssayRubricDimension[]
): Record<string, number> {
  const result: Record<string, number> = {};
  rubric.forEach((dimension) => {
    const chosen = Number(payload.selfScores[dimension.id]);
    result[dimension.id] = Number.isFinite(chosen)
      ? Math.max(0, Math.min(dimension.maxScore, chosen))
      : 0;
  });
  return result;
}

function gradeEssay(
  question: EssayQuestion,
  userAnswer: string
): QuestionResult {
  const payload = parseEssayAnswer(userAnswer);
  const metrics = analyzeEssayText(payload.text);
  const selfScores = clampSelfScores(payload, question.rubric);
  const maxScore = question.rubric.reduce((total, dim) => total + dim.maxScore, 0);
  const selfScore = question.rubric.reduce(
    (total, dim) => total + (selfScores[dim.id] ?? 0),
    0
  );

  const answered = payload.text.trim().length > 0;
  // 作文判定标准（自评练习口径）：
  // 字数达到要求的 90% 且自评得分达到满分的 80% 记为通过。
  const wordsOk = metrics.charCount >= Math.floor(question.minWords * 0.9);
  const selfOk = maxScore > 0 && selfScore >= Math.ceil(maxScore * 0.8);
  const status = !answered ? "skipped" : wordsOk && selfOk ? "correct" : "wrong";

  return {
    questionId: question.id,
    userAnswer,
    status,
    score: selfScore,
    maxScore,
    correctAnswer: question.rubric
      .map((dim) => `${dim.label} ${dim.maxScore} 分`)
      .join("；"),
    errorType: status === "correct" ? "none" : !answered ? "blank" : "concept",
  };
}

function gradeShortAnswer(
  question: ShortAnswerQuestion,
  userAnswer: string
): QuestionResult {
  const normalized = normalizeForMatching(userAnswer);
  const results = question.keyPoints.map((keyPoint) => {
    // 正向命中：patterns 为空表示该要点只做禁用词检查；
    // 负向命中：出现任一禁用词则整条要点不得分。
    const positiveHit =
      keyPoint.patterns.length === 0 ||
      keyPoint.patterns.some((pattern) =>
        normalized.includes(normalizeForMatching(pattern))
      );
    const negativeHit = (keyPoint.notPatterns ?? []).some((pattern) =>
      normalized.includes(normalizeForMatching(pattern))
    );

    return {
      keyPoint,
      hit: normalized.length > 0 && positiveHit && !negativeHit,
    };
  });

  const score = results.reduce(
    (total, item) => total + (item.hit ? item.keyPoint.score : 0),
    0
  );
  const maxScore = question.keyPoints.reduce(
    (total, keyPoint) => total + keyPoint.score,
    0
  );
  const answered = userAnswer.trim().length > 0;
  const status = !answered
    ? "skipped"
    : score === maxScore
      ? "correct"
      : "wrong";

  return {
    questionId: question.id,
    userAnswer,
    status,
    score,
    maxScore,
    correctAnswer: question.referenceAnswer,
    errorType:
      status === "correct" ? "none" : !answered ? "blank" : "concept",
  };
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

  if (question.type === "essay") {
    return gradeEssay(question, userAnswer);
  }

  if (question.type === "short-answer") {
    return gradeShortAnswer(question, userAnswer);
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

  if (answerKind === "algebraic") {
    // 代数等价：把学生答案与每个参考答案都当作一元代数式，
    // 在采样点上函数值一致即等价；无法解析时降级为文本精确匹配。
    const matched = question.acceptedAnswers.some((answer) => {
      const equivalent = areExpressionsEquivalent(userAnswer, answer);
      if (equivalent !== null) return equivalent;
      return normalizeText(answer) === normalizedUser;
    });

    return {
      ...base,
      status: matched ? "correct" : "wrong",
      score: matched ? 1 : 0,
      correctAnswer: question.acceptedAnswers[0],
      errorType: matched ? "none" : "concept",
    };
  }

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
  if (question.type === "essay") {
    return question.rubric
      .map((dim) => `${dim.label} ${dim.maxScore} 分`)
      .join("；");
  }
  if (question.type === "short-answer") return question.referenceAnswer;
  if (question.type === "numeric") return String(question.answer);
  return question.acceptedAnswers[0];
}
