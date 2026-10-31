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
}

export interface ProgressState {
  completedQuestionIds: string[];
  mistakes: Record<string, MistakeRecord>;
}
