import mathContent from "./math.json";
import mathExamContent from "./math-exams.json";
import physicsContent from "./physics.json";
import physicsExamContent from "./physics-exams.json";
import chemistryContent from "./chemistry.json";
import chemistryExamContent from "./chemistry-exams.json";
import type { ExamPaper, KnowledgePoint, Question, Subject } from "../types";

export interface SubjectContent {
  subject: Subject;
  label: string;
  contentVersion: string;
  examVersion: string;
  knowledgePoints: KnowledgePoint[];
  questions: Question[];
  exams: ExamPaper[];
}

const math: SubjectContent = {
  subject: "math",
  label: "数学",
  contentVersion: mathContent.version,
  examVersion: mathExamContent.version,
  knowledgePoints: mathContent.knowledgePoints as KnowledgePoint[],
  questions: mathContent.questions as Question[],
  exams: mathExamContent.exams as ExamPaper[],
};

const physics: SubjectContent = {
  subject: "physics",
  label: "物理",
  contentVersion: physicsContent.version,
  examVersion: physicsExamContent.version,
  knowledgePoints: physicsContent.knowledgePoints as KnowledgePoint[],
  questions: physicsContent.questions as Question[],
  exams: physicsExamContent.exams as ExamPaper[],
};

const chemistry: SubjectContent = {
  subject: "chemistry",
  label: "化学",
  contentVersion: chemistryContent.version,
  examVersion: chemistryExamContent.version,
  knowledgePoints: chemistryContent.knowledgePoints as KnowledgePoint[],
  questions: chemistryContent.questions as Question[],
  exams: chemistryExamContent.exams as ExamPaper[],
};

const registry: Partial<Record<Subject, SubjectContent>> = {
  math,
  physics,
  chemistry,
};

export const AVAILABLE_SUBJECTS: Subject[] = ["math", "physics", "chemistry"];

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: "数学",
  english: "英语",
  physics: "物理",
  chemistry: "化学",
};

export const UPCOMING_SUBJECTS: Subject[] = ["english"];

export function isAvailableSubject(value: string): value is Subject {
  return (AVAILABLE_SUBJECTS as string[]).includes(value);
}

export function getSubjectContent(subject: Subject): SubjectContent {
  return registry[subject] ?? math;
}
