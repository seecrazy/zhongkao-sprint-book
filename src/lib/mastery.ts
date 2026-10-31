import type {
  AttemptRecord,
  AttemptStatus,
  KnowledgePoint,
  Question,
  QuestionStats,
  TopicStats,
} from "../types";

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function getQuestionStats(
  questionId: string,
  attempts: AttemptRecord[]
): QuestionStats {
  const questionAttempts = attempts
    .filter((attempt) => attempt.questionId === questionId)
    .sort(
      (left, right) =>
        new Date(left.attemptedAt).getTime() -
        new Date(right.attemptedAt).getTime()
    );

  const correct = questionAttempts.filter(
    (attempt) => attempt.status === "correct"
  ).length;
  const wrong = questionAttempts.filter(
    (attempt) => attempt.status === "wrong"
  ).length;
  const skipped = questionAttempts.filter(
    (attempt) => attempt.status === "skipped"
  ).length;
  const totalTime = questionAttempts.reduce(
    (total, attempt) => total + attempt.timeSpentSeconds,
    0
  );

  let consecutiveCorrect = 0;
  for (let index = questionAttempts.length - 1; index >= 0; index -= 1) {
    if (questionAttempts[index].status !== "correct") break;
    consecutiveCorrect += 1;
  }

  return {
    attempts: questionAttempts.length,
    correct,
    wrong,
    skipped,
    accuracy: round(safeDivide(correct, questionAttempts.length) * 100),
    averageTimeSeconds: round(
      safeDivide(totalTime, questionAttempts.length),
      1
    ),
    consecutiveCorrect,
    lastAttemptAt: questionAttempts.at(-1)?.attemptedAt,
  };
}

function getStatusFromMastery(mastery: number): KnowledgePoint["status"] {
  if (mastery >= 85) return "mastered";
  if (mastery >= 65) return "stable";
  if (mastery > 0) return "learning";
  return "not-started";
}

export function calculateTopicStats(
  topicId: string,
  questions: Question[],
  attempts: AttemptRecord[]
): TopicStats {
  const topicQuestions = questions.filter((question) =>
    question.knowledgePointIds.includes(topicId)
  );
  const attemptedQuestions = topicQuestions.filter((question) =>
    attempts.some((attempt) => attempt.questionId === question.id)
  );

  const questionStats = topicQuestions.map((question) =>
    getQuestionStats(question.id, attempts)
  );
  const correctAnswers = questionStats.reduce(
    (total, stats) => total + stats.correct,
    0
  );
  const wrongAnswers = questionStats.reduce(
    (total, stats) => total + stats.wrong,
    0
  );
  const skippedAnswers = questionStats.reduce(
    (total, stats) => total + stats.skipped,
    0
  );

  const coverage = safeDivide(attemptedQuestions.length, topicQuestions.length);
  const accuracy = safeDivide(correctAnswers, correctAnswers + wrongAnswers + skippedAnswers);
  const stability = safeDivide(
    questionStats.reduce((total, stats) => total + stats.consecutiveCorrect, 0),
    Math.max(1, topicQuestions.length * 3)
  );

  const mastery = Math.round(
    (accuracy * 0.65 + coverage * 0.25 + Math.min(stability, 1) * 0.1) * 100
  );

  return {
    totalQuestions: topicQuestions.length,
    attemptedQuestions: attemptedQuestions.length,
    correctAnswers,
    wrongAnswers,
    skippedAnswers,
    coverage: Math.round(coverage * 100),
    accuracy: Math.round(accuracy * 100),
    stability: Math.min(100, Math.round(stability * 100)),
    mastery,
    status: getStatusFromMastery(mastery),
  };
}

export function calculateOverallMastery(
  topics: KnowledgePoint[],
  questions: Question[],
  attempts: AttemptRecord[]
): number {
  if (topics.length === 0) return 0;

  const total = topics.reduce((sum, topic) => {
    const stats = calculateTopicStats(topic.id, questions, attempts);
    return sum + stats.mastery;
  }, 0);

  return Math.round(total / topics.length);
}

export function getLocalDateString(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function calculateLearningStreak(attempts: AttemptRecord[]): number {
  const days = new Set(
    attempts.map((attempt) => getLocalDateString(new Date(attempt.attemptedAt)))
  );

  let streak = 0;
  const cursor = new Date();

  if (!days.has(getLocalDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(getLocalDateString(cursor))) return 0;
  }

  while (days.has(getLocalDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getTodayAttemptCount(
  attempts: AttemptRecord[],
  now = new Date()
): number {
  const today = getLocalDateString(now);
  return attempts.filter(
    (attempt) => getLocalDateString(new Date(attempt.attemptedAt)) === today
  ).length;
}

export function getTotalPracticeSeconds(attempts: AttemptRecord[]): number {
  return attempts.reduce((total, attempt) => total + attempt.timeSpentSeconds, 0);
}

export function summarizeStatuses(attempts: AttemptRecord[]): Record<AttemptStatus, number> {
  return {
    correct: attempts.filter((attempt) => attempt.status === "correct").length,
    wrong: attempts.filter((attempt) => attempt.status === "wrong").length,
    skipped: attempts.filter((attempt) => attempt.status === "skipped").length,
  };
}
