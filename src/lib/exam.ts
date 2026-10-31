import { gradeQuestions } from "./grading";
import type {
  ExamPaper,
  ExamResult,
  ExamTopicReport,
  KnowledgePoint,
  Question,
} from "../types";

function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function getExamQuestions(
  paper: ExamPaper,
  questions: Question[]
): Question[] {
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  return paper.questionIds
    .map((questionId) => questionMap.get(questionId))
    .filter((question): question is Question => Boolean(question));
}

export function getExamRemainingSeconds(
  paper: ExamPaper,
  startedAt: string,
  now = Date.now()
): number {
  const endTime = new Date(startedAt).getTime() + paper.durationMinutes * 60 * 1000;
  return Math.max(0, Math.round((endTime - now) / 1000));
}

export function formatExamClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function gradeExamPaper({
  paper,
  topics,
  questions,
  responses,
  startedAt,
  submittedAt = new Date().toISOString(),
}: {
  paper: ExamPaper;
  topics: KnowledgePoint[];
  questions: Question[];
  responses: Record<string, string>;
  startedAt: string;
  submittedAt?: string;
}): ExamResult {
  const examQuestions = getExamQuestions(paper, questions);
  const results = gradeQuestions(examQuestions, responses);
  const score = results.reduce((total, result) => total + result.score, 0);
  const maxScore = results.length * paper.scorePerQuestion;

  const topicReports: ExamTopicReport[] = topics
    .map((topic) => {
      const topicResults = results.filter((result) => {
        const question = examQuestions.find(
          (item) => item.id === result.questionId
        );
        return question?.knowledgePointIds.includes(topic.id);
      });

      const correctCount = topicResults.filter(
        (result) => result.status === "correct"
      ).length;
      const wrongCount = topicResults.filter(
        (result) => result.status === "wrong"
      ).length;
      const skippedCount = topicResults.filter(
        (result) => result.status === "skipped"
      ).length;

      return {
        topicId: topic.id,
        topicName: topic.name,
        questionCount: topicResults.length,
        correctCount,
        wrongCount,
        skippedCount,
        score: correctCount * paper.scorePerQuestion,
        maxScore: topicResults.length * paper.scorePerQuestion,
      };
    })
    .filter((report) => report.questionCount > 0)
    .sort((left, right) => {
      const leftRate = safeDivide(left.score, left.maxScore);
      const rightRate = safeDivide(right.score, right.maxScore);
      return leftRate - rightRate;
    });

  return {
    id: `exam-${paper.id}-${Date.now()}`,
    paperId: paper.id,
    paperTitle: paper.title,
    submittedAt,
    startedAt,
    score,
    maxScore,
    correctCount: results.filter((result) => result.status === "correct").length,
    wrongCount: results.filter((result) => result.status === "wrong").length,
    skippedCount: results.filter((result) => result.status === "skipped").length,
    timeSpentSeconds: Math.max(
      0,
      Math.round(
        (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000
      )
    ),
    results,
    topicReports,
  };
}

export function getExamSuggestions(result: ExamResult): string[] {
  const suggestions: string[] = [];

  if (result.skippedCount > 0) {
    suggestions.push(`优先补做 ${result.skippedCount} 道未作答题，先解决“不敢写”的问题。`);
  }

  result.topicReports
    .filter(
      (report) =>
        report.maxScore > 0 && report.score / report.maxScore < 0.7
    )
    .slice(0, 3)
    .forEach((report) => {
      suggestions.push(
        `复习「${report.topicName}」：本次得分率 ${Math.round(
          (report.score / report.maxScore) * 100
        )}%。`
      );
    });

  if (result.timeSpentSeconds > 0 && result.maxScore > 0) {
    const averageSeconds = Math.round(result.timeSpentSeconds / result.maxScore);
    suggestions.push(`本次平均每题 ${averageSeconds} 秒。超时题目建议重做一遍，寻找更快入口。`);
  }

  if (suggestions.length === 0) {
    suggestions.push("整体较稳。下一步保留每天一组限时题，保持手感。");
  }

  return suggestions;
}
