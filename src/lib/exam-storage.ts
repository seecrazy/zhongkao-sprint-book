import type { ExamResult, ExamSession } from "../types";

const ACTIVE_EXAM_KEY = "sprintbook-active-exam-v1";
const EXAM_HISTORY_KEY = "sprintbook-exam-history-v1";
const MAX_HISTORY = 20;

export function loadActiveExam(): ExamSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ACTIVE_EXAM_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ExamSession>;
    if (
      typeof parsed.paperId !== "string" ||
      typeof parsed.startedAt !== "string" ||
      typeof parsed.endsAt !== "string"
    ) {
      return null;
    }

    return {
      paperId: parsed.paperId,
      startedAt: parsed.startedAt,
      endsAt: parsed.endsAt,
      responses: parsed.responses ?? {},
    };
  } catch {
    return null;
  }
}

export function saveActiveExam(session: ExamSession | null): void {
  if (typeof window === "undefined") return;

  if (!session) {
    window.localStorage.removeItem(ACTIVE_EXAM_KEY);
    return;
  }

  window.localStorage.setItem(ACTIVE_EXAM_KEY, JSON.stringify(session));
}

export function loadExamHistory(): ExamResult[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(EXAM_HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as ExamResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExamResult(result: ExamResult): ExamResult[] {
  const history = [result, ...loadExamHistory()].slice(0, MAX_HISTORY);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(history));
  }

  return history;
}

export function clearExamHistory(): ExamResult[] {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(EXAM_HISTORY_KEY);
  }

  return [];
}
