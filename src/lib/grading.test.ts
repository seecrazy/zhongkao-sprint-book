import { describe, expect, it } from "vitest";
import { analyzeEssayText, gradeQuestion, parseNumericValue } from "./grading";
import type {
  ChoiceQuestion,
  EssayQuestion,
  ExpressionQuestion,
  NumericQuestion,
  ShortAnswerQuestion,
  SolutionQuestion,
} from "../types";

const base = {
  id: "test-question",
  subject: "math" as const,
  knowledgePointIds: ["topic"],
  displayType: "测试题",
  difficulty: 3 as const,
  estimatedSeconds: 60,
  stem: "test stem",
  source: "unit test",
  explanation: "test explanation",
};

const choice: ChoiceQuestion = {
  ...base,
  type: "single-choice",
  options: [
    { key: "A", label: "1" },
    { key: "B", label: "2" },
  ],
  answer: "B",
};

const numeric: NumericQuestion = {
  ...base,
  type: "numeric",
  answer: 3.14,
  tolerance: 0.01,
};

const solutionExpression: ExpressionQuestion = {
  ...base,
  type: "expression",
  acceptedAnswers: ["x = 2 或 x = 3"],
  answerKind: "solution-set",
};

const textExpression: ExpressionQuestion = {
  ...base,
  type: "expression",
  acceptedAnswers: ["x >= -3"],
  answerKind: "text",
};

const algebraicExpression: ExpressionQuestion = {
  ...base,
  type: "expression",
  acceptedAnswers: ["(x+1)(x-1)"],
  answerKind: "algebraic",
};

const shortAnswer: ShortAnswerQuestion = {
  ...base,
  type: "short-answer",
  keyPoints: [
    { label: "温故：复习学过的知识", patterns: ["温故"], score: 2 },
    { label: "而知新：获得新的理解", patterns: ["知新"], score: 2 },
  ],
  referenceAnswer: "温故而知新，可以为师矣。",
};

const shortAnswerWithBan: ShortAnswerQuestion = {
  ...base,
  type: "short-answer",
  keyPoints: [
    {
      label: "没有直接使用'安静'一词",
      patterns: [],
      notPatterns: ["安静"],
      score: 2,
    },
    {
      label: "运用了细节描写",
      patterns: ["笔", "风扇", "翻书", "呼吸", "粉笔"],
      notPatterns: ["安静"],
      score: 2,
    },
  ],
  referenceAnswer: "教室里只听得见笔尖的沙沙声。",
};

const essay: EssayQuestion = {
  ...base,
  type: "essay",
  genre: "记叙文",
  minWords: 50,
  outlineHints: ["围绕一件具体的事展开", "写出细节和心理变化"],
  rubric: [
    {
      id: "content",
      label: "内容与情感",
      maxScore: 30,
      levels: [
        { label: "切题且有真情实感", score: 25 },
        { label: "基本切题", score: 18 },
        { label: "偏离题意", score: 8 },
      ],
    },
    {
      id: "structure",
      label: "结构条理",
      maxScore: 20,
      levels: [
        { label: "层次清晰详略得当", score: 17 },
        { label: "结构完整", score: 12 },
        { label: "条理不清", score: 5 },
      ],
    },
  ],
};

function essayAnswer(text: string, selfScores: Record<string, number>) {
  return JSON.stringify({ text, selfScores });
}

