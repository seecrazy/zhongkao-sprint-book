import { describe, expect, it } from "vitest";
import {
  defaultProgress,
  isMistakeMastered,
  recordAttempt,
  setMistakeErrorTag,
  setMistakeManualMastered,
  toggleLessonRead,
} from "./storage";

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

describe("mistake error governance", () => {
  it("auto-tags new mistakes from the grading error type", () => {
    const progress = recordAttempt(defaultProgress, {
      questionId: "q1",
      status: "wrong",
      userAnswer: "12",
      timeSpentSeconds: 30,
      errorType: "calculation",
    });

    expect(progress.mistakes.q1.errorTag).toBe("calculation");
  });

  it("lets the student correct the tag manually", () => {
    const withMistake = recordAttempt(defaultProgress, {
      questionId: "q1",
      status: "wrong",
      userAnswer: "12",
      timeSpentSeconds: 30,
      errorType: "concept",
    });

    const updated = setMistakeErrorTag(withMistake, "q1", "reading");
    expect(updated.mistakes.q1.errorTag).toBe("reading");
    expect(setMistakeErrorTag(defaultProgress, "missing", "reading")).toBe(
      defaultProgress
    );
  });

  it("supports manually marking a mistake as mastered", () => {
    const withMistake = recordAttempt(defaultProgress, {
      questionId: "q1",
      status: "wrong",
      userAnswer: "12",
      timeSpentSeconds: 30,
    });

    expect(isMistakeMastered(withMistake.mistakes.q1)).toBe(false);

    const mastered = setMistakeManualMastered(withMistake, "q1", true);
    expect(isMistakeMastered(mastered.mistakes.q1)).toBe(true);

    const unmastered = setMistakeManualMastered(mastered, "q1", false);
    expect(isMistakeMastered(unmastered.mistakes.q1)).toBe(false);
  });
});

describe("lesson reading state", () => {
  it("toggles read state per topic and persists the rest of progress", () => {
    const withMistake = recordAttempt(defaultProgress, {
      questionId: "q1",
      status: "wrong",
      userAnswer: "12",
      timeSpentSeconds: 30,
    });

    const read = toggleLessonRead(withMistake, "topic-1");
    expect(read.readLessonIds).toEqual(["topic-1"]);
    expect(read.mistakes.q1).toBeDefined();

    const readAgain = toggleLessonRead(read, "topic-2");
    expect(readAgain.readLessonIds).toEqual(["topic-1", "topic-2"]);

    const unread = toggleLessonRead(readAgain, "topic-1");
    expect(unread.readLessonIds).toEqual(["topic-2"]);
  });
});
