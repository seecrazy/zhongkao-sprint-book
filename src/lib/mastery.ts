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

function getStatusValue(status: AttemptStatus): number {
  if (status === "correct") return 1;
  if (status === "wrong") return 0;
  return 0;
}

function getDaysBetween(from: Date, to: Date): number {
  return Math.max(
    0,
    (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)
  );
}

export function calculateAttemptRecencyWeight(
  attempt: AttemptRecord,
  now = new Date()
): number {
  const days = getDaysBetween(
    new Date(attempt.attemptedAt),
    now
  );

  if (days <= 3) return 1;
  if (days <= 7) return 0.8;
  if (days <= 14) return 0.55;
  if (days <= 30) return 0.3;
  return 0.12;
}

export function getQuestionStats(
  questionId: string,
  attempts: AttemptRecord[],
  now = new Date()
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

  let weightedScore = 0;
  let weightedTotal = 0;

  questionAttempts.forEach((attempt) => {
    const weight = calculateAttemptRecencyWeight(attempt, now);
    weightedScore += getStatusValue(attempt.status) * weight;
    weightedTotal += weight;
  });

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
    weightedAccuracy: round(
      safeDivide(weightedScore, weightedTotal) * 100,
      1
    ),
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
  attempts: AttemptRecord[],
  now = new Date()
): TopicStats {
  const topicQuestions = questions.filter((question) =>
    question.knowledgePointIds.includes(topicId)
  );
  const attemptedQuestions = topicQuestions.filter((question) =>
    attempts.some((attempt) => attempt.questionId === question.id)
  );

  const questionStats = topicQuestions.map((question) => ({
    question,
    stats: getQuestionStats(question.id, attempts, now),
  }));

  const correctAnswers = questionStats.reduce(
    (total, item) => total + item.stats.correct,
    0
  );
  const wrongAnswers = questionStats.reduce(
    (total, item) => total + item.stats.wrong,
    0
  );
  const skippedAnswers = questionStats.reduce(
    (total, item) => total + item.stats.skipped,
    0
  );

  const coverage = safeDivide(
    attemptedQuestions.length,
    topicQuestions.length
  );
  const accuracy = safeDivide(
    correctAnswers,
    correctAnswers + wrongAnswers + skippedAnswers
  );
  const stability = safeDivide(
    questionStats.reduce(
      (total, item) => total + item.stats.consecutiveCorrect,
      0
    ),
    Math.max(1, topicQuestions.length * 3)
  );

  let weightedAccuracyTotal = 0;
  let difficultyAdjustmentTotal = 0;
  let recentPracticeVolume = 0;

  questionStats.forEach(({ question, stats }) => {
    weightedAccuracyTotal += stats.weightedAccuracy / 100;
    difficultyAdjustmentTotal += (question.difficulty - 3) * 0.04;
    recentPracticeVolume += Math.min(3, stats.attempts);
  });

  const averageWeightedAccuracy = safeDivide(
    weightedAccuracyTotal,
    questionStats.length
  );
  const difficultyAdjustment = safeDivide(
    difficultyAdjustmentTotal,
    questionStats.length
  );
  const adjustedWeightedPerformance = safeDivide(
    averageWeightedAccuracy + difficultyAdjustment,
    1
  );
  const weightedPerformance = Math.max(
    0,
    Math.min(1, adjustedWeightedPerformance)
  );
  const recentPractice = Math.min(
    1,
    safeDivide(recentPracticeVolume, topicQuestions.length * 2)
  );

  const mastery = Math.round(
    (weightedPerformance * 0.5 +
      coverage * 0.25 +
      Math.min(stability, 1) * 0.1 +
      recentPractice * 0.15) *
      100
  );

  return {
    totalQuestions: topicQuestions.length,
    attemptedQuestions: attemptedQuestions.length,
    correctAnswers,
    wrongAnswers,
    skippedAnswers,
    coverage: Math.round(coverage * 100),
    accuracy: Math.round(accuracy * 100),
    weightedAccuracy: Math.round(weightedPerformance * 100),
    stability: Math.min(100, Math.round(stability * 100)),
    mastery,
    status: getStatusFromMastery(mastery),
  };
}

export function calculateOverallMastery(
  topics: KnowledgePoint[],
  questions: Question[],
  attempts: AttemptRecord[],
  now = new Date()
): number {
  if (topics.length === 0) return 0;

  const total = topics.reduce((sum, topic) => {
    const stats = calculateTopicStats(
      topic.id,
      questions,
      attempts,
      now
    );
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
    attempts.map((attempt) =>
      getLocalDateString(new Date(attempt.attemptedAt))
    )
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
    (attempt) =>
      getLocalDateString(new Date(attempt.attemptedAt)) === today
  ).length;
}

export function getTotalPracticeSeconds(
  attempts: AttemptRecord[]
): number {
  return attempts.reduce(
    (total, attempt) => total + attempt.timeSpentSeconds,
    0
  );
}

export function summarizeStatuses(
  attempts: AttemptRecord[]
): Record<AttemptStatus, number> {
  return {
    correct: attempts.filter((attempt) => attempt.status === "correct").length,
    wrong: attempts.filter((attempt) => attempt.status === "wrong").length,
    skipped: attempts.filter((attempt) => attempt.status === "skipped").length,
  };
}
