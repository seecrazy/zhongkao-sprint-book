export type Subject = "math" | "english" | "physics" | "chemistry" | "chinese";

export type KnowledgePointStatus = "not-started" | "learning" | "stable" | "mastered";

export interface KnowledgePoint {
  id: string;
  name: string;
  subject: Subject;
  summary: string;
  examWeight: "high" | "medium" | "low";
  status: KnowledgePointStatus;
  lesson?: KnowledgeLesson;
}

export interface LessonConcept {
  title: string;
  content: string[];
}

export interface LessonFormula {
  name: string;
  expression: string;
  note?: string;
}

export interface LessonExample {
  title: string;
  problem: string;
  steps: string[];
  answer: string;
  takeaway?: string;
}

export interface LessonPitfall {
  mistake: string;
  correction: string;
}

export interface KnowledgeLesson {
  objectives: string[];
  keyIdea: string;
  concepts: LessonConcept[];
  formulas: LessonFormula[];
  workedExamples: LessonExample[];
  pitfalls: LessonPitfall[];
  strategy: string;
}

export interface ChoiceOption {
  key: string;
  label: string;
}

export interface BaseQuestion {
  id: string;
  subject: Subject;
  knowledgePointIds: string[];
  displayType: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedSeconds: number;
  stem: string;
  source: string;
  explanation: string;
  optimalSolution?: string;
  commonMistake?: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  type: "single-choice";
  options: ChoiceOption[];
  answer: string;
}

export interface NumericQuestion extends BaseQuestion {
  type: "numeric";
  answer: number;
  tolerance?: number;
  unit?: string;
}

export interface ExpressionQuestion extends BaseQuestion {
  type: "expression";
  acceptedAnswers: string[];
  answerKind?: "solution-set" | "text";
}

export type Question = ChoiceQuestion | NumericQuestion | ExpressionQuestion;

export type QuestionResultStatus = "correct" | "wrong" | "skipped";

export interface QuestionResult {
  questionId: string;
  status: QuestionResultStatus;
  userAnswer: string;
  correctAnswer: string;
  score: number;
  maxScore: number;
  errorType: "none" | "blank" | "concept" | "calculation" | "careless";
  timeSpentSeconds?: number;
}

export interface UserResponse {
  questionId: string;
  value: string;
}

export interface MistakeRecord {
  questionId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  wrongCount: number;
  reviewStage: number;
  consecutiveCorrect: number;
  nextReviewAt: string;
}

export interface ProgressState {
  completedQuestionIds: string[];
  mistakes: Record<string, MistakeRecord>;
  attempts: AttemptRecord[];
  dailyPlans: Record<string, DailyPlanRecord>;
}

export type AttemptStatus = "correct" | "wrong" | "skipped";

export interface AttemptRecord {
  id: string;
  questionId: string;
  status: AttemptStatus;
  userAnswer: string;
  timeSpentSeconds: number;
  attemptedAt: string;
}

export interface QuestionStats {
  attempts: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  weightedAccuracy: number;
  averageTimeSeconds: number;
  consecutiveCorrect: number;
  lastAttemptAt?: string;
}

export interface TopicStats {
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  coverage: number;
  accuracy: number;
  weightedAccuracy: number;
  stability: number;
  mastery: number;
  status: KnowledgePointStatus;
}

export type DailyTaskType = "review" | "topic" | "exam" | "summary";

export interface DailyTaskRoute {
  page: "practice" | "mistakes" | "exam";
  query?: Record<string, string>;
}

export interface DailyTask {
  id: string;
  type: DailyTaskType;
  title: string;
  description: string;
  targetTopicId?: string;
  targetQuestionCount?: number;
  route?: DailyTaskRoute;
}

export interface DailyPlanRecord {
  date: string;
  generatedAt: string;
  completedTaskIds: string[];
}

export interface ExamPaper {
  id: string;
  subject: Subject;
  title: string;
  description: string;
  durationMinutes: number;
  scorePerQuestion?: number;
  questionIds?: string[];
  sections?: ExamSection[];
  level: "foundation" | "topic" | "challenge" | "mock";
}

export interface ExamSession {
  paperId: string;
  startedAt: string;
  endsAt: string;
  responses: Record<string, string>;
}

export interface ExamSection {
  id: string;
  title: string;
  description?: string;
  scorePerQuestion: number;
  questionIds: string[];
}

export interface ExamSectionReport {
  sectionId: string;
  sectionTitle: string;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  score: number;
  maxScore: number;
}

export interface ExamTopicReport {
  topicId: string;
  topicName: string;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  score: number;
  maxScore: number;
}

export interface ExamResult {
  id: string;
  paperId: string;
  paperTitle: string;
  submittedAt: string;
  startedAt: string;
  score: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeSpentSeconds: number;
  results: QuestionResult[];
  topicReports: ExamTopicReport[];
  sectionReports: ExamSectionReport[];
}
