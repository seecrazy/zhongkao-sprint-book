import { describe, expect, it } from "vitest";
import { defaultProgress, recordAttempt } from "./storage";

describe("spaced review scheduling", () => {
  it("adds a mistake and resets progress after a later wrong answer", () => {
    let progress = recordAttempt(defaultProgress, {
      questionId: "question",
      status: "wrong",
      userAnswer: "A",
      timeSpentSeconds: 20,
    });

    expect(progress.mistakes.question.reviewStage).toBe(0);

    progress = recordAttempt(progress, {
      questionId: "question",
      status: "correct",
      userAnswer: "B",
      timeSpentSeconds: 20,
    });
    progress = recordAttempt(progress, {
      questionId: "question",
      status: "correct",
      userAnswer: "B",
      timeSpentSeconds: 20,
    });

    expect(progress.mistakes.question.consecutiveCorrect).toBe(2);
    expect(progress.mistakes.question.reviewStage).toBe(1);

    progress = recordAttempt(progress, {
      questionId: "question",
      status: "wrong",
      userAnswer: "C",
      timeSpentSeconds: 20,
    });

    expect(progress.mistakes.question.reviewStage).toBe(0);
    expect(progress.mistakes.question.consecutiveCorrect).toBe(0);
  });
});
