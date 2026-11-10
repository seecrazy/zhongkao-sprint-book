import { describe, expect, it } from "vitest";
import { buildWeeklyReport, formatTrend } from "./report";
import type { AttemptRecord } from "../types";

const now = new Date("2026-11-08T20:00:00");

function attempt(id: string, dayOffset: number, status: AttemptRecord["status"]): AttemptRecord {
  return {
    id,
    questionId: `q-${id}`,
    status,
    userAnswer: "a",
    timeSpentSeconds: 30,
    attemptedAt: new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000).toISOString(),
  };
}

describe("weekly report", () => {
  it("summarizes the last 7 days and compares with the previous week", () => {
    const attempts = [
      attempt("t1", 0, "correct"),
      attempt("t2", 1, "wrong"),
      attempt("t3", 1, "correct"),
      attempt("t4", 3, "correct"),
      // 上一周（8 天前及以上）
      attempt("p1", 10, "wrong"),
      attempt("p2", 11, "wrong"),
      attempt("p3", 12, "correct"),
    ];

    const report = buildWeeklyReport(attempts, now);

    expect(report.attemptCount).toBe(4);
    expect(report.correctCount).toBe(3);
    expect(report.wrongCount).toBe(1);
    expect(report.accuracy).toBe(75);
    expect(report.activeDays).toBe(3);
    expect(report.totalSeconds).toBe(120);
    expect(report.previousAttemptCount).toBe(3);
    expect(report.previousAccuracy).toBe(33);
  });

  it("returns an empty report when nothing was attempted", () => {
    const report = buildWeeklyReport([], now);
    expect(report.attemptCount).toBe(0);
    expect(report.accuracy).toBe(0);
    expect(report.activeDays).toBe(0);
  });

  it("formats week-over-week trend text", () => {
    expect(formatTrend(0, 0)).toBe("暂无对比");
    expect(formatTrend(4, 0)).toBe("本周已开局");
    expect(formatTrend(5, 10)).toBe("较上周 -50%");
    expect(formatTrend(20, 10)).toBe("较上周 +100%");
    expect(formatTrend(8, 8)).toBe("与上周持平");
  });
});
