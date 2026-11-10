import type {
  AttemptStatus,
  DailyPlanRecord,
  ErrorTag,
  MistakeRecord,
  ProgressState,
  Subject,
} from "../types";

const STORAGE_KEY = "sprintbook-progress-v0.4";
const LEGACY_STORAGE_KEY = "sprintbook-progress-v0.1";
const MAX_ATTEMPTS = 1000;

const REVIEW_INTERVAL_DAYS = [0, 1, 2, 4, 7, 15];

const ERROR_TAGS: ErrorTag[] = ["concept", "calculation", "careless", "reading", "unknown"];

export function normalizeErrorTag(value: unknown): ErrorTag | undefined {
  return ERROR_TAGS.includes(value as ErrorTag) ? (value as ErrorTag) : undefined;
}

// 判分引擎的粗分类 → 错题本错因标签（审题不清只能手动标注）。
const ERROR_TYPE_TO_TAG: Record<string, ErrorTag> = {
  concept: "concept",
  calculation: "calculation",
  careless: "careless",
  blank: "unknown",
};

export const defaultProgress: ProgressState = {
  completedQuestionIds: [],
  mistakes: {},
  attempts: [],
  dailyPlans: {},
  readLessonIds: [],
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
    errorTag: normalizeErrorTag(record.errorTag),
    manualMastered:
      record.manualMastered === true ? true : undefined,
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

  const dailyPlans: Record<string, DailyPlanRecord> = {};
  Object.entries(value.dailyPlans ?? {}).forEach(([date, plan]) => {
    if (
      typeof plan?.date === "string" &&
      typeof plan?.generatedAt === "string" &&
      Array.isArray(plan.completedTaskIds)
    ) {
      dailyPlans[date] = {
        date: plan.date,
        generatedAt: plan.generatedAt,
        completedTaskIds: plan.completedTaskIds.filter(
          (taskId): taskId is string => Boolean(taskId)
        ),
      };
    }
  });

  return {
    completedQuestionIds: Array.isArray(value.completedQuestionIds)
      ? value.completedQuestionIds.filter((id): id is string => Boolean(id))
      : [],
    mistakes,
    attempts,
    dailyPlans,
    readLessonIds: Array.isArray(value.readLessonIds)
      ? value.readLessonIds.filter((id): id is string => Boolean(id))
      : [],
  };
}

export function loadProgress(subject: Subject = "math"): ProgressState {
  if (typeof window === "undefined") return defaultProgress;

  try {
    const raw =
      window.localStorage.getItem(`${STORAGE_KEY}:${subject}`) ??
      // 数学进度历史上存的是全局键，做一次迁移读取。
      (subject === "math"
        ? (window.localStorage.getItem(STORAGE_KEY) ??
          window.localStorage.getItem(LEGACY_STORAGE_KEY))
        : null);
    if (!raw) return defaultProgress;

    return normalizeProgress(JSON.parse(raw));
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(subject: Subject, progress: ProgressState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${STORAGE_KEY}:${subject}`,
    JSON.stringify(progress)
  );
}

export function resetProgress(): ProgressState {
  return {
    completedQuestionIds: [],
    mistakes: {},
    attempts: [],
    dailyPlans: {},
    readLessonIds: [],
  };
}

export function recordAttempt(
  progress: ProgressState,
  input: {
    questionId: string;
    status: AttemptStatus;
    userAnswer: string;
    timeSpentSeconds: number;
    errorType?: "none" | "blank" | "concept" | "calculation" | "careless";
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
      errorTag: ERROR_TYPE_TO_TAG[input.errorType ?? "concept"] ?? "unknown",
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
  if (mistake.manualMastered) return true;
  return mistake.consecutiveCorrect >= 3 && mistake.reviewStage >= 3;
}

export function setMistakeErrorTag(
  progress: ProgressState,
  questionId: string,
  errorTag: ErrorTag
): ProgressState {
  const mistake = progress.mistakes[questionId];
  if (!mistake) return progress;

  return {
    ...progress,
    mistakes: {
      ...progress.mistakes,
      [questionId]: { ...mistake, errorTag },
    },
  };
}

export function setMistakeManualMastered(
  progress: ProgressState,
  questionId: string,
  mastered: boolean
): ProgressState {
  const mistake = progress.mistakes[questionId];
  if (!mistake) return progress;

  return {
    ...progress,
    mistakes: {
      ...progress.mistakes,
      [questionId]: { ...mistake, manualMastered: mastered ? true : undefined },
    },
  };
}

export function toggleLessonRead(
  progress: ProgressState,
  topicId: string
): ProgressState {
  const hasRead = progress.readLessonIds.includes(topicId);

  return {
    ...progress,
    readLessonIds: hasRead
      ? progress.readLessonIds.filter((id) => id !== topicId)
      : [...progress.readLessonIds, topicId],
  };
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

export function toggleDailyTask(
  progress: ProgressState,
  date: string,
  taskId: string
): ProgressState {
  const now = new Date().toISOString();
  const existing = progress.dailyPlans[date];
  const completedTaskIds = existing?.completedTaskIds ?? [];
  const nextCompletedTaskIds = completedTaskIds.includes(taskId)
    ? completedTaskIds.filter((id) => id !== taskId)
    : [...completedTaskIds, taskId];

  return {
    ...progress,
    dailyPlans: {
      ...progress.dailyPlans,
      [date]: {
        date,
        generatedAt: existing?.generatedAt ?? now,
        completedTaskIds: nextCompletedTaskIds,
      },
    },
  };
}
