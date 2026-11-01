import { describe, expect, it } from "vitest";
import {
  calculateLearningStreak,
  calculateTopicStats,
  getQuestionStats,
} from "./mastery";
import type { AttemptRecord, Question } from "../types";

const now = new Date("2026-10-31T12:00:00Z");

function attempt(
  id: string,
  status: AttemptRecord["status"],
  daysAgo: number
): AttemptRecord {
  return {
    id,
    questionId: "question",
    status,
    userAnswer: status === "skipped" ? "" : "answer",
    timeSpentSeconds: 30,
    attemptedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
  };
}

const question: Question = {
  id: "question",
  subject: "math",
  knowledgePointIds: ["topic"],
  displayType: "测试题",
  type: "single-choice",
  difficulty: 4,
  estimatedSeconds: 60,
  stem: "stem",
  source: "test",
  explanation: "explanation",
  options: [
    { key: "A", label: "A" },
    { key: "B", label: "B" },
  ],
  answer: "A",
};

describe("mastery model", () => {
  it("weights recent attempts more strongly than old attempts", () => {
    const stats = getQuestionStats(
      "question",
      [attempt("old", "wrong", 30), attempt("recent", "correct", 1)],
      now
    );

    expect(stats.attempts).toBe(2);
    expect(stats.accuracy).toBe(50);
    expect(stats.weightedAccuracy).toBeGreaterThan(50);
  });

  it("applies difficulty weighting when aggregating a topic", () => {
    const attempts = [attempt("correct", "correct", 1)];
    const hardTopic = calculateTopicStats("topic", [question], attempts, now);

    const easyQuestion: Question = { ...question, difficulty: 1 };
    const easyTopic = calculateTopicStats("topic", [easyQuestion], attempts, now);

    expect(hardTopic.weightedAccuracy).toBe(100);
    expect(easyTopic.weightedAccuracy).toBe(92);
    expect(hardTopic.mastery).toBeGreaterThan(easyTopic.mastery);
  });

  it("counts local learning streak across consecutive days", () => {
    const attempts = [
      attempt("today", "correct", 0),
      attempt("yesterday", "wrong", 1),
    ];
    expect(calculateLearningStreak(attempts, now)).toBeGreaterThanOrEqual(1);
  });
});
