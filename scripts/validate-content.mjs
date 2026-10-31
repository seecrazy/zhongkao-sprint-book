import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const contentDir = path.resolve("src/data");
const errors = [];
const warnings = [];
const questionIds = new Set();
const knowledgePointIds = new Set();
const examPaperIds = new Set();
const examQuestionReferences = [];
let fileCount = 0;
let questionCount = 0;
let knowledgePointCount = 0;
let examCount = 0;

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateKnowledgePoint(point, file, index) {
  const location = `${file}:knowledgePoints[${index}]`;

  for (const field of ["id", "name", "subject", "summary", "examWeight", "status"]) {
    if (!point[field]) errors.push(`${location} 缺少字段 ${field}`);
  }

  if (!["high", "medium", "low"].includes(point.examWeight)) {
    errors.push(`${location} examWeight 必须是 high / medium / low`);
  }

  if (!["not-started", "learning", "stable", "mastered"].includes(point.status)) {
    errors.push(`${location} status 无效`);
  }

  if (point.id) {
    if (knowledgePointIds.has(point.id)) {
      errors.push(`${location} 知识点 ID 重复：${point.id}`);
    }
    knowledgePointIds.add(point.id);
  }
}

function validateQuestion(question, file, index) {
  const location = `${file}:questions[${index}]`;

  for (const field of [
    "id",
    "subject",
    "knowledgePointIds",
    "displayType",
    "type",
    "difficulty",
    "estimatedSeconds",
    "stem",
    "source",
    "explanation",
  ]) {
    if (question[field] === undefined || question[field] === "") {
      errors.push(`${location} 缺少字段 ${field}`);
    }
  }

  if (question.id) {
    if (questionIds.has(question.id)) {
      errors.push(`${location} 题目 ID 重复：${question.id}`);
    }
    questionIds.add(question.id);
  }

  if (!Array.isArray(question.knowledgePointIds) || question.knowledgePointIds.length === 0) {
    errors.push(`${location} knowledgePointIds 必须是非空数组`);
  } else {
    question.knowledgePointIds.forEach((pointId) => {
      if (!knowledgePointIds.has(pointId)) {
        errors.push(`${location} 引用了不存在的知识点：${pointId}`);
      }
    });
  }

  if (!["single-choice", "numeric", "expression"].includes(question.type)) {
    errors.push(`${location} 当前不支持题型：${question.type}`);
  }

  if (question.type === "single-choice") {
    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push(`${location} 单选题至少需要 2 个选项`);
    }
    if (!question.answer) errors.push(`${location} 单选题缺少 answer`);
  }

  if (question.type === "numeric" && !Number.isFinite(question.answer)) {
    errors.push(`${location} 数值题缺少合法 answer`);
  }

  if (question.type === "expression") {
    if (!Array.isArray(question.acceptedAnswers) || question.acceptedAnswers.length === 0) {
      errors.push(`${location} 表达式题缺少 acceptedAnswers`);
    }
    if (question.answerKind && !["solution-set", "text"].includes(question.answerKind)) {
      errors.push(`${location} answerKind 无效`);
    }
  }

  if (question.difficulty && !/[1-5]/.test(String(question.difficulty))) {
    errors.push(`${location} difficulty 必须在 1-5 之间`);
  }

  const mathMarkerCount = (String(question.stem).match(/\$/g) ?? []).length;
  if (mathMarkerCount % 2 !== 0) {
    errors.push(`${location} 题干中的 $ 符号不配对`);
  }

  const explanationMarkerCount = (String(question.explanation).match(/\$/g) ?? []).length;
  if (explanationMarkerCount % 2 !== 0) {
    errors.push(`${location} 解析中的 $ 符号不配对`);
  }

  if (Array.isArray(question.options)) {
    question.options.forEach((option, optionIndex) => {
      if (typeof option?.label !== "string") {
        errors.push(`${location}:options[${optionIndex}] label 必须是字符串`);
        return;
      }

      const optionMarkerCount = (option.label.match(/\$/g) ?? []).length;
      if (optionMarkerCount % 2 !== 0) {
        errors.push(`${location}:options[${optionIndex}] label 中的 $ 符号不配对`);
      }
    });
  }
}

