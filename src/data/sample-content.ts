import mathContent from "./math.json";
import mathExamContent from "./math-exams.json";
import type { KnowledgePoint, Question } from "../types";
import type { ExamPaper } from "../types";

export const mathContentVersion: string = mathContent.version;

export const knowledgePoints = mathContent.knowledgePoints as KnowledgePoint[];

export const sampleQuestions = mathContent.questions as Question[];

export const mathExamVersion: string = mathExamContent.version;

export const examPapers = mathExamContent.exams as ExamPaper[];
