import type { ReactNode } from "react";
import {
  AVAILABLE_SUBJECTS,
  SUBJECT_LABELS,
  UPCOMING_SUBJECTS,
} from "../data/sample-content";
import type { Subject } from "../types";

export type PageKey =
  | "home"
  | "topics"
  | "practice"
  | "exam"
  | "mistakes"
  | "settings";

interface LayoutProps {
  subject: Subject;
  page: PageKey;
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
  { key: "settings", label: "设置" },
];

export default function Layout({
  subject,
  page,
  onNavigate,
  onSwitchSubject,
  children,
}: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>中考冲刺书</strong>
            <span>SprintBook MVP</span>
          </div>
        </div>
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
        SprintBook v0.12 · 五学科试点（数理理化英语文） · 每日计划 · 掌握度 · 模考复盘
      </footer>
    </div>
  );
}
