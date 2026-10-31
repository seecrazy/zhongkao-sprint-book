import type { ReactNode } from "react";

export type PageKey = "home" | "topics" | "practice" | "mistakes" | "settings";

interface LayoutProps {
  page: PageKey;
  onNavigate: (page: PageKey, query?: Record<string, string>) => void;
  children: ReactNode;
}

const navItems: Array<{ key: PageKey; label: string }> = [
  { key: "home", label: "冲刺看板" },
  { key: "topics", label: "考点地图" },
  { key: "practice", label: "专题练习" },
  { key: "mistakes", label: "错题本" },
  { key: "settings", label: "设置" },
];

export default function Layout({ page, onNavigate, children }: LayoutProps) {
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
        SprintBook v0.3 · 数学试点 · 掌握度 · 错题间隔复习
      </footer>
    </div>
  );
}
