import { describe, expect, it } from "vitest";
import {
  buildExamTrend,
  getExamQuestions,
  gradeExamPaper,
} from "./exam";
import type { ExamPaper, ExamResult, KnowledgePoint, Question } from "../types";

function question(id: string, topicId = "topic"): Question {
  return {
    id,
    subject: "math",
    knowledgePointIds: [topicId],
    displayType: "测试",
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

function solutionQuestion(id: string): Question {
  return {
    id,
    subject: "math",
    knowledgePointIds: ["topic"],
    displayType: "解答题",
    type: "solution",
    difficulty: 3,
    estimatedSeconds: 120,
    stem: "stem",
    source: "test",
    explanation: "explanation",
    steps: [
      { prompt: "第一步", answer: 6, score: 2 },
      { prompt: "第二步", answer: 12, score: 2 },
    ],
  };
}

const questions = [question("q1"), question("q2"), question("q3"), question("q4"), question("q5")];

const paper: ExamPaper = {
  id: "paper",
  subject: "math",
  title: "Test Paper",
  description: "Test",
  durationMinutes: 10,
  level: "mock",
  sections: [
    {
      id: "basic",
      title: "Basic",
      scorePerQuestion: 1,
      questionIds: ["q1", "q2"],
    },
    {
      id: "advanced",
      title: "Advanced",
      scorePerQuestion: 3,
      questionIds: ["q3", "q4", "q1"],
    },
  ],
};

const topics: KnowledgePoint[] = [
  { id: "topic", name: "Topic", subject: "math", summary: "", examWeight: "high", status: "learning" },
];

describe("sectioned exams", () => {
  it("flattens section questions without duplicates", () => {
    const flattened = getExamQuestions(paper, questions);
    expect(flattened.map((question) => question.id)).toEqual(["q1", "q2", "q3", "q4"]);
  });

  it("grades each section with its own score per question", () => {
    const result = gradeExamPaper({
      paper,
      topics,
      questions,
      responses: {
        q1: "A",
        q2: "B",
        q3: "A",
      },
      startedAt: "2026-10-31T10:00:00Z",
      submittedAt: "2026-10-31T10:05:00Z",
    });

    expect(result.maxScore).toBe(10);
    expect(result.score).toBe(6);
    expect(result.sectionReports).toEqual([
      expect.objectContaining({ sectionId: "basic", score: 1, maxScore: 2 }),
      expect.objectContaining({
        sectionId: "advanced",
        score: 6,
        maxScore: 9,
        correctCount: 2,
        skippedCount: 1,
      }),
    ]);
    expect(result.results.find((item) => item.questionId === "q1")?.score).toBe(3);
    expect(result.typeReports).toEqual([
      expect.objectContaining({
        displayType: "测试",
        questionCount: 4,
        correctCount: 2,
        wrongCount: 1,
        skippedCount: 1,
        score: 6,
        maxScore: 10,
      }),
    ]);
  });

  it("scales solution step scores into the section score for partial credit", () => {
    const solutionPaper: ExamPaper = {
      ...paper,
      sections: [
        {
          id: "solution-section",
          title: "解答题",
          scorePerQuestion: 8,
          questionIds: ["s1"],
        },
      ],
    };
    const result = gradeExamPaper({
      paper: solutionPaper,
      topics,
      questions: [solutionQuestion("s1"), ...questions],
      responses: { s1: JSON.stringify(["6", "0"]) },
      startedAt: "2026-10-31T10:00:00Z",
      submittedAt: "2026-10-31T10:05:00Z",
    });

    // 两步各 2 分，答对一步：步骤分 2/4，折算到 8 分分区 = 4 分。
    expect(result.score).toBe(4);
    expect(result.sectionReports[0].score).toBe(4);
    expect(result.typeReports[0]).toEqual(
      expect.objectContaining({ displayType: "解答题", score: 4, maxScore: 8 })
    );
  });
});

describe("exam trend", () => {
  it("sorts history chronologically and converts scores to percentages", () => {
    const history: ExamResult[] = [
      {
        id: "newest",
        paperId: "paper",
        paperTitle: "Newest",
        submittedAt: "2026-10-31T12:00:00Z",
        startedAt: "2026-10-31T11:00:00Z",
        score: 9,
        maxScore: 10,
        correctCount: 9,
        wrongCount: 1,
        skippedCount: 0,
        timeSpentSeconds: 600,
        results: [],
        topicReports: [],
        sectionReports: [],
        typeReports: [],
      },
      {
        id: "oldest",
        paperId: "paper",
        paperTitle: "Oldest",
        submittedAt: "2026-10-30T12:00:00Z",
        startedAt: "2026-10-30T11:00:00Z",
        score: 5,
        maxScore: 10,
        correctCount: 5,
        wrongCount: 5,
        skippedCount: 0,
        timeSpentSeconds: 600,
        results: [],
        topicReports: [],
        sectionReports: [],
        typeReports: [],
      },
    ];

    const trend = buildExamTrend(history);
    expect(trend.map((point) => point.id)).toEqual(["oldest", "newest"]);
    expect(trend.map((point) => point.scorePercent)).toEqual([50, 90]);
  });
});
