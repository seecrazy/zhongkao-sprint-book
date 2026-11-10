import type { AttemptRecord, WeeklyReport } from "../types";
import { getLocalDateString } from "./mastery";

function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function collectWindow(attempts: AttemptRecord[], start: Date, end: Date) {
  const startKey = getLocalDateString(start);
  const endKey = getLocalDateString(end);
  return attempts.filter((attempt) => {
    const dateKey = getLocalDateString(new Date(attempt.attemptedAt));
    return dateKey >= startKey && dateKey <= endKey;
  });
}

function summarize(attempts: AttemptRecord[]) {
  const correctCount = attempts.filter((attempt) => attempt.status === "correct").length;
  const wrongCount = attempts.filter((attempt) => attempt.status === "wrong").length;
  const activeDays = new Set(
    attempts.map((attempt) => getLocalDateString(new Date(attempt.attemptedAt)))
  ).size;
  const totalSeconds = attempts.reduce(
    (total, attempt) => total + attempt.timeSpentSeconds,
    0
  );

  return {
    attemptCount: attempts.length,
    correctCount,
    wrongCount,
    accuracy: Math.round(safeDivide(correctCount, attempts.length) * 100),
    totalSeconds,
    activeDays,
  };
}

export function buildWeeklyReport(
  attempts: AttemptRecord[],
  now = new Date()
): WeeklyReport {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 1);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);

  const previousEnd = new Date(weekStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - 6);

  const thisWeek = summarize(collectWindow(attempts, weekStart, today));
  const lastWeek = summarize(collectWindow(attempts, previousStart, previousEnd));

  return {
    attemptCount: thisWeek.attemptCount,
    correctCount: thisWeek.correctCount,
    wrongCount: thisWeek.wrongCount,
    accuracy: thisWeek.accuracy,
    totalSeconds: thisWeek.totalSeconds,
    activeDays: thisWeek.activeDays,
    previousAttemptCount: lastWeek.attemptCount,
    previousAccuracy: lastWeek.accuracy,
  };
}

export function formatTrend(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "本周已开局" : "暂无对比";
  }
  const delta = current - previous;
  const percent = Math.round((delta / previous) * 100);
  if (delta === 0) return "与上周持平";
  return delta > 0 ? `较上周 +${percent}%` : `较上周 ${percent}%`;
}
