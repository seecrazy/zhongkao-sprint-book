import { describe, expect, it } from "vitest";
import { gradeQuestion, parseNumericValue } from "./grading";
import type {
  ChoiceQuestion,
  ExpressionQuestion,
  NumericQuestion,
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
