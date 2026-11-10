import type { ReactNode } from "react";
import {
  AVAILABLE_SUBJECTS,
  SUBJECT_LABELS,
  UPCOMING_SUBJECTS,
} from "../data/sample-content";
import { APP_NAME, APP_NAME_EN, APP_TAGLINE, APP_VERSION } from "../lib/app-info";
import type { AppSettings, Subject, ThemeMode } from "../types";

export type PageKey =
  | "home"
  | "topics"
  | "practice"
  | "exam"
  | "mistakes"
  | "reference"
  | "settings";

interface LayoutProps {
  subject: Subject;
  page: PageKey;
  appSettings: AppSettings;
  onUpdateAppSettings: (settings: AppSettings) => void;
  onNavigate: (page: PageKey, query?: Record<string, string>) => void;
  onSwitchSubject: (subject: Subject) => void;
  children: ReactNode;
}

const navItems: Array<{ key: PageKey; label: string }> = [
  { key: "home", label: "冲刺看板" },
  { key: "topics", label: "考点地图" },
  { key: "practice", label: "专题练习" },
  { key: "exam", label: "限时模考" },
  { key: "mistakes", label: "错题本" },
  { key: "reference", label: "速查表" },
  { key: "settings", label: "设置" },
];

const themeCycle: ThemeMode[] = ["auto", "light", "dark"];
const themeLabel: Record<ThemeMode, string> = {
  auto: "跟随系统",
  light: "浅色",
  dark: "深色",
};
const themeIcon: Record<ThemeMode, string> = {
  auto: "◐",
  light: "☀",
  dark: "☾",
};

export default function Layout({
  subject,
  page,
  appSettings,
  onUpdateAppSettings,
  onNavigate,
  onSwitchSubject,
  children,
}: LayoutProps) {
  function toggleTheme() {
    const next =
      themeCycle[
        (themeCycle.indexOf(appSettings.theme) + 1) % themeCycle.length
      ];
    onUpdateAppSettings({ ...appSettings, theme: next });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>{APP_NAME}</strong>
            <span>{APP_NAME_EN} v{APP_VERSION}</span>
          </div>
        </div>
        <div className="header-controls">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={`主题：${themeLabel[appSettings.theme]}（点击切换）`}
            aria-label={`切换主题，当前${themeLabel[appSettings.theme]}`}
          >
            <span aria-hidden="true">{themeIcon[appSettings.theme]}</span>
            {themeLabel[appSettings.theme]}
          </button>
          <div className="subject-switcher" role="tablist" aria-label="学科切换">
            {AVAILABLE_SUBJECTS.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={item === subject}
                className={item === subject ? "active" : ""}
                onClick={() => onSwitchSubject(item)}
              >
                {SUBJECT_LABELS[item]}
              </button>
            ))}
            {UPCOMING_SUBJECTS.map((item) => (
              <button
                key={item}
                type="button"
                className="upcoming"
                disabled
                title="内容筹备中，敬请期待"
              >
                {SUBJECT_LABELS[item]}
              </button>
            ))}
          </div>
        </div>
        <nav className="app-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === page ? "active" : ""}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        {APP_NAME_EN} v{APP_VERSION} · {APP_TAGLINE}
      </footer>
    </div>
  );
}
