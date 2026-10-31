import type {
  AttemptStatus,
  MistakeRecord,
  ProgressState,
} from "../types";

const STORAGE_KEY = "sprintbook-progress-v0.3";
const LEGACY_STORAGE_KEY = "sprintbook-progress-v0.1";
const MAX_ATTEMPTS = 1000;

const REVIEW_INTERVAL_DAYS = [0, 1, 2, 4, 7, 15];

export const defaultProgress: ProgressState = {
  completedQuestionIds: [],
  mistakes: {},
  attempts: [],
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeMistake(
  value: unknown,
  questionId: string
): MistakeRecord | null {
  if (typeof value !== "object" || value === null) return null;

  const record = value as Partial<MistakeRecord>;
  if (!record.firstSeenAt || !record.lastSeenAt) return null;

  const lastSeenAt = record.lastSeenAt;
  const stage = Math.max(
    0,
    Math.min(record.reviewStage ?? 0, REVIEW_INTERVAL_DAYS.length - 1)
  );

  return {
    questionId,
    firstSeenAt: record.firstSeenAt,
    lastSeenAt,
    wrongCount: Math.max(0, record.wrongCount ?? 1),
    reviewStage: stage,
    consecutiveCorrect: Math.max(0, record.consecutiveCorrect ?? 0),
    nextReviewAt: record.nextReviewAt ?? lastSeenAt,
  };
}

function normalizeProgress(input: unknown): ProgressState {
  if (typeof input !== "object" || input === null) return defaultProgress;

  const value = input as Partial<ProgressState>;
  const mistakes: Record<string, MistakeRecord> = {};

  Object.entries(value.mistakes ?? {}).forEach(([questionId, mistake]) => {
    const normalized = normalizeMistake(mistake, questionId);
    if (normalized) mistakes[questionId] = normalized;
  });

  const attempts = Array.isArray(value.attempts)
    ? value.attempts.filter(
        (attempt) =>
          typeof attempt?.questionId === "string" &&
          typeof attempt?.attemptedAt === "string" &&
          ["correct", "wrong", "skipped"].includes(attempt.status)
      )
    : [];

  return {
    completedQuestionIds: Array.isArray(value.completedQuestionIds)
      ? value.completedQuestionIds.filter((id): id is string => Boolean(id))
      : [],
    mistakes,
    attempts,
  };
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return defaultProgress;

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return defaultProgress;

    return normalizeProgress(JSON.parse(raw));
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: ProgressState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress(): ProgressState {
  return defaultProgress;
}

export function recordAttempt(
  progress: ProgressState,
  input: {
    questionId: string;
    status: AttemptStatus;
    userAnswer: string;
    timeSpentSeconds: number;
  }
): ProgressState {
  const now = new Date();
  const attempt = {
    id: `${now.getTime()}-${input.questionId}`,
    questionId: input.questionId,
    status: input.status,
    userAnswer: input.userAnswer,
    timeSpentSeconds: Math.max(0, Math.round(input.timeSpentSeconds)),
    attemptedAt: now.toISOString(),
  };

  let nextProgress: ProgressState = {
    ...progress,
    attempts: [...progress.attempts, attempt].slice(-MAX_ATTEMPTS),
  };

  if (input.status === "correct") {
    nextProgress = markCompleted(nextProgress, input.questionId);
  }

  const mistake = nextProgress.mistakes[input.questionId];
  if (!mistake && input.status !== "wrong" && input.status !== "skipped") {
    return nextProgress;
  }

  if (!mistake) {
    const nextMistake: MistakeRecord = {
      questionId: input.questionId,
      firstSeenAt: attempt.attemptedAt,
      lastSeenAt: attempt.attemptedAt,
      wrongCount: 1,
      reviewStage: 0,
      consecutiveCorrect: 0,
      nextReviewAt: now.toISOString(),
    };

    return {
      ...nextProgress,
      mistakes: {
        ...nextProgress.mistakes,
        [input.questionId]: nextMistake,
      },
    };
  }

  let reviewStage = mistake.reviewStage;
  let consecutiveCorrect = mistake.consecutiveCorrect;

  if (input.status === "correct") {
    consecutiveCorrect += 1;
    if (consecutiveCorrect >= 2) {
      reviewStage = Math.min(reviewStage + 1, REVIEW_INTERVAL_DAYS.length - 1);
    }
  } else {
    reviewStage = 0;
    consecutiveCorrect = 0;
  }

  const nextReview = addDays(now, REVIEW_INTERVAL_DAYS[reviewStage]);

  return {
    ...nextProgress,
    mistakes: {
      ...nextProgress.mistakes,
      [input.questionId]: {
        ...mistake,
        lastSeenAt: attempt.attemptedAt,
        wrongCount:
          input.status === "correct"
            ? mistake.wrongCount
            : mistake.wrongCount + 1,
        reviewStage,
        consecutiveCorrect,
        nextReviewAt: nextReview.toISOString(),
      },
    },
  };
}

export function markCompleted(
  progress: ProgressState,
  questionId: string
): ProgressState {
  if (progress.completedQuestionIds.includes(questionId)) return progress;

  return {
    ...progress,
    completedQuestionIds: [...progress.completedQuestionIds, questionId],
  };
}

export function isMistakeDue(mistake: MistakeRecord, now = new Date()): boolean {
  return new Date(mistake.nextReviewAt).getTime() <= now.getTime();
}

export function isMistakeMastered(mistake: MistakeRecord): boolean {
  return mistake.consecutiveCorrect >= 3 && mistake.reviewStage >= 3;
}

export function getDueMistakes(
  progress: ProgressState,
  now = new Date()
): MistakeRecord[] {
  return Object.values(progress.mistakes)
    .filter((mistake) => !isMistakeMastered(mistake) && isMistakeDue(mistake, now))
    .sort(
      (left, right) =>
        new Date(left.nextReviewAt).getTime() -
        new Date(right.nextReviewAt).getTime()
    );
}
