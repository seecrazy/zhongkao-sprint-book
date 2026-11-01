import type { ExamResult, ExamSession, Subject } from "../types";

const ACTIVE_EXAM_KEY = "sprintbook-active-exam-v1";
const EXAM_HISTORY_KEY = "sprintbook-exam-history-v1";
const MAX_HISTORY = 20;

function activeExamKey(subject: Subject): string {
  return `${ACTIVE_EXAM_KEY}:${subject}`;
}

function examHistoryKey(subject: Subject): string {
  return `${EXAM_HISTORY_KEY}:${subject}`;
}

function parseExamSession(raw: string): ExamSession | null {
  try {
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

export function loadActiveExam(subject: Subject = "math"): ExamSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(activeExamKey(subject));
  if (!raw) return null;

  return parseExamSession(raw);
}

export function saveActiveExam(
  subject: Subject,
  session: ExamSession | null
): void {
  if (typeof window === "undefined") return;

  const key = activeExamKey(subject);

  if (!session) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(session));
}

export function loadExamHistory(subject: Subject = "math"): ExamResult[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(examHistoryKey(subject));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as ExamResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExamResult(
  subject: Subject,
  result: ExamResult
): ExamResult[] {
  const history = [result, ...loadExamHistory(subject)].slice(0, MAX_HISTORY);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      examHistoryKey(subject),
      JSON.stringify(history)
    );
  }

  return history;
}

export function clearExamHistory(subject: Subject = "math"): ExamResult[] {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(examHistoryKey(subject));
  }

  return [];
}
