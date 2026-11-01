import { describe, expect, it } from "vitest";
import mathContent from "./math.json";
import mathExamContent from "./math-exams.json";
import type { ExamPaper } from "../types";

describe("math content", () => {
  it("has a stable content version", () => {
    expect(mathContent.version).toBe("math-v0.14");
  });

  it("provides a complete structured lesson for every knowledge point", () => {
    expect(mathContent.knowledgePoints.length).toBeGreaterThan(0);

    mathContent.knowledgePoints.forEach((point) => {
      expect(point.lesson).toBeDefined();
      expect(point.lesson?.objectives.length).toBeGreaterThanOrEqual(2);
      expect(point.lesson?.concepts.length).toBeGreaterThanOrEqual(2);
      expect(point.lesson?.formulas.length).toBeGreaterThanOrEqual(1);
      expect(point.lesson?.workedExamples.length).toBeGreaterThanOrEqual(1);
      expect(point.lesson?.pitfalls.length).toBeGreaterThanOrEqual(1);
      expect(point.lesson?.keyIdea).not.toBe("");
      expect(point.lesson?.strategy).not.toBe("");
    });
  });

  it("has unique knowledge point and question IDs", () => {
    const knowledgePointIds = mathContent.knowledgePoints.map((point) => point.id);
    const questionIds = mathContent.questions.map((question) => question.id);

    expect(new Set(knowledgePointIds).size).toBe(knowledgePointIds.length);
    expect(new Set(questionIds).size).toBe(questionIds.length);
  });

  it("only links questions to existing knowledge points", () => {
    const knowledgePointIds = new Set(
      mathContent.knowledgePoints.map((point) => point.id)
    );

    mathContent.questions.forEach((question) => {
      expect(question.knowledgePointIds.length).toBeGreaterThan(0);
      question.knowledgePointIds.forEach((topicId) => {
        expect(knowledgePointIds.has(topicId)).toBe(true);
      });
    });
  });
});

describe("math exams", () => {
  it("only links papers to existing questions", () => {
    const questionIds = new Set(mathContent.questions.map((question) => question.id));

    const exams = mathExamContent.exams as ExamPaper[];

    exams.forEach((exam) => {
      const sectionQuestionIds = exam.sections?.flatMap(
        (section) => section.questionIds
      );
      const legacyQuestionIds = exam.questionIds ?? [];

      [...(sectionQuestionIds ?? []), ...legacyQuestionIds].forEach(
        (questionId) => {
          expect(questionIds.has(questionId)).toBe(true);
        }
      );
    });
  });
});
