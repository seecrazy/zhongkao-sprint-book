import { describe, expect, it } from "vitest";
import { gradeQuestion } from "./grading";
import type {
  ChoiceQuestion,
  ExpressionQuestion,
  NumericQuestion,
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