function validateExamPaper(paper, file, index) {
  const location = `${file}:exams[${index}]`;

  for (const field of [
    "id",
    "subject",
    "title",
    "description",
    "durationMinutes",
    "scorePerQuestion",
    "questionIds",
  ]) {
    if (paper[field] === undefined || paper[field] === "") {
      errors.push(`${location} 缺少字段 ${field}`);
    }
  }

  if (paper.id) {
    if (examPaperIds.has(paper.id)) {
      errors.push(`${location} 试卷 ID 重复：${paper.id}`);
    }
    examPaperIds.add(paper.id);
  }

  if (!Number.isFinite(paper.durationMinutes) || paper.durationMinutes <= 0) {
    errors.push(`${location} durationMinutes 必须是正数`);
  }

  if (!Number.isFinite(paper.scorePerQuestion) || paper.scorePerQuestion <= 0) {
    errors.push(`${location} scorePerQuestion 必须是正数`);
  }

  if (!Array.isArray(paper.questionIds) || paper.questionIds.length < 5) {
    errors.push(`${location} 试卷至少需要 5 道题`);
  } else {
    paper.questionIds.forEach((questionId) => {
      examQuestionReferences.push({ file, location, questionId });
    });

    if (new Set(paper.questionIds).size !== paper.questionIds.length) {
      errors.push(`${location} questionIds 存在重复`);
    }
  }
}

async function main() {
  const files = (await readdir(contentDir))
    .filter((file) => file.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    errors.push(`未找到内容 JSON 文件：${contentDir}`);
  }

  for (const file of files) {
    fileCount += 1;
    const filePath = path.join(contentDir, file);
    const raw = await readFile(filePath, "utf8");

    let content;
    try {
      content = JSON.parse(raw);
    } catch (error) {
      errors.push(`${file} JSON 解析失败：${error.message}`);
      continue;
    }

    if (!isObject(content)) {
      errors.push(`${file} 根节点必须是对象`);
      continue;
    }

    if (!content.version) errors.push(`${file} 缺少 version`);

    const isExamFile = Array.isArray(content.exams);

    if (!isExamFile) {
      if (!Array.isArray(content.knowledgePoints)) {
        errors.push(`${file} 缺少 knowledgePoints 数组`);
      } else {
        content.knowledgePoints.forEach((point, index) => {
          knowledgePointCount += 1;
          if (!isObject(point)) {
            errors.push(`${file}:knowledgePoints[${index}] 必须是对象`);
            return;
          }
          validateKnowledgePoint(point, file, index);
        });
      }

      if (!Array.isArray(content.questions)) {
        errors.push(`${file} 缺少 questions 数组`);
      } else {
        content.questions.forEach((question, index) => {
          questionCount += 1;
          if (!isObject(question)) {
            errors.push(`${file}:questions[${index}] 必须是对象`);
            return;
          }
          validateQuestion(question, file, index);
        });
      }
    }

    if (isExamFile) {
      content.exams.forEach((exam, index) => {
        examCount += 1;
        if (!isObject(exam)) {
          errors.push(`${file}:exams[${index}] 必须是对象`);
          return;
        }
        validateExamPaper(exam, file, index);
      });
    }
  }

  examQuestionReferences.forEach(({ file, location, questionId }) => {
    if (!questionIds.has(questionId)) {
      errors.push(`${file}:${location} 引用了不存在的题目：${questionId}`);
    }
  });

  if (questionCount > 0 && knowledgePointIds.size > 0) {
    const usedPointIds = new Set();

    for (const file of files) {
      const content = JSON.parse(await readFile(path.join(contentDir, file), "utf8"));
      content.questions?.forEach((question) => {
        question.knowledgePointIds?.forEach((pointId) => usedPointIds.add(pointId));
      });
    }

    [...knowledgePointIds]
      .filter((pointId) => !usedPointIds.has(pointId))
      .forEach((pointId) => warnings.push(`知识点暂无题目：${pointId}`));
  }

  console.log("=== 内容校验报告 ===");
  console.log(`内容文件：${fileCount}`);
  console.log(`知识点：${knowledgePointCount}`);
  console.log(`题目：${questionCount}`);
  console.log(`试卷：${examCount}`);

  if (warnings.length > 0) {
    console.log("\n警告：");
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (errors.length > 0) {
    console.error("\n错误：");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log("\n✅ 内容校验通过");
}

await main();
