import mathContent from "./math.json";
import mathExamContent from "./math-exams.json";
import physicsContent from "./physics.json";
import physicsExamContent from "./physics-exams.json";
import chemistryContent from "./chemistry.json";
import chemistryExamContent from "./chemistry-exams.json";
import englishContent from "./english.json";
import englishExamContent from "./english-exams.json";
import chineseContent from "./chinese.json";
import chineseExamContent from "./chinese-exams.json";
import mathGenerated from "./math-generated.json";
import physicsGenerated from "./physics-generated.json";
import chemistryGenerated from "./chemistry-generated.json";
import englishGenerated from "./english-generated.json";
import chineseGenerated from "./chinese-generated.json";
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
  questions: [
    ...(mathContent.questions as Question[]),
    ...(mathGenerated.questions as Question[]),
  ],
  exams: mathExamContent.exams as ExamPaper[],
};

const physics: SubjectContent = {
  subject: "physics",
  label: "物理",
  contentVersion: physicsContent.version,
  examVersion: physicsExamContent.version,
  knowledgePoints: physicsContent.knowledgePoints as KnowledgePoint[],
  questions: [
    ...(physicsContent.questions as Question[]),
    ...(physicsGenerated.questions as Question[]),
  ],
  exams: physicsExamContent.exams as ExamPaper[],
};

const chemistry: SubjectContent = {
  subject: "chemistry",
  label: "化学",
  contentVersion: chemistryContent.version,
  examVersion: chemistryExamContent.version,
  knowledgePoints: chemistryContent.knowledgePoints as KnowledgePoint[],
  questions: [
    ...(chemistryContent.questions as Question[]),
    ...(chemistryGenerated.questions as Question[]),
  ],
  exams: chemistryExamContent.exams as ExamPaper[],
};

const english: SubjectContent = {
  subject: "english",
  label: "英语",
  contentVersion: englishContent.version,
  examVersion: englishExamContent.version,
  knowledgePoints: englishContent.knowledgePoints as KnowledgePoint[],
  questions: [
    ...(englishContent.questions as Question[]),
    ...(englishGenerated.questions as Question[]),
  ],
  exams: englishExamContent.exams as ExamPaper[],
};

const chinese: SubjectContent = {
  subject: "chinese",
  label: "语文",
  contentVersion: chineseContent.version,
  examVersion: chineseExamContent.version,
  knowledgePoints: chineseContent.knowledgePoints as KnowledgePoint[],
  questions: [
    ...(chineseContent.questions as Question[]),
    ...(chineseGenerated.questions as Question[]),
  ],
  exams: chineseExamContent.exams as ExamPaper[],
};

const registry: Partial<Record<Subject, SubjectContent>> = {
  math,
  physics,
  chemistry,
  english,
  chinese,
};

export const AVAILABLE_SUBJECTS: Subject[] = [
  "math",
  "physics",
  "chemistry",
  "english",
  "chinese",
];

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: "数学",
  english: "英语",
  physics: "物理",
  chemistry: "化学",
  chinese: "语文",
};

export const UPCOMING_SUBJECTS: Subject[] = [];

export function isAvailableSubject(value: string): value is Subject {
  return (AVAILABLE_SUBJECTS as string[]).includes(value);
}

export function getSubjectContent(subject: Subject): SubjectContent {
  return registry[subject] ?? math;
}