describe("gradeQuestion", () => {
  it("scores single-choice answers", () => {
    const correct = gradeQuestion(choice, { questionId: choice.id, value: "b" });
    const wrong = gradeQuestion(choice, { questionId: choice.id, value: "A" });
    const skipped = gradeQuestion(choice, { questionId: choice.id, value: "" });

    expect(correct.status).toBe("correct");
    expect(correct.score).toBe(1);
    expect(wrong.status).toBe("wrong");
    expect(skipped.status).toBe("skipped");
  });

  it("supports numeric tolerance", () => {
    const correct = gradeQuestion(numeric, { questionId: numeric.id, value: "3.148" });
    const wrong = gradeQuestion(numeric, { questionId: numeric.id, value: "3.2" });

    expect(correct.status).toBe("correct");
    expect(wrong.status).toBe("wrong");
  });

  it("grades solution sets independent of order and wording", () => {
    const values = ["x=2,x=3", "3 或 2", "x1=2,x2=3"];
    values.forEach((value) => {
      const result = gradeQuestion(solutionExpression, {
        questionId: solutionExpression.id,
        value,
      });
      expect(result.status).toBe("correct");
    });

    const incomplete = gradeQuestion(solutionExpression, {
      questionId: solutionExpression.id,
      value: "x = 2",
    });
    expect(incomplete.status).toBe("wrong");
  });

  it("does not confuse direction in text expressions", () => {
    const correct = gradeQuestion(textExpression, {
      questionId: textExpression.id,
      value: "x≥-3",
    });
    const wrong = gradeQuestion(textExpression, {
      questionId: textExpression.id,
      value: "x <= -3",
    });

    expect(correct.status).toBe("correct");
    expect(wrong.status).toBe("wrong");
  });
});

describe("parseNumericValue", () => {
  it("parses plain decimals, negatives and thousands separators", () => {
    expect(parseNumericValue("25")).toBe(25);
    expect(parseNumericValue("-3.5")).toBe(-3.5);
    expect(parseNumericValue("1,200")).toBe(1200);
  });

  it("parses fractions", () => {
    expect(parseNumericValue("3/4")).toBeCloseTo(0.75);
    expect(parseNumericValue("-1/2")).toBeCloseTo(-0.5);
  });

  it("parses scientific notation in several notations", () => {
    expect(parseNumericValue("1.2e3")).toBe(1200);
    expect(parseNumericValue("1.2×10^3")).toBe(1200);
    expect(parseNumericValue("1.2×10³")).toBe(1200);
    expect(parseNumericValue("3×10⁻²")).toBeCloseTo(0.03);
  });

  it("accepts trailing units but rejects numbers hiding inside them", () => {
    expect(parseNumericValue("25 N")).toBe(25);
    expect(parseNumericValue("1.5kg")).toBe(1.5);
    expect(parseNumericValue("50%")).toBe(50);
    expect(parseNumericValue("２５")).toBe(25);
    expect(parseNumericValue("3米5")).toBeNull();
    expect(parseNumericValue("abc")).toBeNull();
    expect(parseNumericValue("")).toBeNull();
  });

  it("grades numeric questions with fraction and scientific inputs", () => {
    const fractionQuestion: NumericQuestion = {
      ...base,
      type: "numeric",
      answer: 0.75,
      tolerance: 0.001,
    };
    const scienceQuestion: NumericQuestion = {
      ...base,
      type: "numeric",
      answer: 1200,
      tolerance: 0.001,
    };

    expect(
      gradeQuestion(fractionQuestion, {
        questionId: fractionQuestion.id,
        value: "3/4",
      }).status
    ).toBe("correct");
    expect(
      gradeQuestion(scienceQuestion, {
        questionId: scienceQuestion.id,
        value: "1.2×10³",
      }).status
    ).toBe("correct");
  });

  it("grades solution steps with tolerant numeric parsing", () => {
    const solution: SolutionQuestion = {
      ...base,
      type: "solution",
      steps: [
        { prompt: "速度", answer: 15, score: 2 },
        { prompt: "时间", answer: 4, score: 2 },
      ],
    };

    const result = gradeQuestion(solution, {
      questionId: solution.id,
      value: JSON.stringify(["15 m/s", "4s"]),
    });

    expect(result.status).toBe("correct");
    expect(result.score).toBe(4);
  });
});

describe("algebraic expression grading", () => {
  it("accepts equivalent but differently written forms", () => {
    ["x^2-1", "x*x-1", "（x＋1）（x－1）".replace(/－/g, "-")]
      .concat("y=x^2-1")
      .forEach((value) => {
        const result = gradeQuestion(algebraicExpression, {
          questionId: algebraicExpression.id,
          value,
        });
        expect(result.status).toBe("correct");
      });
  });

  it("rejects non-equivalent answers and falls back for unparseable ones", () => {
    expect(
      gradeQuestion(algebraicExpression, {
        questionId: algebraicExpression.id,
        value: "x^2+1",
      }).status
    ).toBe("wrong");

    // 无法解析时降级为文本匹配：与参考答案完全一致才算对。
    expect(
      gradeQuestion(algebraicExpression, {
        questionId: algebraicExpression.id,
        value: "(x+1)(x-1)",
      }).status
    ).toBe("correct");
  });
});

