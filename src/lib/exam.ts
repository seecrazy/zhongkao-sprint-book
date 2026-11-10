import { gradeQuestions } from "./grading";
import type {
  ExamPaper,
  ExamResult,
  ExamSection,
  ExamSectionReport,
  ExamTopicReport,
  ExamTypeReport,
  KnowledgePoint,
  Question,
  QuestionResult,
} from "../types";

function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getExamSections(paper: ExamPaper): ExamSection[] {
  if (paper.sections?.length) return paper.sections;

  return [
    {
      id: `${paper.id}-all`,
      title: "整卷题目",
      scorePerQuestion: paper.scorePerQuestion ?? 1,
      questionIds: paper.questionIds ?? [],
    },
  ];
}

export function getExamSectionQuestions(
  section: ExamSection,
  questions: Question[]
): Question[] {
  const questionMap = new Map(
    questions.map((question) => [question.id, question])
  );

  return section.questionIds
    .map((questionId) => questionMap.get(questionId))
    .filter((question): question is Question => Boolean(question));
}

export function getExamQuestions(
  paper: ExamPaper,
  questions: Question[]
): Question[] {
  const seen = new Set<string>();
  const result: Question[] = [];

  getExamSections(paper).forEach((section) => {
    getExamSectionQuestions(section, questions).forEach((question) => {
      if (seen.has(question.id)) return;
      seen.add(question.id);
      result.push(question);
    });
  });

  return result;
}

export function getExamMaxScore(paper: ExamPaper): number {
  return getExamSections(paper).reduce(
    (total, section) => total + section.questionIds.length * section.scorePerQuestion,
    0
  );
}

export function getExamRemainingSeconds(
  paper: ExamPaper,
  startedAt: string,
  now = Date.now()
): number {
  const endTime =
    new Date(startedAt).getTime() + paper.durationMinutes * 60 * 1000;
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
  const sections = getExamSections(paper);
  const sectionResults = new Map<string, QuestionResult>();
  const sectionReports: ExamSectionReport[] = [];

  sections.forEach((section) => {
    const sectionQuestions = getExamSectionQuestions(section, questions);
    const rawResults = gradeQuestions(sectionQuestions, responses);
    const sectionScoredResults = rawResults.map((result) => {
      // 解答题按步骤得分比例折算到本区分值，部分正确可得部分分；
      // 其余题型按分值全对全得。
      const score =
        result.maxScore > 1
          ? round2((result.score / result.maxScore) * section.scorePerQuestion)
          : result.status === "correct"
            ? section.scorePerQuestion
            : 0;

      return {
        ...result,
        score,
        maxScore: section.scorePerQuestion,
      };
    });

    sectionScoredResults.forEach((result) => {
      sectionResults.set(result.questionId, result);
    });

    const correctCount = sectionScoredResults.filter(
      (result) => result.status === "correct"
    ).length;
    const sectionScore = round2(
      sectionScoredResults.reduce((total, result) => total + result.score, 0)
    );
    const sectionMaxScore = sectionScoredResults.length * section.scorePerQuestion;

    sectionReports.push({
      sectionId: section.id,
      sectionTitle: section.title,
      questionCount: sectionScoredResults.length,
      correctCount,
      wrongCount: sectionScoredResults.filter(
        (result) => result.status === "wrong"
      ).length,
      skippedCount: sectionScoredResults.filter(
        (result) => result.status === "skipped"
      ).length,
      score: sectionScore,
      maxScore: sectionMaxScore,
    });

  });

  const results = examQuestions
    .map((question) => sectionResults.get(question.id))
    .filter((result): result is QuestionResult => Boolean(result));

  const score = round2(
    results.reduce((total, result) => total + result.score, 0)
  );
  const maxScore = results.reduce(
    (total, result) => total + result.maxScore,
    0
  );

  const typeReports: ExamTypeReport[] = Object.values(
    results.reduce<Record<string, ExamTypeReport>>((acc, result) => {
      const question = examQuestions.find(
        (item) => item.id === result.questionId
      );
      if (!question) return acc;

      const report =
        acc[question.displayType] ?? {
          displayType: question.displayType,
          questionCount: 0,
          correctCount: 0,
          wrongCount: 0,
          skippedCount: 0,
          score: 0,
          maxScore: 0,
        };

      report.questionCount += 1;
      report.score = round2(report.score + result.score);
      report.maxScore = round2(report.maxScore + result.maxScore);
      if (result.status === "correct") report.correctCount += 1;
      else if (result.status === "wrong") report.wrongCount += 1;
      else report.skippedCount += 1;

      acc[question.displayType] = report;
      return acc;
    }, {})
  ).sort((left, right) => right.questionCount - left.questionCount);

  const topicReports: ExamTopicReport[] = topics
    .map((topic) => {
      const topicResults = results.filter((result) => {
        const question = examQuestions.find(
          (item) => item.id === result.questionId
        );
        return question?.knowledgePointIds.includes(topic.id);
      });

      const score = round2(
        topicResults.reduce((total, result) => total + result.score, 0)
      );
      const topicMaxScore = topicResults.reduce(
        (total, result) => total + result.maxScore,
        0
      );

      return {
        topicId: topic.id,
        topicName: topic.name,
        questionCount: topicResults.length,
        correctCount: topicResults.filter(
          (result) => result.status === "correct"
        ).length,
        wrongCount: topicResults.filter(
          (result) => result.status === "wrong"
        ).length,
        skippedCount: topicResults.filter(
          (result) => result.status === "skipped"
        ).length,
        score,
        maxScore: topicMaxScore,
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
    sectionReports,
    typeReports,
  };
}

export interface ExamTrendPoint {
  id: string;
  paperId: string;
  paperTitle: string;
  submittedAt: string;
  label: string;
  scorePercent: number;
}

export function buildExamTrend(history: ExamResult[]): ExamTrendPoint[] {
  return [...history]
    .sort(
      (left, right) =>
        new Date(left.submittedAt).getTime() -
        new Date(right.submittedAt).getTime()
    )
    .map((result) => ({
      id: result.id,
      paperId: result.paperId,
      paperTitle: result.paperTitle,
      submittedAt: result.submittedAt,
      label: new Date(result.submittedAt).toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
      }),
      scorePercent: safeDivide(result.score, result.maxScore) * 100,
    }));
}

