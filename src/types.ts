export type Subject = "math" | "english" | "physics" | "chemistry" | "chinese";

export type KnowledgePointStatus = "not-started" | "learning" | "stable" | "mastered";

export type ThemeMode = "auto" | "light" | "dark";

export interface AppSettings {
  examDate: string | null;
  theme: ThemeMode;
}

export type SprintPhase = "foundation" | "specialized" | "sprint" | "final";

export interface SprintStatus {
  phase: SprintPhase;
  daysLeft: number | null;
  examDate: string | null;
}

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
  diagram?: string;
  /** 听力题朗读文本（浏览器 TTS 播报）；提交前不向学生展示。 */
  listeningScript?: string;
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

export interface MultiChoiceQuestion extends BaseQuestion {
  type: "multi-choice";
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
  answerKind?: "solution-set" | "text" | "algebraic";
}

/** 短答 / 翻译题：按要点命中给分，部分正确得部分分。 */
export interface ShortAnswerKeyPoint {
  label: string;
  /** 命中任一 pattern 即视为命中（子串匹配，忽略大小写/空白/标点）。 */
  patterns: string[];
  /** 禁用词：答案中出现任一 notPattern 则该要点不得分（如"不得使用'安静'一词"）。 */
  notPatterns?: string[];
  score: number;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: "short-answer";
  keyPoints: ShortAnswerKeyPoint[];
  referenceAnswer: string;
}

/** 作文题：本地可解释评分（客观数据自动分析 + 量表自评）。 */
export interface EssayRubricLevel {
  label: string;
  score: number;
}

export interface EssayRubricDimension {
  id: string;
  label: string;
  maxScore: number;
  levels: EssayRubricLevel[];
  hints?: string[];
}

export interface EssayQuestion extends BaseQuestion {
  type: "essay";
  genre: string;
  minWords: number;
  maxWords?: number;
  outlineHints: string[];
  rubric: EssayRubricDimension[];
  sampleEssay?: string;
}

export interface SolutionStep {
  prompt: string;
  answer: number;
  tolerance?: number;
  score: number;
}

export interface SolutionQuestion extends BaseQuestion {
  type: "solution";
  steps: SolutionStep[];
}

export type Question =
  | ChoiceQuestion
  | MultiChoiceQuestion
  | NumericQuestion
  | ExpressionQuestion
  | SolutionQuestion
  | ShortAnswerQuestion
  | EssayQuestion;

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

export type ErrorTag = "concept" | "calculation" | "careless" | "reading" | "unknown";

export const ERROR_TAG_LABELS: Record<ErrorTag, string> = {
  concept: "概念不清",
  calculation: "计算失误",
  careless: "粗心大意",
  reading: "审题不清",
  unknown: "未归类",
};

export interface MistakeRecord {
  questionId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  wrongCount: number;
  reviewStage: number;
  consecutiveCorrect: number;
  nextReviewAt: string;
  errorTag?: ErrorTag;
  manualMastered?: boolean;
}

export interface ProgressState {
  completedQuestionIds: string[];
  mistakes: Record<string, MistakeRecord>;
  attempts: AttemptRecord[];
  dailyPlans: Record<string, DailyPlanRecord>;
  readLessonIds: string[];
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

export interface TopicTypeStat {
  displayType: string;
  totalQuestions: number;
  attemptedQuestions: number;
  accuracy: number;
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
  typeStats: TopicTypeStat[];
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

export interface ExamTypeReport {
  displayType: string;
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
  typeReports: ExamTypeReport[];
}

export interface WeeklyReport {
  attemptCount: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  totalSeconds: number;
  activeDays: number;
  previousAttemptCount: number;
  previousAccuracy: number;
}

export interface ReferenceItem {
  name: string;
  expression: string;
  note?: string;
}

export interface ReferenceGroup {
  title: string;
  items: ReferenceItem[];
}

export interface ReferenceSubject {
  subject: Subject;
  groups: ReferenceGroup[];
}
