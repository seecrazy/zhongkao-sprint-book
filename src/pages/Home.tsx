import { knowledgePoints, sampleQuestions } from "../data/sample-content";
import type { ProgressState } from "../types";

interface HomeProps {
  progress: ProgressState;
  onNavigate: (page: "topics" | "practice" | "mistakes") => void;
}

export default function Home({ progress, onNavigate }: HomeProps) {
  const completed = progress.completedQuestionIds.length;
  const total = sampleQuestions.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const mistakeCount = Object.keys(progress.mistakes).length;

  return (
    <section className="page">
      <div className="hero">
        <div>
          <span className="eyebrow">SprintBook v0.1</span>
          <h1>考点看得清，错题改得掉。</h1>
          <p>
            这是中考冲刺书的最小可用骨架：先跑通“专题练习 → 一键判分 → 答案解析 → 错题记录”闭环。
          </p>
          <div className="hero-actions">
            <button className="primary" type="button" onClick={() => onNavigate("practice")}>
              开始练习
            </button>
            <button className="ghost" type="button" onClick={() => onNavigate("topics")}>
              查看考点地图
            </button>
          </div>
        </div>
        <div className="hero-card">
          <strong>当前学习进度</strong>
          <div className="big-number">{percent}%</div>
          <span>
            已完成 {completed} / {total} 题
          </span>
        </div>
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <span>考点数</span>
          <strong>{knowledgePoints.length}</strong>
        </article>
        <article className="stat-card">
          <span>示例题量</span>
          <strong>{total}</strong>
        </article>
        <article className="stat-card">
          <span>待复习错题</span>
          <strong>{mistakeCount}</strong>
        </article>
        <article className="stat-card">
          <span>当前阶段</span>
          <strong>M0</strong>
        </article>
      </div>

      <div className="panel">
        <h2>下一步计划</h2>
        <ol className="roadmap">
          <li>完善题目数据结构，支持表达式判分。</li>
          <li>引入 KaTeX 渲染数学公式。</li>
          <li>增加多步题和逐步解析。</li>
          <li>建立错题间隔复习机制。</li>
          <li>接入完整数学考点地图。</li>
        </ol>
      </div>
    </section>
  );
}
