import { describe, expect, it } from "vitest";
import { buildDailyTasks } from "./planner";
import { defaultProgress } from "./storage";
import type { KnowledgePoint, Question } from "../types";

const now = new Date("2026-11-08T10:00:00");

const topics: KnowledgePoint[] = [
  {
    id: "topic-a",
    name: "考点A",
    subject: "math",
    summary: "",
    examWeight: "high",
    status: "learning",
    lesson: {
      objectives: ["目标"],
      keyIdea: "思路",
      concepts: [],
      formulas: [],
      workedExamples: [],
      pitfalls: [],
      strategy: "策略",
    },
  },
  {
    id: "topic-b",
    name: "考点B",
    subject: "math",
    summary: "",
    examWeight: "medium",
    status: "learning",
  },
];

function question(id: string, topicId: string): Question {
  return {
    id,
    subject: "math",
    knowledgePointIds: [topicId],
    displayType: "单选题",
    type: "single-choice",
    difficulty: 3,
    estimatedSeconds: 30,
    stem: "stem",
    source: "test",
    explanation: "explanation",
    options: [
      { key: "A", label: "A" },
      { key: "B", label: "B" },
    ],
    answer: "A",
  };
}

const questions = [
  ...Array.from({ length: 5 }, (_, i) => question(`a-${i}`, "topic-a")),
  ...Array.from({ length: 5 }, (_, i) => question(`b-${i}`, "topic-b")),
];

describe("phase-aware daily planner", () => {
  it("prioritizes unread lessons during the foundation phase", () => {
    const tasks = buildDailyTasks({
      date: now,
      topics,
      questions,
      progress: defaultProgress,
      sprintPhase: "foundation",
      daysLeft: 200,
    });

    const lessonTask = tasks.find((task) => task.id.startsWith("lesson-"));
    expect(lessonTask).toBeDefined();
    expect(lessonTask?.title).toContain("通读讲解");
    expect(lessonTask?.targetTopicId).toBe("topic-a");
    // 未读讲解任务排在专项训练之前。
    expect(tasks[0].id.startsWith("lesson-")).toBe(true);
  });

  it("narrows topic training to one weakest topic during the sprint phase", () => {
    const foundationTasks = buildDailyTasks({
      date: now,
      topics,
      questions,
      progress: defaultProgress,
      sprintPhase: "specialized",
    });
    const sprintTasks = buildDailyTasks({
      date: now,
      topics,
      questions,
      progress: defaultProgress,
      sprintPhase: "sprint",
      daysLeft: 10,
    });

    const count = (tasks: ReturnType<typeof buildDailyTasks>) =>
      tasks.filter((task) => task.id.startsWith("topic-")).length;

    expect(count(foundationTasks)).toBe(2);
    expect(count(sprintTasks)).toBe(1);
    expect(sprintTasks.find((task) => task.id.startsWith("exam-"))?.description).toContain(
      "冲刺期"
    );
  });

  it("keeps review and summary tasks in every phase", () => {
    ["foundation", "specialized", "sprint", "final"].forEach((phase) => {
      const tasks = buildDailyTasks({
        date: now,
        topics,
        questions,
        progress: defaultProgress,
        sprintPhase: phase as "foundation",
      });
      expect(tasks.some((task) => task.id.startsWith("summary-"))).toBe(true);
    });
  });
});
