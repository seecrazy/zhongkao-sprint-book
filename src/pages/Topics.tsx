import { knowledgePoints, sampleQuestions } from "../data/sample-content";
import type { ProgressState } from "../types";

interface TopicsProps {
  progress: ProgressState;
}

const weightLabel = {
  high: "高频",
  medium: "中频",
  low: "低频",
};

const statusLabel = {
  "not-started": "未开始",
  learning: "学习中",
  stable: "较稳",
  mastered: "已掌握",
};

export default function Topics({ progress }: TopicsProps) {
  return (
    <section className="page">
      <div className="section-head">
        <div>
          <h1>考点地图</h1>
          <p>第一版先建立数学核心考点骨架，后续按学科和模块扩展。</p>
        </div>
      </div>

      <div className="topic-grid">
        {knowledgePoints.map((point) => {
          const related = sampleQuestions.filter((question) =>
            question.knowledgePointIds.includes(point.id)
          );
          const done = related.filter((question) =>
            progress.completedQuestionIds.includes(question.id)
          ).length;
          const percent = related.length === 0 ? 0 : Math.round((done / related.length) * 100);

          return (
            <article key={point.id} className="topic-card">
              <div className="topic-top">
                <h2>{point.name}</h2>
                <span className={`tag ${point.examWeight}`}>
                  {weightLabel[point.examWeight]}
                </span>
              </div>
              <p>{point.summary}</p>
              <div className="meter">
                <span style={{ width: `${percent}%` }} />
              </div>
              <div className="topic-meta">
                <span>{statusLabel[point.status]}</span>
                <span>
                  {done}/{related.length} 题
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
