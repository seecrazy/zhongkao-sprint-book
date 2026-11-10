/**
 * 运行时内容 Schema（zod）：防止 TypeScript 类型断言掩盖内容错误。
 *
 * sample-content.ts 用 `as` 把 JSON 断言成领域类型，字段错了编译期发现不了。
 * 本模块提供与 src/types.ts 一一对应的 zod schema，在开发模式下
 * 于应用启动时校验全部学科内容，并在控制台列出问题清单。
 *
 * 生产构建不引用本模块（App.tsx 里用 import.meta.env.DEV 守卫 + 动态导入），
 * zod 不会进入产物。内容错误最终由 CI 的 validate-content + 本模块双重拦截。
 */
import { z } from "zod";
import type { SubjectContent } from "../data/sample-content";

const subjectSchema = z.enum(["math", "english", "physics", "chemistry", "chinese"]);
const difficultySchema = z.number().int().min(1).max(5);

const baseQuestionShape = {
  id: z.string().min(1),
  subject: subjectSchema,
  knowledgePointIds: z.array(z.string().min(1)).min(1),
  displayType: z.string().min(1),
  difficulty: difficultySchema,
  estimatedSeconds: z.number().positive(),
  stem: z.string().min(1),
  diagram: z.string().optional(),
  listeningScript: z.string().min(1).optional(),
  source: z.string().min(1),
  explanation: z.string().min(1),
  optimalSolution: z.string().optional(),
  commonMistake: z.string().optional(),
};

const questionSchema = z.discriminatedUnion("type", [
  z.object({
    ...baseQuestionShape,
    type: z.literal("single-choice"),
    options: z.array(z.object({ key: z.string().min(1), label: z.string() })).min(2),
    answer: z.string().min(1),
  }),
  z.object({
    ...baseQuestionShape,
    type: z.literal("multi-choice"),
    options: z.array(z.object({ key: z.string().min(1), label: z.string() })).min(3),
    answer: z.string().min(1),
  }),
  z.object({
    ...baseQuestionShape,
    type: z.literal("numeric"),
    answer: z.number(),
    tolerance: z.number().positive().optional(),
    unit: z.string().optional(),
  }),
  z.object({
    ...baseQuestionShape,
    type: z.literal("expression"),
    acceptedAnswers: z.array(z.string().min(1)).min(1),
    answerKind: z.enum(["solution-set", "text", "algebraic"]).optional(),
  }),
  z.object({
    ...baseQuestionShape,
    type: z.literal("solution"),
    steps: z
      .array(
        z.object({
          prompt: z.string().min(1),
          answer: z.number(),
          tolerance: z.number().positive().optional(),
          score: z.number().int().min(1),
        })
      )
      .min(2),
  }),
  z.object({
    ...baseQuestionShape,
    type: z.literal("short-answer"),
    keyPoints: z
      .array(
        z.object({
          label: z.string().min(1),
          patterns: z.array(z.string().min(1)),
          notPatterns: z.array(z.string().min(1)).optional(),
          score: z.number().int().min(1),
        })
      )
      .min(1)
      .refine(
        (keyPoints) =>
          keyPoints.every((kp) => kp.patterns.length > 0 || (kp.notPatterns?.length ?? 0) > 0),
        { message: "每个要点至少需要 1 个 pattern 或 notPattern" }
      ),
    referenceAnswer: z.string().min(1),
  }),
  z.object({
    ...baseQuestionShape,
    type: z.literal("essay"),
    genre: z.string().min(1),
    minWords: z.number().int().min(50),
    maxWords: z.number().int().positive().optional(),
    outlineHints: z.array(z.string().min(1)).min(2),
    rubric: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          maxScore: z.number().int().min(1),
          levels: z
            .array(z.object({ label: z.string().min(1), score: z.number() }))
            .min(2),
          hints: z.array(z.string()).optional(),
        })
      )
      .min(2),
    sampleEssay: z.string().optional(),
  }),
]);

const lessonSchema = z.object({
  objectives: z.array(z.string().min(1)).min(2),
  keyIdea: z.string().min(1),
  concepts: z
    .array(z.object({ title: z.string().min(1), content: z.array(z.string()).min(1) }))
    .min(2),
  formulas: z
    .array(z.object({ name: z.string().min(1), expression: z.string().min(1), note: z.string().optional() }))
    .min(1),
  workedExamples: z
    .array(
      z.object({
        title: z.string().min(1),
        problem: z.string().min(1),
        steps: z.array(z.string()).min(1),
        answer: z.string().min(1),
        takeaway: z.string().optional(),
      })
    )
    .min(1),
  pitfalls: z
    .array(z.object({ mistake: z.string().min(1), correction: z.string().min(1) }))
    .min(1),
  strategy: z.string().min(1),
});

const knowledgePointSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  subject: subjectSchema,
  summary: z.string().min(1),
  examWeight: z.enum(["high", "medium", "low"]),
  status: z.enum(["not-started", "learning", "stable", "mastered"]),
  lesson: lessonSchema,
});

const examSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  scorePerQuestion: z.number().positive(),
  questionIds: z.array(z.string().min(1)).min(1),
});

const examPaperSchema = z.object({
  id: z.string().min(1),
  subject: subjectSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().positive(),
  scorePerQuestion: z.number().positive().optional(),
  questionIds: z.array(z.string().min(1)).optional(),
  sections: z.array(examSectionSchema).optional(),
  level: z.enum(["foundation", "topic", "challenge", "mock"]),
});

export const subjectContentSchema = z.object({
  subject: subjectSchema,
  label: z.string().min(1),
  contentVersion: z.string().min(1),
  examVersion: z.string().min(1),
  knowledgePoints: z.array(knowledgePointSchema),
  questions: z.array(questionSchema),
  exams: z.array(examPaperSchema),
});

export interface ContentIssue {
  subject: string;
  path: string;
  message: string;
}

/** 校验单个学科内容，返回问题清单（空数组 = 通过）。 */
export function validateSubjectContent(content: unknown): ContentIssue[] {
  const result = subjectContentSchema.safeParse(content);
  if (result.success) return [];

  return result.error.issues.map((issue) => ({
    subject: (content as { subject?: string })?.subject ?? "unknown",
    path: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

/**
 * 开发模式自检：校验全部学科内容。
 * 返回全部问题；无问题时返回空数组。控制台输出便于定位。
 */
export function runContentSelfCheck(contents: SubjectContent[]): ContentIssue[] {
  const allIssues: ContentIssue[] = [];

  contents.forEach((content) => {
    const issues = validateSubjectContent(content);
    allIssues.push(...issues);

    if (issues.length > 0) {
      console.error(
        `[content-schema] ${content.subject} 内容校验失败（${issues.length} 处）：`
      );
      issues.slice(0, 20).forEach((issue) => {
        console.error(`  - ${issue.path}: ${issue.message}`);
      });
    }
  });

  if (allIssues.length === 0) {
    console.info(
      `[content-schema] ${contents.length} 个学科内容全部通过运行时校验。`
    );
  }

  return allIssues;
}
