import type { AppSettings, SprintPhase, SprintStatus, ThemeMode } from "../types";

const APP_SETTINGS_KEY = "sprintbook-app-settings-v1";

export const DEFAULT_EXAM_DATE = "2027-06-17";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  examDate: null,
  theme: "auto",
};

const THEME_MODES: ThemeMode[] = ["auto", "light", "dark"];

export function normalizeAppSettings(input: unknown): AppSettings {
  if (typeof input !== "object" || input === null) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  const value = input as Partial<AppSettings>;
  const examDate =
    typeof value.examDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.examDate)
      ? value.examDate
      : null;
  const theme = THEME_MODES.includes(value.theme as ThemeMode)
    ? (value.theme as ThemeMode)
    : "auto";

  return { examDate, theme };
}

export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") return { ...DEFAULT_APP_SETTINGS };

  try {
    const raw = window.localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_APP_SETTINGS };
    return normalizeAppSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
}

export function daysUntilDate(dateText: string, now = new Date()): number {
  const target = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 0;

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  return Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );
}

export function getSprintStatus(
  settings: AppSettings,
  now = new Date()
): SprintStatus {
  const examDate = settings.examDate ?? DEFAULT_EXAM_DATE;
  const daysLeft = daysUntilDate(examDate, now);

  let phase: SprintPhase;
  if (daysLeft > 90) phase = "foundation";
  else if (daysLeft > 30) phase = "specialized";
  else if (daysLeft >= 0) phase = "sprint";
  else phase = "final";

  return {
    phase,
    daysLeft: Math.max(0, daysLeft),
    examDate: settings.examDate ? examDate : null,
  };
}

export const SPRINT_PHASE_LABELS: Record<SprintPhase, { label: string; hint: string }> = {
  foundation: {
    label: "一轮 · 基础期",
    hint: "距离中考还有一段时间，优先把考点讲解读完、基础题正确率打稳。",
  },
  specialized: {
    label: "二轮 · 专项期",
    hint: "中考临近，聚焦薄弱考点专项突破，错题按计划清零。",
  },
  sprint: {
    label: "三轮 · 冲刺期",
    hint: "冲刺阶段：以限时整卷为主，训练节奏和手感，错题逐日清零。",
  },
  final: {
    label: "考后",
    hint: "中考日期已过，可在设置中更新考试日期或回顾学习记录。",
  },
};

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolveTheme(mode);
}