export function getExamSuggestions(result: ExamResult): string[] {
  const suggestions: string[] = [];

  if (result.skippedCount > 0) {
    suggestions.push(
      `优先补做 ${result.skippedCount} 道未作答题，先解决“不敢写”的问题。`
    );
  }

  result.sectionReports
    .filter(
      (report) => report.maxScore > 0 && report.score / report.maxScore < 0.7
    )
    .forEach((report) => {
      suggestions.push(
        `加强「${report.sectionTitle}」：本次得分率 ${Math.round(
          (report.score / report.maxScore) * 100
        )}%。`
      );
    });

  result.topicReports
    .filter(
      (report) => report.maxScore > 0 && report.score / report.maxScore < 0.7
    )
    .slice(0, 3)
    .forEach((report) => {
      suggestions.push(
        `复习「${report.topicName}」：本次得分率 ${Math.round(
          (report.score / report.maxScore) * 100
        )}%。`
      );
    });

  result.typeReports
    .filter(
      (report) =>
        report.maxScore > 0 &&
        report.score / report.maxScore < 0.6 &&
        report.questionCount > 0
    )
    .slice(0, 2)
    .forEach((report) => {
      suggestions.push(
        `题型「${report.displayType}」得分率偏低（${Math.round(
          (report.score / report.maxScore) * 100
        )}%），建议集中训练该题型。`
      );
    });

  const averageSeconds = Math.round(
    result.timeSpentSeconds / Math.max(1, result.results.length)
  );
  suggestions.push(
    `本次平均每题 ${averageSeconds} 秒。超时题目建议重做一遍，寻找更快入口。`
  );

  return suggestions;
}
