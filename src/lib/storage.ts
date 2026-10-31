import type { MistakeRecord, ProgressState } from "../types";

const STORAGE_KEY = "sprintbook-progress-v0.1";

const defaultProgress: ProgressState = {
  completedQuestionIds: [],
  mistakes: {},
};

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return defaultProgress;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;

    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      completedQuestionIds: parsed.completedQuestionIds ?? [],
      mistakes: parsed.mistakes ?? {},
    };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: ProgressState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function recordMistake(
  progress: ProgressState,
  questionId: string
): ProgressState {
  const now = new Date().toISOString();
  const existing = progress.mistakes[questionId];
  const nextMistake: MistakeRecord = existing
    ? {
        ...existing,
        lastSeenAt: now,
        wrongCount: existing.wrongCount + 1,
        reviewStage: 0,
      }
    : {
        questionId,
        firstSeenAt: now,
        lastSeenAt: now,
        wrongCount: 1,
        reviewStage: 0,
      };

  return {
    ...progress,
    mistakes: {
      ...progress.mistakes,
      [questionId]: nextMistake,
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
