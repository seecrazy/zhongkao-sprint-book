export type Subject = "math" | "english" | "physics" | "chemistry";

export type KnowledgePointStatus = "not-started" | "learning" | "stable" | "mastered";

export interface KnowledgePoint {
  id: string;
  name: string;
  subject: Subject;
  summary: string;
  examWeight: "high" | "medium" | "low";
  status: KnowledgePointStatus;
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
  stability: number;
  mastery: number;
  status: KnowledgePointStatus;
}