describe("short-answer grading", () => {
  it("awards partial credit by key point hits", () => {
    const partial = gradeQuestion(shortAnswer, {
      questionId: shortAnswer.id,
      value: "复习的时候能有新的体会，这就是知新",
    });
    expect(partial.status).toBe("wrong");
    expect(partial.score).toBe(2);
    expect(partial.maxScore).toBe(4);

    const none = gradeQuestion(shortAnswer, {
      questionId: shortAnswer.id,
      value: "复习旧知识能有新体会",
    });
    expect(none.score).toBe(0);

    const all = gradeQuestion(shortAnswer, {
      questionId: shortAnswer.id,
      value: "温故而知新：复习旧知识能有新体会",
    });
    expect(all.status).toBe("correct");
    expect(all.score).toBe(4);
  });

  it("ignores punctuation and case when matching", () => {
    const result = gradeQuestion(shortAnswer, {
      questionId: shortAnswer.id,
      value: "温故、而知新！",
    });
    expect(result.score).toBe(4);
  });

  it("marks blank answers as skipped", () => {
    const result = gradeQuestion(shortAnswer, {
      questionId: shortAnswer.id,
      value: "   ",
    });
    expect(result.status).toBe("skipped");
  });

  it("enforces banned words via notPatterns", () => {
    // 用了禁用词"安静"：两个要点都不得分。
    const banned = gradeQuestion(shortAnswerWithBan, {
      questionId: shortAnswerWithBan.id,
      value: "教室里只能听见笔尖的沙沙声，非常安静。",
    });
    expect(banned.score).toBe(0);

    // 避开禁用词且命中细节描写：满分。
    const clean = gradeQuestion(shortAnswerWithBan, {
      questionId: shortAnswerWithBan.id,
      value: "教室里只听得见笔尖划过纸面的沙沙声。",
    });
    expect(clean.status).toBe("correct");
    expect(clean.score).toBe(4);
  });
});

describe("essay grading", () => {
  const longText = Array.from({ length: 60 }, (_, i) => `第${i}句内容`).join("");

  it("passes when word count and self score thresholds are met", () => {
    const result = gradeQuestion(essay, {
      questionId: essay.id,
      value: essayAnswer(longText, { content: 25, structure: 17 }),
    });

    expect(result.status).toBe("correct");
    expect(result.score).toBe(42);
    expect(result.maxScore).toBe(50);
  });

  it("fails short essays or low self scores", () => {
    const tooShort = gradeQuestion(essay, {
      questionId: essay.id,
      value: essayAnswer("太短了", { content: 25, structure: 17 }),
    });
    expect(tooShort.status).toBe("wrong");

    const lowSelf = gradeQuestion(essay, {
      questionId: essay.id,
      value: essayAnswer(longText, { content: 8, structure: 5 }),
    });
    expect(lowSelf.status).toBe("wrong");
  });

  it("clamps self scores to rubric maximums", () => {
    const result = gradeQuestion(essay, {
      questionId: essay.id,
      value: essayAnswer(longText, { content: 999, structure: -5 }),
    });
    expect(result.score).toBe(30);
  });

  it("reports blank essays as skipped", () => {
    const result = gradeQuestion(essay, {
      questionId: essay.id,
      value: essayAnswer("", {}),
    });
    expect(result.status).toBe("skipped");
  });

  it("analyzes essay structure metrics", () => {
    const metrics = analyzeEssayText(
      "开头一段。\n首先写事。\n然后展开。\n总之收束。"
    );
    expect(metrics.paragraphCount).toBe(4);
    expect(metrics.meetsParagraphExpectation).toBe(true);
    expect(metrics.transitionHits).toContain("首先");
    expect(metrics.transitionHits).toContain("总之");
    expect(metrics.charCount).toBeGreaterThan(10);
  });
});
