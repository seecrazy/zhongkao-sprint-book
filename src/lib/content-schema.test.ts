import { describe, expect, it } from "vitest";
import { validateSubjectContent } from "./content-schema";
import {
  AVAILABLE_SUBJECTS,
  getSubjectContent,
} from "../data/sample-content";

describe("runtime content schema", () => {
  it("accepts every bundled subject without issues", () => {
    AVAILABLE_SUBJECTS.forEach((subject) => {
      const issues = validateSubjectContent(getSubjectContent(subject));
      expect(issues, `${subject} should pass schema validation`).toEqual([]);
    });
  });

  it("rejects a question with an unknown type", () => {
    const content = getSubjectContent("math");
    const mutated = {
      ...content,
      questions: [
        ...content.questions.slice(0, 3),
        { ...content.questions[0], id: "mutated-1", type: "fill-blank" },
      ],
    };
    const issues = validateSubjectContent(mutated);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((issue) => issue.path.includes("type"))).toBe(true);
  });

  it("rejects a single-choice question without an answer", () => {
    const content = getSubjectContent("math");
    const first = content.questions[0];
    const mutated = {
      ...content,
      questions: [
        { ...first, id: "mutated-2", type: "single-choice", answer: undefined },
      ],
    };
    const issues = validateSubjectContent(mutated);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("rejects an essay without a rubric", () => {
    const content = getSubjectContent("chinese");
    const essay = content.questions.find((question) => question.type === "essay");
    expect(essay).toBeDefined();

    const mutated = {
      ...content,
      questions: [{ ...(essay as object), rubric: [] }],
    };
    const issues = validateSubjectContent(mutated);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("rejects short-answer key points without any pattern", () => {
    const content = getSubjectContent("chinese");
    const shortAnswer = content.questions.find(
      (question) => question.type === "short-answer"
    );
    expect(shortAnswer).toBeDefined();

    const mutated = {
      ...content,
      questions: [
        {
          ...shortAnswer,
          keyPoints: [{ label: "无模式要点", patterns: [], score: 2 }],
        },
      ],
    };
    const issues = validateSubjectContent(mutated);
    expect(
      issues.some((issue) => issue.message.includes("notPattern"))
    ).toBe(true);
  });

  it("rejects knowledge points without a lesson", () => {
    const content = getSubjectContent("math");
    const mutated = {
      ...content,
      knowledgePoints: [
        { ...content.knowledgePoints[0], id: "mutated-kp", lesson: undefined },
      ],
    };
    const issues = validateSubjectContent(mutated);
    expect(issues.length).toBeGreaterThan(0);
  });
});
